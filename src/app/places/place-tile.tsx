"use client";

import Link from "next/link";
import {
  Card,
  CardBody,
  CardImg,
  CardSubtitle,
  CardTitle,
} from "react-bootstrap";
import { usePocketBase } from "@/app/shared/pocketbase-client-provider";
import { getPbFileUrl } from "@/app/shared/pocketbase-files";
import { FavoriteButton } from "@/components/favorite-button";
import type { PlaceEntity } from "@/entities/place.entity";

type Props = {
  place: PlaceEntity;
};

export function PlaceTile(props: Props) {
  const pb = usePocketBase();
  const imageUrl = props.place.coverImage
    ? getPbFileUrl(props.place, props.place.coverImage, pb)
    : props.place.coverImageUrl || null;

  return (
    <Card className="shadow-sm h-100 position-relative overflow-hidden card-hover">
      <div className="position-absolute top-0 end-0 m-2" style={{ zIndex: 5 }}>
        <FavoriteButton placeId={props.place.id} />
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
            alt={props.place.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}

      <CardBody>
        <CardTitle>
          <Link
            href={`/miejsca/${props.place.slug || props.place.id}`}
            className="text-decoration-none text-light stretched-link"
          >
            {props.place.name}
          </Link>
        </CardTitle>
        {props.place.address && (
          <CardSubtitle className="text-secondary small mt-1">
            {props.place.address}
          </CardSubtitle>
        )}
      </CardBody>
    </Card>
  );
}
