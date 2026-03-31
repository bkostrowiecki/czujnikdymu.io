import { GigTile } from "@/app/gigs/gig-tile";
import UnexpectedErrorPage from "@/components/unexpected-error-page";
import { createPbInstance } from "@/services/pocketbase";
import { Alert, Col, Container, Row } from "react-bootstrap";
import { PlaceTile } from "./place-tile";
import { PlaceEntity } from "@/entities/place.entity";

export default async function PlacesPage() {
  const pb = createPbInstance();

  let places;
  try {
    places = await pb.collection("places").getFullList<PlaceEntity>({
      sort: "-created",
    });
  } catch (err) {
    return <UnexpectedErrorPage />
  }

  return (
    <Container className="pt-5">
      <Row>
        {places.map((place) => {
            return <Col xs={3}>
                <PlaceTile place={place} />
            </Col>
        })}
      </Row>
    </Container>
  );
}
