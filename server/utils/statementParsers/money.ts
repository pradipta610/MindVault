// Two different number formats show up across bank statements:
// - BCA:  comma thousands, dot decimal   -> "6,912,500.00"
// - blu:  dot thousands, comma decimal   -> "6.912.500,00"
// Each parser uses only the format its own bank prints.

const BCA_MONEY_RE = /^\d{1,3}(,\d{3})*\.\d{2}$/
const BLU_MONEY_RE = /^\d{1,3}(\.\d{3})*,\d{2}$/

export const isBcaMoney = (token: string | undefined): token is string =>
  !!token && BCA_MONEY_RE.test(token)

export const parseBcaMoney = (token: string): number =>
  Number(token.replace(/,/g, ''))

export const isBluMoney = (token: string | undefined): token is string =>
  !!token && BLU_MONEY_RE.test(token)

export const parseBluMoney = (token: string): number =>
  Number(token.replace(/\./g, '').replace(',', '.'))
