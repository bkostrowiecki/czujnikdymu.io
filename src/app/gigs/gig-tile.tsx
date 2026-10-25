"use client";

import Link from "next/link";
import {
  Badge,
  Card,
  CardBody,
  CardImg,
  CardSubtitle,
  CardText,
  CardTitle,
} from "react-bootstrap";
import { usePocketBase } from "@/app/shared/pocketbase-client-provider";
import { getPbFileUrl } from "@/app/shared/pocketbase-files";
import { FavoriteButton } from "@/components/favorite-button";
import type { GigEntity } from "@/entities/gig.entity";

export type FeedReasonType = "gig" | "artist" | "place";

export type FeedReason = {
  type: FeedReasonType;
  label: string;
};

export function GigTile({
  gig,
  feedReasons,
}: {
  gig: GigEntity;
  feedReasons?: FeedReason[];
}) {
  const pb = usePocketBase();
  const artists = gig.expand?.artists ?? [];
  const genres = artists.flatMap((artist) => artist.expand?.genres ?? []);
  const uniqueGenres = Array.from(
    new Map(genres.map((genre) => [genre.id, genre])).values(),
  );
  const place = gig.expand?.place;
  const startsAt = gig.startsAt
    ? new Intl.DateTimeFormat("pl-PL", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(gig.startsAt))
    : null;

  const imageUrl = gig.coverImage
    ? getPbFileUrl(
        { ...gig, collectionName: gig.collectionName || "gigs" },
        gig.coverImage,
        pb,
      )
    : gig.coverImageUrl || null;

  return (
    <Card className="shadow-sm h-100 position-relative overflow-hidden card-hover">
      <div className="position-absolute top-0 end-0 m-2" style={{ zIndex: 5 }}>
        <FavoriteButton gigId={gig.id} />
      </div>
      {imageUrl && (
        <div
          style={{
            height: "180px",
            overflow: "hidden",
            backgroundColor: "#1a1d20",
          }}
        >
          <CardImg
            variant="top"
            src={imageUrl}
            alt={gig.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}

      <CardBody>
        {feedReasons && feedReasons.length > 0 && (
          <div
            className="d-flex flex-wrap gap-1 mb-2 position-relative"
            style={{ zIndex: 2 }}
          >
            {feedReasons.map((reason) => {
              const iconClass =
                reason.type === "gig"
                  ? "bi-heart-fill"
                  : reason.type === "artist"
                    ? "bi-people-fill"
                    : "bi-geo-alt-fill";
              const modifierClass =
                reason.type === "gig"
                  ? "feed-reason-badge--gig"
                  : reason.type === "artist"
                    ? "feed-reason-badge--artist"
                    : "feed-reason-badge--place";

              return (
                <span
                  key={`${reason.type}-${reason.label}`}
                  className={`feed-reason-badge ${modifierClass}`}
                  title={reason.label}
                >
                  <i className={`bi ${iconClass}`} />
                  <span>{reason.label}</span>
                </span>
              );
            })}
          </div>
        )}
        <CardTitle>
          <Link
            href={`/koncerty/${gig.id}`}
            className="text-decoration-none text-light stretched-link"
          >
            {gig.title}
          </Link>
        </CardTitle>

        {(startsAt || place) && (
          <CardSubtitle
            className="text-secondary small mt-1 position-relative"
            style={{ zIndex: 2 }}
          >
            {startsAt && <span>{startsAt}</span>}
            {startsAt && place && <span className="mx-1">·</span>}
            {place && (
              <Link
                href={`/miejsca/${place.slug || place.id}`}
                className="text-info text-decoration-none"
              >
                {place.name}
              </Link>
            )}
          </CardSubtitle>
        )}

        {artists.length > 0 && (
          <CardText
            className="mt-2 mb-2 position-relative"
            style={{ zIndex: 2 }}
          >
            {artists.map((artist, idx) => (
              <span key={artist.id}>
                {idx > 0 && ", "}
                <Link
                  href={`/wykonawcy/${artist.slug || artist.id}`}
                  className="text-body text-decoration-none"
                >
                  {artist.name}
                </Link>
              </span>
            ))}
          </CardText>
        )}

        {uniqueGenres.length > 0 && (
          <div
            className="d-flex flex-wrap gap-1 position-relative"
            style={{ zIndex: 2 }}
          >
            {uniqueGenres.map((genre) => (
              <Link
                key={genre.id}
                href={`/genre/${genre.slug || genre.id}`}
                className="text-decoration-none"
              >
                <Badge
                  bg="transparent"
                  className="border border-info text-info"
                  style={{ cursor: "pointer" }}
                >
                  {genre.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
