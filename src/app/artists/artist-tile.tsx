"use client";

import Link from "next/link";
import {
  Badge,
  Card,
  CardBody,
  CardImg,
  CardText,
  CardTitle,
} from "react-bootstrap";
import { usePocketBase } from "@/app/shared/pocketbase-client-provider";
import { getPbFileUrl } from "@/app/shared/pocketbase-files";
import { FavoriteButton } from "@/components/favorite-button";
import type { ArtistEntity } from "@/entities/artist.entity";

export function ArtistTile({ artist }: { artist: ArtistEntity }) {
  const pb = usePocketBase();
  const genres = artist.expand?.genres ?? [];
  const imageUrl = artist.coverImage
    ? getPbFileUrl(artist, artist.coverImage, pb)
    : null;

  return (
    <Card className="shadow-sm h-100 position-relative overflow-hidden card-hover">
      <div className="position-absolute top-0 end-0 m-2" style={{ zIndex: 5 }}>
        <FavoriteButton artistId={artist.id} />
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
            alt={artist.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}
      <CardBody>
        <CardTitle>
          <Link
            href={`/wykonawcy/${artist.slug || artist.id}`}
            className="text-decoration-none text-light stretched-link"
          >
            {artist.name}
          </Link>
        </CardTitle>
        {genres.length > 0 && (
          <CardText
            as="div"
            className="mt-2 mb-0 position-relative"
            style={{ zIndex: 2 }}
          >
            <div className="d-flex flex-wrap gap-1">
              {genres.map((genre) => (
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
          </CardText>
        )}
      </CardBody>
    </Card>
  );
}
