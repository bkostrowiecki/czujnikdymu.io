"use server";

import { initializeSsrPb } from "@/app/shared/pocketbase-ssr";

const SCRAPPER_URL =
  process.env.SCRAPPER_SERVICE_URL || "http://127.0.0.1:3001";

/**
 * Ensures user is authenticated and has moderator role.
 */
async function getAuthenticatedModerator() {
  const pb = await initializeSsrPb();
  if (!pb.authStore.isValid || !pb.authStore.record) {
    throw new Error(
      "Musisz być zalogowany, aby uzyskać dostęp do panelu scrappera.",
    );
  }
  const user = pb.authStore.record;
  if (user.role !== "moderator") {
    throw new Error(
      "Dostęp do tej strony mają wyłącznie użytkownicy z rolą moderatora.",
    );
  }
  return { pb, user };
}

export interface ScrapedGigProposalDto {
  title: string;
  startsAt: string | null;
  rawDate: string;
  rawPlace: string;
  description: string;
  coverSrc: string;
  url: string;
  suggestedPlaceId?: string;
  suggestedCityId?: string;
  suggestedArtistIds: string[];
}

export interface PlaceOptionDto {
  id: string;
  name: string;
  city: string;
  address?: string;
}

export interface ArtistOptionDto {
  id: string;
  name: string;
  slug?: string;
}

export interface CityOptionDto {
  id: string;
  name: string;
}

/**
 * 1. Scrapowanie Koncertów - Pobranie propozycji pojedynczego wydarzenia:
 * Pobiera dane wydarzenia, dopasowuje miejsce i artystów z bazy danych.
 */
