import { initializeSsrPb } from "@/app/shared/pocketbase-ssr";
import UnexpectedErrorPage from "@/components/unexpected-error-page";
import type { ArtistEntity } from "@/entities/artist.entity";
import type { GenreEntity } from "@/entities/genre.entity";
import { ArtistsBrowser } from "./artists-browser";

type SearchParams = { genres?: string | string[]; q?: string };

function getSelectedIds(value: SearchParams["genres"]) {
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((item) => item?.split(",") ?? []).filter(Boolean);
}

export default async function ArtistsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  try {
    const pb = await initializeSsrPb();
    const [artists, genres] = await Promise.all([
      pb
        .collection("artists")
        .getFullList<ArtistEntity>({ sort: "name", expand: "genres" }),
      pb.collection("genres").getFullList<GenreEntity>({ sort: "name" }),
    ]);

    const params = await searchParams;
    return (
      <ArtistsBrowser
        artists={artists}
        genres={genres}
        initialGenreIds={getSelectedIds(params.genres)}
        initialQuery={typeof params.q === "string" ? params.q : ""}
      />
    );
  } catch (err) {
    console.error(err);
    return <UnexpectedErrorPage />;
  }
}
