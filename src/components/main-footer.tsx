import Link from "next/link";
import { Button, Col, Container, Row, Stack } from "react-bootstrap";
import { appName } from "@/const/app-name";
import { SocialMediaLinks } from "./social-media-links";

type Props = {
  userRecord: any;
};

export function MainFooter(props: Props) {
  return (
    <footer className="d-none d-md-block">
      <div className="bg-body-tertiary border-top py-4 pb-5">
        <Container>
          <Row>
            <Col>
              <Stack>
                <Link href="/koncerty">Koncerty</Link>
                <Link href="/miejsca">Miejsca</Link>
                <Link href="/wykonawcy">Wykonawcy</Link>
                <Link href="/polubione">Polubione</Link>
                {!props.userRecord && (
                  <Link href="/zaloguj-sie">Zarejestruj się</Link>
                )}
                {!props.userRecord && (
                  <Link href="/zaloguj-sie">Zaloguj się</Link>
                )}
                {props.userRecord?.role === "moderator" && (
                  <>
                    <Link href="/moderacja" className="text-warning fw-semibold">
                      Moderacja
                    </Link>
                    <Link href="/scrapper" className="text-warning fw-semibold">
                      Scrapper
                    </Link>
                  </>
                )}
                {props.userRecord && <Link href="/konto">Twoje konto</Link>}
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
      <div className="bg-dark text-body-secondary text-center py-2 border-top">
        <small>&copy; {appName}</small>
      </div>
    </footer>
  );
}
