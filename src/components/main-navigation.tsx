"use client";

import Link from "next/link";
import {
  Button,
  Container,
  Nav,
  Navbar,
  NavbarBrand,
  NavItem,
  NavLink,
} from "react-bootstrap";
import { usePocketBase } from "@/app/shared/pocketbase-client-provider";
import { getPbFileUrl } from "@/app/shared/pocketbase-files";
import { appName } from "@/const/app-name";

import { MobileTabBar } from "./mobile-tab-bar";

type User = {
  avatar: string;
  id: string;
  name: string;
  email: string;
  role?: string;
  cities?: string[];
};

export function MainNavigation(props: { userRecord: User }) {
  const pb = usePocketBase();

  return (
    <>
      <Navbar
        className="shadow-lg"
        bg="dark"
        variant="dark"
        fixed="top"
        data-bs-theme="dark"
      >
        <Container>
          <NavbarBrand as={Link} href="/">
            {appName}
          </NavbarBrand>
          <Nav navbar className="gap-4 d-none d-md-flex">
            <NavItem>
              <NavLink as={Link} href="/koncerty">
                Koncerty
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink as={Link} href="/miejsca">
                Miejsca
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink as={Link} href="/wykonawcy">
                Wykonawcy
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink as={Link} href="/polubione">
                Polubione
              </NavLink>
            </NavItem>
            {props.userRecord?.role === "moderator" && (
              <>
                <NavItem>
                  <NavLink
                    as={Link}
                    href="/moderacja"
                    className="d-flex align-items-center gap-1 text-warning fw-semibold"
                  >
                    <span>Moderacja</span>
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    as={Link}
                    href="/scrapper"
                    className="d-flex align-items-center gap-1 text-warning fw-semibold"
                  >
                    <span>Scrapper</span>
                  </NavLink>
                </NavItem>
              </>
            )}
          </Nav>
          <NavItem className="gap-2 d-none d-md-flex">
            {!props.userRecord && (
              <Button
                size="sm"
                color="primary"
                as={Link as any}
                href="/zaloguj-sie"
              >
                Zaloguj się
              </Button>
            )}
            {props.userRecord && (
              <Button
                color="primary"
                size="sm"
                variant="outline-primary"
                as={Link as any}
                href="/konto"
                className="pe-3"
              >
                <img
                  width={28}
                  height={28}
                  className="rounded-circle me-2"
                  style={{ objectFit: "cover" }}
                  src={
                    getPbFileUrl(
                      props.userRecord,
                      props.userRecord.avatar,
                      pb,
                    ) || "/default-avatar.png"
                  }
                  alt="avatar"
                />
                {props.userRecord.name}
              </Button>
            )}
          </NavItem>
          {props.userRecord && (
            <div className="d-flex d-md-none align-items-center">
              <Link
                href="/konto"
                className="d-flex align-items-center text-decoration-none"
              >
                <img
                  width={30}
                  height={30}
                  className="rounded-circle border border-secondary"
                  style={{ objectFit: "cover" }}
                  src={
                    getPbFileUrl(
                      props.userRecord,
                      props.userRecord.avatar,
                      pb,
                    ) || "/default-avatar.png"
                  }
                  alt="avatar"
                />
              </Link>
            </div>
          )}
        </Container>
      </Navbar>
      <MobileTabBar userRecord={props.userRecord} />
    </>
  );
}
