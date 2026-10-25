import type { GenreEntity } from "@/entities/genre.entity";

export interface ArtistEntity {
  id: string;
  slug: string;
  name: string;
  coverImage?: string;
  facebookUrl?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  genres: string[];
  expand?: {
    genres?: GenreEntity[];
  };
}
