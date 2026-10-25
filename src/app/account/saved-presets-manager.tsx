"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card } from "react-bootstrap";
import { usePocketBase } from "@/app/shared/pocketbase-client-provider";
import type { CityEntity } from "@/entities/city.entity";
import type { GenreEntity } from "@/entities/genre.entity";
import {
  type FilterPreset,
  buildPresetQueryString,
} from "@/shared/filter-presets";

type Props = {
  initialPresets: FilterPreset[];
  cities: CityEntity[];
  genres: GenreEntity[];
  userId: string;
};

export function SavedPresetsManager({
  initialPresets,
  cities,
  genres,
  userId,
}: Props) {
  const [presets, setPresets] = useState<FilterPreset[]>(initialPresets);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const pb = usePocketBase();
  const router = useRouter();

  const cityMap = new Map<string, string>(cities.map((c) => [c.id, c.name]));
  const genreMap = new Map<string, string>(genres.map((g) => [g.id, g.name]));

  const getSortLabel = (sort?: string) => {
    if (sort === "date-desc") return "Data malejąco";
    if (sort === "name-asc") return "Alfabetycznie (A-Z)";
    return "Data rosnąco";
  };

  const handleDeletePreset = async (presetId: string) => {
    const target = presets.find((p) => p.id === presetId);
    if (!target) return;

    if (!confirm(`Czy na pewno chcesz usunąć zestaw "${target.name}"?`)) {
      return;
    }

    setLoadingId(presetId);
    try {
      const updated = presets.filter((p) => p.id !== presetId);
      await pb.collection("users").update(userId, {
        searchFilters: updated,
      });
      setPresets(updated);
      router.refresh();
    } catch (err) {
      console.error("Błąd podczas usuwania zestawu:", err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleClearAll = async () => {
    if (
      !confirm("Czy na pewno chcesz usunąć wszystkie zapisane zestawy filtrów?")
    ) {
      return;
    }

    setIsClearingAll(true);
    try {
      await pb.collection("users").update(userId, {
        searchFilters: [],
      });
      setPresets([]);
      router.refresh();
    } catch (err) {
      console.error("Błąd podczas czyszczenia zestawów:", err);
    } finally {
      setIsClearingAll(false);
    }
  };

  return (
    <Card className="shadow-lg p-3 pt-2 h-100 d-flex flex-column" body>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="mb-0 d-flex align-items-center gap-2">
          <i className="bi bi-bookmarks-fill text-primary" />
          Zapisane zestawy filtrów
          {presets.length > 0 && (
            <Badge bg="secondary" className="fw-normal fs-6">
              {presets.length}
            </Badge>
          )}
        </h5>
        {presets.length > 0 && (
          <Button
            variant="outline-danger"
            size="sm"
            onClick={handleClearAll}
            disabled={isClearingAll}
            className="d-flex align-items-center gap-1"
          >
            {isClearingAll ? (
              <span
                className="spinner-border spinner-border-sm"
                aria-hidden="true"
              />
            ) : (
              <i className="bi bi-trash3" />
            )}
            <span className="d-none d-sm-inline">Wyczyść wszystkie</span>
          </Button>
        )}
      </div>

      <p className="text-body-secondary small mb-3">
        Możesz zapisać wiele zestawów filtrów i błyskawicznie wczytywać je w
        zakładce Koncerty.
      </p>

      {presets.length > 0 ? (
        <div className="d-flex flex-column gap-3 my-auto">
          {presets.map((preset) => {
            const cityNames = (preset.cities ?? [])
              .map((id) => cityMap.get(id))
              .filter(Boolean) as string[];

            const genreNames = (preset.genres ?? [])
              .map((id) => genreMap.get(id))
              .filter(Boolean) as string[];

            const queryString = buildPresetQueryString(preset);
            const gigUrl = `/koncerty${queryString ? `?${queryString}` : ""}`;

            return (
              <div
                key={preset.id}
                className="p-3 rounded-3 bg-body-tertiary border border-secondary-subtle d-flex flex-column gap-2"
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div className="fw-bold d-flex align-items-center gap-2">
                    <i className="bi bi-bookmark-fill text-primary" />
                    <span>{preset.name}</span>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-danger p-0 text-decoration-none"
                    onClick={() => handleDeletePreset(preset.id)}
                    disabled={loadingId === preset.id}
                    title="Usuń ten zestaw"
                  >
                    {loadingId === preset.id ? (
                      <span
                        className="spinner-border spinner-border-sm"
                        aria-hidden="true"
                      />
                    ) : (
                      <i className="bi bi-trash3" />
                    )}
                  </Button>
                </div>

                <div className="small text-body-secondary d-flex flex-column gap-1">
                  {cityNames.length > 0 ? (
                    <div className="d-flex flex-wrap align-items-center gap-1">
                      <span className="text-secondary">Miasta</span>
                      {cityNames.map((city) => (
                        <Badge
                          key={city}
                          bg="success"
                          className="py-1 px-2 fw-normal"
                        >
                          {city}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <span className="text-secondary">Miasta </span>
                      <span className="text-body-secondary">Wszystkie</span>
                    </div>
                  )}

                  {genreNames.length > 0 ? (
                    <div className="d-flex flex-wrap align-items-center gap-1">
                      <span className="text-secondary">Gatunki</span>
                      {genreNames.map((genre) => (
                        <Badge
                          key={genre}
                          bg="info"
                          className="text-dark py-1 px-2 fw-normal"
                        >
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <span className="text-secondary">Gatunki </span>
                      <span className="text-body-secondary">Wszystkie</span>
                    </div>
                  )}

                  {preset.query && (
                    <div>
                      <span className="text-secondary">Fraza: </span>
                      <Badge bg="secondary">&quot;{preset.query}&quot;</Badge>
                    </div>
                  )}

                  <div>
                    <span className="text-secondary">Sortowanie: </span>
                    <span>{getSortLabel(preset.sortBy)}</span>
                  </div>
                </div>

                <div className="pt-2 border-top border-secondary-subtle">
                  <Link
                    href={gigUrl}
                    className="btn btn-outline-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
                  >
                    <i className="bi bi-box-arrow-up-right" />
                    Wczytaj ten zestaw na liście koncertów
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4 my-auto">
          <i
            className="bi bi-bookmarks text-muted d-block mb-2"
            style={{ fontSize: "2.5rem" }}
          />
          <p className="text-muted small mb-3">
            Nie masz jeszcze zapisanych zestawów filtrów. Podczas przeglądania
            koncertów możesz zapisać dowolną konfigurację jako własny zestaw
            filtrów.
          </p>
          <Link href="/koncerty" className="btn btn-outline-primary btn-sm">
            <i className="bi bi-search me-1" />
            Przejdź do wyszukiwarki koncertów
          </Link>
        </div>
      )}
    </Card>
  );
}
