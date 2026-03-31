"use client";

import { appName } from "@/const/app-name";
import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";

export const SignInPage = () => {
  return (
    <>
      <Container className="pt-5">
        <Row className="justify-content-center">
          <Col lg={4}>
            <Card className="shadow-lg p-3 pt-2" body>
              <h2>Po co Ci konto?</h2>
              <ul>
                <li>
                  Chcesz sobie wybrać na stałe miasta, które Cię interesują
                </li>
                <li>Chcesz sobie zapisać filtry wyszukiwania</li>
                <li>
                  Chcesz sobie sobie zapisywać koncerty, na które chcesz pójść
                </li>
                <li>Chcesz dawać artystom feedback po koncercie</li>
              </ul>

              <p>
                Jeśli te punkty nie pokrywają się z jakąkolwiek z tych potrzeb,
                proszę, nie zakładaj konta. Oszczędzi nam to moc obliczeniową i
                pracę wynikającą z utrzymania serwisu.
              </p>
            </Card>
          </Col>
          <Col lg={4}>
            <Card className="shadow-lg p-3 pt-2" body>
              <Form>
                <h2>Zarejestruj się</h2>
                <div className="d-flex flex-column gap-2 pb-2">
                  <Button>Facebook</Button>
                  <Button>Gmail</Button>
                </div>
                <hr />
                <Form.Group className="pb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="text" />
                </Form.Group>
                <Form.Group className="pb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control type="text" />
                </Form.Group>
                <Form.Group className="pb-3">
                  <div className="d-flex gap-2">
                    <div>
                      <Form.Check id="privacyAgreement" className="cursor-pointer" />
                    </div>
                    <label htmlFor="privacyAgreement" className="cursor-pointer">
                      Wyrażam zgodę na przetwarzanie moich danych osobowych
                      przez administratora danych osobowych serwisu {appName} w
                      celu obsługi mojego konta w tym serwisie
                    </label>
                  </div>
                </Form.Group>
                <Form.Group>
                  <Button variant="primary" className="w-100">
                    Zarejestruj się emailem
                  </Button>
                </Form.Group>
              </Form>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default SignInPage;
