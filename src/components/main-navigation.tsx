"use client";

import { appName } from "@/const/app-name";
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

export function MainNavigation() {
  return (
    <Navbar className="shadow-lg bg-light" variant="light" fixed="top">
      <Container>
        <NavbarBrand as={Link} href="/">
          {appName}
        </NavbarBrand>
        <Nav navbar className="gap-4">
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
          {/* <NavItem>
            <NavLink as={Link} href="/konto">Twoje Konto</NavLink>
          </NavItem> */}
        </Nav>
        <NavItem className="gap-2 d-flex">
          <Button color="primary" as={Link as any} href="/zaloguj-sie">Zaloguj się</Button>
        </NavItem>
      </Container>
    </Navbar>
  );
}
