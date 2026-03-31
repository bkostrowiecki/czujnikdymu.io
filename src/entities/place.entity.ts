import { CityId } from "./city.entity";
import { LocationVO } from "./location.value";
import { UrlVO } from "./url.value";

export type PlaceId = {
    __brand: 'place'
} & string;

export interface PlaceEntity {
  address: string;
  collectionId: string;
  collectionName: 'places';
  created: Date;
  facebookUrl: UrlVO;
  gigs: any[];
  id: PlaceId;
  location: LocationVO;
  name: string;
  updated: Date;
  city: CityId;
  coverImageUrl: UrlVO;
}
