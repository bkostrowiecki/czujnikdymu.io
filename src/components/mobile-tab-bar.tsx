"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Button,
  Card,
  Container,
  ListGroup,
  Offcanvas,
  Stack,
} from "react-bootstrap";
import { usePocketBase } from "@/app/shared/pocketbase-client-provider";
import { getPbFileUrl } from "@/app/shared/pocketbase-files";
import { appName } from "@/const/app-name";
import { SocialMediaLinks } from "./social-media-links";

type User = {
  avatar: string;
  id: string;
  name: string;
  email: string;
  role?: string;
  cities?: string[];
};

type Props = {
  userRecord: User | null;
};

export function MobileTabBar({ userRecord }: Props) {
  const pathname = usePathname();
  const pb = usePocketBase();
  const [showMore, setShowMore] = useState(false);

  const handleClose = () => setShowMore(false);
  const handleOpen = () => setShowMore(true);

  const isPolubione =
    pathname === "/polubione" ||
    pathname.startsWith("/polubione/") ||
    pathname === "/feed" ||
    pathname.startsWith("/feed/");
  const isKoncerty =
    pathname === "/koncerty" || pathname.startsWith("/koncerty/");
  const isMiejsca = pathname === "/miejsca" || pathname.startsWith("/miejsca/");
  const isWykonawcy =
    pathname === "/wykonawcy" || pathname.startsWith("/wykonawcy/");

  return (
    <>
      {/* Bottom Tab Bar for Mobile (< 768px) */}
      <nav
        className="mobile-tab-bar fixed-bottom d-flex d-md-none justify-content-around align-items-center"
        aria-label="Nawigacja mobilna"
      >
        <Link
          href="/koncerty"
          className={`mobile-tab-item ${isKoncerty ? "active" : ""}`}
        >
          <i
            className={`tab-icon bi ${
              isKoncerty ? "bi-calendar-event-fill" : "bi-calendar-event"
            }`}
          />
          <span>Koncerty</span>
        </Link>

        <Link
          href="/miejsca"
          className={`mobile-tab-item ${isMiejsca ? "active" : ""}`}
        >
          <i
            className={`tab-icon bi ${
              isMiejsca ? "bi-geo-alt-fill" : "bi-geo-alt"
            }`}
          />
          <span>Miejsca</span>
        </Link>

        <Link
          href="/wykonawcy"
          className={`mobile-tab-item ${isWykonawcy ? "active" : ""}`}
        >
          <i
            className={`tab-icon bi ${
              isWykonawcy ? "bi-people-fill" : "bi-people"
            }`}
          />
          <span>Wykonawcy</span>
        </Link>

        <Link
          href="/polubione"
          className={`mobile-tab-item ${isPolubione ? "active" : ""}`}
        >
          <i
            className={`tab-icon bi ${
              isPolubione ? "bi-heart-fill" : "bi-heart"
            }`}
          />
          <span>Polubione</span>
        </Link>

        <button
          type="button"
          onClick={handleOpen}
          className={`mobile-tab-item ${showMore ? "active" : ""}`}
          aria-expanded={showMore}
          aria-label="Więcej opcji"
        >
          <i
            className={`tab-icon bi ${showMore ? "bi-grid-fill" : "bi-grid"}`}
          />
          <span>Więcej</span>
        </button>
      </nav>

      {/* Offcanvas Drawer for Tab 4: "Więcej" */}
      <Offcanvas
        show={showMore}
        onHide={handleClose}
        placement="end"
        data-bs-theme="dark"
        className="bg-dark text-light"
      >
        <Offcanvas.Header
          closeButton
          closeVariant="white"
          className="border-bottom"
        >
          <Offcanvas.Title className="d-flex align-items-center gap-2 fs-5">
            <i className="bi bi-grid text-primary"></i>
            <span className="fw-semibold">Menu</span>
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body className="d-flex flex-column justify-content-between p-3 gap-4">
          <Stack gap={4}>
            {/* User Account / Login Section */}
            <Card className="border-secondary bg-body-tertiary">
              <Card.Body className="p-3">
                {userRecord ? (
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <img
                        width={42}
                        height={42}
                        className="rounded-circle border border-secondary object-fit-cover"
                        src={
                          getPbFileUrl(userRecord, userRecord.avatar, pb) ||
                          "/default-avatar.png"
                        }
                        alt="Awatar użytkownika"
                      />
                      <div className="overflow-hidden">
                        <div className="fw-semibold text-truncate">
                          {userRecord.name}
                        </div>
                        <div className="small text-body-secondary text-truncate">
                          {userRecord.email}
                        </div>
                      </div>
                    </div>
                    <Button
                      as={Link as any}
                      href="/konto"
                      variant="outline-primary"
                      size="sm"
                      onClick={handleClose}
                    >
                      Konto
                    </Button>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <i className="bi bi-person-circle fs-4 text-primary"></i>
                      <span className="fw-semibold">Twój profil</span>
                    </div>
                    <p className="small text-body-secondary mb-2">
                      Zaloguj się, aby zapisywać koncerty i obserwować ulubione
                      zespoły.
                    </p>
                    <div className="d-flex gap-2">
                      <Button
                        as={Link as any}
                        href="/zaloguj-sie"
                        variant="primary"
                        className="w-100"
                        onClick={handleClose}
                      >
                        Zaloguj się
                      </Button>
                      <Button
                        as={Link as any}
                        href="/zaloguj-sie"
                        variant="outline-secondary"
                        className="w-100"
                        onClick={handleClose}
                      >
                        Rejestracja
                      </Button>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Main Navigation Section */}
            <div>
              <div className="text-uppercase text-body-secondary small fw-bold px-1 mb-2">
                Główne widoki
              </div>
              <ListGroup
                variant="flush"
                className="rounded-3 border border-secondary overflow-hidden"
              >
                <ListGroup.Item
                  as={Link}
                  href="/"
                  action
                  onClick={handleClose}
                  className="d-flex align-items-center gap-3 py-2 bg-body-tertiary text-light border-secondary"
                >
                  <i className="bi bi-house text-primary fs-5"></i>
                  <span>Strona główna</span>
                </ListGroup.Item>
                <ListGroup.Item
                  as={Link}
                  href="/koncerty"
                  action
                  onClick={handleClose}
                  className="d-flex align-items-center gap-3 py-2 bg-body-tertiary text-light border-secondary"
                >
                  <i className="bi bi-calendar-event text-primary fs-5"></i>
                  <span>Koncerty</span>
                </ListGroup.Item>
                <ListGroup.Item
                  as={Link}
                  href="/miejsca"
                  action
                  onClick={handleClose}
                  className="d-flex align-items-center gap-3 py-2 bg-body-tertiary text-light border-secondary"
                >
                  <i className="bi bi-geo-alt text-primary fs-5"></i>
                  <span>Miejsca</span>
                </ListGroup.Item>
                <ListGroup.Item
                  as={Link}
                  href="/wykonawcy"
                  action
                  onClick={handleClose}
                  className="d-flex align-items-center gap-3 py-2 bg-body-tertiary text-light border-secondary"
                >
                  <i className="bi bi-people text-primary fs-5"></i>
                  <span>Wykonawcy</span>
                </ListGroup.Item>
                <ListGroup.Item
                  as={Link}
                  href="/polubione"
                  action
                  onClick={handleClose}
                  className="d-flex align-items-center gap-3 py-2 bg-body-tertiary text-light border-secondary"
                >
                  <i className="bi bi-heart-fill text-danger fs-5"></i>
                  <span>Polubione</span>
                </ListGroup.Item>
                {userRecord?.role === "moderator" && (
                  <>
                    <ListGroup.Item
                      as={Link}
                      href="/moderacja"
                      action
                      onClick={handleClose}
                      className="d-flex align-items-center gap-3 py-2 bg-body-tertiary text-warning fw-semibold border-secondary"
                    >
                      <i className="bi bi-shield-check text-warning fs-5"></i>
                      <span>Moderacja</span>
                    </ListGroup.Item>
                    <ListGroup.Item
                      as={Link}
                      href="/scrapper"
                      action
                      onClick={handleClose}
                      className="d-flex align-items-center gap-3 py-2 bg-body-tertiary text-info fw-semibold border-secondary"
                    >
                      <i className="bi bi-cloud-arrow-down text-info fs-5"></i>
                      <span>Scrapper</span>
                    </ListGroup.Item>
                  </>
                )}
              </ListGroup>
            </div>

            {/* Information & Community */}
            <div>
              <div className="text-uppercase text-body-secondary small fw-bold px-1 mb-2">
                O serwisie i pomoc
              </div>
              <ListGroup
                variant="flush"
                className="rounded-3 border border-secondary overflow-hidden"
              >
                <ListGroup.Item
                  as={Link}
                  href="/about"
                  action
                  onClick={handleClose}
                  className="d-flex align-items-center gap-3 py-2 bg-body-tertiary text-light border-secondary"
                >
                  <i className="bi bi-info-circle text-info fs-5"></i>
                  <span>O czujniku dymu</span>
                </ListGroup.Item>
                <ListGroup.Item
                  as={Link}
                  href="/faq"
                  action
                  onClick={handleClose}
                  className="d-flex align-items-center gap-3 py-2 bg-body-tertiary text-light border-secondary"
                >
                  <i className="bi bi-question-circle text-info fs-5"></i>
                  <span>FAQ</span>
                </ListGroup.Item>
                <ListGroup.Item
                  as={Link}
                  href="/support"
                  action
                  onClick={handleClose}
                  className="d-flex align-items-center gap-3 py-2 bg-body-tertiary text-light border-secondary"
                >
                  <i className="bi bi-heart text-danger fs-5"></i>
                  <span>Wsparcie</span>
                </ListGroup.Item>
                <ListGroup.Item
                  as={Link}
                  href="/cooperation"
                  action
                  onClick={handleClose}
                  className="d-flex align-items-center gap-3 py-2 bg-body-tertiary text-light border-secondary"
                >
                  <i className="bi bi-briefcase text-warning fs-5"></i>
                  <span>Współpraca</span>
                </ListGroup.Item>
                <ListGroup.Item
                  as={Link}
                  href="/contact"
                  action
                  onClick={handleClose}
                  className="d-flex align-items-center gap-3 py-2 bg-body-tertiary text-light border-secondary"
                >
                  <i className="bi bi-envelope text-success fs-5"></i>
                  <span>Kontakt</span>
                </ListGroup.Item>
              </ListGroup>
            </div>

            {/* Legal & Updates */}
            <div>
              <div className="text-uppercase text-body-secondary small fw-bold px-1 mb-2">
                Informacje i regulaminy
              </div>
              <ListGroup
                variant="flush"
                className="rounded-3 border border-secondary overflow-hidden"
              >
                <ListGroup.Item
                  as={Link}
                  href="/changelog"
                  action
                  onClick={handleClose}
                  className="d-flex align-items-center gap-3 py-2 bg-body-tertiary text-light border-secondary"
                >
                  <i className="bi bi-stars text-warning fs-5"></i>
                  <span>Nowości</span>
                </ListGroup.Item>
                <ListGroup.Item
                  as={Link}
                  href="/rules"
                  action
                  onClick={handleClose}
                  className="d-flex align-items-center gap-3 py-2 bg-body-tertiary text-light border-secondary"
                >
                  <i className="bi bi-file-earmark-text text-secondary fs-5"></i>
                  <span>Regulamin</span>
                </ListGroup.Item>
                <ListGroup.Item
                  as={Link}
                  href="/privacy-policy"
                  action
                  onClick={handleClose}
                  className="d-flex align-items-center gap-3 py-2 bg-body-tertiary text-light border-secondary"
                >
                  <i className="bi bi-shield-check text-secondary fs-5"></i>
                  <span>Polityka prywatności</span>
                </ListGroup.Item>
              </ListGroup>
            </div>
          </Stack>

          {/* Social Media & Copyright Footer */}
          <div className="pt-3 border-top border-secondary text-center">
            <div className="d-flex justify-content-center gap-2 mb-2">
              <SocialMediaLinks />
            </div>
            <small className="text-body-secondary">&copy; {appName}</small>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}
