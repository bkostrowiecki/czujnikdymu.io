"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFavorites } from "@/app/shared/favorites-provider";

export function FavoriteButton({
  gigId,
  placeId,
  artistId,
  size = 20,
  className = "",
}: {
  gigId?: string;
  placeId?: string;
  artistId?: string;
  size?: number;
  className?: string;
}) {
  const {
    isFavorite,
    toggleFavorite,
    isFavoritePlace,
    toggleFavoritePlace,
    isFavoriteArtist,
    toggleFavoriteArtist,
    isLoggedIn,
  } = useFavorites();
  const router = useRouter();
  const [animating, setAnimating] = useState(false);

  let active = false;
  let labelAdd = "Dodaj do ulubionych";
  let labelRemove = "Usuń z ulubionych";
  let toggleHandler: (() => Promise<void>) | null = null;

  if (placeId) {
    active = isFavoritePlace(placeId);
    labelAdd = "Dodaj miejsce do ulubionych";
    labelRemove = "Usuń miejsce z ulubionych";
    toggleHandler = () => toggleFavoritePlace(placeId);
  } else if (artistId) {
    active = isFavoriteArtist(artistId);
    labelAdd = "Dodaj wykonawcę do ulubionych";
    labelRemove = "Usuń wykonawcę z ulubionych";
    toggleHandler = () => toggleFavoriteArtist(artistId);
  } else if (gigId) {
    active = isFavorite(gigId);
    labelAdd = "Dodaj koncert do ulubionych";
    labelRemove = "Usuń koncert z ulubionych";
    toggleHandler = () => toggleFavorite(gigId);
  }

  const handleClick = async (e: React.MouseEvent) => {
    // Prevent card link navigation
    e.preventDefault();
    e.stopPropagation();

    if (!toggleHandler) return;

    setAnimating(true);
    await toggleHandler();
    setTimeout(() => setAnimating(false), 300);

    if (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/konto")
    ) {
      router.refresh();
    }
  };

  const label = active ? labelRemove : labelAdd;

  return (
    <button
      type="button"
      className={`favorite-btn ${active ? "active" : ""} ${animating ? "favorite-btn--animating" : ""} ${className}`}
      onClick={handleClick}
      aria-label={label}
      title={label}
      style={{
        position: "relative",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "6px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        transition: "transform 0.15s ease",
        zIndex: 10,
      }}
    >
      <i
        className={`bi ${active ? "bi-heart-fill" : "bi-heart"}`}
        style={{
          fontSize: `${size}px`,
          color: active ? "#e74c6f" : "rgba(255, 255, 255, 0.7)",
          transition: "color 0.2s ease, transform 0.2s ease",
          filter: active
            ? "drop-shadow(0 0 4px rgba(231, 76, 111, 0.5))"
            : "none",
        }}
      />
    </button>
  );
}
