/**
 * Supabase database type definitions.
 * Generated from the schema defined in mogcheck-build-prompt.md.
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          coins: number;
          total_scans: number;
          highest_score: number;
          current_tier: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          coins?: number;
          total_scans?: number;
          highest_score?: number;
          current_tier?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          coins?: number;
          total_scans?: number;
          highest_score?: number;
          current_tier?: string | null;
        };
        Relationships: [];
      };
      scans: {
        Row: {
          id: string;
          user_id: string;
          score: number;
          tier: string;
          symmetry_score: number | null;
          ratio_data: Record<string, unknown> | null;
          roast_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          score: number;
          tier: string;
          symmetry_score?: number | null;
          ratio_data?: Record<string, unknown> | null;
          roast_text?: string | null;
          created_at?: string;
        };
        Update: {
          score?: number;
          tier?: string;
          symmetry_score?: number | null;
          ratio_data?: Record<string, unknown> | null;
          roast_text?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'scans_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      battles: {
        Row: {
          id: string;
          challenger_id: string;
          challenger_scan_id: string;
          opponent_id: string | null;
          opponent_scan_id: string | null;
          winner_id: string | null;
          battle_link: string;
          status: 'pending' | 'completed';
          created_at: string;
        };
        Insert: {
          id?: string;
          challenger_id: string;
          challenger_scan_id: string;
          opponent_id?: string | null;
          opponent_scan_id?: string | null;
          winner_id?: string | null;
          battle_link: string;
          status?: 'pending' | 'completed';
          created_at?: string;
        };
        Update: {
          opponent_id?: string | null;
          opponent_scan_id?: string | null;
          winner_id?: string | null;
          status?: 'pending' | 'completed';
        };
        Relationships: [
          {
            foreignKeyName: 'battles_challenger_id_fkey';
            columns: ['challenger_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'battles_challenger_scan_id_fkey';
            columns: ['challenger_scan_id'];
            isOneToOne: false;
            referencedRelation: 'scans';
            referencedColumns: ['id'];
          },
        ];
      };
      coin_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: string;
          reference_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          type: string;
          reference_id?: string | null;
          created_at?: string;
        };
        Update: {
          amount?: number;
          type?: string;
          reference_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'coin_transactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      leaderboard: {
        Row: {
          user_id: string;
          username: string;
          highest_score: number;
          tier: string;
          opted_in: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          username: string;
          highest_score: number;
          tier: string;
          opted_in?: boolean;
          updated_at?: string;
        };
        Update: {
          username?: string;
          highest_score?: number;
          tier?: string;
          opted_in?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'leaderboard_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      gifts: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string | null;
          recipient_username: string | null;
          gift_link: string | null;
          coin_amount: number;
          iap_product_id: string;
          status: 'pending' | 'claimed' | 'expired';
          claimed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id?: string | null;
          recipient_username?: string | null;
          gift_link?: string | null;
          coin_amount: number;
          iap_product_id: string;
          status?: 'pending' | 'claimed' | 'expired';
          claimed_at?: string | null;
          created_at?: string;
        };
        Update: {
          recipient_id?: string | null;
          status?: 'pending' | 'claimed' | 'expired';
          claimed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'gifts_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
