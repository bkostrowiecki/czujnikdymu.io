"use client";

import { FavoriteButton } from "@/components/favorite-button";

export function GigFavoriteButton({ gigId }: { gigId: string }) {
  return <FavoriteButton gigId={gigId} size={24} />;
}
