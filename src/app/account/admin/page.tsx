"use client";

import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";

export const SignInPage = () => {
  return (
    <>
      <Container className="pt-5">
        <Row className="justify-content-center">
          <Col lg={4}>
            <Card className="shadow-lg p-3 pt-2" body>
              <Form>
                <h2>Zaloguj się</h2>
                <Form.Group className="pb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="text" />
                </Form.Group>
                <Form.Group className="pb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control type="password" />
                </Form.Group>
                <Form.Group>
                  <Button variant="primary" className="w-100">
                    Zaloguj się
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
