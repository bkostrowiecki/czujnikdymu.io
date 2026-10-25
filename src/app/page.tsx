import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";
import type { CityEntity } from "@/entities/city.entity";
import type { GenreEntity } from "@/entities/genre.entity";
import type { GigEntity } from "@/entities/gig.entity";
import { normalizeFilterPresets } from "@/shared/filter-presets";
import { HomeGenres } from "./home-genres";
import { HomeSearch } from "./home-search";
import { initializeSsrPb } from "./shared/pocketbase-ssr";

export const dynamic = "force-dynamic";

export default async function Home() {
  const pb = await initializeSsrPb();
  const user = pb.authStore.record;
  const userPresets = normalizeFilterPresets(user?.searchFilters);
  const defaultPreset = userPresets[0] ?? null;

  const [cities, genres, gigs] = await Promise.all([
    pb.collection("cities").getFullList<CityEntity>({ sort: "name" }),
    pb.collection("genres").getFullList<GenreEntity>({ sort: "name" }),
    pb.collection("gigs").getFullList<GigEntity>({
      expand: "artists,artists.genres",
    }),
  ]);

  // Compute gig count per genre
  const gigCountByGenre: Record<string, number> = {};
  for (const gig of gigs) {
    const combinedGenres = new Set<string>();
    for (const gid of gig.genres ?? []) {
      combinedGenres.add(gid);
    }
    for (const artist of gig.expand?.artists ?? []) {
      for (const gid of artist.genres ?? []) {
        combinedGenres.add(gid);
      }
    }
    for (const gid of combinedGenres) {
      gigCountByGenre[gid] = (gigCountByGenre[gid] ?? 0) + 1;
    }
  }

  return (
    <Container className="pt-4 pb-5">
      {/* Hero Header */}
      <div className="text-center mb-5 pt-3">
        <h1 className="display-4 fw-extrabold mb-3">
          Znajdź koncerty w Twoim klimacie
        </h1>
        <p
          className="lead text-body-secondary mx-auto mb-0"
          style={{ maxWidth: "680px" }}
        >
          Przeszukuj nadchodzące koncerty, festiwale i wydarzenia muzyczne
          cięzkich i alternatywnych brzmień w Polsce.
        </p>
      </div>

      {/* Wyszukiwarka koncertów (bez prezentowania wyników na stronie głównej) */}
      <Row className="justify-content-center mb-5">
        <Col xs={12} xl={10}>
          <HomeSearch
            cities={cities}
            genres={genres}
            initialCityIds={defaultPreset?.cities ?? []}
            initialGenreIds={defaultPreset?.genres ?? []}
          />
        </Col>
      </Row>

      {/* Sekcja z wszystkimi dostępnymi gatunkami muzycznymi (linki do podstron) */}
      <Row className="justify-content-center">
        <Col xs={12} xl={10}>
          <HomeGenres genres={genres} gigCountByGenre={gigCountByGenre} />
        </Col>
      </Row>

      {/* Baner szybkiego przejścia do pełnego katalogu */}
      <Row className="justify-content-center mt-5 pt-2">
        <Col xs={12} xl={10}>
          <div className="p-4 rounded-4 bg-body-tertiary border border-secondary-subtle d-flex flex-wrap align-items-center justify-content-between gap-3 shadow-sm">
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-20 text-primary border border-primary border-opacity-35"
                style={{ width: "48px", height: "48px", fontSize: "1.3rem" }}
              >
                <i className="bi bi-calendar2-week" />
              </div>
              <div>
                <h4 className="h5 mb-1 fw-bold">
                  Chcesz zobaczyć pełny repertuar?
                </h4>
                <p className="text-body-secondary small mb-0">
                  Przejdź do pełnej listy koncertów i odkrywaj nadchodzące
                  wydarzenia.
                </p>
              </div>
            </div>
            <Link
              href="/koncerty"
              className="btn btn-outline-primary px-4 fw-semibold"
            >
              Wszystkie koncerty <i className="bi bi-arrow-right ms-1" />
            </Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
