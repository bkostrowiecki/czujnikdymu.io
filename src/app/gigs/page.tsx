import { GigTile } from "@/app/gigs/gig-tile";
import { Col, Container, Row } from "react-bootstrap";

export default function GigsPage() {
    return <Container className="pt-5">
        <Row>
            <Col>
                <GigTile />
            </Col>
            <Col>
                <GigTile />
            </Col>
            <Col>
                <GigTile />
            </Col>
        </Row>
    </Container>
}