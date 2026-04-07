import { initializeSsrPb } from "@/app/shared/pocketbase-ssr";
import { appName } from "@/const/app-name";
import { createPbInstance } from "@/services/pocketbase";
import Link from "next/link";
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
} from "react-bootstrap";
import { headers } from "next/headers";

const pb = createPbInstance();

export const SignInPage = async () => {
  const authMethods = await pb.collection("users").listAuthMethods();
  const providers = authMethods.oauth2.providers || [];

  const headerList = await headers();
  const currentDomain = headerList.get("x-current-domain");

  const redirectUrl = `${currentDomain}/account/oauth2`;

  const openLink = async (url: string) => {
    location.href = url;
  };

  return (
    <>
      <Container className="pt-5">
        <Row className="justify-content-center">
          <Col lg={4}>
            <Card className="shadow-lg p-3 pt-2" body>
              <Form>
                <h2>Zaloguj się</h2>
                <p>
                  <Alert variant="warning">
                    Pierwsze logowanie daną usługą oznacza akceptację{" "}
                    <Link href="/regulamin">regulaminu</Link>,{" "}
                    <Link href="/polityka-prywatnosci">
                      polityki prywatności
                    </Link>{" "}
                    i rejestrację konta
                  </Alert>
                </p>
                <div className="d-flex flex-column gap-2 pb-2">
                  {providers.map((provider) => {
                    const oAuthUrl =
                      provider.authURL + redirectUrl + "/" + provider.name;

                    return (
                      <Button
                        as="a"
                        href={`/account/oauth2?oAuthUrl=${Buffer.from(oAuthUrl, "utf8").toString("base64url")}&codeVerifier=${provider.codeVerifier}`}
                      >
                        {provider.displayName}
                      </Button>
                    );
                  })}
                </div>
                <div className="d-flex justify-content-center align-items-center flex-column">
                  <Button
                    href="/faq#czemu-nie-ma-logowania-adresem-email"
                    variant="link"
                  >
                    Czemu nie ma logowania adresem email?
                  </Button>
                </div>
              </Form>
            </Card>
          </Col>
          <Col lg={4}>
            <Card className="shadow-lg p-3 pt-2" body>
              <h2>Po co Ci konto?</h2>
              <ul>
                <li>
                  Chcesz sobie wybrać na stałe miasta, które Cię interesują
                </li>
                <li>Chcesz sobie zapisać filtry wyszukiwania</li>
                <li>
                  Chcesz sobie sobie zapisywać koncerty, na które chcesz pójść
                </li>
                <li>Chcesz dawać artystom feedback po koncercie</li>
              </ul>

              <p>
                Jeśli te punkty nie pokrywają się z jakąkolwiek z tych potrzeb,
                proszę, nie zakładaj konta.
              </p>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default SignInPage;
