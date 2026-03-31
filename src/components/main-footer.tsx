import Link from "next/link";
import { Button, Col, Container, Row, Stack } from "react-bootstrap";

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
                <Link href="/zaloz-konto">Załóż Konto</Link>
              </Stack>
            </Col>
            <Col>
              <Stack>
                <Link href="/o-czujniku-dymu">O czujniku dymu</Link>
                <Link href="/support">Wsparcie</Link>
                <Link href="/cooperation">Współpraca</Link>
                <Link href="/kontakt">Kontakt</Link>
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
              <Button variant="link" href="https://fb.com" target="_blank">
                <i className="bi bi-facebook fs-3"></i>
              </Button>
              <Button variant="link" href="https://discord.com" target="_blank">
                <i className="bi bi-discord fs-3"></i>
              </Button>
              <Button variant="link" href="https://instagram.com" target="_blank">
                <i className="bi bi-instagram fs-3"></i>
              </Button>
              <Button variant="link" href="https://tiktok.com" target="_blank">
                <i className="bi bi-tiktok fs-3"></i>
              </Button>
            </Col>
          </Row>
        </Container>
      </div>
      <div className="bg-dark text-light text-center">
        <small>&copy; Czujnikdymu.io</small>
      </div>
    </div>
  );
}
