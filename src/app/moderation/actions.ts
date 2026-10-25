"use server";

import { initializeSsrPb } from "@/app/shared/pocketbase-ssr";
import { computeDescriptionHash } from "@/shared/description-hash";
import { cleanEventDescription } from "@/shared/format-event-description";
import type { GenreEntity } from "@/entities/genre.entity";
import type { GigDraftEntity } from "@/entities/gig-draft.entity";

export type ModerationQueueResponse = {
  success: boolean;
  error?: string;
  message?: string;
  items?: GigDraftEntity[];
  totalCount?: number;
  assignedCities?: { id: string; name: string }[];
  allGenres?: GenreEntity[];
  noCities?: boolean;
};

export async function getModerationQueueAction(): Promise<ModerationQueueResponse> {
  const pb = await initializeSsrPb();

  if (!pb.authStore.isValid || !pb.authStore.record) {
    return {
      success: false,
      error: "unauthenticated",
      message: "Musisz być zalogowany, aby uzyskać dostęp do panelu moderacji.",
    };
  }

  const user = pb.authStore.record;
  if (user.role !== "moderator") {
    return {
      success: false,
      error: "forbidden",
      message:
        "Dostęp do tej strony mają wyłącznie użytkownicy z rolą moderatora.",
    };
  }

  const assignedCityIds: string[] = Array.isArray(user.cities)
    ? user.cities
    : [];

  try {
    // Current date threshold (start of today in local date format YYYY-MM-DD)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayStartStr = `${year}-${month}-${day} 00:00:00.000Z`;

    const cityClauses = assignedCityIds
      .map((cid) => `city = "${cid}"`)
      .join(" || ");
    const moderatorDraftClause = `requestedBy = "${user.id}"`;
    const targetClauses = cityClauses
      ? `(${cityClauses} || ${moderatorDraftClause})`
      : moderatorDraftClause;

    const filter = `(startsAt >= "${todayStartStr}" || startsAt = "") && (${targetClauses})`;

    // Fetch genres and drafts with fallback if any sort/expand field differs
    const genresList = await pb
      .collection("genres")
      .getFullList<GenreEntity>({
        sort: "name",
        requestKey: null,
      })
      .catch((err) => {
        console.warn("Could not load genres list", err);
        return [] as GenreEntity[];
      });

    let draftsList: { items: GigDraftEntity[]; totalItems: number };
    try {
      draftsList = await pb
        .collection("gigDrafts")
        .getList<GigDraftEntity>(1, 100, {
          filter,
          sort: "-isUpdate,postponedCount,startsAt,created",
          expand: "place,city,artists,genres,targetGig",
          requestKey: null,
        });
    } catch (primaryErr) {
      console.warn(
        "Primary gigDrafts query failed, falling back to standard sort/expand:",
        primaryErr,
      );
      draftsList = await pb
        .collection("gigDrafts")
        .getList<GigDraftEntity>(1, 100, {
          filter,
          sort: "postponedCount,startsAt,created",
          expand: "place,city,artists,genres",
          requestKey: null,
        });
    }

    let assignedCities: { id: string; name: string }[] = [];
    try {
      const citiesList = await pb.collection("cities").getFullList({
        filter: assignedCityIds.map((cid) => `id = "${cid}"`).join(" || "),
        requestKey: null,
      });
      assignedCities = citiesList.map((c) => ({ id: c.id, name: c.name }));
    } catch (cityErr) {
      console.warn("Could not load assigned cities details", cityErr);
    }

    // Ensure:
    // 1. Moderator's own requested drafts appear FIRST
    // 2. isUpdate items are prioritized next
    // 3. postponedCount
    // 4. startsAt
    const sortedItems = [...(draftsList.items || [])].sort((a, b) => {
      const myReqA = a.requestedBy === user.id ? 1 : 0;
      const myReqB = b.requestedBy === user.id ? 1 : 0;
      if (myReqA !== myReqB) return myReqB - myReqA;

      const updateA = a.isUpdate ? 1 : 0;
      const updateB = b.isUpdate ? 1 : 0;
      if (updateA !== updateB) return updateB - updateA;
      const countDiff = (a.postponedCount || 0) - (b.postponedCount || 0);
      if (countDiff !== 0) return countDiff;
      return (a.startsAt || "").localeCompare(b.startsAt || "");
    });

    if (draftsList.totalItems === 0 && assignedCityIds.length === 0) {
      return {
        success: true,
        items: [],
        totalCount: 0,
        assignedCities: [],
        noCities: true,
        message: "Nie masz jeszcze przypisanych miast do moderacji.",
      };
    }

    return {
      success: true,
      items: sortedItems,
      totalCount: draftsList.totalItems,
      assignedCities,
      allGenres: genresList,
    };
  } catch (error) {
    console.error("Error loading moderation queue:", error);
    return {
      success: false,
      error: "server_error",
      message: "Nie udało się załadować kolejki moderacji.",
    };
  }
}

