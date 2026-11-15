"""Extract the current Nearby Stories PRD and the report's two additional sequences."""
import argparse
import hashlib
import json
import re
from pathlib import Path, PurePosixPath
from shutil import copyfile
from zipfile import ZipFile

from lxml import etree

NS = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
}


def text(node):
    paragraphs = node.xpath('descendant-or-self::w:p', namespaces=NS)
    return ' / '.join(
        value for paragraph in paragraphs
        if (value := ''.join(paragraph.xpath('.//w:t/text()', namespaces=NS)).strip())
    )


def rows(node):
    return [[text(cell) for cell in row.findall('w:tc', NS)]
            for row in node.findall('w:tr', NS)]


class Document:
    def __init__(self, archive):
        self.archive = archive
        self.body = list(etree.fromstring(archive.read('word/document.xml')).find('w:body', NS))
        self.labels = [text(node) for node in self.body]
        self.relationships = {
            node.get('Id'): node.get('Target')
            for node in etree.fromstring(archive.read('word/_rels/document.xml.rels'))
            if node.get('TargetMode') != 'External'
        }

    def heading(self, label, start=0, end=None):
        return self.labels.index(label, start, len(self.body) if end is None else end)

    def table(self, start, end):
        return next(i for i in range(start, end) if self.body[i].tag.endswith('}tbl'))

    def picture(self, key, start, end, source_name, pictures):
        for index in range(start, end):
            embeds = self.body[index].xpath('.//a:blip/@r:embed', namespaces=NS)
            if embeds:
                target = PurePosixPath(self.relationships[embeds[0]])
                if target.parts[:1] != ('media',) or '..' in target.parts:
                    raise ValueError(f'Unexpected embedded media path: {target}')
                name = key + target.suffix.lower()
                (pictures / name).write_bytes(self.archive.read('word/' + str(target)))
                return {'src': 'diagrams/' + name, 'originalMedia': str(target),
                        'sourceBodyIndex': index, 'sourceVersion': source_name}
        raise ValueError(f'Missing source image for {key}')


