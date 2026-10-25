"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Col,
  Container,
  Dropdown,
  Form,
  FormControl,
  InputGroup,
  Offcanvas,
  Row,
  ToggleButton,
} from "react-bootstrap";
import { GigTile } from "@/app/gigs/gig-tile";
import { SavePresetModal } from "@/app/gigs/save-preset-modal";
import { usePocketBase } from "@/app/shared/pocketbase-client-provider";
import {
  BrowserPagination,
  ITEMS_PER_PAGE,
} from "@/components/browser-pagination";
import type { CityEntity } from "@/entities/city.entity";
import type { GenreEntity } from "@/entities/genre.entity";
import type { GigEntity } from "@/entities/gig.entity";
import type { SavedSearchFilters } from "@/entities/user.entity";
import {
  type FilterPreset,
  arePresetFiltersEqual,
  buildPresetQueryString,
  generatePresetSummary,
  normalizeFilterPresets,
} from "@/shared/filter-presets";

export type GigSortOption = "date-asc" | "date-desc" | "name-asc";

function parseGigSort(sort?: string): GigSortOption {
  if (sort === "date-desc") return "date-desc";
  if (sort === "name-asc" || sort === "title-asc" || sort === "alfabetycznie") {
    return "name-asc";
  }
  return "date-asc";
}

function getGigTimestamp(gig: GigEntity, fallback: number): number {
  if (!gig.startsAt) return fallback;
  const time = new Date(gig.startsAt).getTime();
  return Number.isNaN(time) ? fallback : time;
}

type Props = {
  gigs: GigEntity[];
  genres: GenreEntity[];
  cities: CityEntity[];
  initialCityIds: string[];
  initialGenreIds: string[];
  initialQuery: string;
  initialSort?: string;
  userId?: string | null;
  savedPresets?: FilterPreset[];
  initialPresetId?: string | null;
  savedFilters?: SavedSearchFilters | null;
};

