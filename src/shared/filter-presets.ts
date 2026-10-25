import type { CityEntity } from "@/entities/city.entity";
import type { GenreEntity } from "@/entities/genre.entity";

export type FilterPreset = {
  id: string;
  name: string;
  cities?: string[];
  genres?: string[];
  query?: string;
  sortBy?: "date-asc" | "date-desc" | "name-asc";
  createdAt?: string;
};

export function normalizeFilterPresets(raw: unknown): FilterPreset[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .filter(
        (item): item is Record<string, unknown> =>
          typeof item === "object" && item !== null,
      )
      .map((item, idx) => ({
        id:
          typeof item.id === "string" && item.id
            ? item.id
            : `preset_${idx}_${Date.now()}`,
        name:
          typeof item.name === "string" && item.name.trim()
            ? item.name.trim()
            : `Zestaw ${idx + 1}`,
        cities: Array.isArray(item.cities)
          ? item.cities.filter((c): c is string => typeof c === "string")
          : [],
        genres: Array.isArray(item.genres)
          ? item.genres.filter((g): g is string => typeof g === "string")
          : [],
        query: typeof item.query === "string" ? item.query.trim() : "",
        sortBy:
          item.sortBy === "date-desc" || item.sortBy === "name-asc"
            ? item.sortBy
            : "date-asc",
        createdAt:
          typeof item.createdAt === "string"
            ? item.createdAt
            : new Date().toISOString(),
      }));
  }

  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.presets)) {
      return normalizeFilterPresets(obj.presets);
    }

    // Legacy format support: single object with cities, genres, query, sortBy
    const hasCities = Array.isArray(obj.cities) && obj.cities.length > 0;
    const hasGenres = Array.isArray(obj.genres) && obj.genres.length > 0;
    const hasQuery =
      typeof obj.query === "string" && obj.query.trim().length > 0;
    const hasSort = typeof obj.sortBy === "string" && obj.sortBy !== "date-asc";

    if (hasCities || hasGenres || hasQuery || hasSort) {
      return [
        {
          id: "default",
          name: "Zapisane filtry",
          cities: Array.isArray(obj.cities)
            ? obj.cities.filter((c): c is string => typeof c === "string")
            : [],
          genres: Array.isArray(obj.genres)
            ? obj.genres.filter((g): g is string => typeof g === "string")
            : [],
          query: typeof obj.query === "string" ? obj.query.trim() : "",
          sortBy:
            obj.sortBy === "date-desc" || obj.sortBy === "name-asc"
              ? obj.sortBy
              : "date-asc",
          createdAt: new Date().toISOString(),
        },
      ];
    }
  }

  return [];
}

export function arePresetFiltersEqual(
  a?: Partial<FilterPreset> | null,
  b?: Partial<FilterPreset> | null,
): boolean {
  if (!a && !b) return true;
  const aCities = [...(a?.cities ?? [])].sort().join(",");
  const bCities = [...(b?.cities ?? [])].sort().join(",");
  const aGenres = [...(a?.genres ?? [])].sort().join(",");
  const bGenres = [...(b?.genres ?? [])].sort().join(",");
  const aQuery = (a?.query ?? "").trim().toLowerCase();
  const bQuery = (b?.query ?? "").trim().toLowerCase();
  const aSort = a?.sortBy ?? "date-asc";
  const bSort = b?.sortBy ?? "date-asc";

  return (
    aCities === bCities &&
    aGenres === bGenres &&
    aQuery === bQuery &&
    aSort === bSort
  );
}

export function generatePresetSummary(
  preset: Partial<FilterPreset>,
  cities: CityEntity[] = [],
  genres: GenreEntity[] = [],
): string {
  const cityMap = new Map<string, string>(cities.map((c) => [c.id, c.name]));
  const genreMap = new Map<string, string>(genres.map((g) => [g.id, g.name]));

  const cityNames = (preset.cities ?? [])
    .map((id) => cityMap.get(id))
    .filter(Boolean) as string[];

  const genreNames = (preset.genres ?? [])
    .map((id) => genreMap.get(id))
    .filter(Boolean) as string[];

  const parts: string[] = [];

  if (cityNames.length > 0) {
    parts.push(
      cityNames.length > 2
        ? `${cityNames.slice(0, 2).join(", ")} +${cityNames.length - 2}`
        : cityNames.join(", "),
    );
  }

  if (genreNames.length > 0) {
    parts.push(
      genreNames.length > 2
        ? `${genreNames.slice(0, 2).join(", ")} +${genreNames.length - 2}`
        : genreNames.join(", "),
    );
  }

  if (preset.query?.trim()) {
    parts.push(`"${preset.query.trim()}"`);
  }

  if (preset.sortBy && preset.sortBy !== "date-asc") {
    parts.push(preset.sortBy === "date-desc" ? "Od najpóźniejszych" : "A-Z");
  }

  return parts.length > 0 ? parts.join(" • ") : "Wszystkie koncerty";
}

export function suggestPresetName(
  filters: { cities?: string[]; genres?: string[]; query?: string },
  cities: CityEntity[] = [],
  genres: GenreEntity[] = [],
): string {
  const cityMap = new Map<string, string>(cities.map((c) => [c.id, c.name]));
  const genreMap = new Map<string, string>(genres.map((g) => [g.id, g.name]));

  const cityNames = (filters.cities ?? [])
    .map((id) => cityMap.get(id))
    .filter(Boolean) as string[];

  const genreNames = (filters.genres ?? [])
    .map((id) => genreMap.get(id))
    .filter(Boolean) as string[];

  const trimmedQuery = (filters.query ?? "").trim();

  if (cityNames.length > 0 && genreNames.length > 0) {
    return `${cityNames[0]} • ${genreNames[0]}`;
  }

  if (cityNames.length > 0) {
    return cityNames.length > 2
      ? `${cityNames.slice(0, 2).join(", ")}...`
      : cityNames.join(", ");
  }

  if (genreNames.length > 0) {
    return genreNames.length > 2
      ? `${genreNames.slice(0, 2).join(", ")}...`
      : genreNames.join(", ");
  }

  if (trimmedQuery) {
    return `Szukaj: ${trimmedQuery}`;
  }

  return "Mój zestaw filtrów";
}

export function buildPresetQueryString(preset: Partial<FilterPreset>): string {
  const params = new URLSearchParams();
  if (preset.id) params.set("preset", preset.id);
  if (preset.query?.trim()) params.set("q", preset.query.trim());
  if (preset.cities?.length) params.set("cities", preset.cities.join(","));
  if (preset.genres?.length) params.set("genres", preset.genres.join(","));
  if (preset.sortBy && preset.sortBy !== "date-asc")
    params.set("sort", preset.sortBy);
  return params.toString();
}
