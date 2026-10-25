import type { GenreEntity } from "@/entities/genre.entity";
import type { PlaceEntity } from "@/entities/place.entity";

export interface GigArtist {
  id: string;
  slug: string;
  name: string;
  facebookUrl?: string;
  websiteUrl?: string;
  genres: string[];
  expand?: {
    genres?: GenreEntity[];
  };
}

export interface GigEntity {
  id: string;
  collectionId?: string;
  collectionName?: string;
  title: string;
  description?: string;
  coverImage?: string;
  coverImageUrl?: string;
  sourceUrl?: string;
  startsAt?: string;
  city?: string;
  place?: string;
  artists?: string[];
  genres?: string[];
  descriptionHash?: string;
  expand?: {
    place?: PlaceEntity;
    artists?: GigArtist[];
    genres?: GenreEntity[];
  };
}
