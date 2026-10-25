import Link from "next/link";
import { Badge, CardBody, Col, Row } from "react-bootstrap";
import type { GenreEntity } from "@/entities/genre.entity";

function formatGenreName(name: string): string {
  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function getGigCountLabel(count: number): string {
  if (count === 1) return "1 koncert";
  if (count >= 2 && count <= 4) return `${count} koncerty`;
  return `${count} koncertów`;
}

type Props = {
  genres: GenreEntity[];
  gigCountByGenre?: Record<string, number>;
};

export function HomeGenres({ genres, gigCountByGenre = {} }: Props) {
  if (!genres || genres.length === 0) return null;

  return (
    <section className="mt-5 pt-2" id="gatunki-muzyczne">
      {/* Header sekcji */}
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-3">
        <div>
          <h2 className="h4 mb-1 fw-bold">Gatunki muzyczne</h2>
          <p className="text-body-secondary small mb-0">
            Wybierz gatunek, aby przejść do dedykowanych koncertów.
          </p>
        </div>
      </div>

      {/* Siatka gatunków */}
      <Row className="g-3">
        {genres.map((genre) => {
          const count = gigCountByGenre[genre.id] ?? 0;
          const href = `/gatunek/${genre.slug || genre.id}`;

          return (
            <Col key={genre.id} xs={12} sm={6} lg={4}>
              <Link
                href={href}
                className="card genre-card rounded-3 shadow-sm text-decoration-none"
              >
                <CardBody className="d-flex align-items-center justify-content-between p-3">
                  <div className="d-flex align-items-center gap-2">
                    <h3 className="h5 mb-0 fw-bold text-light">
                      {formatGenreName(genre.name)}
                    </h3>
                    <Badge
                      bg={count > 0 ? "primary" : "secondary"}
                      className="py-1 px-2 rounded-pill fw-semibold small"
                    >
                      {count > 0 ? getGigCountLabel(count) : "0 koncertów"}
                    </Badge>
                  </div>

                  <div className="d-flex align-items-center gap-1 text-primary small fw-semibold">
                    <i className="bi bi-arrow-right genre-card-arrow fs-6" />
                  </div>
                </CardBody>
              </Link>
            </Col>
          );
        })}
      </Row>
    </section>
  );
}
