export interface SourceField { name: string; type: string; meaning: string; note: string }
export interface SourceTable { name: string; purpose: string; fields: SourceField[] }
export interface SourceDatabase { id: string; name: string; summary: string; tables: SourceTable[]; image: string }
export interface SourceImage { src: string; originalMedia: string; sourceBodyIndex: number; sourceVersion: string }
export interface Story { id: string; text: string; priority: string; references: string; proposed: boolean }
export interface SourceDocument {
  source: { name: string; sha256: string; useCaseVersion: string; v2BodyIndex: number; report: string; reportSha256: string; dfd?: string; dfdSha256?: string }
  stories: Story[]
  businessRules: { id: string; number: number; text: string }[]
  useCases: { id: string; fields: Record<string, string>; flow: string[]; image: string; sourceBodyIndex: number }[]
  databases: SourceDatabase[]
  images: Record<string, SourceImage>
  codeAliases: Record<string, string>
  decisions: Record<string, string>
}
export interface UseCaseContent {
  id: string; title: string; actor: string; summary: string; precondition: string; trigger: string
  flow: string[]; alternatives: string[]; errors: string[]; outcome: string; rules: number[]; implementation?: string
}
export interface DiagramItem {
  name: string
  description: string
  target?: string
  code?: string[]
}
export interface DiagramContent {
  id: string; title: string; image: string; summary: string
  items: DiagramItem[]; related: string[]; code?: string[]
  stores?: DiagramItem[]; parent?: string; next?: string; implementation?: string
}
export interface DfdDiagram extends DiagramContent { level: 0 | 1 | 2 }
export interface Page { id: string; title: string; shortTitle: string; group: string; kind: 'intro' | 'technologies' | 'microservices' | 'role' | 'backlog' | 'rules' | 'general' | 'usecase' | 'erd' | 'diagram' | 'dfd-index' | 'member-commits' | 'commit-detail'; key?: string; tocParent?: string; dfdLevel?: 0 | 1 | 2 }
export interface CodeFile { id: string; path: string; symbol: string; line: number; description: string; excerpt: string; endLine: number }
export interface CodeData { revision: string; files: Record<string, CodeFile>; byUseCase: Record<string, string[]> }
