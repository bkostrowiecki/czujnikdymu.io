import type { CityEntity } from "@/entities/city.entity";
import type { GenreEntity } from "@/entities/genre.entity";
import type { GigArtist, GigEntity } from "@/entities/gig.entity";
import type { PlaceEntity } from "@/entities/place.entity";

export interface GigDraftEntity {
  id: string;
  collectionId?: string;
  collectionName?: string;
  title: string;
  description?: string;
  descriptionHash?: string;
  isUpdate?: boolean;
  targetGig?: string;
  place?: string;
  city?: string;
  artists?: string[];
  genres?: string[];
  startsAt?: string;
  coverImage?: string;
  coverImageUrl?: string;
  sourceUrl?: string;
  requestedBy?: string;
  postponedCount?: number;
  created?: string;
  updated?: string;
  expand?: {
    place?: PlaceEntity;
    city?: CityEntity;
    artists?: GigArtist[];
    genres?: GenreEntity[];
    targetGig?: GigEntity;
  };
}
