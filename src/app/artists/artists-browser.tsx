"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Col,
  Container,
  FormControl,
  InputGroup,
  Offcanvas,
  Row,
  ToggleButton,
} from "react-bootstrap";
import {
  BrowserPagination,
  ITEMS_PER_PAGE,
} from "@/components/browser-pagination";
import type { ArtistEntity } from "@/entities/artist.entity";
import type { GenreEntity } from "@/entities/genre.entity";
import { ArtistTile } from "./artist-tile";

type Props = {
  artists: ArtistEntity[];
  genres: GenreEntity[];
  initialGenreIds: string[];
  initialQuery: string;
};

export function ArtistsBrowser({
  artists,
  genres,
  initialGenreIds,
  initialQuery,
}: Props) {
  const router = useRouter();

  const [query, setQuery] = useState(initialQuery);
  const [selectedGenres, setSelectedGenres] =
    useState<string[]>(initialGenreIds);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setSelectedGenres(initialGenreIds);
  }, [initialGenreIds]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [initialQuery, initialGenreIds]);

  const visibleArtists = useMemo(
    () =>
      artists.filter(
        (artist) =>
          artist.name
            .toLocaleLowerCase("pl-PL")
            .includes(initialQuery.trim().toLocaleLowerCase("pl-PL")) &&
          (initialGenreIds.length === 0 ||
            artist.genres.some((id) => initialGenreIds.includes(id))),
      ),
    [artists, initialGenreIds, initialQuery],
  );

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (selectedGenres.length) params.set("genres", selectedGenres.join(","));
    router.push(`/wykonawcy${params.size ? `?${params}` : ""}`);
    setShowMobileFilters(false);
  };

  const resetFilters = () => {
    setQuery("");
    setSelectedGenres([]);
    router.push("/wykonawcy");
    setShowMobileFilters(false);
  };

  const toggleGenre = (id: string) => {
    setSelectedGenres((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  };

  const activeFilterCount =
    (initialQuery.trim() ? 1 : 0) + initialGenreIds.length;
  const isFiltered = activeFilterCount > 0;

  return (
    <Container className="py-5">
      {/* Top Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h2 mb-0">
            Wykonawcy{" "}
            <span className="text-body-secondary fs-4 fw-normal">
              ({visibleArtists.length})
            </span>
          </h1>
        </div>
        {isFiltered && (
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={resetFilters}
            className="d-flex align-items-center gap-1"
          >
            <i className="bi bi-x-circle" />
            Wyczyść filtry
          </Button>
        )}
      </div>

      {/* Desktop Horizontal Filter Bar (>= 768px) */}
      <div className="desktop-filter-bar d-none d-md-block mb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters();
          }}
        >
          <div className="d-flex flex-wrap align-items-center gap-3">
            {/* Wyszukiwarka po nazwie */}
            <div style={{ flex: "1 1 200px", maxWidth: "280px" }}>
              <InputGroup size="sm">
                <InputGroup.Text className="bg-body-secondary border-secondary-subtle text-body-secondary">
                  <i className="bi bi-search" />
                </InputGroup.Text>
                <FormControl
                  id="artist-name-search"
                  type="search"
                  placeholder="Szukaj wykonawcy..."
                  className="bg-body-secondary border-secondary-subtle"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </InputGroup>
            </div>

            {/* Horyzontalne pola wyboru gatunków */}
            <div
              className="d-flex align-items-center gap-2 flex-wrap"
              style={{ flex: "2 1 auto" }}
            >
              <span className="small text-body-secondary fw-semibold text-nowrap d-flex align-items-center gap-1">
                <i className="bi bi-tag-fill text-info" />
                Gatunki
              </span>
              <div className="d-flex flex-wrap gap-1 align-items-center">
                {genres.map((genre) => {
                  const isChecked = selectedGenres.includes(genre.id);
                  return (
                    <ToggleButton
                      key={genre.id}
                      id={`desktop-artist-genre-${genre.id}`}
                      type="checkbox"
                      variant={isChecked ? "info" : "outline-secondary"}
                      size="sm"
                      value={genre.id}
                      checked={isChecked}
                      onChange={() => toggleGenre(genre.id)}
                      className="filter-pill-sm text-nowrap"
                    >
                      {genre.name}
                    </ToggleButton>
                  );
                })}
              </div>
            </div>

            {/* Przycisk wyszukiwania */}
            <div className="d-flex align-items-center gap-2 ms-auto">
              <Button
                type="submit"
                size="sm"
                variant="primary"
                className="px-3"
              >
                Szukaj
              </Button>
              {isFiltered && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={resetFilters}
                  title="Wyczyść filtry"
                  className="px-2"
                >
                  <i className="bi bi-x-lg" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Lista wykonawców */}
      {visibleArtists.length > 0 ? (
        <>
          <Row className="g-4">
            {visibleArtists
              .slice(
                (currentPage - 1) * ITEMS_PER_PAGE,
                currentPage * ITEMS_PER_PAGE,
              )
              .map((artist) => (
                <Col key={artist.id} xs={12} md={6} lg={4}>
                  <ArtistTile artist={artist} />
                </Col>
              ))}
          </Row>
          <BrowserPagination
            currentPage={currentPage}
            totalItems={visibleArtists.length}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </>
      ) : (
        <Alert variant="secondary" className="border mt-4 mb-0">
          Brak wykonawców spełniających wybrane kryteria.
        </Alert>
      )}

      {/* Mobilny przycisk FAB (< 768px) */}
      <button
        type="button"
        className="filter-fab d-md-none"
        onClick={() => setShowMobileFilters(true)}
        aria-label="Otwórz filtry wykonawców"
      >
        <i className="bi bi-funnel-fill" />
        {activeFilterCount > 0 && (
          <span className="filter-fab-badge">{activeFilterCount}</span>
        )}
      </button>

      {/* Mobilny wysuwany panel Offcanvas (< 768px) */}
      <Offcanvas
        show={showMobileFilters}
        onHide={() => setShowMobileFilters(false)}
        placement="end"
        data-bs-theme="dark"
        className="bg-dark text-light d-md-none"
      >
        <Offcanvas.Header
          closeButton
          closeVariant="white"
          className="border-bottom"
        >
          <Offcanvas.Title className="d-flex align-items-center gap-2 fs-5">
            <i className="bi bi-funnel-fill text-primary" />
            <span className="fw-semibold">Filtruj wykonawców</span>
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body className="d-flex flex-column justify-content-between p-3">
          <div className="d-flex flex-column gap-4">
            {/* Szukaj po nazwie */}
            <div>
              <label
                htmlFor="mobile-artist-search"
                className="form-label fw-semibold small text-body-secondary mb-2 d-flex align-items-center gap-1"
              >
                <i className="bi bi-search" />
                Szukaj po nazwie
              </label>
              <FormControl
                id="mobile-artist-search"
                type="search"
                placeholder="Np. nazwa zespołu..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* Gatunki muzyczne */}
            <div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-semibold small text-body-secondary d-flex align-items-center gap-1">
                  <i className="bi bi-tag-fill text-info" />
                  Gatunki
                </span>
                {selectedGenres.length > 0 && (
                  <Badge bg="info" className="text-dark">
                    Wybrano: {selectedGenres.length}
                  </Badge>
                )}
              </div>
              <div className="d-flex flex-wrap gap-2">
                {genres.map((genre) => {
                  const isChecked = selectedGenres.includes(genre.id);
                  return (
                    <ToggleButton
                      key={genre.id}
                      id={`mobile-artist-genre-${genre.id}`}
                      type="checkbox"
                      variant={isChecked ? "info" : "outline-secondary"}
                      value={genre.id}
                      checked={isChecked}
                      onChange={() => toggleGenre(genre.id)}
                      className="rounded-pill"
                    >
                      {genre.name}
                    </ToggleButton>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Akcje w dolnej części panelu */}
          <div className="pt-4 border-top mt-4 d-flex flex-column gap-2">
            <Button
              variant="primary"
              size="lg"
              className="w-100 fw-semibold"
              onClick={applyFilters}
            >
              Zastosuj filtry
            </Button>
            {isFiltered && (
              <Button
                variant="outline-secondary"
                size="sm"
                className="w-100"
                onClick={resetFilters}
              >
                Wyczyść filtry
              </Button>
            )}
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </Container>
  );
}
