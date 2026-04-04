export interface Database {
  public: {
    Tables: {
      notes: {
        Row: {
          id: string
          user_id: string
          raw: string
          title: string | null
          tag: string
          poin: string[] | null
          action: string[] | null
          fokus: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          raw: string
          title?: string | null
          tag: string
          poin?: string[] | null
          action?: string[] | null
          fokus?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          raw?: string
          title?: string | null
          tag?: string
          poin?: string[] | null
          action?: string[] | null
          fokus?: string | null
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          text: string
          cat: string
          date: string
          rolled_from: string | null
          done: boolean
          done_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          text: string
          cat: string
          date: string
          rolled_from?: string | null
          done?: boolean
          done_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          text?: string
          cat?: string
          date?: string
          rolled_from?: string | null
          done?: boolean
          done_at?: string | null
          created_at?: string
        }
      }
    }
  }
}
