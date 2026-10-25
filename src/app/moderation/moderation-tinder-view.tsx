"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Alert, Badge, Button, Form } from "react-bootstrap";
import { usePocketBase } from "@/app/shared/pocketbase-client-provider";
import { getPbFileUrl } from "@/app/shared/pocketbase-files";
import type { GenreEntity } from "@/entities/genre.entity";
import type { GigDraftEntity } from "@/entities/gig-draft.entity";
import {
  acceptDraftAction,
  postponeDraftAction,
  rejectDraftAction,
} from "./actions";
import { detectGenresForDraft, type MatchResult } from "./genre-matcher";
import { formatEventDescriptionHtml } from "@/shared/format-event-description";
import styles from "./moderation.module.scss";

type Props = {
  initialItems: GigDraftEntity[];
  initialTotalCount: number;
  assignedCities: { id: string; name: string }[];
  allGenres?: GenreEntity[];
  noCities?: boolean;
};

export function ModerationTinderView({
  initialItems,
  initialTotalCount,
  assignedCities,
  allGenres = [],
  noCities,
}: Props) {
  const pb = usePocketBase();
  const [queue, setQueue] = useState<GigDraftEntity[]>(initialItems);
  const [totalCount, setTotalCount] = useState<number>(initialTotalCount);
  const [swipeDirection, setSwipeDirection] = useState<
    "left" | "right" | "down" | null
  >(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "danger" | "warning";
    text: string;
  } | null>(null);

  // Quick edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editStartsAt, setEditStartsAt] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Selected & detected genres
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);
  const [detectedInfo, setDetectedInfo] = useState<MatchResult>({
    matchedGenres: [],
    matchedTermsByGenreId: {},
  });

  const currentDraft = queue[0] || null;
  const nextDraft = queue[1] || null;
  const thirdDraft = queue[2] || null;

  // Sync edit form and genre auto-detection when currentDraft changes
  useEffect(() => {
    if (currentDraft) {
      setEditTitle(currentDraft.title || "");
      setEditStartsAt(currentDraft.startsAt || "");
      setEditDescription(currentDraft.description || "");
      setIsEditing(false);
      setIsDescriptionExpanded(false);

      // Detect genres from Facebook event content using searchTerms
      const detection = detectGenresForDraft(currentDraft, allGenres);
      setDetectedInfo(detection);

      const autoGenreIds = detection.matchedGenres.map((g) => g.id);
      const existingDraftGenreIds = currentDraft.genres || [];
      const combinedInitialIds = Array.from(
        new Set([...existingDraftGenreIds, ...autoGenreIds]),
      );
      setSelectedGenreIds(combinedInitialIds);
    }
  }, [currentDraft, allGenres]);

  const toggleGenre = useCallback((genreId: string) => {
    setSelectedGenreIds((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId],
    );
  }, []);

  const handleAccept = useCallback(() => {
    if (!currentDraft || swipeDirection || isPending) return;

    const draftToAccept = currentDraft;
    const overrides = {
      ...(isEditing
        ? {
          title: editTitle,
          startsAt: editStartsAt,
          description: editDescription,
        }
        : {}),
      genres: selectedGenreIds,
    };

    setSwipeDirection("right");

    startTransition(async () => {
      setTimeout(() => {
        setQueue((prev) => prev.slice(1));
        setTotalCount((prev) => Math.max(0, prev - 1));
        setSwipeDirection(null);
      }, 300);

      const res = await acceptDraftAction(draftToAccept.id, overrides);
      if (res.success) {
        setFeedback({
          type: "success",
          text: res.isUpdate
            ? `Zaktualizowano istniejący koncert "${draftToAccept.title}"!`
            : `Zaakceptowano "${draftToAccept.title}" i dodano do koncertów!`,
        });
      } else {
        setFeedback({
          type: "danger",
          text: res.error || "Wystąpił błąd przy akceptowaniu wydarzenia.",
        });
      }
    });
  }, [
    currentDraft,
    swipeDirection,
    isPending,
    isEditing,
    editTitle,
    editStartsAt,
    editDescription,
    selectedGenreIds,
  ]);

  const handleReject = useCallback(() => {
    if (!currentDraft || swipeDirection || isPending) return;

    const draftToReject = currentDraft;
    setSwipeDirection("left");

    startTransition(async () => {
      setTimeout(() => {
        setQueue((prev) => prev.slice(1));
        setTotalCount((prev) => Math.max(0, prev - 1));
        setSwipeDirection(null);
      }, 300);

      const res = await rejectDraftAction(draftToReject.id);
      if (res.success) {
        setFeedback({
          type: "warning",
          text: `Odrzucono "${draftToReject.title}".`,
        });
      } else {
        setFeedback({
          type: "danger",
          text: res.error || "Wystąpił błąd przy odrzucaniu wydarzenia.",
        });
      }
    });
  }, [currentDraft, swipeDirection, isPending]);

  const handlePostpone = useCallback(() => {
    if (!currentDraft || swipeDirection || isPending) return;

    const draftToPostpone = currentDraft;
    setSwipeDirection("down");

    startTransition(async () => {
      const res = await postponeDraftAction(draftToPostpone.id);

      setTimeout(() => {
        const nextCount =
          res.postponedCount ?? (draftToPostpone.postponedCount || 0) + 1;
        const updatedItem: GigDraftEntity = {
          ...draftToPostpone,
          postponedCount: nextCount,
        };

        setQueue((prev) => {
          const remaining = prev.slice(1);
          // Re-insert sorted by -isUpdate first, then postponedCount ASC, then startsAt ASC
          const newQueue = [...remaining, updatedItem].sort((a, b) => {
            const isUpdateA = a.isUpdate ? 1 : 0;
            const isUpdateB = b.isUpdate ? 1 : 0;
            if (isUpdateA !== isUpdateB) return isUpdateB - isUpdateA;
            const countDiff = (a.postponedCount || 0) - (b.postponedCount || 0);
            if (countDiff !== 0) return countDiff;
            return (a.startsAt || "").localeCompare(b.startsAt || "");
          });
          return newQueue;
        });

        setSwipeDirection(null);
      }, 300);

      if (res.success) {
        setFeedback({
          type: "warning",
          text: `Odłożono na później (odłożone ${res.postponedCount}x). Trafi na koniec kolejki.`,
        });
      } else {
        setFeedback({
          type: "danger",
          text: res.error || "Wystąpił błąd przy odkładaniu wydarzenia.",
        });
      }
    });
  }, [currentDraft, swipeDirection, isPending]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (
        activeTag === "input" ||
        activeTag === "textarea" ||
        activeTag === "select"
      ) {
        return;
      }

      if (e.key === "ArrowRight" || e.key === "e" || e.key === "E") {
        e.preventDefault();
        handleAccept();
      } else if (e.key === "ArrowLeft" || e.key === "q" || e.key === "Q") {
        e.preventDefault();
        handleReject();
      } else if (e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        handlePostpone();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAccept, handleReject, handlePostpone]);

  if (noCities) {
    return (
      <div className={styles.emptyState}>
        <div className="mb-3 fs-1 text-warning">
          <i className="bi bi-geo-alt-fill" />
        </div>
        <h3 className="h4 text-light mb-3">Brak przypisanych miast</h3>
        <p className="text-secondary mb-4">
          Twoje konto posiada rolę moderatora, ale nie masz jeszcze przypisanych
          żadnych miast do przeglądania wydarzeń.
        </p>
        <p className="small text-secondary">
          Skontaktuj się z administratorem, aby przypisać miasta do Twojego
          profilu.
        </p>
      </div>
    );
  }

  // Cover Image helper
  const getCoverUrl = (draft: GigDraftEntity | null) => {
    if (!draft) return null;
    if (draft.coverImage) {
      return getPbFileUrl(
        { ...draft, collectionName: draft.collectionName || "gigDrafts" },
        draft.coverImage,
        pb,
      );
    }
    return draft.coverImageUrl || null;
  };

  const currentCoverUrl = getCoverUrl(currentDraft);
  const nextCoverUrl = getCoverUrl(nextDraft);

  const startsAtFormatted = currentDraft?.startsAt
    ? new Intl.DateTimeFormat("pl-PL", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(currentDraft.startsAt))
    : "Brak ustalonej daty";

  return (
    <div className={styles.moderationContainer}>
      {/* Top Header Bar with Metrics */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div className="text-end">
          <span className="small text-secondary me-2">Drafty</span>
          <span className="fs-5 fw-bold">{totalCount}</span>
        </div>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => window.location.reload()}
          title="Odśwież kolejkę"
        >
          <i className="bi bi-arrow-clockwise" />
        </Button>
      </div>

      {feedback && (
        <Alert
          variant={feedback.type}
          dismissible
          onClose={() => setFeedback(null)}
          className="shadow-sm mb-4"
        >
          {feedback.text}
        </Alert>
      )}

      {/* Main Tinder Card Deck */}
      {currentDraft ? (
        <div className={styles.cardDeck}>
          {/* Third stacked card hint */}
          {thirdDraft && <div className={styles.cardThird} />}

          {/* Second stacked card hint */}
          {nextDraft && (
            <div className={styles.cardBehind}>
              <div
                style={{
                  height: "100%",
                  backgroundImage: nextCoverUrl
                    ? `url(${nextCoverUrl})`
                    : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  borderRadius: "1.25rem",
                }}
              />
            </div>
          )}

          {/* Active Front Card */}
          <div
            className={`${styles.tinderCard} ${swipeDirection === "left"
                ? styles.swipeLeft
                : swipeDirection === "right"
                  ? styles.swipeRight
                  : swipeDirection === "down"
                    ? styles.swipeDown
                    : ""
              }`}
          >
            {/* Cover Image Header */}
            <div className={styles.imageContainer}>
              {currentCoverUrl ? (
                // biome-ignore lint/performance/noImgElement: PocketBase dynamic image
                <img
                  src={currentCoverUrl}
                  alt={currentDraft.title}
                  loading="eager"
                />
              ) : (
                <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-secondary">
                  <i className="bi bi-image fs-1 mb-2 opacity-50" />
                  <span className="small">Brak grafiki</span>
                </div>
              )}
              <div className={styles.imageOverlay} />

              {/* Floating Top Badges */}
              <div className={styles.floatingBadgesTop}>
                <div className="d-flex align-items-center gap-2">
                  {currentDraft.requestedBy === pb.authStore.record?.id && (
                    <span
                      className={`${styles.badgePill} text-warning border border-warning-subtle`}
                      title="Draft zescrapowany na Twoje zlecenie"
                    >
                      <i className="bi bi-star-fill text-warning me-1" />
                      TWÓJ SCRAP
                    </span>
                  )}

                  {(currentDraft.isUpdate ||
                    Boolean(currentDraft.targetGig)) && (
                      <span
                        className={`${styles.badgePill} ${styles.updateBadge}`}
                      >
                        <i className="bi bi-arrow-repeat" />
                        AKTUALIZACJA
                      </span>
                    )}

                  {currentDraft.expand?.city?.name && (
                    <span className={`${styles.badgePill} text-info`}>
                      <i className="bi bi-geo-alt-fill" />
                      {currentDraft.expand.city.name}
                    </span>
                  )}

                  {(currentDraft.postponedCount || 0) > 0 && (
                    <span
                      className={`${styles.badgePill} ${styles.postponedBadge}`}
                    >
                      <i className="bi bi-clock-history" />
                      Odłożone {currentDraft.postponedCount}x
                    </span>
                  )}
                </div>

                {currentDraft.sourceUrl && (
                  <a
                    href={currentDraft.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.badgePill} text-light text-decoration-none`}
                    title="Otwórz oryginalne źródło wydarzenia"
                  >
                    <i className="bi bi-box-arrow-up-right" />
                    <span>Źródło</span>
                  </a>
                )}
              </div>
            </div>

            {/* Card Content */}
            <div className={styles.cardBody}>
              {(currentDraft.isUpdate || Boolean(currentDraft.targetGig)) && (
                <div className={styles.updateAlertBanner}>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <i className="bi bi-arrow-repeat text-warning fs-5" />
                    <strong className="text-warning">
                      Zaktualizowany opis z Facebooka (AKTUALIZACJA)
                    </strong>
                  </div>
                  <div className="small text-secondary">
                    Opis tego wydarzenia zmienił się na Facebooku.
                    Zaakceptowanie zaktualizuje istniejący koncert w bazie
                    danych.
                    {currentDraft.expand?.targetGig && (
                      <div className="mt-1">
                        <Link
                          href={`/gigs/${currentDraft.expand.targetGig.id}`}
                          target="_blank"
                          className="text-info text-decoration-none"
                        >
                          <i className="bi bi-box-arrow-up-right me-1" />
                          Podgląd obecnego koncertu w serwisie
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <h2 className={styles.eventTitle}>{currentDraft.title}</h2>

              <div className={styles.metaRow}>
                <div className={styles.metaItem}>
                  <i className="bi bi-calendar3 text-primary" />
                  <span className="text-light fw-medium">
                    {startsAtFormatted}
                  </span>
                </div>

                {currentDraft.expand?.place && (
                  <div className={styles.metaItem}>
                    <i className="bi bi-building text-info" />
                    <Link
                      href={`/miejsca/${currentDraft.expand.place.slug || currentDraft.expand.place.id}`}
                      className="text-info text-decoration-none"
                    >
                      {currentDraft.expand.place.name}
                    </Link>
                  </div>
                )}

                {currentDraft.expand?.artists &&
                  currentDraft.expand.artists.length > 0 && (
                    <div className={styles.metaItem}>
                      <i className="bi bi-music-note-beamed text-warning" />
                      <span>
                        {currentDraft.expand.artists
                          .map((a) => a.name)
                          .join(", ")}
                      </span>
                    </div>
                  )}
              </div>

              {/* Proposed & Selected Genres */}
              {allGenres.length > 0 && (
                <div className={styles.genresSection}>
                  <div className={styles.genresSectionHeader}>
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-tags-fill text-warning" />
                      <span className="text-light fw-semibold">
                        Gatunki
                      </span>
                      {detectedInfo.matchedGenres.length > 0 && (
                        <span className={styles.detectedBadge}>
                          <i className="bi bi-stars me-1" />
                          Zaproponowano ({detectedInfo.matchedGenres.length})
                        </span>
                      )}
                    </div>
                    <span className="small text-secondary">
                      {selectedGenreIds.length === 0
                        ? "Brak przypisanych"
                        : `Wybrano: ${selectedGenreIds.length}`}
                    </span>
                  </div>

                  <div className={styles.genresPillsList}>
                    {allGenres.map((genre) => {
                      const isSelected = selectedGenreIds.includes(genre.id);
                      const matchedTerms =
                        detectedInfo.matchedTermsByGenreId[genre.id];
                      const isDetected = Boolean(
                        matchedTerms && matchedTerms.length > 0,
                      );

                      return (
                        <button
                          key={genre.id}
                          type="button"
                          onClick={() => toggleGenre(genre.id)}
                          className={`${styles.genrePill} ${isSelected ? styles.genrePillSelected : ""
                            } ${isDetected && isSelected
                              ? styles.genrePillDetected
                              : ""
                            }`}
                          title={
                            isDetected
                              ? `Zaproponowano na podstawie treści: "${matchedTerms?.join(", ")}"`
                              : isSelected
                                ? "Kliknij, aby odznaczyć"
                                : "Kliknij, aby dodać gatunek"
                          }
                        >
                          {isSelected ? (
                            <i
                              className={`bi bi-check-lg ${styles.genreCheckIcon}`}
                            />
                          ) : (
                            <i className="bi bi-plus text-secondary" />
                          )}

                          <span>{genre.name}</span>

                          {isDetected && (
                            <span
                              className={styles.detectedSparkle}
                              title={`Wykryto słowo: "${matchedTerms?.[0]}"`}
                            >
                              ✨
                            </span>
                          )}

                          {isSelected && (
                            <i
                              className={`bi bi-x ${styles.genreRemoveIcon}`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {detectedInfo.matchedGenres.length > 0 && (
                    <div
                      className="mt-2 text-secondary"
                      style={{ fontSize: "0.75rem" }}
                    >
                      <i className="bi bi-info-circle me-1 text-info" />
                      Wykryto w treści:{" "}
                      {detectedInfo.matchedGenres
                        .map((g) => {
                          const terms =
                            detectedInfo.matchedTermsByGenreId[g.id] || [];
                          return `${g.name} ("${terms[0]}")`;
                        })
                        .join(", ")}
                      . Kliknij dowolny gatunek, aby zmienić wybór przed
                      akceptacją.
                    </div>
                  )}
                </div>
              )}

              {/* Description preview */}
              {currentDraft.description && (
                <>
                  <div
                    className={`${styles.descriptionBox} ${isDescriptionExpanded ? styles.expanded : ""
                      }`}
                    dangerouslySetInnerHTML={{
                      __html: formatEventDescriptionHtml(
                        currentDraft.description,
                      ),
                    }}
                  />
                  <div className="text-end mb-3">
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 text-secondary text-decoration-none"
                      onClick={() =>
                        setIsDescriptionExpanded(!isDescriptionExpanded)
                      }
                    >
                      {isDescriptionExpanded
                        ? "Zwiń opis"
                        : "Rozwiń pełny opis..."}
                    </Button>
                  </div>
                </>
              )}

              {/* Quick Edit Toggle */}
              <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-25">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="d-flex align-items-center gap-1"
                >
                  <i className="bi bi-pencil-square" />
                  <span>
                    {isEditing ? "Anuluj edycję" : "Edytuj przed akceptacją"}
                  </span>
                </Button>
                <span className="small text-secondary">
                  W kolejce: {queue.length} z {totalCount}
                </span>
              </div>

              {/* Inline Edit Form */}
              {isEditing && (
                <div className={styles.editDrawer}>
                  <h6 className="text-warning mb-3">
                    <i className="bi bi-pencil me-1" />
                    Edytuj dane wydarzenia
                  </h6>
                  <Form.Group className="mb-2">
                    <Form.Label className="small text-secondary">
                      Tytuł wydarzenia
                    </Form.Label>
                    <Form.Control
                      type="text"
                      size="sm"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label className="small text-secondary">
                      Data rozpoczęcia (ISO / tekst)
                    </Form.Label>
                    <Form.Control
                      type="text"
                      size="sm"
                      value={editStartsAt}
                      onChange={(e) => setEditStartsAt(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label className="small text-secondary">
                      Opis
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      size="sm"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  </Form.Group>
                </div>
              )}
            </div>

            {/* Action Bar with Tinder Buttons */}
            <div className={styles.actionsBar}>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.rejectBtn}`}
                onClick={handleReject}
                disabled={Boolean(swipeDirection) || isPending}
                title="Odrzuć wydarzenie (Klawisz Q lub Strzałka w lewo)"
              >
                <i className="bi bi-x-lg fs-5" />
                <span>Odrzuć</span>
                <span className={styles.keyHint}>Q / ←</span>
              </button>

              <button
                type="button"
                className={`${styles.actionBtn} ${styles.postponeBtn}`}
                onClick={handlePostpone}
                disabled={Boolean(swipeDirection) || isPending}
                title="Odłóż na później (Klawisz Spacja lub Strzałka w dół)"
              >
                <i className="bi bi-clock-history fs-5" />
                <span>Na później</span>
                <span className={styles.keyHint}>Spacja / ↓</span>
              </button>

              <button
                type="button"
                className={`${styles.actionBtn} ${styles.acceptBtn}`}
                onClick={handleAccept}
                disabled={Boolean(swipeDirection) || isPending}
                title="Zaakceptuj i dodaj do koncertów (Klawisz E lub Strzałka w prawo)"
              >
                <i className="bi bi-check-lg fs-5" />
                <span>Zaakceptuj</span>
                <span className={styles.keyHint}>E / →</span>
              </button>
            </div>

            {/* Shortcuts explanation */}
            <div className={styles.shortcutsRow}>
              Wskazówka: Możesz używać klawiszy{" "}
              <span className={styles.keyHint}>← Q</span> (Odrzuć),{" "}
              <span className={styles.keyHint}>↓ Spacja</span> (Na później),{" "}
              <span className={styles.keyHint}>→ E</span> (Zaakceptuj)
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className={styles.emptyState}>
          <div className="mb-3 fs-1 text-success">
            <i className="bi bi-check-circle-fill" />
          </div>
          <h2 className="h3 text-light mb-2">Wszystko przejrzane! 🎉</h2>
          <p className="text-secondary mb-4">
            Brak oczekujących draftów wydarzeń do moderacji w Twoich
            przypisanych miastach.
          </p>
          <Button
            variant="primary"
            onClick={() => window.location.reload()}
            className="d-inline-flex align-items-center gap-2"
          >
            <i className="bi bi-arrow-clockwise" />
            <span>Sprawdź ponownie</span>
          </Button>
        </div>
      )}
    </div>
  );
}
