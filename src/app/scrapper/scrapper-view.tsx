"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  ButtonGroup,
  Card,
  Col,
  Container,
  Form,
  Nav,
  Row,
  Spinner,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import { HtmlWysiwygEditor } from "@/components/html-wysiwyg-editor";
import { cleanEventDescription } from "@/shared/format-event-description";
import {
  confirmArtistAction,
  confirmConcertAction,
  confirmPlaceAction,
  previewArtistAction,
  previewConcertAction,
  previewPlaceAction,
  scrapeConcertsAction,
  type ArtistOptionDto,
  type CityOptionDto,
  type PlaceOptionDto,
  type ScrapedGigProposalDto,
} from "./actions";

type City = { id: string; name: string };

type ScrapperViewProps = {
  cities: City[];
  currentUserId: string;
};

type ActiveTab = "concerts" | "artists" | "places";
type CoverMode = "default" | "url" | "file";

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

function toDatetimeLocalValue(isoString?: string | null): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function ScrapperView({ cities }: ScrapperViewProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("concerts");

  // --- 1. KONCERTY STATE ---
  const [concertUrl, setConcertUrl] = useState("");
  const [concertLoading, setConcertLoading] = useState(false);
  const [concertProposal, setConcertProposal] = useState<{
    data: ScrapedGigProposalDto;
    places: PlaceOptionDto[];
    artists: ArtistOptionDto[];
    cities: CityOptionDto[];
  } | null>(null);

  // Editable concert fields
  const [concertEditTitle, setConcertEditTitle] = useState("");
  const [concertEditStartsAt, setConcertEditStartsAt] = useState("");
  const [concertEditPlaceId, setConcertEditPlaceId] = useState("");
  const [concertEditCityId, setConcertEditCityId] = useState("");
  const [concertEditArtistIds, setConcertEditArtistIds] = useState<string[]>(
    [],
  );
  const [concertEditDescription, setConcertEditDescription] = useState("");

  // Cover image controls
  const [concertCoverMode, setConcertCoverMode] =
    useState<CoverMode>("default");
  const [concertCustomUrl, setConcertCustomUrl] = useState("");
  const [concertCustomFileBase64, setConcertCustomFileBase64] = useState("");
  const [concertCustomFileName, setConcertCustomFileName] = useState("");
  const [concertPreviewUrl, setConcertPreviewUrl] = useState("");

  const [concertSaving, setConcertSaving] = useState(false);
  const [concertSuccess, setConcertSuccess] = useState<{
    isNew: boolean;
    title: string;
    draftId?: string;
  } | null>(null);
  const [concertError, setConcertError] = useState<string | null>(null);

  // --- 2. WYKONAWCY STATE ---
  const [artistUrl, setArtistUrl] = useState("");
  const [artistLoading, setArtistLoading] = useState(false);
  const [artistProposal, setArtistProposal] = useState<{
    data: any;
    existingArtist: any;
    isUpdate: boolean;
    isNew: boolean;
    message?: string;
  } | null>(null);
  const [artistEditName, setArtistEditName] = useState("");
  const [artistEditWebsiteUrl, setArtistEditWebsiteUrl] = useState("");
  const [artistEditInstagramUrl, setArtistEditInstagramUrl] = useState("");
  const [artistCoverMode, setArtistCoverMode] = useState<CoverMode>("default");
  const [artistCustomUrl, setArtistCustomUrl] = useState("");
  const [artistCustomFileBase64, setArtistCustomFileBase64] = useState("");
  const [artistCustomFileName, setArtistCustomFileName] = useState("");
  const [artistPreviewUrl, setArtistPreviewUrl] = useState("");
  const [artistSaving, setArtistSaving] = useState(false);
  const [artistSuccess, setArtistSuccess] = useState<{
    isNew: boolean;
    slug: string;
    name: string;
  } | null>(null);
  const [artistError, setArtistError] = useState<string | null>(null);

  // --- 3. MIEJSCA STATE ---
  const [placeUrl, setPlaceUrl] = useState("");
  const [placeLoading, setPlaceLoading] = useState(false);
  const [placeProposal, setPlaceProposal] = useState<{
    data: any;
    existingPlace: any;
    isUpdate: boolean;
    isNew: boolean;
    message?: string;
  } | null>(null);
  const [placeAddress, setPlaceAddress] = useState("");
  const [placeCityId, setPlaceCityId] = useState("");
  const [placeCoverMode, setPlaceCoverMode] = useState<CoverMode>("default");
  const [placeCustomUrl, setPlaceCustomUrl] = useState("");
  const [placeCustomFileBase64, setPlaceCustomFileBase64] = useState("");
  const [placeCustomFileName, setPlaceCustomFileName] = useState("");
  const [placePreviewUrl, setPlacePreviewUrl] = useState("");
  const [placeSaving, setPlaceSaving] = useState(false);
  const [placeSuccess, setPlaceSuccess] = useState<{
    isNew: boolean;
    slug: string;
    name: string;
  } | null>(null);
  const [placeError, setPlaceError] = useState<string | null>(null);

  // Handlers: Koncerty
  const handleConcertFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await readFileAsBase64(file);
      setConcertCustomFileBase64(base64);
      setConcertCustomFileName(file.name);
      setConcertPreviewUrl(URL.createObjectURL(file));
      setConcertCoverMode("file");
    }
  };

  const handleConcertUrlImageChange = (url: string) => {
    setConcertCustomUrl(url);
    if (url.trim()) {
      setConcertPreviewUrl(url.trim());
    } else {
      setConcertPreviewUrl(concertProposal?.data?.coverSrc || "");
    }
  };

  const handleResetConcertCover = () => {
    setConcertCoverMode("default");
    setConcertCustomUrl("");
    setConcertCustomFileBase64("");
    setConcertCustomFileName("");
    setConcertPreviewUrl(concertProposal?.data?.coverSrc || "");
  };

  const handlePreviewConcert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concertUrl.trim()) return;

    setConcertLoading(true);
    setConcertProposal(null);
    setConcertSuccess(null);
    setConcertError(null);
    handleResetConcertCover();

    const res = await previewConcertAction(concertUrl);
    if (res.success && res.data) {
      setConcertProposal({
        data: res.data,
        places: res.places || [],
        artists: res.artists || [],
        cities: res.cities || cities,
      });

      setConcertEditTitle(res.data.title || "");
      setConcertEditStartsAt(toDatetimeLocalValue(res.data.startsAt));
      setConcertEditPlaceId(res.data.suggestedPlaceId || "");
      setConcertEditCityId(res.data.suggestedCityId || "");
      setConcertEditArtistIds(res.data.suggestedArtistIds || []);
      setConcertEditDescription(cleanEventDescription(res.data.description || ""));
      setConcertPreviewUrl(res.data.coverSrc || "");
    } else {
      setConcertError(
        res.error || "Wystąpił błąd podczas scrapowania wydarzenia.",
      );
    }
    setConcertLoading(false);
  };

  const handleConfirmConcert = async () => {
    if (!concertProposal?.data) return;

    setConcertSaving(true);
    setConcertError(null);

    const startsAtIso = concertEditStartsAt
      ? new Date(concertEditStartsAt).toISOString()
      : concertProposal.data.startsAt || undefined;

    const res = await confirmConcertAction({
      title: concertEditTitle.trim() || concertProposal.data.title,
      startsAt: startsAtIso,
      placeId: concertEditPlaceId || undefined,
      cityId: concertEditCityId || undefined,
      artistIds: concertEditArtistIds,
      description: cleanEventDescription(concertEditDescription) || undefined,
      sourceUrl: concertProposal.data.url,
      customCoverUrl:
        concertCoverMode === "url" && concertCustomUrl.trim()
          ? concertCustomUrl.trim()
          : undefined,
      coverBase64:
        concertCoverMode === "file" && concertCustomFileBase64
          ? concertCustomFileBase64
          : undefined,
      coverFileName: concertCustomFileName || undefined,
      coverSrc: concertProposal.data.coverSrc || undefined,
      downloadImage: true,
    });

    if (res.success) {
      setConcertSuccess({
        isNew: res.isNew ?? true,
        title: concertEditTitle.trim() || concertProposal.data.title,
        draftId: res.draftId,
      });
      setConcertProposal(null);
      handleResetConcertCover();
    } else {
      setConcertError(
        res.error || "Nie udało się zapisać koncertu do draftów.",
      );
    }
    setConcertSaving(false);
  };

  const handleConcertPlaceSelect = (placeId: string) => {
    setConcertEditPlaceId(placeId);
    if (placeId && concertProposal) {
      const selectedPlace = concertProposal.places.find(
        (p) => p.id === placeId,
      );
      if (selectedPlace?.city) {
        setConcertEditCityId(selectedPlace.city);
      }
    }
  };

  const handleAddConcertArtist = (artistId: string) => {
    if (!artistId) return;
    if (!concertEditArtistIds.includes(artistId)) {
      setConcertEditArtistIds([...concertEditArtistIds, artistId]);
    }
  };

  const handleRemoveConcertArtist = (artistId: string) => {
    setConcertEditArtistIds(
      concertEditArtistIds.filter((id) => id !== artistId),
    );
  };

  // Handlers: Wykonawcy
  const handleArtistFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await readFileAsBase64(file);
      setArtistCustomFileBase64(base64);
      setArtistCustomFileName(file.name);
      setArtistPreviewUrl(URL.createObjectURL(file));
      setArtistCoverMode("file");
    }
  };

  const handleArtistUrlImageChange = (url: string) => {
    setArtistCustomUrl(url);
    if (url.trim()) {
      setArtistPreviewUrl(url.trim());
    } else {
      setArtistPreviewUrl(
        artistProposal?.data?.coverSrc || artistProposal?.data?.avatarSrc || "",
      );
    }
  };

  const handleResetArtistCover = () => {
    setArtistCoverMode("default");
    setArtistCustomUrl("");
    setArtistCustomFileBase64("");
    setArtistCustomFileName("");
    setArtistPreviewUrl(
      artistProposal?.data?.coverSrc || artistProposal?.data?.avatarSrc || "",
    );
  };

  const handlePreviewArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistUrl.trim()) return;

    setArtistLoading(true);
    setArtistProposal(null);
    setArtistSuccess(null);
    setArtistError(null);
    handleResetArtistCover();

    const res = await previewArtistAction(artistUrl);
    if (res.success && res.data) {
      setArtistProposal({
        data: res.data,
        existingArtist: res.existingArtist,
        isUpdate: res.isUpdate || false,
        isNew: res.isNew || false,
        message: res.message,
      });
      setArtistEditName(res.data.name || res.existingArtist?.name || "");
      setArtistEditWebsiteUrl(
        res.data.websiteUrl || res.existingArtist?.websiteUrl || "",
      );
      setArtistEditInstagramUrl(
        res.data.instagramUrl || res.existingArtist?.instagramUrl || "",
      );
      setArtistPreviewUrl(res.data.coverSrc || res.data.avatarSrc || "");
    } else {
      setArtistError(
        res.error || "Wystąpił błąd podczas scrapowania wykonawcy.",
      );
    }
    setArtistLoading(false);
  };

  const handleConfirmArtist = async () => {
    if (!artistProposal?.data) return;

    setArtistSaving(true);
    setArtistError(null);

    const finalArtistData = {
      ...artistProposal.data,
      name: artistEditName.trim() || artistProposal.data.name,
      websiteUrl: artistEditWebsiteUrl.trim() || undefined,
      instagramUrl: artistEditInstagramUrl.trim() || undefined,
    };

    const res = await confirmArtistAction(finalArtistData, {
      customCoverUrl:
        artistCoverMode === "url" && artistCustomUrl.trim()
          ? artistCustomUrl.trim()
          : undefined,
      coverBase64:
        artistCoverMode === "file" && artistCustomFileBase64
          ? artistCustomFileBase64
          : undefined,
      coverFileName: artistCustomFileName || undefined,
      downloadImage: true,
    });

    if (res.success) {
      setArtistSuccess({
        isNew: res.isNew,
        slug: artistProposal.data.slug,
        name: finalArtistData.name,
      });
      setArtistProposal(null);
      setArtistEditName("");
      setArtistEditWebsiteUrl("");
      setArtistEditInstagramUrl("");
      handleResetArtistCover();
    } else {
      setArtistError(res.error || "Nie udało się zapisać wykonawcy.");
    }
    setArtistSaving(false);
  };

  // Handlers: Miejsca
  const handlePlaceFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await readFileAsBase64(file);
      setPlaceCustomFileBase64(base64);
      setPlaceCustomFileName(file.name);
      setPlacePreviewUrl(URL.createObjectURL(file));
      setPlaceCoverMode("file");
    }
  };

  const handlePlaceUrlImageChange = (url: string) => {
    setPlaceCustomUrl(url);
    if (url.trim()) {
      setPlacePreviewUrl(url.trim());
    } else {
      setPlacePreviewUrl(placeProposal?.data?.coverSrc || "");
    }
  };

  const handleResetPlaceCover = () => {
    setPlaceCoverMode("default");
    setPlaceCustomUrl("");
    setPlaceCustomFileBase64("");
    setPlaceCustomFileName("");
    setPlacePreviewUrl(placeProposal?.data?.coverSrc || "");
  };

  const handlePreviewPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeUrl.trim()) return;

    setPlaceLoading(true);
    setPlaceProposal(null);
    setPlaceSuccess(null);
    setPlaceError(null);
    handleResetPlaceCover();

    const res = await previewPlaceAction(placeUrl);
    if (res.success && res.data) {
      setPlaceProposal({
        data: res.data,
        existingPlace: res.existingPlace,
        isUpdate: res.isUpdate || false,
        isNew: res.isNew || false,
        message: res.message,
      });
      setPlaceAddress(res.data.address || res.existingPlace?.address || "");
      setPlaceCityId(
        res.data.cityId || res.existingPlace?.city || (cities[0]?.id ?? ""),
      );
      setPlacePreviewUrl(res.data.coverSrc || "");
    } else {
      setPlaceError(res.error || "Wystąpił błąd podczas scrapowania miejsca.");
    }
    setPlaceLoading(false);
  };

  const handleConfirmPlace = async () => {
    if (!placeProposal?.data) return;

    setPlaceSaving(true);
    setPlaceError(null);

    const res = await confirmPlaceAction(placeProposal.data, {
      cityId: placeCityId,
      address: placeAddress,
      customCoverUrl:
        placeCoverMode === "url" && placeCustomUrl.trim()
          ? placeCustomUrl.trim()
          : undefined,
      coverBase64:
        placeCoverMode === "file" && placeCustomFileBase64
          ? placeCustomFileBase64
          : undefined,
      coverFileName: placeCustomFileName || undefined,
      downloadImage: true,
    });

    if (res.success) {
      setPlaceSuccess({
        isNew: res.isNew,
        slug: placeProposal.data.slug,
        name: placeProposal.data.name,
      });
      setPlaceProposal(null);
      handleResetPlaceCover();
    } else {
      setPlaceError(res.error || "Nie udało się zapisać miejsca.");
    }
    setPlaceSaving(false);
  };

  return (
    <Container className="py-4 py-md-5">
      {/* Header */}
      <div className="mb-4">
        <h1 className="h2 fw-bold text-warning mb-2">Scrapper danych</h1>
        <p className="text-secondary mb-0">
          Wymuś natychmiastowe pobranie i synchronizację koncertów, wykonawców
          lub miejsc z <strong>Facebooka</strong> oraz{" "}
          <strong>Bandcampa</strong>.
        </p>
      </div>

      {/* Tabs */}
      <Nav
        variant="pills"
        className="gap-2 mb-4 p-1 bg-dark rounded-3 border border-secondary border-opacity-50"
      >
        <Nav.Item>
          <Nav.Link
            as="button"
            active={activeTab === "concerts"}
            onClick={() => setActiveTab("concerts")}
            className="d-flex align-items-center gap-2 px-3 py-2 cursor-pointer"
          >
            <i className="bi bi-calendar-event fs-5" />
            <span className="fw-semibold">Koncerty</span>
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            as="button"
            active={activeTab === "artists"}
            onClick={() => setActiveTab("artists")}
            className="d-flex align-items-center gap-2 px-3 py-2 cursor-pointer"
          >
            <i className="bi bi-people fs-5" />
            <span className="fw-semibold">Wykonawcy</span>
            <Badge bg="secondary" className="ms-1 small">
              FB / Bandcamp
            </Badge>
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            as="button"
            active={activeTab === "places"}
            onClick={() => setActiveTab("places")}
            className="d-flex align-items-center gap-2 px-3 py-2 cursor-pointer"
          >
            <i className="bi bi-geo-alt fs-5" />
            <span className="fw-semibold">Miejsca</span>
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {/* TAB 1: KONCERTY */}
      {activeTab === "concerts" && (
        <Card className="bg-dark border-secondary shadow-sm">
          <Card.Body className="p-4">
            <div className="d-flex align-items-start gap-3 mb-4">
              <div className="p-3 rounded-circle bg-primary bg-opacity-10 text-primary fs-3">
                <i className="bi bi-calendar2-plus" />
              </div>
              <div>
                <h4 className="fw-bold text-light mb-1">
                  Scrapowanie koncertu z Facebooka
                </h4>
                <p className="text-secondary mb-0">
                  Wklej bezpośredni link do jednego konkretnego wydarzenia na
                  Facebooku (np.{" "}
                  <code>https://www.facebook.com/events/123456789/</code>).
                  Scrapper odczyta szczegóły, automatycznie zasugeruje pasujące
                  miejsce oraz zespoły z Twojej bazy i wyświetli formularz do
                  zatwierdzenia przed dodaniem do kolejki Moderacji.
                </p>
              </div>
            </div>

            <Form onSubmit={handlePreviewConcert}>
              <Form.Group className="mb-3">
                <Form.Label className="text-light fw-semibold">
                  Link do pojedynczego wydarzenia na Facebooku
                </Form.Label>
                <div className="d-flex flex-column flex-md-row gap-2">
                  <Form.Control
                    type="url"
                    placeholder="https://www.facebook.com/events/1234567890/..."
                    value={concertUrl}
                    onChange={(e) => setConcertUrl(e.target.value)}
                    disabled={concertLoading}
                    className="bg-body-tertiary text-light border-secondary"
                    required
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={concertLoading || !concertUrl.trim()}
                    className="d-flex align-items-center justify-content-center gap-2 px-4 text-nowrap"
                  >
                    {concertLoading ? (
                      <>
                        <Spinner animation="border" size="sm" />
                        <span>Pobieranie i analiza...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-cloud-arrow-down-fill" />
                        <span>Pobierz i zanalizuj wydarzenie</span>
                      </>
                    )}
                  </Button>
                </div>
              </Form.Group>
            </Form>

            {/* Loading */}
            {concertLoading && (
              <Alert
                variant="info"
                className="d-flex align-items-center gap-3 mt-3"
              >
                <Spinner animation="border" size="sm" />
                <div>
                  <strong>
                    Trwa scrapowanie wydarzenia przez Puppeteer...
                  </strong>
                  <div className="small text-secondary">
                    Przeglądarka renderuje stronę wydarzenia na Facebooku,
                    odczytuje datę, miejsce, opis oraz grafikę i porównuje je z
                    bazą miejsc i wykonawców.
                  </div>
                </div>
              </Alert>
            )}

            {/* PROPOSAL FORM */}
            {concertProposal && (
              <Card className="mt-4 bg-body-tertiary border-secondary">
                <Card.Header className="bg-dark border-secondary py-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg="primary">Propozycja Koncertu</Badge>
                    <span className="text-light fw-bold">
                      Zweryfikuj dane przed dodaniem do draftów
                    </span>
                  </div>
                  {concertProposal.data.url && (
                    <a
                      href={concertProposal.data.url}
                      target="_blank"
                      rel="noreferrer"
                      className="small text-info text-decoration-none d-flex align-items-center gap-1"
                    >
                      <i className="bi bi-facebook" /> FB Event
                    </a>
                  )}
                </Card.Header>
                <Card.Body className="p-4">
                  <Row className="g-4">
                    {/* LEWA KOLUMNA: Okładka / Cover image */}
                    <Col md={5} lg={4}>
                      <div className="border border-secondary rounded-3 p-3 bg-dark">
                        <div className="small fw-bold text-light mb-2 d-flex align-items-center justify-content-between">
                          <span>
                            <i className="bi bi-image text-primary me-1" />{" "}
                            Okładka (Cover Image):
                          </span>
                          {concertCoverMode !== "default" && (
                            <Button
                              variant="link"
                              size="sm"
                              className="text-secondary p-0 text-decoration-none small"
                              onClick={handleResetConcertCover}
                            >
                              Przywróć z FB
                            </Button>
                          )}
                        </div>

                        {concertPreviewUrl ? (
                          <div className="text-center mb-3">
                            {/* biome-ignore lint/performance/noImgElement: live preview */}
                            <img
                              src={concertPreviewUrl}
                              alt="Podgląd okładki"
                              className="img-fluid rounded-2 border border-secondary"
                              style={{
                                maxHeight: "200px",
                                width: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            className="d-flex align-items-center justify-content-center bg-body-tertiary rounded-2 border border-secondary mb-3 text-secondary"
                            style={{ height: "140px" }}
                          >
                            <i className="bi bi-image fs-1 opacity-50" />
                          </div>
                        )}

                        <ButtonGroup size="sm" className="w-100 mb-2">
                          <Button
                            variant={
                              concertCoverMode === "default"
                                ? "primary"
                                : "outline-secondary"
                            }
                            onClick={() => {
                              setConcertCoverMode("default");
                              setConcertPreviewUrl(
                                concertProposal.data.coverSrc || "",
                              );
                            }}
                          >
                            Z FB
                          </Button>
                          <Button
                            variant={
                              concertCoverMode === "url"
                                ? "primary"
                                : "outline-secondary"
                            }
                            onClick={() => setConcertCoverMode("url")}
                          >
                            Link URL
                          </Button>
                          <Button
                            variant={
                              concertCoverMode === "file"
                                ? "primary"
                                : "outline-secondary"
                            }
                            onClick={() => setConcertCoverMode("file")}
                          >
                            Plik
                          </Button>
                        </ButtonGroup>

                        {concertCoverMode === "url" && (
                          <Form.Group className="mt-2">
                            <Form.Control
                              type="url"
                              size="sm"
                              placeholder="https://... link do grafiki"
                              value={concertCustomUrl}
                              onChange={(e) =>
                                handleConcertUrlImageChange(e.target.value)
                              }
                              className="bg-body-tertiary text-light border-secondary"
                            />
                            <div className="small text-secondary mt-1">
                              Podaj link &mdash; scrapper ściągnie grafikę do
                              bazy.
                            </div>
                          </Form.Group>
                        )}

                        {concertCoverMode === "file" && (
                          <Form.Group className="mt-2">
                            <Form.Control
                              type="file"
                              size="sm"
                              accept="image/*"
                              onChange={handleConcertFileChange}
                              className="bg-body-tertiary text-light border-secondary"
                            />
                            {concertCustomFileName && (
                              <div className="small text-info mt-1">
                                Plik: {concertCustomFileName}
                              </div>
                            )}
                          </Form.Group>
                        )}
                      </div>
                    </Col>

                    {/* PRAWA KOLUMNA: Formularz koncertu */}
                    <Col md={7} lg={8}>
                      {/* Tytuł */}
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-light mb-1">
                          Tytuł wydarzenia:
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={concertEditTitle}
                          onChange={(e) =>
                            setConcertEditTitle(e.target.value)
                          }
                          placeholder="Wpisz tytuł wydarzenia"
                          className="bg-dark text-light border-secondary fw-semibold"
                        />
                      </Form.Group>

                      {/* Data i godzina */}
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-light mb-1 d-flex align-items-center justify-content-between">
                          <span>
                            <i className="bi bi-clock text-info me-1" /> Data i
                            godzina rozpoczęcia:
                          </span>
                          {concertProposal.data.rawDate && (
                            <span className="text-secondary small fw-normal">
                              Oryginał z FB: &quot;
                              {concertProposal.data.rawDate}&quot;
                            </span>
                          )}
                        </Form.Label>
                        <Form.Control
                          type="datetime-local"
                          value={concertEditStartsAt}
                          onChange={(e) =>
                            setConcertEditStartsAt(e.target.value)
                          }
                          className="bg-dark text-light border-secondary"
                        />
                      </Form.Group>

                      {/* Miejsce i Miasto */}
                      <Row className="g-2 mb-3">
                        <Col sm={6}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-light mb-1 d-flex align-items-center justify-content-between">
                              <span>
                                <i className="bi bi-geo-alt-fill text-danger me-1" />{" "}
                                Miejsce (Klub / Sala):
                              </span>
                            </Form.Label>
                            <Form.Select
                              value={concertEditPlaceId}
                              onChange={(e) =>
                                handleConcertPlaceSelect(e.target.value)
                              }
                              className="bg-dark text-light border-secondary"
                            >
                              <option value="">
                                -- Wybierz miejsce z bazy (lub brak) --
                              </option>
                              {concertProposal.places.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}{" "}
                                  {p.address ? `(${p.address})` : ""}
                                </option>
                              ))}
                            </Form.Select>
                            <div className="small text-secondary mt-1">
                              Wykryte z FB:{" "}
                              <code className="text-light">
                                {concertProposal.data.rawPlace || "brak"}
                              </code>
                              {concertProposal.data.suggestedPlaceId &&
                                concertEditPlaceId ===
                                  concertProposal.data.suggestedPlaceId && (
                                  <Badge bg="success" className="ms-1">
                                    Dopasowano
                                  </Badge>
                                )}
                            </div>
                          </Form.Group>
                        </Col>
                        <Col sm={6}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-light mb-1">
                              <i className="bi bi-building text-warning me-1" />{" "}
                              Miasto:
                            </Form.Label>
                            <Form.Select
                              value={concertEditCityId}
                              onChange={(e) =>
                                setConcertEditCityId(e.target.value)
                              }
                              className="bg-dark text-light border-secondary"
                            >
                              <option value="">-- Wybierz miasto --</option>
                              {concertProposal.cities.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </Form.Select>
                            <div className="small text-secondary mt-1">
                              Lokalizacja wydarzenia
                            </div>
                          </Form.Group>
                        </Col>
                      </Row>

                      {/* Zespoły / Artyści */}
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-light mb-1 d-flex align-items-center justify-content-between">
                          <span>
                            <i className="bi bi-music-note-beamed text-primary me-1" />{" "}
                            Powiązani wykonawcy (Zespoły z bazy):
                          </span>
                          <span className="small text-secondary fw-normal">
                            Dopasowano automatycznie:{" "}
                            {concertProposal.data.suggestedArtistIds?.length ||
                              0}
                          </span>
                        </Form.Label>

                        {/* Aktualnie wybrane zespoły */}
                        <div className="d-flex flex-wrap gap-2 mb-2 p-2 bg-dark rounded border border-secondary">
                          {concertEditArtistIds.length === 0 ? (
                            <span className="text-secondary small">
                              Brak powiązanych wykonawców. Możesz dodać ich z
                              listy poniżej.
                            </span>
                          ) : (
                            concertEditArtistIds.map((aId) => {
                              const art = concertProposal.artists.find(
                                (a) => a.id === aId,
                              );
                              return (
                                <Badge
                                  key={aId}
                                  bg="primary"
                                  className="d-flex align-items-center gap-2 py-2 px-3 fs-6"
                                >
                                  <span>{art?.name || aId}</span>
                                  <i
                                    className="bi bi-x-circle-fill cursor-pointer text-white-50"
                                    onClick={() =>
                                      handleRemoveConcertArtist(aId)
                                    }
                                    title="Usuń wykonawcę z tego koncertu"
                                    role="button"
                                  />
                                </Badge>
                              );
                            })
                          )}
                        </div>

                        {/* Dropdown dodawania wykonawcy */}
                        <Form.Select
                          size="sm"
                          value=""
                          onChange={(e) =>
                            handleAddConcertArtist(e.target.value)
                          }
                          className="bg-dark text-light border-secondary"
                        >
                          <option value="">
                            + Dodaj kolejnego wykonawcę z bazy danych...
                          </option>
                          {concertProposal.artists
                            .filter(
                              (a) => !concertEditArtistIds.includes(a.id),
                            )
                            .map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name}
                              </option>
                            ))}
                        </Form.Select>
                      </Form.Group>

                      {/* Opis */}
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-light mb-1 d-flex align-items-center justify-content-between">
                          <span>
                            <i className="bi bi-file-earmark-text text-info me-1" />{" "}
                            Opis wydarzenia (edytor HTML / WYSIWYG):
                          </span>
                        </Form.Label>
                        <HtmlWysiwygEditor
                          value={concertEditDescription}
                          onChange={setConcertEditDescription}
                          placeholder="Treść opisu wydarzenia..."
                          minHeight="220px"
                        />
                      </Form.Group>

                      {/* Przyciski zatwierdzenia */}
                      <div className="d-flex gap-2 mt-4">
                        <Button
                          variant="success"
                          onClick={handleConfirmConcert}
                          disabled={concertSaving}
                          className="d-flex align-items-center gap-2 fw-semibold px-4"
                        >
                          {concertSaving ? (
                            <>
                              <Spinner animation="border" size="sm" />
                              <span>Zapisywanie w draftach...</span>
                            </>
                          ) : (
                            <>
                              <i className="bi bi-check2-circle fs-5" />
                              <span>Dodaj wydarzenie do draftów</span>
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline-secondary"
                          onClick={() => {
                            setConcertProposal(null);
                            handleResetConcertCover();
                          }}
                          disabled={concertSaving}
                        >
                          Anuluj
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}
          </Card.Body>
        </Card>
      )}

      {/* TAB 2: WYKONAWCY */}
      {activeTab === "artists" && (
        <Card className="bg-dark border-secondary shadow-sm">
          <Card.Body className="p-4">
            <div className="d-flex align-items-start gap-3 mb-4">
              <div className="p-3 rounded-circle bg-warning bg-opacity-10 text-warning fs-3">
                <i className="bi bi-file-music" />
              </div>
              <div>
                <h4 className="fw-bold text-light mb-1">
                  Scrapowanie wykonawców (Facebook & Bandcamp)
                </h4>
                <p className="text-secondary mb-0">
                  Wklej link do profilu zespołu na <strong>Facebooku</strong>{" "}
                  lub strony na <strong>Bandcampie</strong>. Scrapper pobierze
                  dane i przedstawi{" "}
                  <strong>propozycję dodania lub aktualizacji</strong> wykonawcy
                  z opcją zmiany grafiki (cover image) przed zatwierdzeniem.
                </p>
              </div>
            </div>

            <Form onSubmit={handlePreviewArtist}>
              <Form.Group className="mb-3">
                <Form.Label className="text-light fw-semibold">
                  Link do profilu zespołu (Facebook lub Bandcamp)
                </Form.Label>
                <div className="d-flex flex-column flex-md-row gap-2">
                  <Form.Control
                    type="url"
                    placeholder="https://www.facebook.com/... lub https://nazwa.bandcamp.com"
                    value={artistUrl}
                    onChange={(e) => setArtistUrl(e.target.value)}
                    disabled={artistLoading}
                    className="bg-body-tertiary text-light border-secondary"
                    required
                  />
                  <Button
                    type="submit"
                    variant="warning"
                    disabled={artistLoading || !artistUrl.trim()}
                    className="d-flex align-items-center justify-content-center gap-2 px-4 text-nowrap fw-semibold text-dark"
                  >
                    {artistLoading ? (
                      <>
                        <Spinner animation="border" size="sm" />
                        <span>Pobieranie...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-search" />
                        <span>Pobierz propozycję</span>
                      </>
                    )}
                  </Button>
                </div>
              </Form.Group>

              {/* Quick links */}
              <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
                <span className="small text-secondary">Przykładowe linki:</span>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="py-0 px-2 small"
                  onClick={() => setArtistUrl("https://belzebong.bandcamp.com")}
                >
                  BelzebonG (Bandcamp)
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="py-0 px-2 small"
                  onClick={() => setArtistUrl("https://dopelord.bandcamp.com")}
                >
                  Dopelord (Bandcamp)
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="py-0 px-2 small"
                  onClick={() =>
                    setArtistUrl("https://www.facebook.com/Riversidepl")
                  }
                >
                  Riverside (Facebook)
                </Button>
              </div>
            </Form>

            {/* Proposal Card */}
            {artistProposal && (
              <Card className="border-secondary bg-body-tertiary mt-4">
                <Card.Header className="bg-dark border-secondary d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    {artistProposal.isUpdate ? (
                      <Badge bg="warning" text="dark" className="px-2 py-1">
                        <i className="bi bi-arrow-repeat me-1" />
                        PROPOZYCJA AKTUALIZACJI ISTNIEJĄCEGO WYKONAWCY
                      </Badge>
                    ) : (
                      <Badge bg="success" className="px-2 py-1">
                        <i className="bi bi-plus-circle me-1" />
                        PROPOZYCJA DODANIA NOWEGO WYKONAWCY
                      </Badge>
                    )}
                  </div>
                  <small className="text-secondary">Wymaga potwierdzenia</small>
                </Card.Header>

                <Card.Body className="p-4">
                  <Row className="g-4">
                    {/* Cover Preview & Cover Controls */}
                    <Col md={5}>
                      <div className="text-center mb-3">
                        {artistPreviewUrl ? (
                          // biome-ignore lint/performance/noImgElement: dynamic preview
                          <img
                            src={artistPreviewUrl}
                            alt={artistProposal.data.name}
                            className="rounded-3 img-fluid border border-secondary shadow-sm object-fit-cover"
                            style={{ maxHeight: "240px", width: "100%" }}
                          />
                        ) : (
                          <div
                            className="bg-dark rounded-3 d-flex flex-column align-items-center justify-content-center text-secondary border border-secondary"
                            style={{ height: "200px" }}
                          >
                            <i className="bi bi-image fs-1 mb-2 opacity-50" />
                            <span>Brak zdjęcia</span>
                          </div>
                        )}
                      </div>

                      {/* Cover Image Selector */}
                      <div className="p-3 bg-dark rounded-3 border border-secondary">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="small fw-semibold text-light">
                            <i className="bi bi-image me-1" />
                            Zmień Cover Image:
                          </span>
                          {artistCoverMode !== "default" && (
                            <Button
                              variant="link"
                              size="sm"
                              className="text-warning p-0 text-decoration-none small"
                              onClick={handleResetArtistCover}
                            >
                              Przywróć oryginalną
                            </Button>
                          )}
                        </div>

                        <ButtonGroup size="sm" className="w-100 mb-2">
                          <Button
                            variant={
                              artistCoverMode === "default"
                                ? "warning"
                                : "outline-secondary"
                            }
                            onClick={() => {
                              setArtistCoverMode("default");
                              setArtistPreviewUrl(
                                artistProposal.data.coverSrc ||
                                artistProposal.data.avatarSrc ||
                                "",
                              );
                            }}
                          >
                            Pobrany
                          </Button>
                          <Button
                            variant={
                              artistCoverMode === "url"
                                ? "warning"
                                : "outline-secondary"
                            }
                            onClick={() => setArtistCoverMode("url")}
                          >
                            Podaj link
                          </Button>
                          <Button
                            variant={
                              artistCoverMode === "file"
                                ? "warning"
                                : "outline-secondary"
                            }
                            onClick={() => setArtistCoverMode("file")}
                          >
                            Wgraj plik
                          </Button>
                        </ButtonGroup>

                        {artistCoverMode === "url" && (
                          <Form.Group className="mt-2">
                            <Form.Control
                              type="url"
                              size="sm"
                              placeholder="https://... (link do grafiki)"
                              value={artistCustomUrl}
                              onChange={(e) =>
                                handleArtistUrlImageChange(e.target.value)
                              }
                              className="bg-body-tertiary text-light border-secondary"
                            />
                            <div className="small text-secondary mt-1">
                              Podaj link do pliku &mdash; scrapper pobierze i
                              zapisze go w bazie.
                            </div>
                          </Form.Group>
                        )}

                        {artistCoverMode === "file" && (
                          <Form.Group className="mt-2">
                            <Form.Control
                              type="file"
                              size="sm"
                              accept="image/*"
                              onChange={handleArtistFileChange}
                              className="bg-body-tertiary text-light border-secondary"
                            />
                            {artistCustomFileName && (
                              <div className="small text-info mt-1">
                                Plik: {artistCustomFileName}
                              </div>
                            )}
                          </Form.Group>
                        )}
                      </div>
                    </Col>

                    <Col md={7}>
                      {/* Nazwa wykonawcy - edytowalna */}
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-light mb-1 d-flex align-items-center justify-content-between">
                          <span>
                            <i className="bi bi-person-fill text-primary me-1" />{" "}
                            Nazwa wykonawcy:
                          </span>
                          {artistEditName !== artistProposal.data.name && (
                            <span className="text-warning small fw-normal">
                              (oryginalnie: {artistProposal.data.name})
                            </span>
                          )}
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={artistEditName}
                          onChange={(e) => setArtistEditName(e.target.value)}
                          placeholder="Wpisz nazwę wykonawcy"
                          className="bg-body-tertiary text-light border-secondary fw-semibold"
                        />
                        <div className="text-secondary small mt-1">
                          Slug: <code>{artistProposal.data.slug}</code>
                        </div>
                      </Form.Group>

                      {/* Strona WWW i Instagram */}
                      <Row className="g-2 mb-3">
                        <Col sm={6}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-light mb-1">
                              <i className="bi bi-globe text-info me-1" /> Strona
                              WWW / Bandcamp:
                            </Form.Label>
                            <Form.Control
                              type="url"
                              size="sm"
                              value={artistEditWebsiteUrl}
                              onChange={(e) =>
                                setArtistEditWebsiteUrl(e.target.value)
                              }
                              placeholder="https://..."
                              className="bg-body-tertiary text-light border-secondary"
                            />
                          </Form.Group>
                        </Col>
                        <Col sm={6}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-light mb-1">
                              <i className="bi bi-instagram text-danger me-1" />{" "}
                              Instagram:
                            </Form.Label>
                            <Form.Control
                              type="url"
                              size="sm"
                              value={artistEditInstagramUrl}
                              onChange={(e) =>
                                setArtistEditInstagramUrl(e.target.value)
                              }
                              placeholder="https://instagram.com/..."
                              className="bg-body-tertiary text-light border-secondary"
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      {/* Link Facebook źródłowy */}
                      {artistProposal.data.facebookUrl && (
                        <div className="small mb-3 text-secondary text-break">
                          <i className="bi bi-facebook text-primary me-1" />{" "}
                          Profil źródłowy FB:{" "}
                          <a
                            href={artistProposal.data.facebookUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-info"
                          >
                            {artistProposal.data.facebookUrl}
                          </a>
                        </div>
                      )}

                      {artistProposal.data.category && (
                        <div className="mb-2">
                          <span className="text-secondary small me-2">
                            Kategoria:
                          </span>
                          <span className="text-light">
                            {artistProposal.data.category}
                          </span>
                        </div>
                      )}

                      {artistProposal.data.genreNames &&
                        artistProposal.data.genreNames.length > 0 && (
                          <div className="mb-3">
                            <span className="text-secondary small me-2">
                              Dopasowane gatunki:
                            </span>
                            <div className="d-inline-flex flex-wrap gap-1">
                              {artistProposal.data.genreNames.map(
                                (gn: string) => (
                                  <Badge
                                    key={gn}
                                    bg="dark"
                                    className="border border-secondary"
                                  >
                                    {gn}
                                  </Badge>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {artistProposal.data.bio && (
                        <div className="mb-3">
                          <div className="text-secondary small mb-1">
                            Opis / Bio:
                          </div>
                          <div
                            className="p-3 rounded-2 bg-dark text-light small border border-secondary"
                            style={{ maxHeight: "120px", overflowY: "auto" }}
                          >
                            {artistProposal.data.bio}
                          </div>
                        </div>
                      )}

                      <div className="d-flex gap-2 mt-4">
                        <Button
                          variant={
                            artistProposal.isUpdate ? "warning" : "success"
                          }
                          onClick={handleConfirmArtist}
                          disabled={artistSaving}
                          className="d-flex align-items-center gap-2 fw-semibold px-4"
                        >
                          {artistSaving ? (
                            <>
                              <Spinner animation="border" size="sm" />
                              <span>Zapisywanie w bazie...</span>
                            </>
                          ) : (
                            <>
                              <i className="bi bi-check2-circle" />
                              <span>
                                {artistProposal.isUpdate
                                  ? "Potwierdź aktualizację wykonawcy"
                                  : "Potwierdź dodanie wykonawcy"}
                              </span>
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline-secondary"
                          onClick={() => {
                            setArtistProposal(null);
                            setArtistEditName("");
                            setArtistEditWebsiteUrl("");
                            setArtistEditInstagramUrl("");
                            handleResetArtistCover();
                          }}
                          disabled={artistSaving}
                        >
                          Anuluj
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}
          </Card.Body>
        </Card>
      )}

      {/* TAB 3: MIEJSCA */}
      {activeTab === "places" && (
        <Card className="bg-dark border-secondary shadow-sm">
          <Card.Body className="p-4">
            <div className="d-flex align-items-start gap-3 mb-4">
              <div className="p-3 rounded-circle bg-success bg-opacity-10 text-success fs-3">
                <i className="bi bi-geo-alt-fill" />
              </div>
              <div>
                <h4 className="fw-bold text-light mb-1">
                  Scrapowanie miejsc z Facebooka
                </h4>
                <p className="text-secondary mb-0">
                  Wklej link do strony klubu lub sali koncertowej na Facebooku.
                  Scrapper odczyta dane miejsca i przedstawi{" "}
                  <strong>propozycję dodania lub aktualizacji</strong> miejsca z
                  opcją modyfikacji adresu, miasta oraz grafiki okładki (cover
                  image).
                </p>
              </div>
            </div>

            <Form onSubmit={handlePreviewPlace}>
              <Form.Group className="mb-3">
                <Form.Label className="text-light fw-semibold">
                  Link do strony miejsca na Facebooku
                </Form.Label>
                <div className="d-flex flex-column flex-md-row gap-2">
                  <Form.Control
                    type="url"
                    placeholder="https://www.facebook.com/..."
                    value={placeUrl}
                    onChange={(e) => setPlaceUrl(e.target.value)}
                    disabled={placeLoading}
                    className="bg-body-tertiary text-light border-secondary"
                    required
                  />
                  <Button
                    type="submit"
                    variant="success"
                    disabled={placeLoading || !placeUrl.trim()}
                    className="d-flex align-items-center justify-content-center gap-2 px-4 text-nowrap fw-semibold"
                  >
                    {placeLoading ? (
                      <>
                        <Spinner animation="border" size="sm" />
                        <span>Pobieranie...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-search" />
                        <span>Pobierz propozycję</span>
                      </>
                    )}
                  </Button>
                </div>
              </Form.Group>

              {/* Quick links */}
              <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
                <span className="small text-secondary">
                  Przykładowe miejsca:
                </span>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="py-0 px-2 small"
                  onClick={() => setPlaceUrl("https://www.facebook.com/2KOLA")}
                >
                  2 Koła (Warszawa)
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="py-0 px-2 small"
                  onClick={() =>
                    setPlaceUrl("https://www.facebook.com/klubprogresja")
                  }
                >
                  Progresja (Warszawa)
                </Button>
              </div>
            </Form>

            {/* Place Proposal Card */}
            {placeProposal && (
              <Card className="border-secondary bg-body-tertiary mt-4">
                <Card.Header className="bg-dark border-secondary d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    {placeProposal.isUpdate ? (
                      <Badge bg="warning" text="dark" className="px-2 py-1">
                        <i className="bi bi-arrow-repeat me-1" />
                        PROPOZYCJA AKTUALIZACJI ISTNIEJĄCEGO MIEJSCA
                      </Badge>
                    ) : (
                      <Badge bg="success" className="px-2 py-1">
                        <i className="bi bi-plus-circle me-1" />
                        PROPOZYCJA DODANIA NOWEGO MIEJSCA
                      </Badge>
                    )}
                  </div>
                  <small className="text-secondary">Wymaga potwierdzenia</small>
                </Card.Header>

                <Card.Body className="p-4">
                  <Row className="g-4">
                    {/* Cover Preview & Cover Controls */}
                    <Col md={5}>
                      <div className="text-center mb-3">
                        {placePreviewUrl ? (
                          // biome-ignore lint/performance/noImgElement: dynamic preview
                          <img
                            src={placePreviewUrl}
                            alt={placeProposal.data.name}
                            className="rounded-3 img-fluid border border-secondary shadow-sm object-fit-cover"
                            style={{ maxHeight: "240px", width: "100%" }}
                          />
                        ) : (
                          <div
                            className="bg-dark rounded-3 d-flex flex-column align-items-center justify-content-center text-secondary border border-secondary"
                            style={{ height: "200px" }}
                          >
                            <i className="bi bi-image fs-1 mb-2 opacity-50" />
                            <span>Brak zdjęcia w tle</span>
                          </div>
                        )}
                      </div>

                      {/* Place Cover Image Selector */}
                      <div className="p-3 bg-dark rounded-3 border border-secondary">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="small fw-semibold text-light">
                            <i className="bi bi-image me-1" />
                            Zmień Cover Image:
                          </span>
                          {placeCoverMode !== "default" && (
                            <Button
                              variant="link"
                              size="sm"
                              className="text-warning p-0 text-decoration-none small"
                              onClick={handleResetPlaceCover}
                            >
                              Przywróć oryginalną
                            </Button>
                          )}
                        </div>

                        <ButtonGroup size="sm" className="w-100 mb-2">
                          <Button
                            variant={
                              placeCoverMode === "default"
                                ? "success"
                                : "outline-secondary"
                            }
                            onClick={() => {
                              setPlaceCoverMode("default");
                              setPlacePreviewUrl(
                                placeProposal.data.coverSrc || "",
                              );
                            }}
                          >
                            Pobrany
                          </Button>
                          <Button
                            variant={
                              placeCoverMode === "url"
                                ? "success"
                                : "outline-secondary"
                            }
                            onClick={() => setPlaceCoverMode("url")}
                          >
                            Podaj link
                          </Button>
                          <Button
                            variant={
                              placeCoverMode === "file"
                                ? "success"
                                : "outline-secondary"
                            }
                            onClick={() => setPlaceCoverMode("file")}
                          >
                            Wgraj plik
                          </Button>
                        </ButtonGroup>

                        {placeCoverMode === "url" && (
                          <Form.Group className="mt-2">
                            <Form.Control
                              type="url"
                              size="sm"
                              placeholder="https://... (link do grafiki)"
                              value={placeCustomUrl}
                              onChange={(e) =>
                                handlePlaceUrlImageChange(e.target.value)
                              }
                              className="bg-body-tertiary text-light border-secondary"
                            />
                            <div className="small text-secondary mt-1">
                              Podaj link do pliku &mdash; scrapper pobierze i
                              zapisze go w bazie.
                            </div>
                          </Form.Group>
                        )}

                        {placeCoverMode === "file" && (
                          <Form.Group className="mt-2">
                            <Form.Control
                              type="file"
                              size="sm"
                              accept="image/*"
                              onChange={handlePlaceFileChange}
                              className="bg-body-tertiary text-light border-secondary"
                            />
                            {placeCustomFileName && (
                              <div className="small text-info mt-1">
                                Plik: {placeCustomFileName}
                              </div>
                            )}
                          </Form.Group>
                        )}
                      </div>
                    </Col>

                    <Col md={7}>
                      <h3 className="h4 text-light fw-bold mb-1">
                        {placeProposal.data.name}
                      </h3>
                      <div className="text-secondary small mb-3">
                        Slug: <code>{placeProposal.data.slug}</code>
                      </div>

                      {placeProposal.data.category && (
                        <div className="mb-3">
                          <span className="text-secondary small me-2">
                            Kategoria:
                          </span>
                          <span className="text-light">
                            {placeProposal.data.category}
                          </span>
                        </div>
                      )}

                      {/* Editable Address */}
                      <Form.Group className="mb-3">
                        <Form.Label className="small text-secondary fw-semibold mb-1">
                          Adres miejsca
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={placeAddress}
                          onChange={(e) => setPlaceAddress(e.target.value)}
                          className="bg-dark text-light border-secondary"
                          placeholder="np. ul. Tunelowa 2B, 01-221 Warszawa"
                        />
                      </Form.Group>

                      {/* City Selector */}
                      <Form.Group className="mb-3">
                        <Form.Label className="small text-secondary fw-semibold mb-1">
                          Miasto
                        </Form.Label>
                        <Form.Select
                          value={placeCityId}
                          onChange={(e) => setPlaceCityId(e.target.value)}
                          className="bg-dark text-light border-secondary"
                        >
                          <option value="">Wybierz miasto...</option>
                          {cities.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>

                      <div className="small mb-4 text-break">
                        <i className="bi bi-facebook text-primary me-2" />
                        <a
                          href={placeProposal.data.facebookUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-info"
                        >
                          {placeProposal.data.facebookUrl}
                        </a>
                      </div>

                      <div className="d-flex gap-2">
                        <Button
                          variant={
                            placeProposal.isUpdate ? "warning" : "success"
                          }
                          onClick={handleConfirmPlace}
                          disabled={placeSaving}
                          className="d-flex align-items-center gap-2 fw-semibold px-4"
                        >
                          {placeSaving ? (
                            <>
                              <Spinner animation="border" size="sm" />
                              <span>Zapisywanie w bazie...</span>
                            </>
                          ) : (
                            <>
                              <i className="bi bi-check2-circle" />
                              <span>
                                {placeProposal.isUpdate
                                  ? "Potwierdź aktualizację miejsca"
                                  : "Potwierdź dodanie do listy miejsc"}
                              </span>
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline-secondary"
                          onClick={() => {
                            setPlaceProposal(null);
                            handleResetPlaceCover();
                          }}
                          disabled={placeSaving}
                        >
                          Anuluj
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Toast Container for notifications */}
      <ToastContainer
        position="top-end"
        className="p-3 position-fixed"
        style={{ zIndex: 1080 }}
      >
        {/* Concert success */}
        {concertSuccess && (
          <Toast
            bg="success"
            onClose={() => setConcertSuccess(null)}
            show={!!concertSuccess}
            delay={10000}
            autohide
          >
            <Toast.Header closeButton>
              <i className="bi bi-check-circle-fill text-success me-2" />
              <strong className="me-auto">Wydarzenie dodane do moderacji!</strong>
            </Toast.Header>
            <Toast.Body className="text-white">
              <div>
                Wydarzenie <strong>&quot;{concertSuccess.title}&quot;</strong> zostało
                pomyślnie dodane do draftów i czeka na Ciebie na pierwszym miejscu w Moderacji!
              </div>
              <div className="mt-2 pt-2 border-top border-white-50">
                <Button
                  as={Link as any}
                  href="/moderation"
                  size="sm"
                  variant="light"
                  className="text-dark fw-bold"
                >
                  <i className="bi bi-shield-check me-1" /> Przejdź do Moderacji
                </Button>
              </div>
            </Toast.Body>
          </Toast>
        )}

        {/* Concert error */}
        {concertError && (
          <Toast
            bg="danger"
            onClose={() => setConcertError(null)}
            show={!!concertError}
            delay={8000}
            autohide
          >
            <Toast.Header closeButton>
              <i className="bi bi-exclamation-triangle-fill text-danger me-2" />
              <strong className="me-auto">Błąd koncertu</strong>
            </Toast.Header>
            <Toast.Body className="text-white">{concertError}</Toast.Body>
          </Toast>
        )}

        {/* Artist success */}
        {artistSuccess && (
          <Toast
            bg="success"
            onClose={() => setArtistSuccess(null)}
            show={!!artistSuccess}
            delay={8000}
            autohide
          >
            <Toast.Header closeButton>
              <i className="bi bi-check-circle-fill text-success me-2" />
              <strong className="me-auto">
                {artistSuccess.isNew
                  ? "Wykonawca dodany!"
                  : "Wykonawca zaktualizowany!"}
              </strong>
            </Toast.Header>
            <Toast.Body className="text-white">
              <div>
                Wykonawca <strong>&quot;{artistSuccess.name}&quot;</strong> został
                pomyślnie {artistSuccess.isNew ? "dodany" : "zaktualizowany"}.
              </div>
              <div className="mt-2 pt-2 border-top border-white-50">
                <Button
                  as={Link as any}
                  href={`/artists/${artistSuccess.slug}`}
                  size="sm"
                  variant="light"
                  className="text-dark fw-bold"
                >
                  Zobacz profil wykonawcy
                </Button>
              </div>
            </Toast.Body>
          </Toast>
        )}

        {/* Artist error */}
        {artistError && (
          <Toast
            bg="danger"
            onClose={() => setArtistError(null)}
            show={!!artistError}
            delay={8000}
            autohide
          >
            <Toast.Header closeButton>
              <i className="bi bi-exclamation-triangle-fill text-danger me-2" />
              <strong className="me-auto">Błąd wykonawcy</strong>
            </Toast.Header>
            <Toast.Body className="text-white">{artistError}</Toast.Body>
          </Toast>
        )}

        {/* Place success */}
        {placeSuccess && (
          <Toast
            bg="success"
            onClose={() => setPlaceSuccess(null)}
            show={!!placeSuccess}
            delay={8000}
            autohide
          >
            <Toast.Header closeButton>
              <i className="bi bi-check-circle-fill text-success me-2" />
              <strong className="me-auto">
                {placeSuccess.isNew
                  ? "Miejsce dodane!"
                  : "Miejsce zaktualizowane!"}
              </strong>
            </Toast.Header>
            <Toast.Body className="text-white">
              <div>
                Miejsce <strong>&quot;{placeSuccess.name}&quot;</strong> zostało
                pomyślnie {placeSuccess.isNew ? "dodane" : "zaktualizowane"}.
              </div>
              <div className="mt-2 pt-2 border-top border-white-50">
                <Button
                  as={Link as any}
                  href={`/places/${placeSuccess.slug}`}
                  size="sm"
                  variant="light"
                  className="text-dark fw-bold"
                >
                  Zobacz profil miejsca
                </Button>
              </div>
            </Toast.Body>
          </Toast>
        )}

        {/* Place error */}
        {placeError && (
          <Toast
            bg="danger"
            onClose={() => setPlaceError(null)}
            show={!!placeError}
            delay={8000}
            autohide
          >
            <Toast.Header closeButton>
              <i className="bi bi-exclamation-triangle-fill text-danger me-2" />
              <strong className="me-auto">Błąd miejsca</strong>
            </Toast.Header>
            <Toast.Body className="text-white">{placeError}</Toast.Body>
          </Toast>
        )}
      </ToastContainer>
    </Container>
  );
}
