import type { Metadata } from "next";
import Link from "next/link";
import { Card, Col, Container, Row } from "react-bootstrap";
import { initializeSsrPb } from "@/app/shared/pocketbase-ssr";
import { appName } from "@/const/app-name";
import { getCitiesAction } from "./actions";
import { ScrapperView } from "./scrapper-view";

export const metadata: Metadata = {
  title: `Scrapper danych | ${appName}`,
  description:
    "Wymuszenie pobierania koncertów, wykonawców i miejsc z Facebooka oraz Bandcampa dla moderatorów.",
};

export const dynamic = "force-dynamic";

export default async function ScrapperPage() {
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
                Dostęp do panelu scrappera wymaga zalogowania na konto z
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
                Ta strona jest dostępna wyłącznie dla moderatorów serwisu{" "}
                {appName}.
              </p>
              <Link href="/" className="btn btn-outline-light">
                Powrót do strony głównej
              </Link>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  // 3. Fetch cities for places dropdown
  const citiesRes = await getCitiesAction();
  const cities = citiesRes.cities || [];

  return <ScrapperView cities={cities} currentUserId={user.id} />;
}
