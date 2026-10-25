import { GigsBrowser } from "@/app/gigs/gigs-browser";
import { initializeSsrPb } from "@/app/shared/pocketbase-ssr";
import UnexpectedError from "@/components/unexpected-error";
import type { CityEntity } from "@/entities/city.entity";
import type { GenreEntity } from "@/entities/genre.entity";
import type { GigEntity } from "@/entities/gig.entity";
import { normalizeFilterPresets } from "@/shared/filter-presets";

type SearchParams = {
  cities?: string | string[];
  genres?: string | string[];
  q?: string;
  sort?: string | string[];
  reset?: string | string[];
  preset?: string | string[];
};

function getSelectedIds(value: SearchParams[keyof SearchParams]) {
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((item) => item?.split(",") ?? []).filter(Boolean);
}

export const dynamic = "force-dynamic";

export default async function GigsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  try {
    const pb = await initializeSsrPb();
    const user = pb.authStore.record;
    const userSavedPresets = normalizeFilterPresets(user?.searchFilters);

    const [gigs, genres, cities] = await Promise.all([
      pb.collection("gigs").getFullList<GigEntity>({
        sort: "startsAt",
        expand: "place,artists,artists.genres",
      }),
      pb.collection("genres").getFullList<GenreEntity>({ sort: "name" }),
      pb.collection("cities").getFullList<CityEntity>({ sort: "name" }),
    ]);

    const params = await searchParams;
    const sortParam = Array.isArray(params.sort) ? params.sort[0] : params.sort;
    const presetParam = Array.isArray(params.preset)
      ? params.preset[0]
      : params.preset;

    const matchedPreset = presetParam
      ? (userSavedPresets.find((p) => p.id === presetParam) ?? null)
      : null;

    // Check if the URL has explicit filter parameters
    const hasExplicitFilters =
      params.cities !== undefined ||
      params.genres !== undefined ||
      params.q !== undefined ||
      params.sort !== undefined ||
      params.reset !== undefined ||
      params.preset !== undefined;

    const initialCityIds =
      params.cities !== undefined
        ? getSelectedIds(params.cities)
        : (matchedPreset?.cities ?? []);

    const initialGenreIds =
      params.genres !== undefined
        ? getSelectedIds(params.genres)
        : (matchedPreset?.genres ?? []);

    const initialQuery =
      params.q !== undefined
        ? typeof params.q === "string"
          ? params.q
          : ""
        : (matchedPreset?.query ?? "");

    const initialSort =
      sortParam !== undefined
        ? typeof sortParam === "string"
          ? sortParam
          : "date-asc"
        : (matchedPreset?.sortBy ?? "date-asc");

    return (
      <GigsBrowser
        gigs={gigs}
        genres={genres}
        cities={cities}
        initialCityIds={initialCityIds}
        initialGenreIds={initialGenreIds}
        initialQuery={initialQuery}
        initialSort={initialSort}
        userId={user?.id ?? null}
        savedPresets={userSavedPresets}
        initialPresetId={matchedPreset?.id ?? null}
      />
    );
  } catch (err) {
    console.error(err);
    return <UnexpectedError />;
  }
}
