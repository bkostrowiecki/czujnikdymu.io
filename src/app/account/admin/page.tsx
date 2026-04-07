"use client";

import { useActionState, useEffect } from "react";
import { Alert, Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { signInAction } from "./sign-in.serveraction";
import { redirect } from "next/navigation";

export const SignInPage = () => {
  const [state, action, isPending] = useActionState(signInAction, {});

  useEffect(() => {
    if (state.success) {
      redirect('/');
    }
  }, [state.success])

  return (
    <>
      <Container className="pt-5">
        <Row className="justify-content-center">
          <Col lg={4}>
            <Card className="shadow-lg p-3 pt-2" body>
              <Form action={action}>
                <h2>Zaloguj się</h2>
                <Form.Group className="pb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="text" name="email" />
                </Form.Group>
                <Form.Group className="pb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control type="password" name="password" />
                </Form.Group>
                <Form.Group>
                  {state.error && <Alert variant='danger'>
                    {state.error.toString()}
                  </Alert>}
                </Form.Group>
                <Form.Group>
                  <Button variant="primary" type="submit" className="w-100" disabled={isPending}>
                    {isPending ? "Logowanie..." : "Zaloguj się"}
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
