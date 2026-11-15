/* Browser verification of the built static app, without needing a live backend.
 * Usage: node browser-check.cjs <playwright module> <chromium executable> <output folder>
 * Requests are fulfilled from dist, so the check also works when loopback is restricted.
 */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.argv[2] || 'playwright');
const { revision, files, byUseCase } = require('../../src/content/code-references.json');
const phongCommits = require('../../src/content/phong-commits.json');
const phongFiles = require('../../src/content/phong-commit-files.json');
const phongNotes = require('../../src/content/phong-commit-notes.json');
const teamCommits = require('../../src/content/team-commits.json');
const teamFiles = require('../../src/content/team-commit-files.json');
const teamNotes = require('../../src/content/team-commit-notes.json');
const sourceUrls = new Set(Object.values(files).map(file =>
  'https://github.com/n1giahuy/Nearby-Stories/blob/' + revision + '/' +
  file.path.split('/').map(encodeURIComponent).join('/') + '#L' + file.line));
const root = path.resolve(__dirname, '../..');
const dist = path.join(root, 'dist');
const output = path.resolve(process.argv[4] || path.join(root, 'qa'));
const origin = 'http://127.0.0.1:4175';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.argv[3] ? { executablePath: process.argv[3] } : {}) });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, colorScheme: 'light', reducedMotion: 'reduce', acceptDownloads: true });
    const unexpected = [], errors = [];
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) { unexpected.push(url.origin + url.pathname); await route.abort(); return; }
      const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
      const file = path.resolve(dist, relative);
      if (!file.startsWith(dist + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { errors.push('Missing asset: ' + relative); await route.fulfill({ status: 404, body: 'Not found' }); return; }
      await route.fulfill({ status: 200, body: fs.readFileSync(file), contentType: mime[path.extname(file)] || 'application/octet-stream' });
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      window.__paperStarts = 0;
      const start = AudioBufferSourceNode.prototype.start;
      AudioBufferSourceNode.prototype.start = function (...args) { window.__paperStarts++; return start.apply(this, args); };
    });
    const check = (condition, message) => { if (!condition) throw Error(message); };
    await page.addInitScript(() => {
      localStorage.setItem('ns-handbook-groups', JSON.stringify(['intro', 'dfd', 'erd', 'usecases']));
    });
    await page.goto(origin, { waitUntil: 'networkidle' });
    const expandedGroups = page.locator('.toc-group-button[aria-expanded="true"]');
    check(await expandedGroups.count() === 0, 'Groups should start collapsed even with old saved preferences');
    check(await page.getByText('PRD cập nhật · Use case v2', { exact: true }).count() === 0, 'Old sidebar note is visible');
    const dfdGroup = page.getByRole('button', { name: 'DFD', exact: true });
    await dfdGroup.click();
    check(await expandedGroups.count() === 1, 'Opening DFD opened an unrelated group');
    await dfdGroup.click();
    check(await expandedGroups.count() === 0, 'Closing DFD did not collapse it');
    const header = page.getByRole('navigation', { name: 'Tài liệu và tùy chọn đọc' });
    const resourceLinks = [
      ['Bản báo cáo', 'https://docs.google.com/document/d/1jTIyhgZI35Mum3TlTVmXG8pCzXwgLuN1sn_p6E36kQE/edit?usp=sharing'],
      ['Quản lí công việc', 'https://docs.google.com/spreadsheets/d/1NiGegUmbfyaz2TzIF0GZqKTh0hB9H0HW-JaQ84L3alc/edit?gid=0#gid=0'],
      ['GitHub', 'https://github.com/n1giahuy/Nearby-Stories'],
      ['Product Requirement Document', 'https://docs.google.com/document/d/1u90yZQ-tHGRho60jXjcrB4FM5f1NMC5r8jvqbtLE_WI/edit?usp=sharing'],
    ];
    for (const [name, url] of resourceLinks) {
      const link = header.getByRole('link', { name, exact: true });
      check(await link.getAttribute('href') === url && await link.getAttribute('target') === '_blank', 'Incorrect header link: ' + name);
    }
    check(await header.locator(':scope > :last-child').getAttribute('aria-pressed') === 'true', 'Paper sound is not the last control');
    await page.evaluate(() => document.fonts.ready);
    check(await page.evaluate(() => document.fonts.check('14px "Be Vietnam Pro"')), 'Vietnamese font missing');
    check(await page.locator('html').getAttribute('lang') === 'vi', 'Language missing');
    check(await page.evaluate(() => window.__paperStarts) === 0, 'Initial audio');
    await page.screenshot({ path: path.join(output, 'handbook-introduction.png'), fullPage: true });
    check(await page.locator('.toc > :last-child > button').getAttribute('aria-controls') === 'toc-member-commits', 'Commit group should be last');
    check(await page.locator('.toc > a[href="#/deployment"] + .toc-group > button').getAttribute('aria-controls') === 'toc-member-commits', 'Commit group should follow deployment');
    const routes = await page.locator('.toc a').evaluateAll(links => links.map(a => ({ href: a.getAttribute('href'), text: a.textContent })));
    check(await page.getByRole('button', { name: 'Commit', exact: true }).count() === 1, 'Expected short Commit label');
    check(routes.length === 51 && new Set(routes.map(r => r.href)).size === routes.length, 'Route inventory wrong');
    async function go(href) {
      const menu = page.getByRole('button', { name: 'Mở mục lục', exact: true });
      if (await menu.isVisible() && await menu.getAttribute('aria-expanded') !== 'true') await menu.click();
      const target = page.locator(`.toc a[href="${href}"]`);
      const group = target.locator('xpath=ancestor::section[contains(@class,"toc-group")]');
      if (await group.count()) {
        const button = group.locator('.toc-group-button');
        if (await button.getAttribute('aria-expanded') !== 'true') await button.click();
      }
      await target.click();
      await page.locator('.book h1').first().waitFor();
      for (const img of await page.locator('.book img').all()) await img.evaluate(image => image.decode());
    }
    for (const route of routes) {
      await go(route.href);
      check(!(await page.locator('.book').innerText()).includes('undefined'), 'Undefined content at ' + route.href);
      check(await page.locator('.book h1').count() === 1, 'Wrong primary heading at ' + route.href);
    }
    check(await page.evaluate(() => window.__paperStarts) === 0, 'Audio from sidebar');
    await go('#/uc6');
    for (const title of ['Mục tiêu', 'Cách hoạt động', 'Các nhánh thay thế', 'Khi xảy ra lỗi', 'Kết quả']) check(await page.getByRole('heading', { name: title, exact: true }).isVisible(), 'Hidden explanation ' + title);
    check(await page.getByRole('button', { name: /^[1-9]$/ }).count() === 0, 'Step buttons still present');
    await page.getByRole('tab', { name: 'Mã nguồn', exact: true }).click();
    check(await page.locator('.code-file').count() === byUseCase.UC6.length, 'UC6 code map incomplete');
    const sourceHref = await page.locator('.code-file .text-link').first().getAttribute('href');
    check(sourceHref.includes('/blob/' + revision + '/') && sourceHref.includes('#L'), 'Unpinned source link');
    await page.getByRole('tab', { name: 'Giải thích', exact: true }).click();
    await page.getByRole('button', { name: 'Phóng to', exact: true }).click();
    await page.getByRole('dialog').waitFor();
    await page.getByRole('button', { name: 'Phóng lớn', exact: true }).click();
    check(await page.locator('.zoom-controls').innerText().then(t => t.includes('125%')), 'Diagram zoom did not update');
    await page.keyboard.press('Escape');
    check(await page.getByRole('dialog').count() === 0, 'Diagram dialog did not close');
    check(await page.evaluate(() => window.__paperStarts) === 0, 'Audio from code/zoom');
    await page.screenshot({ path: path.join(output, 'handbook-usecase.png'), fullPage: true });
    for (const [id, count] of [['catalog', 20], ['identity', 8], ['localization', 2], ['speech', 2]]) {
      await go('#/erd-' + id);
      check(await page.locator('.schema-table').count() === count, 'Missing ERD tables ' + id);
      for (const purpose of await page.locator('.schema-table>p').all()) check(await purpose.isVisible(), 'Hidden table role');
    }
    await go('#/erd-catalog');
    await page.screenshot({ path: path.join(output, 'handbook-erd.png'), fullPage: false });
    let codePages = 0;
    for (const route of routes) {
      await go(route.href);
      const codeTab = page.getByRole('tab', { name: 'Mã nguồn' });
      if (await codeTab.count()) {
        await codeTab.click();
        const links = await page.getByRole('link', { name: 'Xem mã nguồn' }).evaluateAll(anchors => anchors.map(a => a.href));
        check(links.length > 0 && links.every(link => sourceUrls.has(link)), 'Code links ' + route.href);
        codePages += 1;
        await page.getByRole('tab', { name: 'Giải thích' }).click();
      }
      if (route.href === '#/cong-nghe') {
        const links = await page.getByRole('link', { name: 'Vị trí trong dự án' }).evaluateAll(anchors => anchors.map(a => a.href));
        check(links.length === 16 && links.every(link => sourceUrls.has(link)), 'Technology code links');
      }
    }
    check(codePages === 34, 'Unexpected inventory of code tabs: ' + codePages);
    async function verifyDatesAtRight(rows) {
      const dateColumns = await rows.evaluateAll(items => items.map(item => {
        const heading = item.querySelector('h1, h2').getBoundingClientRect();
        const date = item.querySelector('time').getBoundingClientRect();
        return {
          date: item.querySelector('time').dateTime,
          sideBySide: date.left >= heading.right - 1 && date.top < heading.bottom,
        };
      }));
      check(dateColumns.length > 0 && dateColumns.every(item => item.sideBySide && /^\d{4}-\d{2}-\d{2}$/.test(item.date)), 'Date should be in the right column beside its heading');
    }
    const profiles = [
      { page: 'commit-huy-nguyen', name: 'n1giahuy', commits: teamCommits.huy },
      { page: 'commit-thnhan713', name: 'ThNhan713', commits: teamCommits.nhan },
      { page: 'commit-huynhhoangphong', name: 'HuynhHoangPhong', commits: phongCommits },
    ];
    const repository = 'https://github.com/n1giahuy/Nearby-Stories';
    const supportedPages = new Set(routes.map(route => route.href));
    for (const profile of profiles) {
      await go('#/' + profile.page);
      check(await page.locator('#toc-member-commits a[href="#/' + profile.page + '"]').innerText() === profile.name, 'Incorrect member sidebar name');
      check(await page.locator('.book h1').innerText() === profile.name, 'Incorrect member heading');
      const rows = page.locator('.commit-list-item');
      check(await rows.count() === profile.commits.length, 'Incorrect commit inventory for ' + profile.name);
      await verifyDatesAtRight(rows);
      await page.screenshot({ path: path.join(output, 'handbook-' + profile.page + '.png') });
      const headings = await rows.locator('h2').allTextContents();
      check(headings.every((heading, index) => heading === profile.commits[index].title), 'Incorrect list titles or order');
      let testedFileDisclosure = false;
      for (const commit of profile.commits) {
        const href = '#/commit-' + commit.sha.slice(0, 7);
        const title = page.locator('.commit-heading-link[href="' + href + '"]');
        check(await title.innerText() === commit.subject, 'Incorrect commit detail link');
        await title.click();
        await page.locator('.commit-detail').waitFor();
        check(await page.locator('.book h1').innerText() === commit.title, 'Incorrect commit title');
        await verifyDatesAtRight(page.locator('.commit-detail-heading'));
        const overview = teamNotes[commit.sha] ?? phongNotes[commit.pullRequest];
        check(await page.locator('.commit-goal').innerText() === 'Mục tiêu. ' + overview.goal, 'Wrong commit goal');
        const changes = await page.locator('.commit-notes > li').allTextContents();
        const expectedChanges = overview.changes.map(({ label, action, outcome }) => label + '. ' + action + ' ' + outcome);
        check(changes.length > 0 && JSON.stringify(changes) === JSON.stringify(expectedChanges), 'Missing commit changes and outcomes');
        check(await page.getByText('Gộp nhánh', { exact: true }).count() === (commit.merge ? 1 : 0), 'Wrong merge label');
        const files = page.locator('.commit-file');
        check(await files.count() === commit.fileCount, 'Missing commit files');
        const groups = page.locator('.commit-file-group');
        check(await page.locator('.commit-file-group[open]').count() === (commit.fileCount <= 12 ? await groups.count() : 0), 'Wrong default disclosure state');
        if (!testedFileDisclosure && commit.fileCount > 12) {
          await groups.first().locator('summary').click();
          check(await groups.first().locator('.commit-file p').first().isVisible(), 'Open file group should show file descriptions');
          testedFileDisclosure = true;
        }
        const expectedEntries = teamFiles[commit.sha] ?? phongFiles[commit.sha];
        const expectedStatus = { A:'Thêm', M:'Sửa', D:'Xóa', R:'Đổi tên', C:'Sao chép', T:'Đổi loại' };
        const actual = new Map(await files.evaluateAll(items => items.map(item => [
          item.querySelector('.commit-file-path').textContent,
          {
            description: item.querySelector('p').textContent,
            status: item.querySelector('.commit-file-status').textContent,
            link: item.querySelector('a')?.href,
          },
        ])));
        for (const file of expectedEntries) {
          const path = file.previousPath ? file.previousPath + ' → ' + file.path : file.path;
          const row = actual.get(path);
          const href = repository + '/blob/' + commit.sha + '/' + file.path.split('/').map(encodeURIComponent).join('/');
          check(row?.description === file.description && row?.status === expectedStatus[file.status] &&
            row?.link === (file.status === 'D' ? undefined : href), 'Wrong file details for ' + commit.sha + ' ' + path);
        }
        const diff = page.getByRole('link', { name: 'Xem diff trên GitHub' });
        check(await diff.getAttribute('href') === repository + '/commit/' + commit.sha, 'Wrong commit permalink');
        const pr = page.locator('.commit-actions a[aria-label^="Pull request"]');
        check(await pr.count() === (commit.pullRequest ? 1 : 0), 'Unexpected pull request link');
        if (commit.pullRequest) check(await pr.getAttribute('href') === repository + '/pull/' + commit.pullRequest, 'Wrong pull request link');
        for (const related of commit.related ?? []) {
          check(supportedPages.has('#/' + related.page), 'Unregistered related page ' + related.page);
          check(await page.locator('.commit-actions').getByRole('link', { name: related.label, exact: true }).getAttribute('href') === '#/' + related.page,
            'Wrong related page link');
        }
        await page.getByRole('link', { name: 'Về danh sách commit của ' + profile.name }).click();
      }
    }
    const firstCommit = phongCommits[0];
    await page.getByRole('link', { name: firstCommit.subject, exact: true }).click();
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.commit-detail').waitFor();
    check(await page.locator('.book h1').innerText() === firstCommit.title, 'Commit deep-link reload failed');
    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 950 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(expectedWidth =>
        innerWidth === expectedWidth && document.documentElement.scrollWidth <= innerWidth + 1,
      width, { timeout: 3000 });
      await verifyDatesAtRight(page.locator('.commit-detail-heading'));
      await page.screenshot({ path: path.join(output, 'handbook-commit-mobile-' + width + '.png') });
    }
    await page.getByRole('link', { name: 'Về danh sách commit của HuynhHoangPhong' }).click();
    await verifyDatesAtRight(page.locator('.commit-list-item'));
    await page.screenshot({ path: path.join(output, 'handbook-commit-list-mobile.png') });
    await page.setViewportSize({ width: 1440, height: 1100 });
    await go('#/dfd-level-2');
    check(await page.locator('#toc-dfd .toc-level-two>a').count() === 5, 'Level 2 sidebar nesting missing');
    check(await page.getByRole('link', { name: /^Mở sơ đồ / }).count() === 5, 'Level 2 overview links missing');
    await page.screenshot({ path: path.join(output, 'handbook-dfd-level-2.png') });
    const colors = await page.evaluate(() => Object.fromEntries(
      ['body', '.book', '.app-header', '.app-sidebar', '.page-navigation'].map(selector =>
        [selector, getComputedStyle(document.querySelector(selector)).backgroundColor])
    ));
    check(colors['.book'] === 'rgb(255, 255, 255)' && Object.entries(colors).every(([selector, color]) =>
      selector === '.book' || color !== colors['.book']), 'Book and cover colors');
    await go('#/dfd-level-1');
    check(await page.getByRole('link', { name: 'Xem sơ đồ Level 2' }).count() === 5, 'Level 1 drill-down links missing');
    check(await page.getByRole('link', { name: 'Xem ERD' }).count() === 6, 'Data store links missing');
    await page.screenshot({ path: path.join(output, 'handbook-dfd.png') });
    await page.getByRole('button', { name: 'Phóng to', exact: true }).click();
    await page.getByRole('dialog').waitFor();
    await page.getByRole('button', { name: 'Phóng lớn', exact: true }).click();
    check(await page.locator('.zoom-controls').innerText().then(t => t.includes('125%')), 'DFD zoom failed');
    await page.keyboard.press('Escape');
    check(await page.getByRole('dialog').count() === 0, 'DFD dialog did not close');
    for (const group of ['visitor', 'staff', 'shared']) {
      await go('#/backlog-' + group);
      check(await page.locator('.story').count() === ({ visitor: 7, staff: 10, shared: 6 }[group]), 'Backlog group mismatch');
    }
    await go('#/backlog-staff');
    check(await page.locator('.proposed').count() === 2, 'Proposed stories missing');
    await go('#/gioi-thieu');
    const input = page.getByRole('searchbox', { name: 'Tìm trong mục lục' });
    await input.fill('xac thuc');
    check(await page.locator('.toc a[href="#/uc1"]').isVisible(), 'Accent-insensitive search failed');
    await input.fill('   ');
    check(await page.locator('.search-results').count() === 0, 'Blank search showed results');
    await input.fill('');
    await page.getByRole('button', { name: /Tiếng giấy/ }).click();
    await page.getByRole('button', { name: /Tiếng giấy/ }).click();
    check(await page.evaluate(() => window.__paperStarts) === 0, 'Toggle played audio');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
    await page.waitForTimeout(350);
    check(await page.locator('.turn-sheet').isVisible(), 'Page turn is not visible');
    const transform = await page.locator('.turn-sheet').evaluate(el => getComputedStyle(el).transform);
    check(transform.startsWith('matrix3d('), 'Turn is not three dimensional');
    check((await page.locator('.turn-front').innerText()).length > 30 && (await page.locator('.turn-back').innerText()).length > 30, 'Turn has empty faces');
    await page.screenshot({ path: path.join(output, 'handbook-page-turn.png'), fullPage: false });
    await page.waitForTimeout(1200);
    check(await page.locator('.turn-overlay').count() === 0, 'Turn layer not cleaned');
    check(await page.evaluate(() => window.__paperStarts) === 1, 'Next page audio missing');
    await page.getByRole('button', { name: 'Trang trước', exact: true }).click();
    await page.waitForTimeout(1500);
    check(await page.evaluate(() => window.__paperStarts) === 2, 'Previous page audio missing');
    await page.getByRole('button', { name: /Tiếng giấy/ }).click();
    await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
    await page.waitForTimeout(1500);
    check(await page.evaluate(() => window.__paperStarts) === 2, 'Mute failed');
    await page.goBack();
    check(await page.locator('.book h1').innerText().then(t => t.includes('Khám phá địa điểm')), 'Browser Back failed');
    await page.goForward();
    check(await page.locator('.book h1').innerText().then(t => t.includes('Khách tham quan')), 'Browser Forward failed');
    await page.reload({ waitUntil: 'networkidle' });
    check(await page.locator('.book h1').innerText().then(t => t.includes('Khách tham quan')), 'Deep link reload failed');
    check(await expandedGroups.count() === 0, 'Reloaded deep link opened a group by default');
    for (const width of [1440, 1280, 1180, 1050, 1024, 1000, 851, 850, 768, 480, 375, 320]) {
      await page.setViewportSize({ width, height: 950 });
      const controls = await header.locator(':scope > *').evaluateAll(items => items.map(item => {
        const box = item.getBoundingClientRect();
        return { left: box.left, right: box.right };
      }));
      check(controls.length === 5 && controls.every(control => control.left >= 0 && control.right <= width + 1), 'Clipped header at ' + width);
      check(controls.every((control, index) => index === 0 || control.left >= controls[index - 1].right), 'Overlapping header controls at ' + width);
      for (const id of ['gioi-thieu', 'uc2', 'dfd-level-1', 'dfd-level-2', 'erd-catalog', 'cong-nghe', 'backlog-staff']) {
        await go('#/' + id);
        const size = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
        check(size.scroll <= size.width + 1, 'Horizontal overflow ' + width + ' ' + id + ' ' + size.scroll);
      }
    }
    await page.setViewportSize({ width: 375, height: 900 });await go('#/gioi-thieu');
    await page.screenshot({ path: path.join(output, 'handbook-mobile.png'), fullPage: true });
    await page.emulateMedia({ colorScheme: 'dark' });
    check(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme) === 'light', 'Theme should stay light');
    await page.setViewportSize({ width: 1440, height: 1100 });await go('#/gioi-thieu');
    await go('#/dfd-level-1');
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('link', { name: /^Tải hình DFD Level 1/ }).click();
    const download = await downloadEvent;
    check(download.suggestedFilename() === 'dfd-level-1.png', 'DFD image download failed');
    check(unexpected.length === 0, 'App requested external services: ' + unexpected.join(','));
    check(errors.length === 0, errors.join('\n'));
    fs.writeFileSync(path.join(output, 'browser-check-result.json'), JSON.stringify({ result: 'passed', routes: routes.length, diagrams: 35, tables: 32, stories: 23, widths: [1440, 1280, 1180, 1050, 1024, 1000, 851, 850, 768, 480, 375, 320], externalRequests: unexpected, consoleErrors: errors }, null, 2));
    console.log('PASS: 51 sidebar routes and 48 commit routes, all diagrams and schema roles, full UC text, code map, zoom, download, hash history, search, real 3D turn, sound only on footer, mute, light-only, collapsed TOC, four header links, responsive 320–1440 px; no background external/API requests.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
