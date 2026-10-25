import type { GenreEntity } from "@/entities/genre.entity";
import type { GigDraftEntity } from "@/entities/gig-draft.entity";

/**
 * Extracts and normalizes search terms for a given genre.
 * Includes explicit `searchTerms`, as well as `name` and formatted `slug`.
 */
export function getGenreSearchTerms(genre: GenreEntity): string[] {
  const terms = new Set<string>();

  if (genre.searchTerms) {
    let rawList: string[] = [];
    const trimmed = genre.searchTerms.trim();

    // Support JSON array format if present
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          rawList = parsed.map(String);
        }
      } catch {
        rawList = [];
      }
    }

    // Otherwise split by comma, semicolon or newline
    if (rawList.length === 0) {
      rawList = genre.searchTerms.split(/[,\n\r;]+/);
    }

    for (const item of rawList) {
      const clean = item.trim().toLowerCase();
      if (clean.length > 0) {
        terms.add(clean);
      }
    }
  }

  // Also include the genre name
  if (genre.name) {
    const nameClean = genre.name.trim().toLowerCase();
    if (nameClean.length > 0) {
      terms.add(nameClean);
    }
  }

  // Also include slug (replacing dashes with spaces, e.g. "post-metal" -> "post metal")
  if (genre.slug) {
    const slugClean = genre.slug.trim().toLowerCase().replace(/-/g, " ");
    if (slugClean.length > 0) {
      terms.add(slugClean);
    }
  }

  return Array.from(terms);
}

/**
 * Clean HTML and normalize text from draft title and description.
 */
export function normalizeDraftText(
  title?: string,
  description?: string,
): string {
  const cleanTitle = (title || "").trim();
  const cleanDescription = (description || "")
    .replace(/<br\s*[/]?>/gi, " ")
    .replace(/<\/div>/gi, " ")
    .replace(/<\/?[^>]+(>|$)/g, " ")
    .trim();

  return `${cleanTitle} ${cleanDescription}`.toLowerCase();
}

export type MatchResult = {
  matchedGenres: GenreEntity[];
  matchedTermsByGenreId: Record<string, string[]>;
};

/**
 * Scans event text for genre search terms using Unicode word boundary matching.
 */
export function detectGenresForDraft(
  draft: GigDraftEntity,
  allGenres: GenreEntity[],
): MatchResult {
  const normalizedText = normalizeDraftText(draft.title, draft.description);
  if (!normalizedText.trim()) {
    return { matchedGenres: [], matchedTermsByGenreId: {} };
  }

  const matchedGenres: GenreEntity[] = [];
  const matchedTermsByGenreId: Record<string, string[]> = {};

  for (const genre of allGenres) {
    const terms = getGenreSearchTerms(genre);
    const matchedTerms: string[] = [];

    for (const term of terms) {
      if (!term) continue;

      // Unicode boundary regex so "doom" matches "doom metal" but "emo" doesn't match inside "demokratyczny"
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(
        `(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`,
        "iu",
      );

      if (regex.test(normalizedText)) {
        matchedTerms.push(term);
      }
    }

    if (matchedTerms.length > 0) {
      matchedGenres.push(genre);
      matchedTermsByGenreId[genre.id] = matchedTerms;
    }
  }

  return { matchedGenres, matchedTermsByGenreId };
}
