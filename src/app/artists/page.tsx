import { ArtistTile } from "@/app/artists/artist-tile";
import { GigTile } from "@/app/gigs/gig-tile";
import { Alert, Col, Container, Row } from "react-bootstrap";

export default function GigsPage() {
  return (
    <Container className="pt-5">
      <Row>
        <Col>
          <ArtistTile />
        </Col>
        <Col>
          <ArtistTile />
        </Col>
        <Col>
          <ArtistTile />
        </Col>
        <Col>
          <ArtistTile />
        </Col>
      </Row>
    </Container>
  );
}
