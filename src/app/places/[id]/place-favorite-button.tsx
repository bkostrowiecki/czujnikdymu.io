"use client";

import { FavoriteButton } from "@/components/favorite-button";

export function PlaceFavoriteButton({ placeId }: { placeId: string }) {
  return <FavoriteButton placeId={placeId} size={24} />;
}
