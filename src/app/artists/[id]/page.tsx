import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Alert,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  Card,
  CardBody,
  Col,
  Container,
  Row,
} from "react-bootstrap";
import { GigTile } from "@/app/gigs/gig-tile";
import { getPbFileUrl } from "@/app/shared/pocketbase-files";
import { initializeSsrPb } from "@/app/shared/pocketbase-ssr";
import UnexpectedErrorPage from "@/components/unexpected-error-page";
import { appName } from "@/const/app-name";
import type { ArtistEntity } from "@/entities/artist.entity";
import type { GigEntity } from "@/entities/gig.entity";
import { ArtistFavoriteButton } from "./artist-favorite-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const pb = await initializeSsrPb();
    let artist: ArtistEntity;
    try {
      artist = await pb
        .collection("artists")
        .getFirstListItem<ArtistEntity>(`slug = "${id}"`);
    } catch {
      artist = await pb.collection("artists").getOne<ArtistEntity>(id);
    }
    return {
      title: `${artist.name} - ${appName}`,
      description: `Wydarzenia i koncerty wykonawcy ${artist.name}`,
    };
  } catch {
    return {
      title: `Wykonawca - ${appName}`,
    };
  }
}

export default async function ArtistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pb = await initializeSsrPb();

  let artist: ArtistEntity;
  let gigs: GigEntity[] = [];

  try {
    try {
      artist = await pb
        .collection("artists")
        .getFirstListItem<ArtistEntity>(`slug = "${id}"`, {
          expand: "genres",
        });
    } catch {
      artist = await pb.collection("artists").getOne<ArtistEntity>(id, {
        expand: "genres",
      });
    }
  } catch (err: any) {
    if (err?.status === 404) {
      notFound();
    }
    return <UnexpectedErrorPage />;
  }

  try {
    gigs = await pb.collection("gigs").getFullList<GigEntity>({
      filter: `artists ~ "${artist.id}"`,
      sort: "startsAt",
      expand: "place,artists,artists.genres",
    });
  } catch (err) {
    console.error("Failed to load gigs for artist:", err);
  }

  const genres = artist.expand?.genres ?? [];
  const imageUrl = artist.coverImage
    ? getPbFileUrl(artist, artist.coverImage, pb)
    : null;

  return (
    <Container className="pt-4 pb-5">
      <Row className="mb-3">
        <Col>
          <Breadcrumb>
            <BreadcrumbItem href="/">Główna</BreadcrumbItem>
            <BreadcrumbItem href="/wykonawcy">Wykonawcy</BreadcrumbItem>
            <BreadcrumbItem active>{artist.name}</BreadcrumbItem>
          </Breadcrumb>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card className="shadow-lg border-secondary bg-body-tertiary overflow-hidden">
            {imageUrl && (
              <div
                style={{
                  maxHeight: "360px",
                  overflow: "hidden",
                  backgroundColor: "#1a1d20",
                }}
              >
                <img
                  src={imageUrl}
                  alt={artist.name}
                  style={{
                    width: "100%",
                    maxHeight: "360px",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}
            <CardBody className="p-4">
              <div className="d-flex align-items-center gap-3">
                {!imageUrl && (
                  <div
                    className="rounded-circle bg-dark border border-secondary d-flex align-items-center justify-content-center text-primary"
                    style={{ width: "64px", height: "64px", minWidth: "64px" }}
                  >
                    <i className="bi bi-people-fill fs-2"></i>
                  </div>
                )}
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <h1 className="h2 mb-0 text-light fw-bold">
                      {artist.name}
                    </h1>
                    <ArtistFavoriteButton artistId={artist.id} />
                  </div>
                  {genres.length > 0 && (
                    <div className="d-flex flex-wrap gap-1 mt-2">
                      {genres.map((genre) => (
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
                  )}
                </div>
              </div>
              {(artist.websiteUrl || artist.facebookUrl || artist.instagramUrl) && (
                <div className="d-flex flex-wrap gap-2 mt-3 pt-3 border-top border-secondary">
                  {artist.websiteUrl && (
                    <a
                      href={artist.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-light btn-sm d-inline-flex align-items-center gap-2"
                    >
                      <i className="bi bi-globe"></i> Strona WWW
                    </a>
                  )}
                  {artist.facebookUrl && (
                    <a
                      href={artist.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
                    >
                      <i className="bi bi-facebook"></i> Facebook
                    </a>
                  )}
                  {artist.instagramUrl && (
                    <a
                      href={artist.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-2"
                    >
                      <i className="bi bi-instagram"></i> Instagram
                    </a>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col>
          <h2 className="h4 text-light fw-semibold">
            <i className="bi bi-calendar-event me-2 text-primary"></i>
            Nadchodzące koncerty
          </h2>
        </Col>
      </Row>

      {gigs.length > 0 ? (
        <Row className="g-4">
          {gigs.map((gig) => (
            <Col key={gig.id} xs={12} md={6} lg={4}>
              <GigTile gig={gig} />
            </Col>
          ))}
        </Row>
      ) : (
        <Row>
          <Col>
            <Alert variant="secondary" className="border">
              <i className="bi bi-info-circle me-2"></i>
              Brak nadchodzących koncertów dla tego wykonawcy.
            </Alert>
          </Col>
        </Row>
      )}
    </Container>
  );
}
