export interface QuickAddPayload {
  text: string
  cat: string | null
  date: string
  deadline_at: string | null
  custom_fields: Record<string, any>
}
