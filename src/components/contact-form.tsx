'use client';

import { appName } from "@/const/app-name";
import { Button, Card, Form } from "react-bootstrap";

type Props = {
  context: string;
  title: string;
  userEmail: string;
};

export const ContactForm = ({ context, title, userEmail }: Props) => {
  return (
    <Form>
      <h2>{title}</h2>
      {!userEmail && (
        <Form.Group className="pb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control type="text" />
        </Form.Group>
      )}
      <Form.Group className="pb-3">
        <Form.Label>Temat</Form.Label>
        <Form.Control type="text" />
      </Form.Group>
      <Form.Group className="pb-3">
        <Form.Label>Treść</Form.Label>
        <Form.Control type="textarea" />
      </Form.Group>
      <Form.Group className="pb-3">
        <div className="d-flex gap-2">
          <div>
            <Form.Check id="privacyAgreement" className="cursor-pointer" />
          </div>
          <label htmlFor="privacyAgreement" className="cursor-pointer">
            Wyrażam zgodę na przetwarzanie moich danych osobowych przez
            administratora danych osobowych serwisu {appName} w celu obsługi
            mojej wiadomości kontaktowej
          </label>
        </div>
      </Form.Group>
      <Form.Group>
        <Button variant="primary">Wyślij wiadomość</Button>
      </Form.Group>
    </Form>
  );
};
