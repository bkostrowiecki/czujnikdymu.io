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
import type { CityEntity } from "@/entities/city.entity";
import type { PlaceEntity } from "@/entities/place.entity";
import { PlaceTile } from "./place-tile";

type Props = {
  cities: CityEntity[];
  places: PlaceEntity[];
  initialCityIds: string[];
  initialQuery: string;
};

export function PlacesBrowser({
  cities,
  places,
  initialCityIds,
  initialQuery,
}: Props) {
  const router = useRouter();

  const [query, setQuery] = useState(initialQuery);
  const [selectedCities, setSelectedCities] =
    useState<string[]>(initialCityIds);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setSelectedCities(initialCityIds);
  }, [initialCityIds]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [initialQuery, initialCityIds]);

  const visiblePlaces = useMemo(
    () =>
      places.filter(
        (place) =>
          place.name
            .toLocaleLowerCase("pl-PL")
            .includes(initialQuery.trim().toLocaleLowerCase("pl-PL")) &&
          (initialCityIds.length === 0 || initialCityIds.includes(place.city)),
      ),
    [places, initialCityIds, initialQuery],
  );

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (selectedCities.length) params.set("cities", selectedCities.join(","));
    router.push(`/miejsca${params.size ? `?${params}` : ""}`);
    setShowMobileFilters(false);
  };

  const resetFilters = () => {
    setQuery("");
    setSelectedCities([]);
    router.push("/miejsca");
    setShowMobileFilters(false);
  };

  const toggleCity = (id: string) => {
    setSelectedCities((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  };

  const activeFilterCount =
    (initialQuery.trim() ? 1 : 0) + initialCityIds.length;
  const isFiltered = activeFilterCount > 0;

  return (
    <Container className="py-5">
      {/* Top Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h2 mb-0">
            Miejsca{" "}
            <span className="text-body-secondary fs-4 fw-normal">
              ({visiblePlaces.length})
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
                  id="place-name-search"
                  type="search"
                  placeholder="Szukaj klubu, miejsca..."
                  className="bg-body-secondary border-secondary-subtle"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </InputGroup>
            </div>

            {/* Horyzontalne pola wyboru miast */}
            <div
              className="d-flex align-items-center gap-2 flex-wrap"
              style={{ flex: "2 1 auto" }}
            >
              <span className="small text-body-secondary fw-semibold text-nowrap d-flex align-items-center gap-1">
                <i className="bi bi-geo-alt-fill text-success" />
                Miasta
              </span>
              <div className="d-flex flex-wrap gap-1 align-items-center">
                {cities.map((city) => {
                  const isChecked = selectedCities.includes(city.id);
                  return (
                    <ToggleButton
                      key={city.id}
                      id={`desktop-city-${city.id}`}
                      type="checkbox"
                      variant={isChecked ? "success" : "outline-secondary"}
                      size="sm"
                      value={city.id}
                      checked={isChecked}
                      onChange={() => toggleCity(city.id)}
                      className="filter-pill-sm text-nowrap"
                    >
                      {city.name}
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

      {/* Lista miejsc */}
      {visiblePlaces.length > 0 ? (
        <>
          <Row className="g-4">
            {visiblePlaces
              .slice(
                (currentPage - 1) * ITEMS_PER_PAGE,
                currentPage * ITEMS_PER_PAGE,
              )
              .map((place) => (
                <Col key={place.id} xs={12} md={6} lg={4}>
                  <PlaceTile place={place} />
                </Col>
              ))}
          </Row>
          <BrowserPagination
            currentPage={currentPage}
            totalItems={visiblePlaces.length}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </>
      ) : (
        <Alert variant="secondary" className="border mt-4 mb-0">
          Brak miejsc spełniających wybrane kryteria.
        </Alert>
      )}

      {/* Mobilny przycisk FAB (< 768px) */}
      <button
        type="button"
        className="filter-fab d-md-none"
        onClick={() => setShowMobileFilters(true)}
        aria-label="Otwórz filtry miejsc"
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
            <span className="fw-semibold">Filtruj miejsca</span>
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body className="d-flex flex-column justify-content-between p-3">
          <div className="d-flex flex-column gap-4">
            {/* Szukaj po nazwie */}
            <div>
              <label
                htmlFor="mobile-place-search"
                className="form-label fw-semibold small text-body-secondary mb-2 d-flex align-items-center gap-1"
              >
                <i className="bi bi-search" />
                Szukaj po nazwie
              </label>
              <FormControl
                id="mobile-place-search"
                type="search"
                placeholder="Np. klub, dom kultury..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* Miasta */}
            <div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-semibold small text-body-secondary d-flex align-items-center gap-1">
                  <i className="bi bi-geo-alt-fill text-success" />
                  Miasta
                </span>
                {selectedCities.length > 0 && (
                  <Badge bg="success">Wybrano: {selectedCities.length}</Badge>
                )}
              </div>
              <div className="d-flex flex-wrap gap-2">
                {cities.map((city) => {
                  const isChecked = selectedCities.includes(city.id);
                  return (
                    <ToggleButton
                      key={city.id}
                      id={`mobile-city-${city.id}`}
                      type="checkbox"
                      variant={isChecked ? "success" : "outline-secondary"}
                      value={city.id}
                      checked={isChecked}
                      onChange={() => toggleCity(city.id)}
                      className="rounded-pill"
                    >
                      {city.name}
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
