export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          mood_preferences: Json | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          mood_preferences?: Json | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          mood_preferences?: Json | null
        }
      }
      products: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string
          price: number
          image_url: string
          moods: string[]
          inventory: number
          category: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description: string
          price: number
          image_url: string
          moods: string[]
          inventory: number
          category: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string
          price?: number
          image_url?: string
          moods?: string[]
          inventory?: number
          category?: string
        }
      }
      product_reactions: {
        Row: {
          id: string
          product_id: string
          emoji: string
          count: number
        }
        Insert: {
          id?: string
          product_id: string
          emoji: string
          count: number
        }
        Update: {
          id?: string
          product_id?: string
          emoji?: string
          count?: number
        }
      }
      user_reactions: {
        Row: {
          id: string
          user_id: string
          product_id: string
          emoji: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          emoji: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          emoji?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          quantity: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          quantity?: number
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          total: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total: number
          status: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total?: number
          status?: string
          created_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          price: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          price?: number
        }
      }
    }
  }
}

