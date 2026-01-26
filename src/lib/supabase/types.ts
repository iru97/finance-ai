export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string
          user_id: string
          messages: Json
          context: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          messages?: Json
          context?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          messages?: Json
          context?: Json
          created_at?: string
          updated_at?: string
        }
      }
      financial_cache: {
        Row: {
          id: number
          cache_key: string
          data_type: string
          ticker: string | null
          data: Json
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: number
          cache_key: string
          data_type: string
          ticker?: string | null
          data: Json
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: number
          cache_key?: string
          data_type?: string
          ticker?: string | null
          data?: Json
          expires_at?: string
          created_at?: string
        }
      }
      watchlists: {
        Row: {
          id: string
          user_id: string
          name: string
          tickers: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          tickers?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          tickers?: string[]
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
