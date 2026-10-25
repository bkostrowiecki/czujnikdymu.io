import type { PlaceEntity, PlaceId } from "./place.entity";

export type CityId = {
  __brand: "city";
} & string;

export interface CityEntity {
  id: CityId;
  slug: string;
  name: string;
  places: PlaceEntity[] | PlaceId[];
  created: Date;
  updated: Date;
}
