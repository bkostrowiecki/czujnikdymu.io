"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePocketBase } from "./pocketbase-client-provider";

type FavoriteGigRecord = {
  id: string;
  gig: string;
};

type FavoritePlaceRecord = {
  id: string;
  place: string;
};

type FavoriteArtistRecord = {
  id: string;
  artist: string;
};

type FavoritesContextValue = {
  favoriteGigIds: Set<string>;
  isFavorite: (gigId: string) => boolean;
  toggleFavorite: (gigId: string) => Promise<void>;

  favoritePlaceIds: Set<string>;
  isFavoritePlace: (placeId: string) => boolean;
  toggleFavoritePlace: (placeId: string) => Promise<void>;

  favoriteArtistIds: Set<string>;
  isFavoriteArtist: (artistId: string) => boolean;
  toggleFavoriteArtist: (artistId: string) => Promise<void>;

  isLoading: boolean;
  isLoggedIn: boolean;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

const BASE_STORAGE_KEYS = {
  gigs: "cd_favorite_gigs",
  places: "cd_favorite_places",
  artists: "cd_favorite_artists",
};

function getStorageKey(baseKey: string, userId: string | null): string {
  return userId ? `${baseKey}_${userId}` : `${baseKey}_guest`;
}

function loadFromStorage(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(key: string, ids: Iterable<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(ids)));
  } catch {}
}

