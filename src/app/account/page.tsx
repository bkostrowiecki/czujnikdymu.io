"use client";

import { Button, Col, Container, Row } from "react-bootstrap";
import { signOutAction } from "./sign-out.serveraction";
import { useActionState, useEffect } from "react";
import { redirect } from "next/navigation";

export default function AccountPage() {
  const [state, action, isPending] = useActionState(signOutAction, {
    success: false
  });

  useEffect(() => {
    if (state.success) {
      redirect("/");
    }
  }, [state.success]);

  return (
    <Container className="pt-5">
      <Row>
        <Col>
          <Button color="primary" onClick={action}>
            Wyloguj się
          </Button>
        </Col>
      </Row>
    </Container>
  );
}
