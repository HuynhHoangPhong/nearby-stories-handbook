import history from './phong-commits.json'
import team from './team-commits.json'

export interface CommitFile {
  path: string
  status: 'A' | 'M' | 'D' | 'R' | 'C' | 'T'
  description: string
  previousPath?: string
}

export interface MemberCommit {
  sha: string
  date: string
  title: string
  subject: string
  pullRequest?: number
  merge?: boolean
  summary: string
  fileCount: number
  related?: { page: string; label: string }[]
}

export interface CommitMember {
  page: string
  name: string
  commits: MemberCommit[]
}

export const commitMembers: CommitMember[] = [
  { page: 'commit-huynhhoangphong', name: 'HuynhHoangPhong', commits: history },
  { page: 'commit-huy-nguyen', name: 'n1giahuy', commits: team.huy },
  { page: 'commit-thnhan713', name: 'ThNhan713', commits: team.nhan },
]

export const commitMembership = new Map(commitMembers.flatMap(member =>
  member.commits.map(commit => [commit.sha, { member, commit }] as const)
))

export const commitPageId = (sha: string) => 'commit-' + sha.slice(0, 7)