export async function acceptDraftAction(
  draftId: string,
  overrides?: {
    title?: string;
    startsAt?: string;
    description?: string;
    genres?: string[];
  },
): Promise<{
  success: boolean;
  error?: string;
  createdGigId?: string;
  isUpdate?: boolean;
}> {
  const pb = await initializeSsrPb();

  if (
    !pb.authStore.isValid ||
    !pb.authStore.record ||
    pb.authStore.record.role !== "moderator"
  ) {
    return { success: false, error: "Brak uprawnień do moderacji." };
  }

  const user = pb.authStore.record;
  const assignedCityIds: string[] = Array.isArray(user.cities)
    ? user.cities
    : [];

  try {
    const draft = await pb
      .collection("gigDrafts")
      .getOne<GigDraftEntity>(draftId, {
        requestKey: null,
      });

    if (draft.city && !assignedCityIds.includes(draft.city)) {
      return {
        success: false,
        error: "Wydarzenie nie znajduje się w Twoich przypisanych miastach.",
      };
    }

    const formData = new FormData();
    const finalTitle = overrides?.title?.trim() || draft.title;
    if (finalTitle) formData.append("title", finalTitle);

    const rawDescription = overrides?.description ?? draft.description;
    const finalDescription = rawDescription
      ? cleanEventDescription(rawDescription)
      : rawDescription;
    if (finalDescription) formData.append("description", finalDescription);

    const finalStartsAt = overrides?.startsAt ?? draft.startsAt;
    if (finalStartsAt) formData.append("startsAt", finalStartsAt);

    if (draft.city) formData.append("city", draft.city);
    if (draft.place) formData.append("place", draft.place);
    if (draft.sourceUrl) formData.append("sourceUrl", draft.sourceUrl);
    if (draft.coverImageUrl)
      formData.append("coverImageUrl", draft.coverImageUrl);

    // Save descriptionHash to gigs
    const descriptionToHash = finalDescription ?? "";
    const computedHash = computeDescriptionHash(descriptionToHash);
    const finalDescriptionHash = computedHash || draft.descriptionHash || "";
    if (finalDescriptionHash) {
      formData.append("descriptionHash", finalDescriptionHash);
    }

    if (Array.isArray(draft.artists)) {
      for (const artistId of draft.artists) {
        formData.append("artists", artistId);
      }
    }

    const finalGenres =
      overrides?.genres !== undefined ? overrides.genres : draft.genres || [];
    if (Array.isArray(finalGenres)) {
      for (const genreId of finalGenres) {
        formData.append("genres", genreId);
      }
    }

    // Try to transfer cover image binary file if present
    if (draft.coverImage) {
      try {
        const fileUrl = pb.files.getURL(draft, draft.coverImage);
        const fileRes = await fetch(fileUrl);
        if (fileRes.ok) {
          const blob = await fileRes.blob();
          formData.append("coverImage", blob, draft.coverImage);
        }
      } catch (fileErr) {
        console.warn(
          "Could not transfer coverImage file, relying on coverImageUrl:",
          fileErr,
        );
      }
    }

    // Check if updating an existing gig
    let targetGigId: string | null = draft.targetGig || null;

    if (!targetGigId && draft.sourceUrl) {
      try {
        const existingGig = await pb
          .collection("gigs")
          .getFirstListItem(
            pb.filter("sourceUrl = {:url}", { url: draft.sourceUrl }),
            {
              requestKey: null,
            },
          );
        if (existingGig) {
          targetGigId = existingGig.id;
        }
      } catch {
        // Not found, will create new
      }
    }

    let savedGigId: string;
    const isUpdate = Boolean(targetGigId);

    if (targetGigId) {
      // Update existing gig in-place
      const updatedGig = await pb
        .collection("gigs")
        .update(targetGigId, formData, { requestKey: null });
      savedGigId = updatedGig.id;
    } else {
      // Create new gig
      const createdGig = await pb
        .collection("gigs")
        .create(formData, { requestKey: null });
      savedGigId = createdGig.id;
    }

    // Remove from gigDrafts
    await pb.collection("gigDrafts").delete(draftId, { requestKey: null });

    return {
      success: true,
      createdGigId: savedGigId,
      isUpdate,
    };
  } catch (error) {
    console.error("Error accepting draft:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Wystąpił błąd podczas akceptacji wydarzenia.",
    };
  }
}