export function FavoritesProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string | null;
}) {
  const pb = usePocketBase();

  const [favorites, setFavorites] = useState<Map<string, string>>(new Map());
  const [placeFavorites, setPlaceFavorites] = useState<Map<string, string>>(
    new Map(),
  );
  const [artistFavorites, setArtistFavorites] = useState<Map<string, string>>(
    new Map(),
  );
  const [isLoading, setIsLoading] = useState(true);

  // Sync favorites with PocketBase (or localStorage for guests)
  useEffect(() => {
    // Clean up any stale un-scoped legacy keys to prevent contamination
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(BASE_STORAGE_KEYS.gigs);
        localStorage.removeItem(BASE_STORAGE_KEYS.places);
        localStorage.removeItem(BASE_STORAGE_KEYS.artists);
      } catch {}
    }

    if (!userId) {
      // Guest mode: load strictly from guest storage
      const localGigs = loadFromStorage(
        getStorageKey(BASE_STORAGE_KEYS.gigs, null),
      );
      const localPlaces = loadFromStorage(
        getStorageKey(BASE_STORAGE_KEYS.places, null),
      );
      const localArtists = loadFromStorage(
        getStorageKey(BASE_STORAGE_KEYS.artists, null),
      );

      const gigsMap = new Map<string, string>();
      for (const id of localGigs) gigsMap.set(id, "local");
      setFavorites(gigsMap);

      const placesMap = new Map<string, string>();
      for (const id of localPlaces) placesMap.set(id, "local");
      setPlaceFavorites(placesMap);

      const artistsMap = new Map<string, string>();
      for (const id of localArtists) artistsMap.set(id, "local");
      setArtistFavorites(artistsMap);

      setIsLoading(false);
      return;
    }

    // Authenticated user: PocketBase is the single source of truth
    // 1. Initial quick visual state from user cache
    const cachedGigs = loadFromStorage(
      getStorageKey(BASE_STORAGE_KEYS.gigs, userId),
    );
    const cachedPlaces = loadFromStorage(
      getStorageKey(BASE_STORAGE_KEYS.places, userId),
    );
    const cachedArtists = loadFromStorage(
      getStorageKey(BASE_STORAGE_KEYS.artists, userId),
    );

    if (cachedGigs.length > 0) {
      setFavorites(new Map(cachedGigs.map((id) => [id, "local"])));
    }
    if (cachedPlaces.length > 0) {
      setPlaceFavorites(new Map(cachedPlaces.map((id) => [id, "local"])));
    }
    if (cachedArtists.length > 0) {
      setArtistFavorites(new Map(cachedArtists.map((id) => [id, "local"])));
    }

    // 2. Fetch authoritative data from PocketBase
    let cancelled = false;

    Promise.all([
      pb
        .collection("favoriteGigs")
        .getFullList<FavoriteGigRecord>({
          filter: `user = "${userId}"`,
          fields: "id,gig",
        })
        .catch(() => [] as FavoriteGigRecord[]),
      pb
        .collection("favoritePlaces")
        .getFullList<FavoritePlaceRecord>({
          filter: `user = "${userId}"`,
          fields: "id,place",
        })
        .catch(() => [] as FavoritePlaceRecord[]),
      pb
        .collection("favoriteArtists")
        .getFullList<FavoriteArtistRecord>({
          filter: `user = "${userId}"`,
          fields: "id,artist",
        })
        .catch(() => [] as FavoriteArtistRecord[]),
    ])
      .then(([gigRecords, placeRecords, artistRecords]) => {
        if (cancelled) return;

        const gigsMap = new Map<string, string>();
        for (const r of gigRecords) {
          gigsMap.set(r.gig, r.id);
        }
        setFavorites(gigsMap);
        saveToStorage(
          getStorageKey(BASE_STORAGE_KEYS.gigs, userId),
          gigsMap.keys(),
        );

        const placesMap = new Map<string, string>();
        for (const r of placeRecords) {
          placesMap.set(r.place, r.id);
        }
        setPlaceFavorites(placesMap);
        saveToStorage(
          getStorageKey(BASE_STORAGE_KEYS.places, userId),
          placesMap.keys(),
        );

        const artistsMap = new Map<string, string>();
        for (const r of artistRecords) {
          artistsMap.set(r.artist, r.id);
        }
        setArtistFavorites(artistsMap);
        saveToStorage(
          getStorageKey(BASE_STORAGE_KEYS.artists, userId),
          artistsMap.keys(),
        );
      })
      .catch((err) => {
        console.error("Failed to load favorites from PocketBase:", err);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId, pb]);

  const favoriteGigIds = new Set(favorites.keys());
  const favoritePlaceIds = new Set(placeFavorites.keys());
  const favoriteArtistIds = new Set(artistFavorites.keys());

  const isFavorite = useCallback(
    (gigId: string) => favorites.has(gigId),
    [favorites],
  );

  const isFavoritePlace = useCallback(
    (placeId: string) => placeFavorites.has(placeId),
    [placeFavorites],
  );

  const isFavoriteArtist = useCallback(
    (artistId: string) => artistFavorites.has(artistId),
    [artistFavorites],
  );

  const toggleFavorite = useCallback(
    async (gigId: string) => {
      const existingRecordId = favorites.get(gigId);
      const storageKey = getStorageKey(BASE_STORAGE_KEYS.gigs, userId);

      if (existingRecordId) {
        // Optimistic removal
        setFavorites((prev) => {
          const next = new Map(prev);
          next.delete(gigId);
          saveToStorage(storageKey, next.keys());
          return next;
        });

        if (userId) {
          try {
            if (existingRecordId !== "local") {
              await pb.collection("favoriteGigs").delete(existingRecordId);
            } else {
              const found = await pb
                .collection("favoriteGigs")
                .getFirstListItem(`user = "${userId}" && gig = "${gigId}"`)
                .catch(() => null);
              if (found) {
                await pb.collection("favoriteGigs").delete(found.id);
              }
            }
          } catch (err: any) {
            if (err?.status === 404) {
              // Record already gone
            } else {
              console.error("Failed to remove favorite gig:", err);
              // Revert
              setFavorites((prev) => {
                const next = new Map(prev).set(gigId, existingRecordId);
                saveToStorage(storageKey, next.keys());
                return next;
              });
            }
          }
        }
      } else {
        // Optimistic add
        setFavorites((prev) => {
          const next = new Map(prev).set(gigId, "local");
          saveToStorage(storageKey, next.keys());
          return next;
        });

        if (userId) {
          try {
            const record = await pb
              .collection("favoriteGigs")
              .create({ user: userId, gig: gigId });
            setFavorites((prev) => {
              const next = new Map(prev).set(gigId, record.id);
              saveToStorage(storageKey, next.keys());
              return next;
            });
          } catch (err: any) {
            // If already exists in PB, fetch it
            try {
              const found = await pb
                .collection("favoriteGigs")
                .getFirstListItem(`user = "${userId}" && gig = "${gigId}"`);
              setFavorites((prev) => {
                const next = new Map(prev).set(gigId, found.id);
                saveToStorage(storageKey, next.keys());
                return next;
              });
            } catch {
              console.error("Failed to save favorite gig:", err);
              // Revert
              setFavorites((prev) => {
                const next = new Map(prev);
                next.delete(gigId);
                saveToStorage(storageKey, next.keys());
                return next;
              });
            }
          }
        }
      }
    },
    [userId, favorites, pb],
  );

  const toggleFavoritePlace = useCallback(
    async (placeId: string) => {
      const existingRecordId = placeFavorites.get(placeId);
      const storageKey = getStorageKey(BASE_STORAGE_KEYS.places, userId);

      if (existingRecordId) {
        // Optimistic removal
        setPlaceFavorites((prev) => {
          const next = new Map(prev);
          next.delete(placeId);
          saveToStorage(storageKey, next.keys());
          return next;
        });

        if (userId) {
          try {
            if (existingRecordId !== "local") {
              await pb.collection("favoritePlaces").delete(existingRecordId);
            } else {
              const found = await pb
                .collection("favoritePlaces")
                .getFirstListItem(`user = "${userId}" && place = "${placeId}"`)
                .catch(() => null);
              if (found) {
                await pb.collection("favoritePlaces").delete(found.id);
              }
            }
          } catch (err: any) {
            if (err?.status === 404) {
              // Record already gone
            } else {
              console.error("Failed to remove favorite place:", err);
              // Revert
              setPlaceFavorites((prev) => {
                const next = new Map(prev).set(placeId, existingRecordId);
                saveToStorage(storageKey, next.keys());
                return next;
              });
            }
          }
        }
      } else {
        // Optimistic add
        setPlaceFavorites((prev) => {
          const next = new Map(prev).set(placeId, "local");
          saveToStorage(storageKey, next.keys());
          return next;
        });

        if (userId) {
          try {
            const record = await pb
              .collection("favoritePlaces")
              .create({ user: userId, place: placeId });
            setPlaceFavorites((prev) => {
              const next = new Map(prev).set(placeId, record.id);
              saveToStorage(storageKey, next.keys());
              return next;
            });
          } catch (err: any) {
            // If already exists in PB, fetch it
            try {
              const found = await pb
                .collection("favoritePlaces")
                .getFirstListItem(`user = "${userId}" && place = "${placeId}"`);
              setPlaceFavorites((prev) => {
                const next = new Map(prev).set(placeId, found.id);
                saveToStorage(storageKey, next.keys());
                return next;
              });
            } catch {
              console.error("Failed to save favorite place:", err);
              // Revert
              setPlaceFavorites((prev) => {
                const next = new Map(prev);
                next.delete(placeId);
                saveToStorage(storageKey, next.keys());
                return next;
              });
            }
          }
        }
      }
    },
    [userId, placeFavorites, pb],
  );

  const toggleFavoriteArtist = useCallback(
    async (artistId: string) => {
      const existingRecordId = artistFavorites.get(artistId);
      const storageKey = getStorageKey(BASE_STORAGE_KEYS.artists, userId);

      if (existingRecordId) {
        // Optimistic removal
        setArtistFavorites((prev) => {
          const next = new Map(prev);
          next.delete(artistId);
          saveToStorage(storageKey, next.keys());
          return next;
        });

        if (userId) {
          try {
            if (existingRecordId !== "local") {
              await pb.collection("favoriteArtists").delete(existingRecordId);
            } else {
              const found = await pb
                .collection("favoriteArtists")
                .getFirstListItem(
                  `user = "${userId}" && artist = "${artistId}"`,
                )
                .catch(() => null);
              if (found) {
                await pb.collection("favoriteArtists").delete(found.id);
              }
            }
          } catch (err: any) {
            if (err?.status === 404) {
              // Record already gone
            } else {
              console.error("Failed to remove favorite artist:", err);
              // Revert
              setArtistFavorites((prev) => {
                const next = new Map(prev).set(artistId, existingRecordId);
                saveToStorage(storageKey, next.keys());
                return next;
              });
            }
          }
        }
      } else {
        // Optimistic add
        setArtistFavorites((prev) => {
          const next = new Map(prev).set(artistId, "local");
          saveToStorage(storageKey, next.keys());
          return next;
        });

        if (userId) {
          try {
            const record = await pb
              .collection("favoriteArtists")
              .create({ user: userId, artist: artistId });
            setArtistFavorites((prev) => {
              const next = new Map(prev).set(artistId, record.id);
              saveToStorage(storageKey, next.keys());
              return next;
            });
          } catch (err: any) {
            // If already exists in PB, fetch it
            try {
              const found = await pb
                .collection("favoriteArtists")
                .getFirstListItem(
                  `user = "${userId}" && artist = "${artistId}"`,
                );
              setArtistFavorites((prev) => {
                const next = new Map(prev).set(artistId, found.id);
                saveToStorage(storageKey, next.keys());
                return next;
              });
            } catch {
              console.error("Failed to save favorite artist:", err);
              // Revert
              setArtistFavorites((prev) => {
                const next = new Map(prev);
                next.delete(artistId);
                saveToStorage(storageKey, next.keys());
                return next;
              });
            }
          }
        }
      }
    },
    [userId, artistFavorites, pb],
  );

  return (
    <FavoritesContext.Provider
      value={{
        favoriteGigIds,
        isFavorite,
        toggleFavorite,

        favoritePlaceIds,
        isFavoritePlace,
        toggleFavoritePlace,

        favoriteArtistIds,
        isFavoriteArtist,
        toggleFavoriteArtist,

        isLoading,
        isLoggedIn: !!userId,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx)
    throw new Error("useFavorites must be used within a FavoritesProvider");
  return ctx;
}
