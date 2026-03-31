'use client';

import { Col, Container, Row } from "react-bootstrap";

export default function UnexpectedError() {
  return (
    <Container>
      <Row>
        <Col className="pt-5">
          <h2 className="display-1 text-danger">Błąd 500</h2>
          <h1>
            Wystąpił zupełnie niespodziewany błąd podczas działania strony
          </h1>
        </Col>
      </Row>
    </Container>
  );
}
