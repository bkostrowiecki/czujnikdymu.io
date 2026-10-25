"use client";

import { useRouter } from "next/navigation";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  Row,
  ToggleButton,
} from "react-bootstrap";
import type { CityEntity } from "@/entities/city.entity";
import type { GenreEntity } from "@/entities/genre.entity";

type Props = {
  cities: CityEntity[];
  genres: GenreEntity[];
  initialCityIds?: string[];
  initialGenreIds?: string[];
};

export function HomeSearch({
  cities,
  genres,
  initialCityIds = [],
  initialGenreIds = [],
}: Props) {
  const router = useRouter();

  const [selectedCityIds, setSelectedCityIds] =
    useState<string[]>(initialCityIds);
  const [selectedGenreIds, setSelectedGenreIds] =
    useState<string[]>(initialGenreIds);

  useEffect(() => {
    if (initialCityIds.length > 0) setSelectedCityIds(initialCityIds);
  }, [initialCityIds]);

  useEffect(() => {
    if (initialGenreIds.length > 0) setSelectedGenreIds(initialGenreIds);
  }, [initialGenreIds]);

  const hasLoadedPreferences =
    (initialCityIds.length > 0 || initialGenreIds.length > 0) &&
    (selectedCityIds.length > 0 || selectedGenreIds.length > 0);

  const activeFilterCount = selectedCityIds.length + selectedGenreIds.length;

  const searchHref = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedCityIds.length > 0)
      params.set("cities", selectedCityIds.join(","));
    if (selectedGenreIds.length > 0)
      params.set("genres", selectedGenreIds.join(","));
    const qs = params.toString();

    return qs ? `/koncerty?${qs}` : "/koncerty";
  }, [selectedCityIds, selectedGenreIds]);

  const toggleValue = (
    value: string,
    setter: Dispatch<SetStateAction<string[]>>,
  ) => {
    setter((current) =>
      current.includes(value)
        ? current.filter((id) => id !== value)
        : [...current, value],
    );
  };

  const handleReset = () => {
    setSelectedCityIds([]);
    setSelectedGenreIds([]);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.push(searchHref);
  };

  return (
    <Card className="shadow-lg border-secondary-subtle bg-body-tertiary rounded-4 overflow-hidden">
      <CardBody className="p-4 p-md-5">
        <form onSubmit={handleSubmit}>
          {hasLoadedPreferences && (
            <div className="mb-4">
              <Badge
                bg="success-subtle"
                className="text-success border border-success-subtle d-inline-flex align-items-center gap-1 py-2 px-3 small"
              >
                <i className="bi bi-cloud-check-fill" /> Wczytano Twoje zapisane
                preferencje z profilu
              </Badge>
            </div>
          )}
          <Row className="g-4 mb-4">
            <div className="text-body-secondary small ms-auto me-auto">
              Wybierz interesujące Cię miasta lub gatunki
            </div>

            {/* Wybór miast */}
            {cities.length > 0 && (
              <Col xs={12} lg={6}>
                <div className="p-3 bg-body rounded-3 border border-secondary-subtle h-100">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="fw-semibold small text-body-secondary text-uppercase letter-spacing-1 d-flex align-items-center gap-1">
                      <i className="bi bi-geo-alt-fill text-success" />
                      Miasta
                    </span>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {cities.map((city) => {
                      const isChecked = selectedCityIds.includes(city.id);
                      return (
                        <ToggleButton
                          key={city.id}
                          variant={isChecked ? "success" : "outline-secondary"}
                          className="rounded-pill filter-pill-sm text-nowrap"
                          type="checkbox"
                          id={`home-city-${city.id}`}
                          value={city.id}
                          checked={isChecked}
                          onChange={() =>
                            toggleValue(city.id, setSelectedCityIds)
                          }
                        >
                          {city.name}
                        </ToggleButton>
                      );
                    })}
                  </div>
                </div>
              </Col>
            )}

            {/* Wybór gatunków */}
            {genres.length > 0 && (
              <Col xs={12} lg={6}>
                <div className="p-3 bg-body rounded-3 border border-secondary-subtle h-100">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="fw-semibold small text-body-secondary text-uppercase letter-spacing-1 d-flex align-items-center gap-1">
                      <i className="bi bi-tag-fill text-info" />
                      Gatunki
                    </span>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {genres.map((genre) => {
                      const isChecked = selectedGenreIds.includes(genre.id);
                      return (
                        <ToggleButton
                          key={genre.id}
                          variant={isChecked ? "info" : "outline-secondary"}
                          className="rounded-pill filter-pill-sm text-nowrap"
                          type="checkbox"
                          id={`home-genre-${genre.id}`}
                          value={genre.id}
                          checked={isChecked}
                          onChange={() =>
                            toggleValue(genre.id, setSelectedGenreIds)
                          }
                        >
                          {genre.name}
                        </ToggleButton>
                      );
                    })}
                  </div>
                </div>
              </Col>
            )}
          </Row>

          {/* Dolny pasek akcji */}
          <div className="pt-3 border-top border-secondary-subtle d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-2 ms-auto me-auto">
              {activeFilterCount > 0 && (
                <Button
                  variant="outline-secondary"
                  size="lg"
                  onClick={handleReset}
                  className="d-flex align-items-center gap-1"
                >
                  <i className="bi bi-x-circle" />
                  Wyczyść
                </Button>
              )}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="px-4 fw-semibold d-flex align-items-center gap-2"
              >
                <i className="bi bi-search" />
                Wyszukaj koncerty
                {activeFilterCount > 0 && (
                  <Badge bg="light" text="dark" className="rounded-pill ms-1">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
