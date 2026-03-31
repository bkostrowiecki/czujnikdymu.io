import { headers } from "next/headers";
import { Col, Container, Row } from "react-bootstrap";

export default async function UnexpectedErrorPage() {
  const headerList = await headers();
  const pathname = headerList.get("x-current-path");

  return (
    <Container>
      <Row>
        <Col className="pt-5">
          <h2 className="display-1 text-danger">Błąd 500</h2>
          <h1>
            Wystąpił zupełnie niespodziewany błąd podczas odczytywania strony <code>{pathname}</code>
          </h1>
        </Col>
      </Row>
    </Container>
  );
}
