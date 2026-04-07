"use client";

import { usePocketBase } from "@/app/shared/pocketbase-client-provider";
import { getPbFileUrl } from "@/app/shared/pocketbase-files";
import { appName } from "@/const/app-name";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import {
  Button,
  Container,
  Nav,
  Navbar,
  NavbarBrand,
  NavItem,
  NavLink,
} from "react-bootstrap";

type User = {
  avatar: string;
  id: string;
  name: string;
  email: string;
}

export function MainNavigation(props: {
  userRecord: User
}) {
  const pb = usePocketBase();

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
        </Nav>
        <NavItem className="gap-2 d-flex">
          {!props.userRecord && <Button color="primary" as={Link as any} href="/zaloguj-sie">Zaloguj się</Button>}
          {props.userRecord && <Button color="primary" variant="outline-primary" as={Link as any} href="/konto" className="pe-3">
            <img width={28} height={28} className="me-2" src={getPbFileUrl(props.userRecord, props.userRecord.avatar, pb) || '/default-avatar.png'} alt="avatar" />
            {props.userRecord.name}
          </Button>}
          {/* <NavItem>
            <NavLink as={Link} href="/konto">Twoje Konto</NavLink>
          </NavItem> */}
        </NavItem>
      </Container>
    </Navbar>
  );
}
