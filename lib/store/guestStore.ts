export interface GuestData {
  interactions: { media_id: number; media_type: string; interaction_type: string }[];
  favorites: {
    genres: string[];
    movies: any[];
    tv: any[];
    anime: any[];
  };
  moods: string[];
}

const GUEST_STORAGE_KEY = "dobinge_guest_data";

export const getGuestData = (): GuestData => {
  if (typeof window === "undefined") return { interactions: [], favorites: { genres: [], movies: [], tv: [], anime: [] }, moods: [] };
  const data = localStorage.getItem(GUEST_STORAGE_KEY);
  return data ? JSON.parse(data) : { interactions: [], favorites: { genres: [], movies: [], tv: [], anime: [] }, moods: [] };
};

export const saveGuestData = (data: GuestData) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(data));
  }
};

export const addGuestInteraction = (media_id: number, media_type: string, interaction_type: string) => {
  const data = getGuestData();
  // Prevent duplicates
  const exists = data.interactions.some(i => i.media_id === media_id && i.interaction_type === interaction_type);
  if (!exists) {
    data.interactions.push({ media_id, media_type, interaction_type });
    saveGuestData(data);
  }
};

export const clearGuestData = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(GUEST_STORAGE_KEY);
    localStorage.removeItem("dobinge_guest_mode");
  }
};