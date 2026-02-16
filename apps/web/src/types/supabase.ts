/**
 * Supabase Database Types
 *
 * These types represent the database schema for the Supabase backend.
 * They can be auto-generated using:
 * pnpm supabase:types
 *
 * This will generate types from the local Supabase instance.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          settings: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          settings?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          settings?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          display_name: string | null;
          role: string;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id: string;
          email: string;
          display_name?: string | null;
          role?: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          display_name?: string | null;
          role?: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          thread_id: string;
          sender_id: string;
          content: string;
          kind: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          sender_id: string;
          content: string;
          kind?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          sender_id?: string;
          content?: string;
          kind?: string;
          created_at?: string;
        };
      };
      // Add other tables as needed
      [key: string]: any;
    };
    Views: {
      [key: string]: any;
    };
    Functions: {
      [key: string]: any;
    };
    Enums: {
      [key: string]: any;
    };
  };
}
