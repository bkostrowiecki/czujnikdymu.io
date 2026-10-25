export type SavedSearchFilters = {
  cities?: string[];
  genres?: string[];
  query?: string;
  sortBy?: "date-asc" | "date-desc" | "name-asc";
};

export type FilterPreset = {
  id: string;
  name: string;
  cities?: string[];
  genres?: string[];
  query?: string;
  sortBy?: "date-asc" | "date-desc" | "name-asc";
  createdAt?: string;
};

export type UserEntity = {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  searchFilters?:
    | FilterPreset[]
    | SavedSearchFilters
    | { presets: FilterPreset[] }
    | null;
  role?: string;
  cities?: string[];
  created: string;
  updated: string;
};
