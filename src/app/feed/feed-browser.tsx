"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  FormControl,
  InputGroup,
  Row,
  Spinner,
} from "react-bootstrap";
import { type FeedReason, GigTile } from "@/app/gigs/gig-tile";
import { useFavorites } from "@/app/shared/favorites-provider";
import {
  BrowserPagination,
  ITEMS_PER_PAGE,
} from "@/components/browser-pagination";
import type { GigEntity } from "@/entities/gig.entity";

export type ReasonFilterOption = "all" | "gig" | "artist" | "place";

interface FeedGigItem {
  gig: GigEntity;
  reasons: FeedReason[];
}

function getGigTimestamp(gig: GigEntity, fallback: number): number {
  if (!gig.startsAt) return fallback;
  const time = new Date(gig.startsAt).getTime();
  return Number.isNaN(time) ? fallback : time;
}

function compareGigsByNearestDate(a: GigEntity, b: GigEntity): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const nowTime = now.getTime();

  const timeA = getGigTimestamp(a, Infinity);
  const timeB = getGigTimestamp(b, Infinity);

  const isAUpcoming = timeA >= nowTime && timeA !== Infinity;
  const isBUpcoming = timeB >= nowTime && timeB !== Infinity;

  // Both upcoming: closest date first
  if (isAUpcoming && isBUpcoming) {
    if (timeA !== timeB) return timeA - timeB;
    return (a.title ?? "").localeCompare(b.title ?? "", "pl");
  }

  // Upcoming before past or undated
  if (isAUpcoming && !isBUpcoming) return -1;
  if (!isAUpcoming && isBUpcoming) return 1;

  // Both past or undated:
  if (timeA !== Infinity && timeB !== Infinity) {
    return timeA - timeB;
  }
  if (timeA !== Infinity) return -1;
  if (timeB !== Infinity) return 1;

  return (a.title ?? "").localeCompare(b.title ?? "", "pl");
}