export function GigsBrowser({
  gigs,
  genres,
  cities,
  initialCityIds,
  initialGenreIds,
  initialQuery,
  initialSort = "date-asc",
  userId,
  savedPresets,
  initialPresetId,
  savedFilters,
}: Props) {
  const router = useRouter();
  const pb = usePocketBase();

  // Controlled states synchronized with URL query params
  const [query, setQuery] = useState(initialQuery);
  const [selectedCities, setSelectedCities] =
    useState<string[]>(initialCityIds);
  const [selectedGenres, setSelectedGenres] =
    useState<string[]>(initialGenreIds);
  const [sortBy, setSortBy] = useState<GigSortOption>(() =>
    parseGigSort(initialSort),
  );
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Saved presets state
  const [presets, setPresets] = useState<FilterPreset[]>(() => {
    if (savedPresets && savedPresets.length > 0) return savedPresets;
    if (savedFilters) return normalizeFilterPresets(savedFilters);
    return [];
  });
  const [activePresetId, setActivePresetId] = useState<string | null>(
    initialPresetId ?? null,
  );
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  // Guest presets from localStorage if not logged in
  useEffect(() => {
    if (!userId && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("cd_guest_filter_presets");
        if (stored) {
          const parsed = normalizeFilterPresets(JSON.parse(stored));
          if (parsed.length > 0) {
            setPresets(parsed);
          }
        }
      } catch (err) {
        console.error("Błąd podczas odczytu filtrów gościa:", err);
      }
    }
  }, [userId]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setSelectedCities(initialCityIds);
  }, [initialCityIds]);

  useEffect(() => {
    setSelectedGenres(initialGenreIds);
  }, [initialGenreIds]);

  useEffect(() => {
    setSortBy(parseGigSort(initialSort));
  }, [initialSort]);

  useEffect(() => {
    if (savedPresets) {
      setPresets(savedPresets);
    }
  }, [savedPresets]);

  useEffect(() => {
    setActivePresetId(initialPresetId ?? null);
  }, [initialPresetId]);

  // Reset page when filters change
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [initialQuery, initialGenreIds, initialCityIds, sortBy]);

  const currentFilters = useMemo(
    () => ({
      cities: selectedCities,
      genres: selectedGenres,
      query: query.trim(),
      sortBy,
    }),
    [selectedCities, selectedGenres, query, sortBy],
  );

  const activePreset = useMemo(
    () => presets.find((p) => p.id === activePresetId) ?? null,
    [presets, activePresetId],
  );

  const isPresetModified = useMemo(() => {
    if (!activePreset) return false;
    return !arePresetFiltersEqual(activePreset, currentFilters);
  }, [activePreset, currentFilters]);

  const matchingPreset = useMemo(() => {
    return (
      presets.find((p) => arePresetFiltersEqual(p, currentFilters)) ?? null
    );
  }, [presets, currentFilters]);

  const persistPresets = async (updatedPresets: FilterPreset[]) => {
    setPresets(updatedPresets);

    if (userId) {
      await pb.collection("users").update(userId, {
        searchFilters: updatedPresets,
      });
    } else if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "cd_guest_filter_presets",
          JSON.stringify(updatedPresets),
        );
      } catch (err) {
        console.error("Błąd podczas zapisu filtrów do localStorage:", err);
      }
    }
  };

  const handleSavePreset = async ({
    name,
    targetPresetId,
  }: {
    name: string;
    targetPresetId?: string;
  }) => {
    const filterData = {
      cities: selectedCities,
      genres: selectedGenres,
      query: query.trim(),
      sortBy,
    };

    let updatedPresets: FilterPreset[];
    let savedId: string;

    if (targetPresetId) {
      // Update existing preset
      savedId = targetPresetId;
      updatedPresets = presets.map((p) =>
        p.id === targetPresetId
          ? {
            ...p,
            ...filterData,
            name,
          }
          : p,
      );
    } else {
      // Create new preset
      savedId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `preset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const newPreset: FilterPreset = {
        id: savedId,
        name,
        ...filterData,
        createdAt: new Date().toISOString(),
      };
      updatedPresets = [newPreset, ...presets];
    }

    await persistPresets(updatedPresets);
    setActivePresetId(savedId);

    const params = new URLSearchParams(window.location.search);
    params.set("preset", savedId);
    router.push(`/koncerty?${params.toString()}`);

    setSaveNotification(
      targetPresetId
        ? `Zaktualizowano zestaw "${name}"`
        : `Zapisano nowy zestaw filtrów "${name}"`,
    );
    setTimeout(() => setSaveNotification(null), 4000);
  };

  const handleDeletePreset = async (presetId: string) => {
    const target = presets.find((p) => p.id === presetId);
    if (!target) return;

    if (!confirm(`Czy na pewno chcesz usunąć zestaw "${target.name}"?`)) {
      return;
    }

    const updatedPresets = presets.filter((p) => p.id !== presetId);
    await persistPresets(updatedPresets);

    if (activePresetId === presetId) {
      setActivePresetId(null);
      const params = new URLSearchParams(window.location.search);
      params.delete("preset");
      const qs = params.toString();
      router.push(`/koncerty${qs ? `?${qs}` : ""}`);
    }

    setSaveNotification(`Usunięto zestaw "${target.name}"`);
    setTimeout(() => setSaveNotification(null), 3000);
  };

  const loadPreset = (preset: FilterPreset) => {
    setSelectedCities(preset.cities ?? []);
    setSelectedGenres(preset.genres ?? []);
    setQuery(preset.query ?? "");
    setSortBy(preset.sortBy ?? "date-asc");
    setActivePresetId(preset.id);
    setShowMobileFilters(false);

    const qs = buildPresetQueryString(preset);
    router.push(`/koncerty${qs ? `?${qs}` : ""}`);

    setSaveNotification(`Wczytano zestaw: "${preset.name}"`);
    setTimeout(() => setSaveNotification(null), 3500);
  };

  const visibleGigs = useMemo(() => {
    const filtered = gigs.filter(
      (gig) =>
        (gig.title ?? "")
          .toLocaleLowerCase("pl-PL")
          .includes(initialQuery.trim().toLocaleLowerCase("pl-PL")) &&
        (initialGenreIds.length === 0 ||
          gig.genres?.some((id) => initialGenreIds.includes(id)) ||
          gig.expand?.artists?.some((artist) =>
            artist.genres?.some((id) => initialGenreIds.includes(id)),
          )) &&
        (initialCityIds.length === 0 ||
          initialCityIds.includes(gig.city ?? gig.expand?.place?.city ?? "")),
    );

    return filtered.sort((a, b) => {
      if (sortBy === "date-desc") {
        const timeA = getGigTimestamp(a, -Infinity);
        const timeB = getGigTimestamp(b, -Infinity);
        if (timeA !== timeB) return timeB - timeA;
        return (a.title ?? "").localeCompare(b.title ?? "", "pl");
      }

      if (sortBy === "name-asc") {
        const cmp = (a.title ?? "").localeCompare(b.title ?? "", "pl");
        if (cmp !== 0) return cmp;
        const timeA = getGigTimestamp(a, Infinity);
        const timeB = getGigTimestamp(b, Infinity);
        return timeA - timeB;
      }

      // Default: "date-asc" (closest first)
      const timeA = getGigTimestamp(a, Infinity);
      const timeB = getGigTimestamp(b, Infinity);
      if (timeA !== timeB) return timeA - timeB;
      return (a.title ?? "").localeCompare(b.title ?? "", "pl");
    });
  }, [gigs, initialCityIds, initialGenreIds, initialQuery, sortBy]);

  const applyFilters = (customSort?: GigSortOption) => {
    const activeSort = customSort ?? sortBy;
    const params = new URLSearchParams();

    // Preserve activePresetId if current filters still match
    if (activePresetId && !isPresetModified) {
      params.set("preset", activePresetId);
    }
    if (query.trim()) params.set("q", query.trim());
    if (selectedCities.length) params.set("cities", selectedCities.join(","));
    if (selectedGenres.length) params.set("genres", selectedGenres.join(","));
    if (activeSort !== "date-asc") params.set("sort", activeSort);

    router.push(`/koncerty${params.size ? `?${params}` : ""}`);
    setShowMobileFilters(false);
  };

  const handleSortChange = (newSort: GigSortOption) => {
    setSortBy(newSort);
    const params = new URLSearchParams(window.location.search);
    if (newSort === "date-asc") {
      params.delete("sort");
    } else {
      params.set("sort", newSort);
    }
    const queryString = params.toString();
    router.push(`/koncerty${queryString ? `?${queryString}` : ""}`);
  };

  const resetFilters = () => {
    setQuery("");
    setSelectedCities([]);
    setSelectedGenres([]);
    setSortBy("date-asc");
    setActivePresetId(null);
    router.push("/koncerty?reset=1");
    setShowMobileFilters(false);
  };

  const toggleCity = (cityId: string) => {
    setSelectedCities((current) =>
      current.includes(cityId)
        ? current.filter((id) => id !== cityId)
        : [...current, cityId],
    );
  };

  const toggleGenre = (genreId: string) => {
    setSelectedGenres((current) =>
      current.includes(genreId)
        ? current.filter((id) => id !== genreId)
        : [...current, genreId],
    );
  };

  const activeFilterCount =
    (initialQuery.trim() ? 1 : 0) +
    initialGenreIds.length +
    initialCityIds.length +
    (sortBy !== "date-asc" ? 1 : 0);

  const isFiltered = activeFilterCount > 0;

  return (
    <Container className="py-5">
      {/* Save notification toast / banner */}
      {saveNotification && (
        <Alert
          variant="success"
          dismissible
          onClose={() => setSaveNotification(null)}
          className="d-flex align-items-center gap-2 py-2 px-3 mb-4 shadow-sm"
        >
          <i className="bi bi-check-circle-fill text-success fs-5" />
          <span className="small fw-semibold">{saveNotification}</span>
        </Alert>
      )}

      {/* Top Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
        <div>
          <h1 className="h2 mb-0">
            Koncerty{" "}
            <span className="text-body-secondary fs-4 fw-normal">
              ({visibleGigs.length})
            </span>
          </h1>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Preset Selector Dropdown */}
          <Dropdown align="end">
            <Dropdown.Toggle
              variant={activePreset ? "primary" : "outline-secondary"}
              size="sm"
              id="presets-dropdown-btn"
              className="d-flex align-items-center gap-2"
            >
              <i
                className={
                  activePreset ? "bi bi-bookmark-check-fill" : "bi bi-bookmarks"
                }
              />
              <span>
                {activePreset ? (
                  <>
                    Zestaw: <strong>{activePreset.name}</strong>
                    {isPresetModified && (
                      <span
                        className="badge bg-warning text-dark ms-1"
                        style={{ fontSize: "0.65rem" }}
                        title="Zmieniono filtry w stosunku do zapisanego zestawu"
                      >
                        *
                      </span>
                    )}
                  </>
                ) : presets.length > 0 ? (
                  `Zapisane zestawy (${presets.length})`
                ) : (
                  "Zapisane zestawy"
                )}
              </span>
            </Dropdown.Toggle>

            <Dropdown.Menu
              className="shadow-lg border-secondary-subtle"
              style={{ minWidth: "290px" }}
            >
              <Dropdown.Header className="d-flex align-items-center gap-1">
                <i className="bi bi-bookmarks-fill text-primary me-1" />
                Twoje zestawy filtrów
              </Dropdown.Header>

              {presets.length === 0 ? (
                <div className="px-3 py-2 text-body-secondary small">
                  Brak zapisanych zestawów. Skonfiguruj filtry i kliknij
                  &quot;Zapisz zestaw&quot;.
                </div>
              ) : (
                presets.map((preset) => {
                  const isActive = activePresetId === preset.id;
                  const summary = generatePresetSummary(preset, cities, genres);
                  return (
                    <div
                      key={preset.id}
                      className="d-flex align-items-center justify-content-between px-2 py-1"
                    >
                      <button
                        type="button"
                        onClick={() => loadPreset(preset)}
                        className={`btn btn-link text-start text-decoration-none text-body p-1 flex-grow-1 d-flex align-items-center gap-2 ${isActive ? "fw-bold text-primary" : ""
                          }`}
                        style={{ fontSize: "0.9rem" }}
                      >
                        <i
                          className={
                            isActive
                              ? "bi bi-bookmark-check-fill text-primary"
                              : "bi bi-bookmark text-secondary"
                          }
                        />
                        <div
                          className="text-truncate"
                          style={{ maxWidth: "210px" }}
                        >
                          <div className="text-truncate">{preset.name}</div>
                          <div
                            className="text-body-secondary fw-normal text-truncate"
                            style={{ fontSize: "0.75rem" }}
                          >
                            {summary}
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger p-1 opacity-75"
                        title={`Usuń zestaw "${preset.name}"`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePreset(preset.id);
                        }}
                      >
                        <i className="bi bi-trash3" />
                      </button>
                    </div>
                  );
                })
              )}

              <Dropdown.Divider />

              <Dropdown.Item
                onClick={() => setIsSaveModalOpen(true)}
                className="d-flex align-items-center gap-2 text-primary"
              >
                <i className="bi bi-bookmark-plus" />
                <span>Zapisz bieżące filtry jako zestaw...</span>
              </Dropdown.Item>

              {activePreset && isPresetModified && (
                <Dropdown.Item
                  onClick={() =>
                    handleSavePreset({
                      name: activePreset.name,
                      targetPresetId: activePreset.id,
                    })
                  }
                  className="d-flex align-items-center gap-2 text-warning"
                >
                  <i className="bi bi-arrow-repeat" />
                  <span>Nadpisz &quot;{activePreset.name}&quot;</span>
                </Dropdown.Item>
              )}
            </Dropdown.Menu>
          </Dropdown>

          {/* Direct Save Preset Button */}
          <Button
            variant={matchingPreset ? "outline-success" : "outline-primary"}
            size="sm"
            onClick={() => setIsSaveModalOpen(true)}
            className="d-flex align-items-center gap-1"
            title="Zapisz bieżące filtry jako zestaw"
          >
            <i
              className={
                matchingPreset
                  ? "bi bi-bookmark-check-fill text-success"
                  : "bi bi-bookmark-plus"
              }
            />
            <span className="d-none d-sm-inline">
              {matchingPreset ? "Zapisane jako zestaw" : "Zapisz zestaw"}
            </span>
          </Button>

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
      </div>

      {/* Quick Presets Pills Strip */}
      {presets.length > 0 && (
        <div className="d-flex align-items-center gap-2 mb-3 overflow-x-auto pb-1">
          <span className="small text-body-secondary fw-semibold text-nowrap d-flex align-items-center gap-1">
            <i className="bi bi-bookmarks-fill text-primary" /> Zestawy:
          </span>
          <Button
            size="sm"
            variant={
              !activePresetId && !isFiltered ? "primary" : "outline-secondary"
            }
            onClick={resetFilters}
            className="rounded-pill text-nowrap py-1 px-3"
            style={{ fontSize: "0.8rem" }}
          >
            Wszystkie
          </Button>
          {presets.map((preset) => {
            const isCurrent = activePresetId === preset.id;
            return (
              <Button
                key={preset.id}
                size="sm"
                variant={isCurrent ? "primary" : "outline-secondary"}
                onClick={() => loadPreset(preset)}
                className="rounded-pill text-nowrap py-1 px-3 d-flex align-items-center gap-1"
                style={{ fontSize: "0.8rem" }}
                title={generatePresetSummary(preset, cities, genres)}
              >
                <i
                  className={
                    isCurrent ? "bi bi-bookmark-fill" : "bi bi-bookmark"
                  }
                />
                <span>{preset.name}</span>
                {isCurrent && isPresetModified && (
                  <span
                    className="badge bg-warning text-dark ms-1 p-0 px-1"
                    style={{ fontSize: "0.65rem" }}
                  >
                    *
                  </span>
                )}
              </Button>
            );
          })}
          <Button
            size="sm"
            variant="outline-primary"
            onClick={() => setIsSaveModalOpen(true)}
            className="rounded-pill text-nowrap py-1 px-2 d-flex align-items-center gap-1"
            style={{ fontSize: "0.8rem" }}
            title="Zapisz bieżące filtry jako nowy zestaw"
          >
            <i className="bi bi-plus-lg" /> Nowy zestaw
          </Button>
        </div>
      )}

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
            <div style={{ flex: "1 1 200px", maxWidth: "260px" }}>
              <InputGroup size="sm">
                <InputGroup.Text className="bg-body-secondary border-secondary-subtle text-body-secondary">
                  <i className="bi bi-search" />
                </InputGroup.Text>
                <FormControl
                  id="gig-name-search"
                  type="search"
                  placeholder="Szukaj po nazwie..."
                  className="bg-body-secondary border-secondary-subtle"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </InputGroup>
            </div>

            {/* Horyzontalne pola wyboru miast */}
            {cities.length > 0 && (
              <div
                className="d-flex align-items-center gap-2 flex-wrap"
                style={{ flex: "1 1 auto" }}
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
            )}

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
                      id={`desktop-genre-${genre.id}`}
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

            {/* Sortowanie */}
            <div className="d-flex align-items-center gap-2 ms-auto">
              <label
                htmlFor="desktop-gig-sort-select"
                className="small text-body-secondary text-nowrap fw-semibold mb-0 d-flex align-items-center gap-1"
              >
                <i className="bi bi-arrow-down-up" />
                Sortuj:
              </label>
              <Form.Select
                id="desktop-gig-sort-select"
                size="sm"
                className="w-auto bg-body-secondary border-secondary-subtle"
                style={{ minWidth: "150px" }}
                value={sortBy}
                onChange={(e) =>
                  handleSortChange(e.target.value as GigSortOption)
                }
              >
                <option value="date-asc">Data rosnąco</option>
                <option value="date-desc">Data malejąco</option>
                <option value="name-asc">Alfabetycznie</option>
              </Form.Select>
            </div>

            {/* Przycisk wyszukiwania */}
            <div className="d-flex align-items-center gap-2">
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

      {/* Lista koncertów */}
      {visibleGigs.length > 0 ? (
        <>
          <Row className="g-4">
            {visibleGigs
              .slice(
                (currentPage - 1) * ITEMS_PER_PAGE,
                currentPage * ITEMS_PER_PAGE,
              )
              .map((gig) => (
                <Col key={gig.id} xs={12} md={6} lg={4}>
                  <GigTile gig={gig} />
                </Col>
              ))}
          </Row>
          <BrowserPagination
            currentPage={currentPage}
            totalItems={visibleGigs.length}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </>
      ) : (
        <Alert variant="secondary" className="border mt-4 mb-0">
          Brak wydarzeń spełniających wybrane kryteria.
        </Alert>
      )}

      {/* Mobilny przycisk FAB (< 768px) */}
      <button
        type="button"
        className="filter-fab d-md-none"
        onClick={() => setShowMobileFilters(true)}
        aria-label="Otwórz filtry i sortowanie"
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
            <span className="fw-semibold">Filtry i sortowanie</span>
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body className="d-flex flex-column justify-content-between p-3">
          <div className="d-flex flex-column gap-4">
            {/* Zapisane zestawy filtrów */}
            {presets.length > 0 && (
              <div className="p-3 rounded bg-body-secondary border border-secondary-subtle">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold small text-body-secondary d-flex align-items-center gap-1">
                    <i className="bi bi-bookmarks-fill text-primary" />
                    Wczytaj zestaw filtrów
                  </span>
                  {activePreset && (
                    <Badge bg="primary" className="fw-normal">
                      Aktywny
                    </Badge>
                  )}
                </div>
                <Form.Select
                  size="sm"
                  value={activePresetId ?? ""}
                  onChange={(e) => {
                    const found = presets.find((p) => p.id === e.target.value);
                    if (found) {
                      loadPreset(found);
                    } else if (e.target.value === "") {
                      resetFilters();
                    }
                  }}
                  className="mb-2"
                >
                  <option value="">-- Wybierz zapisany zestaw --</option>
                  {presets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({generatePresetSummary(p, cities, genres)})
                    </option>
                  ))}
                </Form.Select>
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="w-100 d-flex align-items-center justify-content-center gap-1"
                  onClick={() => {
                    setShowMobileFilters(false);
                    setIsSaveModalOpen(true);
                  }}
                >
                  <i className="bi bi-bookmark-plus" />
                  Zapisz bieżące filtry jako zestaw
                </Button>
              </div>
            )}

            {/* Szukaj po nazwie */}
            <div>
              <label
                htmlFor="mobile-gig-search"
                className="form-label fw-semibold small text-body-secondary mb-2 d-flex align-items-center gap-1"
              >
                <i className="bi bi-search" />
                Szukaj po nazwie
              </label>
              <FormControl
                id="mobile-gig-search"
                type="search"
                placeholder="Np. koncert, festiwal..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* Miasta */}
            {cities.length > 0 && (
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
            )}

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
                      id={`mobile-genre-${genre.id}`}
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

            {/* Sortowanie */}
            <div>
              <label
                htmlFor="mobile-gig-sort"
                className="form-label fw-semibold small text-body-secondary mb-2 d-flex align-items-center gap-1"
              >
                <i className="bi bi-arrow-down-up" />
                Sortowanie
              </label>
              <Form.Select
                id="mobile-gig-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as GigSortOption)}
              >
                <option value="date-asc">Data rosnąco (najbliższe)</option>
                <option value="date-desc">Data malejąco (najpóźniejsze)</option>
                <option value="name-asc">Alfabetycznie (A - Z)</option>
              </Form.Select>
            </div>
          </div>

          {/* Akcje w dolnej części panelu */}
          <div className="pt-4 border-top mt-4 d-flex flex-column gap-2">
            <Button
              variant="primary"
              size="lg"
              className="w-100 fw-semibold"
              onClick={() => applyFilters()}
            >
              Zastosuj filtry
            </Button>
            <Button
              variant="outline-primary"
              size="sm"
              className="w-100 d-flex align-items-center justify-content-center gap-1"
              onClick={() => {
                setShowMobileFilters(false);
                setIsSaveModalOpen(true);
              }}
            >
              <i className="bi bi-bookmark-plus" />
              Zapisz te filtry jako zestaw
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

      {/* Save Preset Modal */}
      <SavePresetModal
        show={isSaveModalOpen}
        onHide={() => setIsSaveModalOpen(false)}
        currentFilters={currentFilters}
        cities={cities}
        genres={genres}
        activePreset={activePreset}
        onSave={handleSavePreset}
      />
    </Container>
  );
}
