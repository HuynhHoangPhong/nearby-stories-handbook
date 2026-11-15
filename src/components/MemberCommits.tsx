import { repository } from '../config/assets'
import { commitMembers, commitPageId } from '../content/member-commits'

type Navigate = (id: string) => void
export const formatDate = (date: string) => date.split('-').reverse().join('/')

export function PullRequestLink({ number }: { number: number }) {
  return <a href={repository + '/pull/' + number} target="_blank" rel="noreferrer" aria-label={'Pull request #' + number}>
    {'#' + number}
  </a>
}

export function MemberCommitList({ memberPage, navigate }: { memberPage: string; navigate: Navigate }) {
  const member = commitMembers.find(item => item.page === memberPage)!
  return <section className="paper-full member-commits">
    <span className="eyebrow">Commit</span>
    <h1>{member.name}</h1>
    <p className="lead full-lead">{member.commits.length} commit trong lịch sử <code>main</code>, từ mới đến cũ.</p>
    <ol className="commit-list">
      {member.commits.map(commit => {
        const id = commitPageId(commit.sha)
        return <li className="commit-list-item" key={commit.sha}>
          <h2>
            <a className="commit-heading-link" href={'#/' + id} onClick={event => { event.preventDefault(); navigate(id) }}>{commit.subject}</a>
            {commit.pullRequest && commit.subject !== commit.title && <>{' ('}<PullRequestLink number={commit.pullRequest} />{')'}</>}
          </h2>
          <div className="commit-date-column">
            <time dateTime={commit.date}>{formatDate(commit.date)}</time>
            <span>{commit.fileCount} tệp</span>
          </div>
          <p>{commit.merge && <><strong>Gộp nhánh.</strong> </>}{commit.summary}</p>
        </li>
      })}
    </ol>
  </section>
}
