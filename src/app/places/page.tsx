import { initializeSsrPb } from "@/app/shared/pocketbase-ssr";
import UnexpectedErrorPage from "@/components/unexpected-error-page";
import type { CityEntity } from "@/entities/city.entity";
import type { PlaceEntity } from "@/entities/place.entity";
import { PlacesBrowser } from "./places-browser";

type SearchParams = { cities?: string | string[]; q?: string };

function getSelectedIds(value: SearchParams["cities"]) {
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((item) => item?.split(",") ?? []).filter(Boolean);
}

export default async function PlacesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  try {
    const pb = await initializeSsrPb();
    const [places, cities] = await Promise.all([
      pb.collection("places").getFullList<PlaceEntity>({ sort: "name" }),
      pb.collection("cities").getFullList<CityEntity>({ sort: "name" }),
    ]);

    const params = await searchParams;
    return (
      <PlacesBrowser
        places={places}
        cities={cities}
        initialCityIds={getSelectedIds(params.cities)}
        initialQuery={typeof params.q === "string" ? params.q : ""}
      />
    );
  } catch {
    return <UnexpectedErrorPage />;
  }
}
