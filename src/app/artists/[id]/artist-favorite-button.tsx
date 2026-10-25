"use client";

import { FavoriteButton } from "@/components/favorite-button";

export function ArtistFavoriteButton({ artistId }: { artistId: string }) {
  return <FavoriteButton artistId={artistId} size={24} />;
}
