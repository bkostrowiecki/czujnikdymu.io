import type { Metadata } from "next";
import Link from "next/link";
import { Alert, Card, Col, Container, Row } from "react-bootstrap";
import { initializeSsrPb } from "@/app/shared/pocketbase-ssr";
import { appName } from "@/const/app-name";
import { getModerationQueueAction } from "./actions";
import { ModerationTinderView } from "./moderation-tinder-view";

export const metadata: Metadata = {
  title: `Moderacja wydarzeń | ${appName}`,
  description:
    "Panel weryfikacji i akceptacji nowych wydarzeń dla moderatorów.",
};

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  const pb = await initializeSsrPb();
  const user = pb.authStore.record;

  // 1. Check if authenticated
  if (!pb.authStore.isValid || !user) {
    return (
      <Container className="pt-5" style={{ minHeight: "75vh" }}>
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card className="shadow-lg p-4 border-secondary text-center" body>
              <div className="text-warning fs-1 mb-3">
                <i className="bi bi-shield-lock" />
              </div>
              <h2 className="h4 text-light mb-3">Wymagane logowanie</h2>
              <p className="text-secondary mb-4">
                Dostęp do panelu moderacji wymaga zalogowania na konto z
                uprawnieniami moderatora.
              </p>
              <div className="d-flex flex-column gap-2">
                <Link href="/account/admin" className="btn btn-primary">
                  Zaloguj się hasłem
                </Link>
                <Link href="/zaloguj-sie" className="btn btn-outline-secondary">
                  Logowanie społecznościowe
                </Link>
              </div>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  // 2. Check if user has role 'moderator'
  if (user.role !== "moderator") {
    return (
      <Container className="pt-5" style={{ minHeight: "75vh" }}>
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card className="shadow-lg p-4 border-danger text-center" body>
              <div className="text-danger fs-1 mb-3">
                <i className="bi bi-exclamation-octagon" />
              </div>
              <h2 className="h4 text-light mb-3">Brak uprawnień</h2>
              <p className="text-secondary mb-4">
                Dostęp do tej strony mają wyłącznie użytkownicy z rolą{" "}
                <strong>moderator</strong>. Twoje konto (
                <code>{user.email}</code>) nie posiada uprawnień moderatorskich.
              </p>
              <Link href="/" className="btn btn-outline-light">
                Wróć do strony głównej
              </Link>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  // 3. User is moderator - fetch queue
  const queueData = await getModerationQueueAction();

  if (!queueData.success) {
    return (
      <Container className="pt-5">
        <Alert variant="danger">
          <Alert.Heading>Błąd wczytywania moderacji</Alert.Heading>
          <p>{queueData.message || "Wystąpił nieoczekiwany błąd serwera."}</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="pt-3">
      <ModerationTinderView
        initialItems={queueData.items || []}
        initialTotalCount={queueData.totalCount || 0}
        assignedCities={queueData.assignedCities || []}
        allGenres={queueData.allGenres || []}
        noCities={queueData.noCities}
      />
    </Container>
  );
}