def extract(source: Path, report: Path, app: Path, dfd: Path | None = None):
    content = app / 'src' / 'content'
    pictures = app / 'public' / 'diagrams'
    documents = app / 'public' / 'documents'
    for directory in (content, pictures, documents):
        directory.mkdir(parents=True, exist_ok=True)

    with ZipFile(source) as archive, ZipFile(report) as report_archive, ZipFile(dfd or source) as dfd_archive:
        doc = Document(archive)
        supporting = Document(report_archive)
        body, labels = doc.body, doc.labels
        v2_start = doc.heading('Focused Use Cases')
        general = doc.heading('General Use Case Diagram', v2_start)
        code_start = doc.heading('Code Reference UC1 to UC4', general)

        images = {}
        images['uc-general'] = doc.picture('uc-general', general, general + 3, 'Use case v2', pictures)
        use_cases = []
        for number in range(1, 10):
            heading = next(i for i in range(general, code_start)
                           if labels[i].startswith(f'UC{number}. '))
            activity = doc.heading(f'UC{number} Activity Diagram', heading + 1, code_start)
            table_index = doc.table(heading + 1, activity)
            fields, flow = {}, []
            in_flow = False
            for row in rows(body[table_index]):
                if not any(row):
                    continue
                label = row[0].rstrip(':').strip()
                if label == 'Basic Course of Events':
                    in_flow = True
                elif label:
                    in_flow = False
                    fields[label] = ' '.join(value for value in row[1:] if value)
                elif in_flow:
                    flow.extend(value for value in row[1:] if value)
            key = f'uc{number}-activity'
            images[key] = doc.picture(key, activity + 1, activity + 2, 'Use case v2', pictures)
            use_cases.append({'id': f'UC{number}', 'fields': fields, 'flow': flow,
                              'image': key, 'sourceBodyIndex': table_index})

        backlog_index = doc.table(doc.heading('Product Backlog') + 1, v2_start)
        stories = [{'id': row[0], 'text': row[1], 'priority': row[2], 'references': row[3],
                    'proposed': row[0] in ('US22', 'US23')}
                   for row in rows(body[backlog_index])[1:] if row]
        business_rules = []
        for label in labels[v2_start:general]:
            match = re.match(r'^2\.(\d+)\s+(.+)', label)
            if match:
                business_rules.append({'id': 'BR 2.' + match[1], 'number': int(match[1]), 'text': match[2]})

        databases = []
        erd_start = doc.heading('ERD')
        appendix = doc.heading('Phần A. Thực thể, thuộc tính và khóa', erd_start)
        for number, service in enumerate(('Catalog', 'Localization', 'Speech', 'Identity'), start=1):
            heading = doc.heading(f'A.{number} Cơ sở dữ liệu {service}', appendix, v2_start)
            end = next((i for i in range(heading + 1, v2_start)
                        if re.match(r'^A\.\d Cơ sở dữ liệu ', labels[i])
                        or labels[i].startswith('Phần B.')), v2_start)
            inventory = rows(body[doc.table(heading + 1, end)])
            tables = []
            for index in range(heading + 1, end):
                match = re.fullmatch(r'Thực thể (\w+)', labels[index])
                if not match:
                    continue
                table = body[doc.table(index + 1, end)]
                fields = [{'name': row[1], 'type': row[2], 'meaning': row[3], 'note': row[4]}
                          for row in rows(table)[1:] if len(row) == 5 and row[1]]
                tables.append({'name': match[1], 'purpose': labels[index + 1], 'fields': fields})
            if [table['name'] for table in tables] != [row[1] for row in inventory[1:]]:
                raise ValueError(f'{service} inventory and entity details disagree')
            erd_heading = doc.heading(service, erd_start, appendix)
            key = 'erd-' + service.lower()
            images[key] = doc.picture(key, erd_heading, appendix, source.name, pictures)
            databases.append({'id': service.lower(), 'name': service, 'summary': labels[heading + 1],
                              'tables': tables, 'image': key})

        figure_headings = {
            'class-catalog-application': 'class-catalog-application',
            'class-catalog-domain': 'class-catalog-domain',
            'class-localization': 'Class Diagram — Localization Service',
            'class-speech': 'Class Diagram — Speech Service',
            'sequence-auth': '1. Authenticate User',
            'sequence-nearby': '2. Discover Nearby Places',
            'sequence-generate': '3. Generate Narration',
            'sequence-play': '4. Play Narration',
            'sequence-publish': '5. Publish Narration Content',
            'sequence-jobs': '6. Monitor Synthesis Job',
            'component': 'Component Diagram',
            'deployment': 'Deployment Diagram',
        }
        for key, title in figure_headings.items():
            index = doc.heading(title, end=general)
            images[key] = doc.picture(key, index, index + 6, source.name, pictures)

        dfd_headings = {
            'dfd-level-0': 'Level 0',
            'dfd-level-1': 'Level 1',
            'dfd-5-publish': 'Figure 1. DFD Level 2: Process 5.0 Publish & Track Narration',
            'dfd-3-serve': 'Figure 2. DFD Level 2: Process 3.0 Serve Narration',
            'dfd-6-translate': 'Figure 3. DFD Level 2: Process 6.0 Translate Narration',
            'dfd-7-synthesize': 'Figure 4. DFD Level 2: Process 7.0 Synthesize Audio',
            'dfd-9-report': 'Figure 5. DFD Level 2: Process 9.0 Report Usage',
        }
        dfd_start = doc.heading('Level 0', code_start)
        dfd_doc = Document(dfd_archive) if dfd else doc
        dfd_name = (dfd or source).name
        for key, title in dfd_headings.items():
            index = dfd_doc.heading(title, 0 if dfd else dfd_start)
            images[key] = dfd_doc.picture(key, index, index + 4, dfd_name, pictures)

        for key, title in {
            'sequence-statistics': '4.3.7 Xem thống kê sử dụng',
            'sequence-export': '4.3.8 Xuất báo cáo sử dụng',
        }.items():
            index = supporting.heading(title)
            images[key] = supporting.picture(key, index, index + 3, report.name, pictures)

        aliases, decisions = {}, {}
        current_uc = None
        for label in labels[code_start:dfd_start]:
            alias = re.fullmatch(r'(\w+) — (src/.+)', label)
            uc = re.match(r'^(UC\d+)\s+', label)
            if alias:
                aliases[alias[1]] = alias[2]
            elif uc:
                current_uc = uc[1]
            elif current_uc and '→' in label:
                decisions[current_uc] = label

        data = {'source': {'name': source.name, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                           'useCaseVersion': 'Use case v2', 'v2BodyIndex': v2_start,
                           'report': report.name, 'reportSha256': hashlib.sha256(report.read_bytes()).hexdigest()},
                'stories': stories, 'businessRules': business_rules, 'useCases': use_cases,
                'databases': databases, 'images': images, 'codeAliases': aliases, 'decisions': decisions}
        if dfd:
            data['source']['dfd'] = dfd.name
            data['source']['dfdSha256'] = hashlib.sha256(dfd.read_bytes()).hexdigest()
        if len(stories) != 23 or len({story['id'] for story in stories}) != 23 or len(business_rules) != 16:
            raise ValueError('Unexpected backlog or business-rule inventory')
        (content / 'generated.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        copyfile(source, documents / 'product-requirements.docx')
        print(f'{len(stories)} stories, {len(business_rules)} rules, {len(use_cases)} use cases, '
              f'{len(images)} diagrams, {sum(len(db["tables"]) for db in databases)} tables')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--report', required=True, type=Path)
    parser.add_argument('--dfd', type=Path, help='Use the standalone DFD PRD for the seven DFD figures')
    parser.add_argument('--app', required=True, type=Path)
    args = parser.parse_args()
    extract(args.source.resolve(), args.report.resolve(), args.app.resolve(), args.dfd)
