import generated from './generated.json'
import references from './code-references.json'
import type { CodeData, SourceDocument } from './types'
export const source = generated as SourceDocument
export const codeData = references as CodeData
