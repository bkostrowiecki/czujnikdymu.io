import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Alert,
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
import UnexpectedErrorPage from "@/components/unexpected-error-page";
import { appName } from "@/const/app-name";
import type { GigEntity } from "@/entities/gig.entity";
import type { PlaceEntity } from "@/entities/place.entity";
import { createPbInstance } from "@/services/pocketbase";
import { PlaceFavoriteButton } from "./place-favorite-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const pb = createPbInstance();
    let place: PlaceEntity;
    try {
      place = await pb
        .collection("places")
        .getFirstListItem<PlaceEntity>(`slug = "${id}"`);
    } catch {
      place = await pb.collection("places").getOne<PlaceEntity>(id);
    }
    return {
      title: `${place.name} - ${appName}`,
      description: place.address
        ? `Koncerty i wydarzenia w miejscu ${place.name}, ${place.address}`
        : `Koncerty i wydarzenia w miejscu ${place.name}`,
    };
  } catch {
    return {
      title: `Miejsce - ${appName}`,
    };
  }
}

export default async function PlacePage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const pb = createPbInstance();
  const { id } = await params;

  let place: PlaceEntity;
  try {
    try {
      place = await pb
        .collection("places")
        .getFirstListItem<PlaceEntity>(`slug = "${id}"`);
    } catch {
      place = await pb.collection("places").getOne<PlaceEntity>(id);
    }
  } catch (err: any) {
    if (err?.status === 404) {
      notFound();
    }
    return <UnexpectedErrorPage />;
  }

  let gigs: GigEntity[] = [];
  try {
    gigs = await pb.collection("gigs").getFullList<GigEntity>({
      filter: `place = "${place.id}"`,
      sort: "startsAt",
      expand: "place,artists,artists.genres",
    });
  } catch (err) {
    console.error("Failed to load gigs for place:", err);
  }

  const imageUrl = place.coverImage
    ? getPbFileUrl(place, place.coverImage, pb)
    : place.coverImageUrl || null;

  return (
    <Container className="pt-4 pb-5">
      <Row className="mb-3">
        <Col>
          <Breadcrumb>
            <BreadcrumbItem href="/">Główna</BreadcrumbItem>
            <BreadcrumbItem href="/miejsca">Miejsca</BreadcrumbItem>
            <BreadcrumbItem active>{place.name}</BreadcrumbItem>
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
                  alt={place.name}
                  style={{
                    width: "100%",
                    maxHeight: "360px",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}
            <CardBody className="p-4">
              <div className="d-flex align-items-center gap-2 mb-2">
                <h1 className="h2 mb-0 text-light fw-bold">{place.name}</h1>
                <PlaceFavoriteButton placeId={place.id} />
              </div>
              {place.address && (
                <p className="mb-3">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary text-decoration-none d-inline-flex align-items-center gap-1 link-light"
                    title="Otwórz adres w Google Maps"
                  >
                    <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                    <span>{place.address}</span>
                    <i
                      className="bi bi-box-arrow-up-right ms-1 small opacity-75"
                      style={{ fontSize: "0.75rem" }}
                    ></i>
                  </a>
                </p>
              )}
              <div className="d-flex flex-wrap gap-2">
                {place.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-2"
                  >
                    <i className="bi bi-geo-alt-fill"></i> Google Maps
                  </a>
                )}
                {place.facebookUrl && (
                  <a
                    href={place.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
                  >
                    <i className="bi bi-facebook"></i> Facebook
                  </a>
                )}
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col>
          <h2 className="h4 text-light fw-semibold">
            <i className="bi bi-calendar-event me-2 text-primary"></i>
            Nadchodzące koncerty w tym miejscu
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
              Brak nadchodzących koncertów dla tego miejsca.
            </Alert>
          </Col>
        </Row>
      )}
    </Container>
  );
}
