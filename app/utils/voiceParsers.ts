// ── Task voice parser ──────────────────────────────────────────────────────
// Extracts date keywords and category from Indonesian voice transcript

function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const DAY_MAP: Record<string, number> = {
  minggu: 0, senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5, sabtu: 6,
}

export function parseTaskVoice(text: string, categoryNames: string[]): {
  title: string
  date: string | null
  category: string | null
} {
  let remaining = text.trim()
  let date: string | null = null
  let category: string | null = null

  // Date: "besok"
  if (/\bbesok\b/i.test(remaining)) {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    date = toDateString(d)
    remaining = remaining.replace(/\bbesok\b/gi, '')
  }
  // Date: "lusa"
  else if (/\blusa\b/i.test(remaining)) {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    date = toDateString(d)
    remaining = remaining.replace(/\blusa\b/gi, '')
  }
  // Date: day name "senin", "selasa", etc.
  else {
    for (const [dayName, dayNum] of Object.entries(DAY_MAP)) {
      const regex = new RegExp(`\\b${dayName}\\b`, 'i')
      if (regex.test(remaining)) {
        const today = new Date()
        const todayDay = today.getDay()
        let diff = dayNum - todayDay
        if (diff <= 0) diff += 7
        const target = new Date()
        target.setDate(today.getDate() + diff)
        date = toDateString(target)
        remaining = remaining.replace(regex, '')
        break
      }
    }
  }
  // Date: "tgl N" or "tanggal N"
  if (!date) {
    const tglMatch = remaining.match(/\b(?:tgl|tanggal)\s+(\d{1,2})\b/i)
    if (tglMatch) {
      const day = parseInt(tglMatch[1]!)
      if (day >= 1 && day <= 31) {
        const now = new Date()
        const target = new Date(now.getFullYear(), now.getMonth(), day)
        if (target < now) target.setMonth(target.getMonth() + 1)
        date = toDateString(target)
        remaining = remaining.replace(tglMatch[0], '')
      }
    }
  }

  // Category: match against user's category names
  const lower = remaining.toLowerCase()
  for (const cat of categoryNames) {
    if (lower.includes(cat.toLowerCase())) {
      category = cat
      remaining = remaining.replace(new RegExp(`\\b${cat}\\b`, 'i'), '')
      break
    }
  }

  return {
    title: remaining.replace(/\s{2,}/g, ' ').trim(),
    date,
    category,
  }
}

// ── Finance voice parser ───────────────────────────────────────────────────
// Extracts amount, type (income/expense), and description from Indonesian voice

export function parseFinanceVoice(text: string): {
  amount: number | null
  type: 'income' | 'expense' | null
  description: string
} {
  let remaining = text.trim()
  let amount: number | null = null
  let type: 'income' | 'expense' | null = null

  // Amount: "N juta", "N.M juta"
  const jutaMatch = remaining.match(/([\d.,]+)\s*juta/i)
  if (jutaMatch) {
    const raw = jutaMatch[1]!.replace(/,/g, '.')
    amount = Math.round(parseFloat(raw) * 1_000_000)
    remaining = remaining.replace(jutaMatch[0], '')
  }

  // Amount: "N ribu", "N rb", "N k"
  if (!amount) {
    const ribuMatch = remaining.match(/([\d.,]+)\s*(?:ribu|rb|k)\b/i)
    if (ribuMatch) {
      const raw = ribuMatch[1]!.replace(/,/g, '.')
      amount = Math.round(parseFloat(raw) * 1_000)
      remaining = remaining.replace(ribuMatch[0], '')
    }
  }

  // Amount: plain number (at least 3 digits to avoid accidental matches)
  if (!amount) {
    const numMatch = remaining.match(/\b(\d{3,})\b/)
    if (numMatch) {
      amount = parseInt(numMatch[1]!)
      remaining = remaining.replace(numMatch[0], '')
    }
  }

  // Type detection
  const expenseKeywords = /\b(beli|makan|bayar|transport|bensin|belanja|parkir|ongkir|kirim|laundry|potong|tagihan|listrik|pulsa)\b/i
  const incomeKeywords = /\b(terima|gajian|gaji|dapat|dapet|transfer\s+masuk|bonus|cashback)\b/i

  if (incomeKeywords.test(remaining)) {
    type = 'income'
    remaining = remaining.replace(incomeKeywords, '')
  } else if (expenseKeywords.test(remaining)) {
    type = 'expense'
    remaining = remaining.replace(expenseKeywords, '')
  }

  return {
    amount,
    type,
    description: remaining.replace(/\s{2,}/g, ' ').trim(),
  }
}
