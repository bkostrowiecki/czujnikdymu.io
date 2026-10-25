"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Form, Modal } from "react-bootstrap";
import type { CityEntity } from "@/entities/city.entity";
import type { GenreEntity } from "@/entities/genre.entity";
import { type FilterPreset, suggestPresetName } from "@/shared/filter-presets";

type Props = {
  show: boolean;
  onHide: () => void;
  currentFilters: {
    cities: string[];
    genres: string[];
    query: string;
    sortBy: "date-asc" | "date-desc" | "name-asc";
  };
  cities: CityEntity[];
  genres: GenreEntity[];
  activePreset?: FilterPreset | null;
  onSave: (presetData: {
    name: string;
    targetPresetId?: string;
  }) => Promise<void>;
};

export function SavePresetModal({
  show,
  onHide,
  currentFilters,
  cities,
  genres,
  activePreset,
  onSave,
}: Props) {
  const [name, setName] = useState("");
  const [saveMode, setSaveMode] = useState<"new" | "update">("new");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      if (activePreset) {
        setName(activePreset.name);
        setSaveMode("update");
      } else {
        setName(suggestPresetName(currentFilters, cities, genres));
        setSaveMode("new");
      }
      setError(null);
      setIsSaving(false);
    }
  }, [show, activePreset, currentFilters, cities, genres]);

  const cityMap = new Map<string, string>(cities.map((c) => [c.id, c.name]));
  const genreMap = new Map<string, string>(genres.map((g) => [g.id, g.name]));

  const selectedCityNames = currentFilters.cities
    .map((id) => cityMap.get(id))
    .filter(Boolean) as string[];

  const selectedGenreNames = currentFilters.genres
    .map((id) => genreMap.get(id))
    .filter(Boolean) as string[];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Podaj nazwę zestawu filtrów.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        name: trimmed,
        targetPresetId:
          saveMode === "update" && activePreset ? activePreset.id : undefined,
      });
      onHide();
    } catch (err) {
      console.error(err);
      setError("Wystąpił błąd podczas zapisywania zestawu.");
    } finally {
      setIsSaving(false);
    }
  };

  const getSortLabel = (sort: string) => {
    if (sort === "date-desc") return "Data malejąco (najpóźniejsze)";
    if (sort === "name-asc") return "Alfabetycznie (A - Z)";
    return "Data rosnąco (najbliższe)";
  };

  return (
    <Modal show={show} onHide={onHide} centered data-bs-theme="dark">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton className="border-secondary-subtle">
          <Modal.Title className="fs-5 d-flex align-items-center gap-2">
            <i className="bi bi-bookmark-plus-fill text-primary" />
            Zapisz zestaw filtrów
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="py-3">
          {error && (
            <div className="alert alert-danger py-2 small mb-3">{error}</div>
          )}

          {activePreset && (
            <div className="mb-3 p-2 rounded bg-body-secondary border border-secondary-subtle">
              <div className="form-check mb-1">
                <input
                  className="form-check-input"
                  type="radio"
                  name="saveMode"
                  id="saveModeUpdate"
                  checked={saveMode === "update"}
                  onChange={() => {
                    setSaveMode("update");
                    setName(activePreset.name);
                  }}
                />
                <label
                  className="form-check-label small fw-semibold"
                  htmlFor="saveModeUpdate"
                >
                  Zaktualizuj obecny zestaw: &quot;{activePreset.name}&quot;
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="saveMode"
                  id="saveModeNew"
                  checked={saveMode === "new"}
                  onChange={() => {
                    setSaveMode("new");
                    setName(suggestPresetName(currentFilters, cities, genres));
                  }}
                />
                <label
                  className="form-check-label small fw-semibold"
                  htmlFor="saveModeNew"
                >
                  Zapisz jako nowy, oddzielny zestaw
                </label>
              </div>
            </div>
          )}

          <div className="mb-3">
            <Form.Label
              htmlFor="preset-name-input"
              className="small fw-semibold text-body-secondary"
            >
              Nazwa zestawu
            </Form.Label>
            <Form.Control
              id="preset-name-input"
              type="text"
              placeholder="Np. Warszawa • Rock & Metal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="p-3 rounded-3 bg-body-tertiary border border-secondary-subtle small">
            <div className="fw-semibold text-body-secondary mb-2 d-flex align-items-center gap-1">
              <i className="bi bi-info-circle text-primary" />
              Zawartość tego zestawu:
            </div>

            <div className="d-flex flex-column gap-2">
              <div>
                <span className="text-secondary me-2">Miasta</span>
                {selectedCityNames.length > 0 ? (
                  <div className="d-inline-flex flex-wrap gap-1 align-items-center">
                    {selectedCityNames.map((city) => (
                      <Badge key={city} bg="success" className="fw-normal">
                        {city}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-body-secondary italic">
                    Wszystkie miasta
                  </span>
                )}
              </div>

              <div>
                <span className="text-secondary me-2">Gatunki</span>
                {selectedGenreNames.length > 0 ? (
                  <div className="d-inline-flex flex-wrap gap-1 align-items-center">
                    {selectedGenreNames.map((genre) => (
                      <Badge
                        key={genre}
                        bg="info"
                        className="text-dark fw-normal"
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-body-secondary italic">
                    Wszystkie gatunki
                  </span>
                )}
              </div>

              {currentFilters.query.trim() && (
                <div>
                  <span className="text-secondary me-2">Szukana fraza:</span>
                  <Badge bg="secondary">
                    &quot;{currentFilters.query.trim()}&quot;
                  </Badge>
                </div>
              )}

              <div>
                <span className="text-secondary me-2">Sortowanie:</span>
                <span className="text-body">
                  {getSortLabel(currentFilters.sortBy)}
                </span>
              </div>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer className="border-secondary-subtle">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={onHide}
            disabled={isSaving}
          >
            Anuluj
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-1"
                  aria-hidden="true"
                />
                Zapisywanie...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-1" />
                {saveMode === "update" ? "Zaktualizuj zestaw" : "Zapisz zestaw"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
