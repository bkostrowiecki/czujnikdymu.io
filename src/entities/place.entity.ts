import type { CityId } from "./city.entity";
import type { LocationVO } from "./location.value";
import type { UrlVO } from "./url.value";

export type PlaceId = {
  __brand: "place";
} & string;

export interface PlaceEntity {
  address: string;
  collectionId: string;
  collectionName: "places";
  created: Date;
  facebookUrl: UrlVO;
  gigs: any[];
  id: PlaceId;
  slug: string;
  location: LocationVO;
  name: string;
  updated: Date;
  city: CityId;
  coverImage?: string;
  coverImageUrl?: UrlVO;
}
