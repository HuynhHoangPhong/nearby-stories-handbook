import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PageContent } from '../components/PageContent'
import { source, codeData } from './data'
import { dataFlowDiagrams } from './data-flows'
import { technologies } from './introduction'
import { backlogGroups, diagrams, pages, rules, useCases } from './editorial'

afterEach(cleanup)
describe('the updated PRD is the handbook source', () => {
  it('uses the current PRD block for all nine activities and General', () => {
    expect(source.source.useCaseVersion).toBe('Use case v2')
    expect(source.useCases).toHaveLength(9)
    for (const uc of source.useCases) {
      expect(uc.sourceBodyIndex).toBeGreaterThan(source.source.v2BodyIndex)
      expect(source.images[uc.image]!.sourceBodyIndex).toBeGreaterThan(source.source.v2BodyIndex)
    }
    expect(source.images['uc-general']!.sourceBodyIndex).toBeGreaterThan(source.source.v2BodyIndex)
  })
  it('accounts for every updated story exactly once, including proposed statistics and export stories', () => {
    const ids = backlogGroups.flatMap(g => g.ids)
    expect(new Set(ids).size).toBe(23)
    expect([...ids].sort()).toEqual(source.stories.map(s => s.id).sort())
    expect(backlogGroups.find(g => g.id === 'shared')!.ids).toContain('US07')
    expect(backlogGroups.find(g => g.id === 'staff')!.ids).toEqual(expect.arrayContaining(['US22', 'US23']))
    expect(source.stories.filter(s => s.proposed).map(s => s.id)).toEqual(['US22', 'US23'])
  })
  it('keeps sixteen v2 rules, all diagrams, and the four complete database inventories', () => {
    expect(rules).toHaveLength(16)
    expect(source.businessRules).toHaveLength(16)
    expect(Object.keys(source.images)).toHaveLength(35)
    expect(Object.fromEntries(source.databases.map(db => [db.id, db.tables.length]))).toEqual({ catalog: 20, identity: 8, localization: 2, speech: 2 })
    expect(diagrams.filter(d => d.id.startsWith('class-'))).toHaveLength(4)
    expect(diagrams.filter(d => d.id.startsWith('sequence-'))).toHaveLength(8)
  })
  it('maps every diagram, ERD and technology link to a pinned code reference', () => {
    const ids = [
      ...diagrams.flatMap(diagram => diagram.code ?? []),
      ...source.databases.map(database => 'DB-' + database.id.toUpperCase()),
      ...technologies.map(technology => technology.source),
    ]
    expect(codeData.revision).toMatch(/^[a-f0-9]{40}$/)
    for (const id of ids) expect(codeData.files[id]?.line).toBeGreaterThan(0)
    const domain = diagrams.find(diagram => diagram.id === 'class-catalog-domain')!
    expect(domain.code?.map(id => codeData.files[id]?.path)).toEqual(
      ['PointOfInterest', 'Narration', 'NarrationSource', 'GenerationRequest', 'CatalogDeliveryContent', 'SupportedLanguage']
        .map(name => 'src/Catalog/Catalog.Core/Entities/' + name + '.cs'),
    )
  })
  it('has unique deep links and code references for every use case', () => {
    expect(new Set(pages.map(p => p.id)).size).toBe(pages.length)
    for (const uc of useCases) {
      expect(pages.some(p => p.id === uc.id.toLowerCase())).toBe(true)
      expect(codeData.byUseCase[uc.id]!.length).toBeGreaterThan(0)
      for (const id of codeData.byUseCase[uc.id]!) expect(codeData.files[id]?.path.startsWith('src/')).toBe(true)
      for (const rule of uc.rules) expect(rule).toBeGreaterThanOrEqual(1)
    }
  })
})
describe('reading the book', () => {
  it('shows the complete UC explanation without step-selection buttons', () => {
    render(<PageContent page={pages.find(p => p.id === 'uc6')!} index={0} navigate={vi.fn()} onZoom={vi.fn()} />)
    for (const title of ['Mục tiêu', 'Cách hoạt động', 'Các nhánh thay thế', 'Khi xảy ra lỗi', 'Kết quả', 'Quy tắc liên quan']) expect(screen.getByRole('heading', { name: title })).toBeVisible()
    expect(screen.getByText(/Catalog đổi trạng thái và ghi yêu cầu/)).toBeVisible()
    expect(screen.queryByRole('button', { name: /^Bước \d/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^[1-9]$/ })).not.toBeInTheDocument()
  })
  it('shows the purpose of all twenty Catalog tables immediately', () => {
    const { container } = render(<PageContent page={pages.find(p => p.id === 'erd-catalog')!} index={0} navigate={vi.fn()} onZoom={vi.fn()} />)
    expect(container.querySelectorAll('.schema-table')).toHaveLength(20)
    const catalog = source.databases.find(db => db.id === 'catalog')!
    for (const table of catalog.tables) expect(screen.getByText(table.purpose)).toBeVisible()
    expect(screen.getAllByText('PK.').length).toBeGreaterThan(0)
  })
  it('connects all seven DFDs to the PRD and pins every process to GitHub code', () => {
    expect(dataFlowDiagrams.map(diagram => diagram.level).sort()).toEqual([0, 1, 2, 2, 2, 2, 2])
    expect(pages.find(page => page.id === 'dfd-level-2')?.kind).toBe('dfd-index')
    for (const diagram of dataFlowDiagrams) {
      expect(source.images[diagram.image]?.sourceVersion).toBe('PRD_DFD.docx')
      expect(pages.find(p => p.id === diagram.id)?.group).toBe('dfd')
      for (const item of [...diagram.items, ...diagram.stores ?? []]) {
        if (item.target) expect(pages.some(p => p.id === item.target)).toBe(true)
      }
      for (const item of diagram.items) {
        expect(item.code?.length).toBeGreaterThan(0)
        for (const id of item.code ?? []) expect(codeData.files[id]?.line).toBeGreaterThan(0)
      }
    }
    render(<PageContent page={pages.find(p => p.id === 'dfd-3-serve')!} index={0} navigate={vi.fn()} onZoom={vi.fn()} />)
    expect(screen.getByRole('link', { name: 'Xem sơ đồ Level 2' })).toHaveAttribute('href', '#/dfd-5-publish')
    expect(screen.getByText(/chỉ cho bắt đầu phát.*100 m/)).toBeVisible()
    fireEvent.click(screen.getByRole('tab', { name: 'Mã nguồn' }))
    const audio = codeData.files['AUDIO-HTTP']!
    const url = 'https://github.com/n1giahuy/Nearby-Stories/blob/' + codeData.revision + '/' + audio.path + '#L' + audio.line
    expect(screen.getAllByRole('link', { name: 'Xem mã nguồn' }).map(link => link.getAttribute('href'))).toContain(url)
  })
})
