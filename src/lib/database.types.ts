// Hand-rolled types matching the Supabase schema in supabase/migrations/.
// Replace with `supabase gen types typescript` output once the project is linked.
//
// Note: Row / Insert / Update are declared as `type` (not `interface`) on
// purpose. Supabase's `GenericTable` constraint requires Row/Insert/Update to
// extend `Record<string, unknown>`. TypeScript interfaces don't auto-satisfy
// `Record<string, unknown>` (no implicit index signature), but type aliases
// over object literals do — so the table types resolve correctly here.

export type GenerationStatus = 'pending' | 'generating' | 'published' | 'failed';

export type AirportRow = {
  iata: string;
  icao: string | null;
  name: string;
  city: string;
  country: string;
  country_code: string | null;
  lat: number | null;
  lng: number | null;
  timezone: string | null;
  terminals: unknown | null;
  history_md: string | null;
  local_travel_md: string | null;
  about_md: string | null;
  generated_at: string | null;
  content_version: number;
  release_wave: number;            // added in migration 0002
  published_at: string | null;     // added in migration 0002
  created_at: string;
  updated_at: string;
};

export type RouteRow = {
  id: string;
  origin_iata: string;
  destination_iata: string;
  slug: string;
  distance_km: number | null;
  typical_duration_min: number | null;
  airlines: string[] | null;
  hero_md: string | null;
  history_md: string | null;
  faqs: unknown | null; // jsonb: Array<{ q: string; a: string }>
  meta_title: string | null;
  meta_description: string | null;
  status: GenerationStatus;
  generated_at: string | null;
  content_version: number;
  release_wave: number;            // added in migration 0002
  published_at: string | null;     // added in migration 0002
  created_at: string;
  updated_at: string;
};

export type GenerationJobRow = {
  id: string;
  route_id: string | null;
  airport_iata: string | null;
  status: GenerationStatus;
  error: string | null;
  tokens_used: number | null;
  cost_usd: number | null;
  created_at: string;
  completed_at: string | null;
};

// Insert types — required fields explicit, everything else optional.
export type AirportInsert = {
  iata: string;
  name: string;
  city: string;
  country: string;
  icao?: string | null;
  country_code?: string | null;
  lat?: number | null;
  lng?: number | null;
  timezone?: string | null;
  terminals?: unknown;
  history_md?: string | null;
  local_travel_md?: string | null;
  about_md?: string | null;
  generated_at?: string | null;
  content_version?: number;
  release_wave?: number;
  published_at?: string | null;
};

export type RouteInsert = {
  id?: string;
  origin_iata: string;
  destination_iata: string;
  slug: string;
  distance_km?: number | null;
  typical_duration_min?: number | null;
  airlines?: string[] | null;
  hero_md?: string | null;
  history_md?: string | null;
  faqs?: unknown;
  meta_title?: string | null;
  meta_description?: string | null;
  status?: GenerationStatus;
  generated_at?: string | null;
  content_version?: number;
  release_wave?: number;
  published_at?: string | null;
};

export type GenerationJobInsert = {
  id?: string;
  route_id?: string | null;
  airport_iata?: string | null;
  status: GenerationStatus;
  error?: string | null;
  tokens_used?: number | null;
  cost_usd?: number | null;
  completed_at?: string | null;
};

export type Database = {
  public: {
    Tables: {
      airports: {
        Row: AirportRow;
        Insert: AirportInsert;
        Update: Partial<AirportRow>;
        Relationships: [];
      };
      routes: {
        Row: RouteRow;
        Insert: RouteInsert;
        Update: Partial<RouteRow>;
        Relationships: [];
      };
      generation_jobs: {
        Row: GenerationJobRow;
        Insert: GenerationJobInsert;
        Update: Partial<GenerationJobRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { generation_status: GenerationStatus };
    CompositeTypes: Record<string, never>;
  };
};

export type RouteFaq = { q: string; a: string };