export function FeedBrowser({ gigs }: { gigs: GigEntity[] }) {
  const { favoriteGigIds, favoritePlaceIds, favoriteArtistIds, isLoading } =
    useFavorites();

  const [searchQuery, setSearchQuery] = useState("");
  const [reasonFilter, setReasonFilter] = useState<ReasonFilterOption>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const totalFavoritesCount =
    favoriteGigIds.size + favoritePlaceIds.size + favoriteArtistIds.size;

  // Compute matching gigs and reasons
  const matchingFeedItems = useMemo<FeedGigItem[]>(() => {
    const items: FeedGigItem[] = [];

    for (const gig of gigs) {
      const reasons: FeedReason[] = [];

      // 1. Is it an already favorited gig?
      if (favoriteGigIds.has(gig.id)) {
        reasons.push({
          type: "gig",
          label: "Ulubiony koncert",
        });
      }

      // 2. Is it by a favorited artist?
      const matchedArtists = (gig.expand?.artists ?? []).filter((artist) =>
        favoriteArtistIds.has(artist.id),
      );
      const hasArtistIdMatch = (gig.artists ?? []).some((id) =>
        favoriteArtistIds.has(id),
      );

      if (matchedArtists.length > 0) {
        const names = matchedArtists.map((a) => a.name).join(", ");
        reasons.push({
          type: "artist",
          label:
            matchedArtists.length === 1
              ? `Ulubiony wykonawca: ${names}`
              : `Ulubieni wykonawcy: ${names}`,
        });
      } else if (hasArtistIdMatch) {
        reasons.push({
          type: "artist",
          label: "Ulubiony wykonawca",
        });
      }

      // 3. Is it in a favorited place?
      const placeId = gig.expand?.place?.id ?? gig.place;
      const isPlaceFav = Boolean(placeId && favoritePlaceIds.has(placeId));

      if (isPlaceFav) {
        const placeName = gig.expand?.place?.name;
        reasons.push({
          type: "place",
          label: placeName
            ? `Ulubione miejsce: ${placeName}`
            : "Ulubione miejsce",
        });
      }

      if (reasons.length > 0) {
        items.push({ gig, reasons });
      }
    }

    // Sort by nearest date first
    return items.sort((a, b) => compareGigsByNearestDate(a.gig, b.gig));
  }, [gigs, favoriteGigIds, favoritePlaceIds, favoriteArtistIds]);

  // Counts for reason filters
  const gigCount = useMemo(
    () =>
      matchingFeedItems.filter((item) =>
        item.reasons.some((r) => r.type === "gig"),
      ).length,
    [matchingFeedItems],
  );

  const artistCount = useMemo(
    () =>
      matchingFeedItems.filter((item) =>
        item.reasons.some((r) => r.type === "artist"),
      ).length,
    [matchingFeedItems],
  );

  const placeCount = useMemo(
    () =>
      matchingFeedItems.filter((item) =>
        item.reasons.some((r) => r.type === "place"),
      ).length,
    [matchingFeedItems],
  );

  // Filter by user query and selected filter reason
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase("pl-PL");

    return matchingFeedItems.filter((item) => {
      // Filter by reason
      if (reasonFilter !== "all") {
        const matchesReason = item.reasons.some((r) => r.type === reasonFilter);
        if (!matchesReason) return false;
      }

      // Filter by query
      if (q) {
        const titleMatch = (item.gig.title ?? "")
          .toLocaleLowerCase("pl-PL")
          .includes(q);
        const placeMatch = (item.gig.expand?.place?.name ?? "")
          .toLocaleLowerCase("pl-PL")
          .includes(q);
        const cityMatch = (item.gig.city ?? item.gig.expand?.place?.city ?? "")
          .toLocaleLowerCase("pl-PL")
          .includes(q);
        const artistMatch = (item.gig.expand?.artists ?? []).some((a) =>
          a.name.toLocaleLowerCase("pl-PL").includes(q),
        );

        if (!titleMatch && !placeMatch && !cityMatch && !artistMatch) {
          return false;
        }
      }

      return true;
    });
  }, [matchingFeedItems, reasonFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  const handleReasonFilter = (filter: ReasonFilterOption) => {
    setReasonFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <Container className="pt-4 pb-5">
      {/* Header section */}
      <div className="mb-4 pt-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-2">
          <div>
            <h1 className="h2 mb-1 d-flex align-items-center gap-2">
              <span>Polubione</span>
              {!isLoading && matchingFeedItems.length > 0 && (
                <span
                  className="text-body-secondary fs-4 fw-normal"
                >
                  ({matchingFeedItems.length})
                </span>
              )}
            </h1>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-5">
          <Spinner
            animation="border"
            variant="danger"
            as="output"
            className="mb-3"
            aria-label="Wczytywanie"
          />
          <p className="text-secondary">Wczytywanie polubionych koncertów...</p>
        </div>
      ) : totalFavoritesCount === 0 ? (
        /* Empty State: User has no favorites at all */
        <Card className="border-secondary bg-body-tertiary text-center p-4 p-md-5 my-4 shadow-sm">
          <div className="py-3">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 text-danger mb-3"
              style={{ width: 80, height: 80 }}
            >
              <i className="bi bi-heart fs-1" />
            </div>
            <h3 className="h4 fw-bold mb-2">
              Nie masz jeszcze żadnych polubień
            </h3>
            <p
              className="text-secondary mx-auto mb-4"
              style={{ maxWidth: 540 }}
            >
              Dodaj koncerty, ulubione zespoły lub kluby muzyczne do
              obserwowanych za pomocą ikony serduszka{" "}
              <i className="bi bi-heart-fill text-danger mx-1" />. Nadchodzące
              wydarzenia powiązane z Twoimi ulubionymi pojawią się tutaj
              automatycznie!
            </p>

            <div className="d-flex flex-wrap justify-content-center gap-2">
              <Link href="/koncerty" className="btn btn-primary">
                <i className="bi bi-calendar-event me-2" />
                Przeglądaj koncerty
              </Link>
              <Link href="/wykonawcy" className="btn btn-outline-secondary">
                <i className="bi bi-people me-2" />
                Odkryj wykonawców
              </Link>
              <Link href="/miejsca" className="btn btn-outline-secondary">
                <i className="bi bi-geo-alt me-2" />
                Zobacz miejsca
              </Link>
            </div>
          </div>
        </Card>
      ) : matchingFeedItems.length === 0 ? (
        /* Empty State: User has favorites, but no matching gigs */
        <Card className="border-secondary bg-body-tertiary text-center p-4 p-md-5 my-4 shadow-sm">
          <div className="py-3">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle bg-warning bg-opacity-10 text-warning mb-3"
              style={{ width: 80, height: 80 }}
            >
              <i className="bi bi-calendar-x fs-1" />
            </div>
            <h3 className="h4 fw-bold mb-2">
              Brak nadchodzących koncertów dla Twoich polubień
            </h3>
            <p
              className="text-secondary mx-auto mb-4"
              style={{ maxWidth: 540 }}
            >
              Obserwujesz ulubione pozycje (wykonawców: {favoriteArtistIds.size}
              , miejsca: {favoritePlaceIds.size}, koncerty:{" "}
              {favoriteGigIds.size}), ale obecnie nie znaleziono dla nich
              żadnych nadchodzących koncertów. Sprawdź ponownie wkrótce lub
              dodaj kolejnych artystów i kluby!
            </p>

            <div className="d-flex flex-wrap justify-content-center gap-2">
              <Link href="/koncerty" className="btn btn-primary">
                <i className="bi bi-calendar-event me-2" />
                Przeglądaj wszystkie koncerty
              </Link>
              <Link href="/wykonawcy" className="btn btn-outline-secondary">
                <i className="bi bi-people me-2" />
                Dodaj wykonawców
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        /* Feed Content with Filters & Tiles */
        <>
          {/* Controls: Search & Category Filter Pills */}
          <div className="bg-body-tertiary border border-secondary rounded-3 p-3 mb-4 shadow-sm">
            <Row className="g-3 align-items-center">
              <Col xs={12} md={6}>
                <InputGroup>
                  <InputGroup.Text className="bg-dark border-secondary text-secondary">
                    <i className="bi bi-search" />
                  </InputGroup.Text>
                  <FormControl
                    type="search"
                    placeholder="Szukaj w feedzie (koncert, zespół, klub, miasto)..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="bg-dark border-secondary text-light"
                  />
                  {searchQuery && (
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        setSearchQuery("");
                        setCurrentPage(1);
                      }}
                      title="Wyczyść wyszukiwanie"
                    >
                      <i className="bi bi-x-lg" />
                    </Button>
                  )}
                </InputGroup>
              </Col>

              <Col xs={12} md={6}>
                <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                  <Button
                    size="sm"
                    variant={
                      reasonFilter === "all" ? "primary" : "outline-secondary"
                    }
                    onClick={() => handleReasonFilter("all")}
                    className="rounded-pill px-3"
                  >
                    Wszystkie ({matchingFeedItems.length})
                  </Button>
                  {gigCount > 0 && (
                    <Button
                      size="sm"
                      variant={
                        reasonFilter === "gig" ? "danger" : "outline-secondary"
                      }
                      onClick={() => handleReasonFilter("gig")}
                      className="rounded-pill px-3 d-inline-flex align-items-center gap-1"
                    >
                      <i className="bi bi-heart-fill" />
                      <span>Koncerty ({gigCount})</span>
                    </Button>
                  )}
                  {artistCount > 0 && (
                    <Button
                      size="sm"
                      variant={
                        reasonFilter === "artist"
                          ? "warning"
                          : "outline-secondary"
                      }
                      onClick={() => handleReasonFilter("artist")}
                      className="rounded-pill px-3 d-inline-flex align-items-center gap-1"
                    >
                      <i className="bi bi-people-fill" />
                      <span>Wykonawcy ({artistCount})</span>
                    </Button>
                  )}
                  {placeCount > 0 && (
                    <Button
                      size="sm"
                      variant={
                        reasonFilter === "place" ? "info" : "outline-secondary"
                      }
                      onClick={() => handleReasonFilter("place")}
                      className="rounded-pill px-3 d-inline-flex align-items-center gap-1"
                    >
                      <i className="bi bi-geo-alt-fill" />
                      <span>Miejsca ({placeCount})</span>
                    </Button>
                  )}
                </div>
              </Col>
            </Row>
          </div>

          {/* Results Info & Count */}
          {filteredItems.length === 0 ? (
            <Card className="text-center p-4 border-secondary bg-body-tertiary my-4">
              <i className="bi bi-search text-secondary fs-2 mb-2" />
              <h5 className="mb-1">
                Brak wyników wyszukiwania w Twoim feedzie
              </h5>
              <p className="text-secondary small mb-3">
                Żaden koncert w feedzie nie pasuje do wpisanej frazy &quot;
                {searchQuery}&quot;.
              </p>
              <div>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setReasonFilter("all");
                    setCurrentPage(1);
                  }}
                >
                  Wyczyść filtry
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3 text-secondary small">
                <span>
                  Wyświetlono {paginatedItems.length} z {filteredItems.length}{" "}
                  {filteredItems.length === 1 ? "koncertu" : "koncertów"}{" "}
                </span>
              </div>

              {/* Grid of Gigs */}
              <Row className="g-4">
                {paginatedItems.map((item) => (
                  <Col key={item.gig.id} xs={12} md={6} lg={4}>
                    <GigTile gig={item.gig} feedReasons={item.reasons} />
                  </Col>
                ))}
              </Row>

              {/* Pagination */}
              {totalPages > 1 && (
                <BrowserPagination
                  currentPage={currentPage}
                  totalItems={filteredItems.length}
                  onPageChange={setCurrentPage}
                  perPage={ITEMS_PER_PAGE}
                />
              )}
            </>
          )}
        </>
      )}
    </Container>
  );
}
