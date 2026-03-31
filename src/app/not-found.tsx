import './globals.scss';

import { headers } from "next/headers";
import { Col, Container, Row } from "react-bootstrap";

export default async function NotFound() {
  const headerList = await headers();
  const pathname = headerList.get("x-current-path");

  return (
    <Container>
      <Row>
        <Col className="pt-5">
          <h2 className="display-1">Błąd 404</h2>
          <h1>
            Nie znaleziono strony <code>{pathname}</code>
          </h1>
        </Col>
      </Row>
    </Container>
  );
}
