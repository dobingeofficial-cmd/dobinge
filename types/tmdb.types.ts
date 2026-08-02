export interface DoBingeMedia {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type: 'movie' | 'tv';
  // TODO: Expand with additional fields in Phase 2
}