export async function rejectDraftAction(
  draftId: string,
): Promise<{ success: boolean; error?: string }> {
  const pb = await initializeSsrPb();

  if (
    !pb.authStore.isValid ||
    !pb.authStore.record ||
    pb.authStore.record.role !== "moderator"
  ) {
    return { success: false, error: "Brak uprawnień do moderacji." };
  }

  const user = pb.authStore.record;
  const assignedCityIds: string[] = Array.isArray(user.cities)
    ? user.cities
    : [];

  try {
    const draft = await pb
      .collection("gigDrafts")
      .getOne<GigDraftEntity>(draftId, {
        requestKey: null,
      });

    if (draft.city && !assignedCityIds.includes(draft.city)) {
      return {
        success: false,
        error: "Wydarzenie nie znajduje się w Twoich przypisanych miastach.",
      };
    }

    await pb.collection("gigDrafts").delete(draftId, { requestKey: null });
    return { success: true };
  } catch (error) {
    console.error("Error rejecting draft:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Wystąpił błąd podczas odrzucania wydarzenia.",
    };
  }
}

export async function postponeDraftAction(
  draftId: string,
): Promise<{ success: boolean; error?: string; postponedCount?: number }> {
  const pb = await initializeSsrPb();

  if (
    !pb.authStore.isValid ||
    !pb.authStore.record ||
    pb.authStore.record.role !== "moderator"
  ) {
    return { success: false, error: "Brak uprawnień do moderacji." };
  }

  const user = pb.authStore.record;
  const assignedCityIds: string[] = Array.isArray(user.cities)
    ? user.cities
    : [];

  try {
    const draft = await pb
      .collection("gigDrafts")
      .getOne<GigDraftEntity>(draftId, {
        requestKey: null,
      });

    if (draft.city && !assignedCityIds.includes(draft.city)) {
      return {
        success: false,
        error: "Wydarzenie nie znajduje się w Twoich przypisanych miastach.",
      };
    }

    const currentCount = draft.postponedCount || 0;
    const nextCount = currentCount + 1;

    await pb
      .collection("gigDrafts")
      .update(draftId, { postponedCount: nextCount }, { requestKey: null });

    return { success: true, postponedCount: nextCount };
  } catch (error) {
    console.error("Error postponing draft:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Wystąpił błąd podczas odkładania wydarzenia.",
    };
  }
}
