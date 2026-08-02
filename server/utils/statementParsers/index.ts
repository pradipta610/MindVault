import type { StatementParser, SupportedBank } from './types'
import { BCAStatementParser } from './BCAStatementParser'
import { BluStatementParser } from './BluStatementParser'

const registry: Partial<Record<SupportedBank, StatementParser>> = {
  bca: BCAStatementParser,
  blu: BluStatementParser,
}

export const getStatementParser = (bank: SupportedBank): StatementParser => {
  const parser = registry[bank]
  if (!parser) {
    throw createError({
      statusCode: 501,
      message: `Parser untuk bank '${bank}' belum tersedia.`,
    })
  }
  return parser
}

export const registerStatementParser = (parser: StatementParser) => {
  registry[parser.bank] = parser
}
