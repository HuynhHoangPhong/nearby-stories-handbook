import { ArrowUpRight, Files } from 'lucide-react'
import { repository } from '../config/assets'
import history from '../content/phong-commit-files.json'
import teamFiles from '../content/team-commit-files.json'
import teamNotes from '../content/team-commit-notes.json'
import phongNotes from '../content/phong-commit-notes.json'
import { commitMembership } from '../content/member-commits'
import type { CommitFile } from '../content/member-commits'
import { PullRequestLink, formatDate } from './MemberCommits'
import { CrossLink } from './Shared'

interface CommitNotes {
  goal: string
  changes: { label: string; action: string; outcome: string }[]
}

const filesByCommit = { ...history, ...teamFiles } as Record<string, CommitFile[]>
const overviewByCommit: Record<string, CommitNotes> = { ...phongNotes, ...teamNotes }
const statuses: Record<CommitFile['status'], string> = {
  A: 'Thêm', M: 'Sửa', D: 'Xóa', R: 'Đổi tên', C: 'Sao chép', T: 'Đổi loại',
}
const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/')

function groupFiles(files: CommitFile[]) {
  const groups = new Map<string, CommitFile[]>()
  for (const file of files) {
    const segments = file.path.split('/')
    const directories = segments.slice(0, -1)
    const [root, section] = directories
    const depth = root === 'src' ? (section === 'Web' ? 4 : 3) : root === 'tests' ? 2 : 1
    const group = directories.slice(0, depth).join('/') || 'Thư mục gốc'
    const groupFiles = groups.get(group) ?? []
    groupFiles.push(file)
    groups.set(group, groupFiles)
  }
  return groups
}

export default function MemberCommitDetail({ sha, navigate }: { sha: string; navigate: (id: string) => void }) {
  const { commit, member } = commitMembership.get(sha)!
  const filesByGroup = groupFiles(filesByCommit[sha]!)
  const overview = overviewByCommit[sha]!
  return <section className="paper-full member-commits commit-detail">
    <CrossLink to={member.page} navigate={navigate}>Về danh sách commit của {member.name}</CrossLink>
    <div className="commit-detail-heading">
      <div>
        <h1>{commit.title}</h1>
        <div className="commit-meta"><code>{commit.sha.slice(0, 7)}</code><span>{member.name}</span>{commit.merge && <span>Gộp nhánh</span>}</div>
      </div>
      <time className="commit-date-column" dateTime={commit.date}>{formatDate(commit.date)}</time>
    </div>
    <div className="commit-actions">
      <a className="text-link" href={repository + '/commit/' + commit.sha} target="_blank" rel="noreferrer">Xem diff trên GitHub <ArrowUpRight size={14} /></a>
      {commit.pullRequest && <PullRequestLink number={commit.pullRequest} />}
      {commit.related?.map(link => <CrossLink key={link.page} to={link.page} navigate={navigate}>{link.label}</CrossLink>)}
    </div>
    <h2>Thay đổi chính</h2>
    <p className="commit-goal"><strong>Mục tiêu.</strong> {overview.goal}</p>
    <ul className="commit-notes">
      {overview.changes.map(change => (
        <li key={change.label}><strong>{change.label}.</strong> {change.action} {change.outcome}</li>
      ))}
    </ul>
    <h2>{commit.fileCount} tệp thay đổi</h2>
    {commit.merge && <p>Danh sách so với trạng thái của nhánh nhận trước khi gộp.</p>}
    {[...filesByGroup].map(([group, files]) => (
      <details className="commit-file-group" key={group} open={commit.fileCount <= 12}>
        <summary>{group} <span>{files.length} tệp</span></summary>
        <ul className="commit-files">
          {files.map(file => (
            <li className="commit-file" key={file.path}>
              <div className="commit-file-heading">
                <Files size={16} aria-hidden="true" />
                <h3>{file.path.split('/').pop()}</h3>
                <span className="commit-file-status">{statuses[file.status]}</span>
              </div>
              <code className="commit-file-path">
                {file.previousPath && <>{file.previousPath} → </>}{file.path}
              </code>
              <p>{file.description}</p>
              {file.status !== 'D' && <a className="text-link" href={repository + '/blob/' + commit.sha + '/' + encodePath(file.path)} target="_blank" rel="noreferrer">
                Xem tệp trên GitHub <ArrowUpRight size={14} />
              </a>}
            </li>
          ))}
        </ul>
      </details>
    ))}
  </section>
}