export async function previewConcertAction(url: string) {
  try {
    await getAuthenticatedModerator();

    if (!url || !url.trim()) {
      return {
        success: false,
        error: "Podaj prawidłowy link do wydarzenia na Facebooku.",
      };
    }

    const response = await fetch(`${SCRAPPER_URL}/api/gigs/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim() }),
      cache: "no-store",
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(
        result.error || `Błąd pobierania wydarzenia (${response.status})`,
      );
    }

    return {
      success: true,
      data: result.data as ScrapedGigProposalDto,
      places: (result.places || []) as PlaceOptionDto[],
      artists: (result.artists || []) as ArtistOptionDto[],
      cities: (result.cities || []) as CityOptionDto[],
    };
  } catch (err: any) {
    console.error("previewConcertAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * 1b. Scrapowanie Koncertów - Potwierdzenie i dodanie do draftów:
 * Zapisuje zweryfikowane wydarzenie w PocketBase gigDrafts z przypisanym requestedBy.
 */
export async function confirmConcertAction(input: {
  title: string;
  startsAt?: string;
  placeId?: string;
  cityId?: string;
  artistIds?: string[];
  description?: string;
  sourceUrl?: string;
  customCoverUrl?: string;
  coverBase64?: string;
  coverFileName?: string;
  coverSrc?: string;
  downloadImage?: boolean;
}) {
  try {
    const { user } = await getAuthenticatedModerator();

    const response = await fetch(`${SCRAPPER_URL}/api/gigs/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        requestedBy: user.id,
      }),
      cache: "no-store",
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(
        result.error || `Błąd zapisu koncertu (${response.status})`,
      );
    }

    return {
      success: true,
      draftId: result.draftId,
      isNew: result.isNew,
      message: result.message,
    };
  } catch (err: any) {
    console.error("confirmConcertAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Legacy: uruchomienie całego ticku na danej stronie (opcjonalnie)
 */
export async function scrapeConcertsAction(
  url: string,
  options?: {
    customCoverUrl?: string;
    coverBase64?: string;
    coverFileName?: string;
  },
) {
  try {
    const { user } = await getAuthenticatedModerator();

    if (!url || !url.trim()) {
      return {
        success: false,
        error: "Podaj prawidłowy adres URL wydarzenia lub strony Facebooka.",
      };
    }

    const cleanUrl = url.trim();

    const response = await fetch(`${SCRAPPER_URL}/api/tick`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: cleanUrl,
        requestedBy: user.id,
        customCoverUrl: options?.customCoverUrl,
        coverBase64: options?.coverBase64,
        coverFileName: options?.coverFileName,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(
        errData?.message || `Błąd serwera scrappera: ${response.statusText}`,
      );
    }

    const result = await response.json();
    return {
      success: true,
      totalDraftsSaved: result.totalDraftsSaved || 0,
      message:
        result.totalDraftsSaved > 0
          ? `Pomyślnie zescrapowano i dodano ${result.totalDraftsSaved} draft(ów) do kolejki moderacji!`
          : "Scrapper zakończył działanie. Wydarzenie może już istnieć w bazie z niezmienionym opisem.",
    };
  } catch (err: any) {
    console.error("scrapeConcertsAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * 2. Scrapowanie Wykonawców - Pobranie propozycji:
 * Pobiera dane wykonawcy z Facebooka lub Bandcampa i sprawdza, czy wpis już istnieje w bazie.
 */
export async function previewArtistAction(url: string) {
  try {
    await getAuthenticatedModerator();

    if (!url || !url.trim()) {
      return {
        success: false,
        error: "Podaj adres URL profilu zespołu na Facebooku lub Bandcampie.",
      };
    }

    const response = await fetch(`${SCRAPPER_URL}/api/artists/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: url.trim(),
        saveToPb: false,
      }),
      cache: "no-store",
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(
        result.error || `Błąd scrapowania wykonawcy (${response.status})`,
      );
    }

    return {
      success: true,
      data: result.data,
      existingArtist: result.existingArtist,
      isUpdate: Boolean(result.existingArtist),
      isNew: !result.existingArtist,
      message: result.message,
    };
  } catch (err: any) {
    console.error("previewArtistAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * 2. Scrapowanie Wykonawców - Potwierdzenie zapisu:
 * Zatwierdza dodanie nowego lub aktualizację istniejącego wykonawcy.
 */
export async function confirmArtistAction(
  artist: any,
  options?: {
    customCoverUrl?: string;
    coverBase64?: string;
    coverFileName?: string;
    downloadImage?: boolean;
  },
) {
  try {
    await getAuthenticatedModerator();

    const response = await fetch(`${SCRAPPER_URL}/api/artists/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artist,
        downloadImage: options?.downloadImage !== false,
        customCoverUrl: options?.customCoverUrl,
        coverBase64: options?.coverBase64,
        coverFileName: options?.coverFileName,
      }),
      cache: "no-store",
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(
        result.error || `Błąd zapisu wykonawcy (${response.status})`,
      );
    }

    return {
      success: true,
      pbRecord: result.pbRecord,
      isNew: result.isNew,
      matchedGenres: result.matchedGenres,
    };
  } catch (err: any) {
    console.error("confirmArtistAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * 3. Scrapowanie Miejsc - Pobranie propozycji:
 * Pobiera dane miejsca z Facebooka i sprawdza, czy wpis już istnieje w bazie.
 */
export async function previewPlaceAction(url: string) {
  try {
    await getAuthenticatedModerator();

    if (!url || !url.trim()) {
      return {
        success: false,
        error: "Podaj adres URL strony miejsca na Facebooku.",
      };
    }

    const response = await fetch(`${SCRAPPER_URL}/api/places/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: url.trim(),
      }),
      cache: "no-store",
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(
        result.error || `Błąd scrapowania miejsca (${response.status})`,
      );
    }

    return {
      success: true,
      data: result.data,
      existingPlace: result.existingPlace,
      isUpdate: Boolean(result.existingPlace),
      isNew: !result.existingPlace,
      message: result.message,
    };
  } catch (err: any) {
    console.error("previewPlaceAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * 3. Scrapowanie Miejsc - Potwierdzenie zapisu:
 * Zatwierdza dodanie nowego lub aktualizację istniejącego miejsca.
 */
export async function confirmPlaceAction(
  place: any,
  options?: {
    cityId?: string;
    address?: string;
    customCoverUrl?: string;
    coverBase64?: string;
    coverFileName?: string;
    downloadImage?: boolean;
  },
) {
  try {
    await getAuthenticatedModerator();

    const response = await fetch(`${SCRAPPER_URL}/api/places/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        place,
        cityId: options?.cityId,
        address: options?.address,
        downloadImage: options?.downloadImage !== false,
        customCoverUrl: options?.customCoverUrl,
        coverBase64: options?.coverBase64,
        coverFileName: options?.coverFileName,
      }),
      cache: "no-store",
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(
        result.error || `Błąd zapisu miejsca (${response.status})`,
      );
    }

    return {
      success: true,
      pbRecord: result.pbRecord,
      isNew: result.isNew,
    };
  } catch (err: any) {
    console.error("confirmPlaceAction error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Pobiera listę miast do wyboru w formularzu miejsc
 */
export async function getCitiesAction() {
  try {
    const { pb } = await getAuthenticatedModerator();
    const cities = await pb
      .collection("cities")
      .getFullList<{ id: string; name: string }>({
        sort: "name",
        requestKey: null,
      });
    return { success: true, cities };
  } catch (_err) {
    return { success: false, cities: [] };
  }
}
