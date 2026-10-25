"use client";

import { redirect } from "next/navigation";
import { useActionState, useEffect } from "react";
import { Button } from "react-bootstrap";
import { signOutAction } from "./sign-out.serveraction";

export function SignOutButton() {
  const [state, action, isPending] = useActionState(signOutAction, {
    success: false,
  });

  useEffect(() => {
    if (state.success) {
      redirect("/");
    }
  }, [state.success]);

  return (
    <Button variant="outline-danger" onClick={action} disabled={isPending}>
      {isPending ? "Wylogowywanie..." : "Wyloguj się"}
    </Button>
  );
}
