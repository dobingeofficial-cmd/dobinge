/**
 * DoBinge Core TypeScript Type Definitions
 */

export interface MediaCard {
  id: number;
  title: string;
  poster_path: string;
  media_type: "movie" | "tv";
  rating?: number;
  year?: string;
  backdrop_path?: string;
}

export interface WatchProvider {
  name: string;
  logo: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface SimilarMedia {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  vote_average: number;
}

export interface MediaDetails {
  title: string;
  overview: string;
  posterPath: string;
  releaseYear: number;
  runtime: number;
  rating: string;
  genres: string[];
  vote_average: number;
}

export interface UserInteraction {
  id?: string;
  user_id: string;
  media_id: number;
  media_type: "movie" | "tv";
  action: "watchlist" | "watched" | "skip";
  reaction?: "liked" | null;
  created_at: string;
}