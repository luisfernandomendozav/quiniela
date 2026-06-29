import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("Falta DATABASE_URL en el entorno");
}

// Cliente SQL serverless de Neon. Uso: sql`SELECT ...`
export const sql = neon(process.env.DATABASE_URL);

export type User = {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
};

export type Match = {
  id: number;
  jornada: number;
  home_team: string;
  away_team: string;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  status: "pending" | "finished";
  stage: string | null;
  group_name: string | null;
  venue: string | null;
  city: string | null;
  pen_winner: "home" | "away" | null;
};

export type Stadium = {
  id: number;
  name: string;
  city: string;
  country: string;
  capacity: number | null;
  is_mexico: boolean;
};

export type Prediction = {
  id: number;
  user_id: number;
  match_id: number;
  pred_home: number;
  pred_away: number;
  points: number;
};
