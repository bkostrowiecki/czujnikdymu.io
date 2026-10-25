import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  Card,
  CardBody,
  Col,
  Container,
  Row,
} from "react-bootstrap";
import { getPbFileUrl } from "@/app/shared/pocketbase-files";
import { initializeSsrPb } from "@/app/shared/pocketbase-ssr";
import { AddToCalendarButton } from "@/components/add-to-calendar-button";
import UnexpectedErrorPage from "@/components/unexpected-error-page";
import { appName } from "@/const/app-name";
import type { GigEntity } from "@/entities/gig.entity";
import { formatEventDescriptionHtml } from "@/shared/format-event-description";
import { GigFavoriteButton } from "./gig-favorite-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const pb = await initializeSsrPb();
    const gig = await pb.collection("gigs").getOne<GigEntity>(id, {
      expand: "place,artists",
    });
    const placeName = gig.expand?.place?.name;
    return {
      title: `${gig.title} - ${appName}`,
      description: [
        gig.title,
        placeName ? `Miejsce: ${placeName}` : null,
        gig.startsAt
          ? new Date(gig.startsAt).toLocaleDateString("pl-PL")
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
    };
  } catch {
    return {
      title: `Koncert - ${appName}`,
    };
  }
}

export default async function GigDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pb = await initializeSsrPb();

  let gig: GigEntity;
  try {
    gig = await pb.collection("gigs").getOne<GigEntity>(id, {
      expand: "place,artists,artists.genres,genres",
    });
  } catch (err: any) {
    if (err?.status === 404) {
      notFound();
    }
    return <UnexpectedErrorPage />;
  }

  const place = gig.expand?.place;
  const artists = gig.expand?.artists ?? [];
  const artistGenres = artists.flatMap((artist) => artist.expand?.genres ?? []);
  const directGenres = gig.expand?.genres ?? [];
  const allGigGenres = [...artistGenres, ...directGenres];
  const uniqueGenres = Array.from(
    new Map(allGigGenres.map((genre) => [genre.id, genre])).values(),
  );

  const startsAtDate = gig.startsAt
    ? new Intl.DateTimeFormat("pl-PL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(gig.startsAt))
    : null;

  const startsAtTime = gig.startsAt
    ? new Intl.DateTimeFormat("pl-PL", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(gig.startsAt))
    : null;

  const imageUrl = gig.coverImage
    ? getPbFileUrl(
        { ...gig, collectionName: gig.collectionName || "gigs" },
        gig.coverImage,
        pb,
      )
    : gig.coverImageUrl || null;

  const sourceHostname = (() => {
    if (!gig.sourceUrl) return null;
    try {
      return new URL(gig.sourceUrl).hostname.replace(/^www\./, "");
    } catch {
      return gig.sourceUrl;
    }
  })();

  return (
    <Container className="pt-4 pb-5">
      <Row className="mb-3">
        <Col>
          <Breadcrumb>
            <BreadcrumbItem href="/">Główna</BreadcrumbItem>
            <BreadcrumbItem href="/koncerty">Koncerty</BreadcrumbItem>
            <BreadcrumbItem active>{gig.title}</BreadcrumbItem>
          </Breadcrumb>
        </Col>
      </Row>

      <Row className="mb-4 justify-content-center">
        <Col xs={12} lg={10}>
          <Card className="shadow-lg border-secondary bg-body-tertiary overflow-hidden">
            {imageUrl && (
              <div
                style={{
                  maxHeight: "480px",
                  overflow: "hidden",
                  backgroundColor: "#141619",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <img
                  src={imageUrl}
                  alt={gig.title}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "480px",
                    objectFit: "contain",
                  }}
                />
              </div>
            )}

            <CardBody className="p-4 p-md-5">
              <div className="d-flex align-items-center gap-2 mb-3">
                <h1 className="h2 mb-0 text-light fw-bold">{gig.title}</h1>
                <GigFavoriteButton gigId={gig.id} />
              </div>

              {/* Data i godzina oraz Dodaj do kalendarza */}
              {(startsAtDate || startsAtTime) && (
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                  <div className="d-flex align-items-center gap-2 text-light">
                    <i className="bi bi-calendar-event fs-5 text-primary"></i>
                    <span className="fs-5 text-capitalize">{startsAtDate}</span>
                    {startsAtTime && (
                      <span className="text-secondary ms-1">
                        godz. {startsAtTime}
                      </span>
                    )}
                  </div>
                  <AddToCalendarButton
                    gig={{
                      id: gig.id,
                      title: gig.title,
                      description: gig.description,
                      startsAt: gig.startsAt,
                      sourceUrl: gig.sourceUrl,
                      place: place
                        ? {
                            name: place.name,
                            city: place.city,
                            address: place.address,
                          }
                        : undefined,
                      artists: artists.map((a) => ({ name: a.name })),
                    }}
                  />
                </div>
              )}

              {/* Miejsce / Klub */}
              {place && (
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-geo-alt-fill fs-5 text-danger"></i>
                  <div className="d-flex flex-wrap align-items-center gap-1">
                    <Link
                      href={`/miejsca/${place.slug || place.id}`}
                      className="fs-5 fw-semibold text-info text-decoration-none me-2"
                    >
                      {place.name}
                    </Link>
                    {place.address && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-secondary small text-decoration-none d-inline-flex align-items-center gap-1 link-light"
                        title="Otwórz adres w Google Maps"
                      >
                        <i className="bi bi-geo-alt text-danger"></i>
                        <span>({place.address})</span>
                        <i
                          className="bi bi-box-arrow-up-right ms-1 opacity-75"
                          style={{ fontSize: "0.75rem" }}
                        ></i>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Wykonawcy */}
              {artists.length > 0 && (
                <div className="mb-3">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <i className="bi bi-people-fill fs-5 text-warning"></i>
                    <span className="fw-semibold text-light">Wykonawcy</span>
                  </div>
                  <div className="d-flex flex-wrap gap-2 ps-4">
                    {artists.map((artist) => (
                      <Link
                        key={artist.id}
                        href={`/wykonawcy/${artist.slug || artist.id}`}
                        className="btn btn-sm btn-outline-light d-inline-flex align-items-center gap-1"
                      >
                        <i className="bi bi-music-note-beamed"></i>
                        {artist.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Gatunki */}
              {uniqueGenres.length > 0 && (
                <div className="mb-4 ps-4">
                  <div className="d-flex flex-wrap gap-1">
                    {uniqueGenres.map((genre) => (
                      <Link
                        key={genre.id}
                        href={`/genre/${genre.slug || genre.id}`}
                        className="text-decoration-none"
                      >
                        <Badge
                          bg="transparent"
                          className="border border-info text-info fs-6 fw-normal"
                          style={{ cursor: "pointer" }}
                        >
                          {genre.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Opis */}
              {(gig.description || gig.sourceUrl) && (
                <div className="mt-4 pt-3 border-top border-secondary">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                    <h2 className="h5 text-light mb-0">O wydarzeniu</h2>
                    {gig.sourceUrl && (
                      <a
                        href={gig.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-secondary small text-decoration-none d-inline-flex align-items-center gap-1 link-light"
                        title="Zobacz oryginalne źródło wydarzenia"
                      >
                        <i className="bi bi-box-arrow-up-right text-info"></i>
                        <span>Źródło</span>
                        <span className="text-info fw-medium">
                          {sourceHostname}
                        </span>
                      </a>
                    )}
                  </div>
                  {gig.description && (
                    <div
                      className="text-body lead fs-6 gig-description-content"
                      style={{ lineHeight: 1.7 }}
                      dangerouslySetInnerHTML={{
                        __html: formatEventDescriptionHtml(gig.description),
                      }}
                    />
                  )}
                </div>
              )}

              {/* Akcje / Linki */}
              {/* <div className="mt-4 pt-3 border-top border-secondary d-flex flex-wrap gap-3">
                {place && (
                  <Link
                    href={`/miejsca/${place.slug || place.id}`}
                    className="btn btn-outline-info d-inline-flex align-items-center gap-2"
                  >
                    <i className="bi bi-building"></i>
                    Strona klubu: {place.name}
                  </Link>
                )}
                {place?.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-danger d-inline-flex align-items-center gap-2"
                  >
                    <i className="bi bi-geo-alt-fill"></i>
                    Google Maps
                  </a>
                )}
                <Link
                  href="/koncerty"
                  className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
                >
                  <i className="bi bi-arrow-left"></i>
                  Wszystkie koncerty
                </Link>
              </div> */}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
