// User types
export interface User {
  id: number;
  username: string;
  role: "admin" | "committee";
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Nomination types
export interface Nomination {
  id: number;
  name: string;
  year: number;
  career_position?: string | null;
  professional_achievements?: string | null;
  professional_awards?: string | null;
  educational_achievements?: string | null;
  merit_awards?: string | null;
  service_church_community?: string | null;
  service_mbaphs?: string | null;
  nomination_summary?: string | null;
  nominator_name?: string | null;
  nominator_email?: string | null;
  nominator_phone?: string | null;
  created_at?: string;
  created_by?: number;
}

export interface NominationInput {
  name: string;
  year: number;
  career_position?: string;
  professional_achievements?: string;
  professional_awards?: string;
  educational_achievements?: string;
  merit_awards?: string;
  service_church_community?: string;
  service_mbaphs?: string;
  nomination_summary?: string;
  nominator_name?: string;
  nominator_email?: string;
  nominator_phone?: string;
}

// Person (aggregated nominations)
export interface Person {
  name: string;
  year: string;
  nomination_count: number;
}

// Ballot types
export interface BallotSelection {
  person_name: string;
  person_year: string;
}

// Results types
export interface ResultPerson {
  name: string;
  year: string;
  selection_count: number;
  total_committee: number;
  percentage: number;
  voters: Array<{ id: number; username: string }>;
}

// Stats types
export interface Stats {
  totalPeople: number;
  totalNominations: number;
  committeeMembers: number;
  mySelections: number;
}

// API Response wrapper
export interface ApiError {
  error: string;
}
