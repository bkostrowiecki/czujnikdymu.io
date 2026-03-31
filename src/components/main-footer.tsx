import { appName } from "@/const/app-name";
import Link from "next/link";
import { Button, Col, Container, Row, Stack } from "react-bootstrap";
import { SocialMediaLinks } from "./social-media-links";

export function MainFooter() {
  return (
    <div>
      <div className="bg-light border-top py-4 pb-5">
        <Container>
          <Row>
            <Col>
              <Stack>
                <Link href="/koncerty">Koncerty</Link>
                <Link href="/miejsca">Miejsca</Link>
                <Link href="/wykonawcy">Wykonawcy</Link>
                <Link href="/zaloguj-sie">Zarejestruj się</Link>
                <Link href="/zaloguj-sie">Zaloguj się</Link>
              </Stack>
            </Col>
            <Col>
              <Stack>
                <Link href="/o-czujniku-dymu">O czujniku dymu</Link>
                <Link href="/support">Wsparcie</Link>
                <Link href="/wspolpraca">Współpraca</Link>
                <Link href="/kontakt">Kontakt</Link>
                <Link href="/faq">FAQ</Link>
              </Stack>
            </Col>
            <Col>
              <Stack>
                <Link href="/changelog">Nowości</Link>
                <Link href="/regulamin">Regulamin</Link>
                <Link href="/polityka-prywatnosci">Polityka prywatności</Link>
              </Stack>
            </Col>
            <Col>
              <SocialMediaLinks />
            </Col>
          </Row>
        </Container>
      </div>
      <div className="bg-dark text-light text-center">
        <small>&copy; {appName}</small>
      </div>
    </div>
  );
}
