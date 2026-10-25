import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type Client from "pocketbase";
import {
  Breadcrumb,
  BreadcrumbItem,
  Card,
  CardBody,
  Col,
  Container,
  Row,
} from "react-bootstrap";
import { GigTile } from "@/app/gigs/gig-tile";
import { initializeSsrPb } from "@/app/shared/pocketbase-ssr";
import UnexpectedErrorPage from "@/components/unexpected-error-page";
import { appName } from "@/const/app-name";
import type { GenreEntity } from "@/entities/genre.entity";
import type { GigEntity } from "@/entities/gig.entity";

function normalizeSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function findGenre(
  pb: Client,
  slug: string,
): Promise<GenreEntity | null> {
  const decodedSlug = decodeURIComponent(slug).trim();

  // 1. Try finding by exact slug
  try {
    return await pb
      .collection("genres")
      .getFirstListItem<GenreEntity>(`slug = "${decodedSlug}"`);
  } catch {
    // continue
  }

  // 2. Try finding by ID
  try {
    return await pb.collection("genres").getOne<GenreEntity>(decodedSlug);
  } catch {
    // continue
  }

  // 3. Fallback: load all genres and match by slug, name, or normalized slug
  try {
    const allGenres = await pb.collection("genres").getFullList<GenreEntity>();
    const target = normalizeSlug(decodedSlug);
    const matched = allGenres.find((g) => {
      if (g.slug && normalizeSlug(g.slug) === target) return true;
      if (g.name && normalizeSlug(g.name) === target) return true;
      if (g.name && g.name.toLowerCase() === decodedSlug.toLowerCase())
        return true;
      return false;
    });
    return matched || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const pb = await initializeSsrPb();
    const genre = await findGenre(pb, slug);
    if (!genre) {
      return {
        title: `Gatunek muzyczny - ${appName}`,
      };
    }

    const genreNameFormatted =
      genre.name.charAt(0).toUpperCase() + genre.name.slice(1);

    return {
      title: `${genreNameFormatted} - Koncerty - ${appName}`,
      description: `Wszystkie nadchodzące koncerty i wydarzenia muzyczne z gatunku ${genre.name} w Polsce.`,
    };
  } catch {
    return {
      title: `Gatunek - ${appName}`,
    };
  }
}

export default async function GenrePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pb = await initializeSsrPb();

  let genre: GenreEntity | null = null;
  try {
    genre = await findGenre(pb, slug);
  } catch (err) {
    console.error("Error fetching genre:", err);
    return <UnexpectedErrorPage />;
  }

  if (!genre) {
    notFound();
  }

  let gigs: GigEntity[] = [];

  try {
    gigs = await pb
      .collection("gigs")
      .getFullList<GigEntity>({
        filter: pb.filter("artists.genres ?~ {:genreId}", {
          genreId: genre.id,
        }),
        expand: "place,artists,artists.genres",
        sort: "startsAt",
      })
      .catch(async () => {
        // Fallback in-memory filter
        const allGigs = await pb.collection("gigs").getFullList<GigEntity>({
          expand: "place,artists,artists.genres",
          sort: "startsAt",
        });
        return allGigs.filter((gig) =>
          gig.expand?.artists?.some(
            (artist) =>
              artist.genres?.includes(genre!.id) ||
              artist.expand?.genres?.some(
                (gx) => gx.id === genre!.id || gx.slug === genre!.slug,
              ),
          ),
        );
      });
  } catch (err) {
    console.error("Error fetching genre gigs:", err);
    return <UnexpectedErrorPage />;
  }

  const genreNameFormatted =
    genre.name.charAt(0).toUpperCase() + genre.name.slice(1);

  return (
    <Container className="pt-4 pb-5" id="genre-page-container">
      {/* Breadcrumbs */}
      <Row className="mb-3">
        <Col>
          <Breadcrumb>
            <BreadcrumbItem href="/">Główna</BreadcrumbItem>
            <BreadcrumbItem href="/koncerty">Koncerty</BreadcrumbItem>
            <BreadcrumbItem active>{genreNameFormatted}</BreadcrumbItem>
          </Breadcrumb>
        </Col>
      </Row>

      {/* Hero Header Card */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-lg border-secondary bg-body-tertiary">
            <CardBody className="p-4 p-md-5">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                <div>
                  <div className="text-secondary small text-uppercase fw-semibold letter-spacing-1">
                    Gatunek muzyczny
                  </div>
                  <h1 className="h2 mb-0 text-light fw-bold" id="genre-title">
                    {genreNameFormatted}
                  </h1>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  <Link
                    href={`/koncerty?genres=${genre.id}`}
                    className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
                    id="filter-in-browser-btn"
                  >
                    <i className="bi bi-sliders" />
                    <span>Filtruj w wyszukiwarce</span>
                  </Link>
                </div>
              </div>

              <p className="text-secondary mb-3 fs-6">
                Wszystkie nadchodzące koncerty, festiwale i wydarzenia muzyczne
                w klimacie{" "}
                <span className="text-light fw-medium">{genre.name}</span>.
              </p>

              {/* Stat Chips */}
              <div className="d-flex flex-wrap gap-2">
                <span className="badge bg-dark border border-secondary text-light px-3 py-2 fs-6 fw-normal d-inline-flex align-items-center gap-2">
                  <i className="bi bi-calendar-event text-primary" />
                  <span>
                    {gigs.length}{" "}
                    {gigs.length === 1
                      ? "koncert"
                      : gigs.length >= 2 && gigs.length <= 4
                        ? "koncerty"
                        : "koncertów"}
                  </span>
                </span>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Concerts Section Header */}
      <Row className="mb-3">
        <Col className="d-flex align-items-center justify-content-between">
          <h2
            className="h4 text-light fw-semibold mb-0"
            id="genre-gigs-heading"
          >
            <i className="bi bi-calendar-event me-2 text-primary" />
            Koncerty z gatunku {genre.name}
            <span className="text-secondary ms-2 fs-6 fw-normal">
              ({gigs.length})
            </span>
          </h2>
        </Col>
      </Row>

      {/* Concerts Grid or Empty State */}
      {gigs.length > 0 ? (
        <Row className="g-4" id="genre-gigs-grid">
          {gigs.map((gig) => (
            <Col key={gig.id} xs={12} md={6} lg={4}>
              <GigTile gig={gig} />
            </Col>
          ))}
        </Row>
      ) : (
        <Row id="genre-gigs-empty">
          <Col>
            <Card className="border border-secondary bg-body-tertiary text-center p-5">
              <CardBody>
                <div
                  className="rounded-circle bg-secondary bg-opacity-25 text-secondary d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: "64px", height: "64px", fontSize: "2rem" }}
                >
                  <i className="bi bi-calendar-x" />
                </div>
                <h3 className="h5 text-light fw-semibold mb-2">
                  Brak nadchodzących koncertów dla gatunku {genre.name}
                </h3>
                <p
                  className="text-secondary mb-4 mx-auto"
                  style={{ maxWidth: "480px" }}
                >
                  Aktualnie nie mamy zarejestrowanych żadnych nadchodzących
                  koncertów z tego gatunku. Możesz przejrzeć pełną listę
                  wszystkich koncertów w serwisie.
                </p>
                <div className="d-flex flex-wrap justify-content-center gap-2">
                  <Link href="/koncerty" className="btn btn-primary">
                    <i className="bi bi-music-note-list me-1" />
                    Zobacz wszystkie koncerty
                  </Link>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}
