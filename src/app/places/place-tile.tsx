import { PlaceEntity } from "@/entities/place.entity";
import Link from "next/link";
import { Badge, Card, CardBody, CardImg, CardSubtitle, CardText, CardTitle, Row } from "react-bootstrap";

type Props = {
    place: PlaceEntity;
}

export function PlaceTile(props: Props) {
  return (
    <Card className="shadow-lg">
      <Link href={"/miejsca/" + props.place.id}>
      <CardImg
        src={
          props.place.coverImageUrl
        }
      ></CardImg>
      </Link>

      <CardBody>
        <CardTitle>{props.place.name}</CardTitle>
        <CardSubtitle>{props.place.city}</CardSubtitle>
        <CardText className="mt-2">
          {props.place.city}
        </CardText>
      </CardBody>
    </Card>
  );
}
