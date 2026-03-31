import UnexpectedErrorPage from "@/components/unexpected-error-page";
import { PlaceEntity } from "@/entities/place.entity";
import { createPb } from "@/services/pocketbase";
import Link from "next/link";
import { Breadcrumb, BreadcrumbItem, Col, Container, Row } from "react-bootstrap";

export default async function PlacePage({
  params,
}: {
  params: {
    id: string;
  };
}) {
    const pb = createPb();

  const { id } = await params;

  let place;
  try {
    place = await pb.collection("places").getOne<PlaceEntity>(id);
  } catch (err) {
    return <UnexpectedErrorPage />;
  }

  return <Container className="pt-5">
    <Row>
        <Col>
            <Breadcrumb>
                <Link href={"/miejsca"} passHref legacyBehavior>
                    <BreadcrumbItem>Miejsca</BreadcrumbItem>
                </Link>
                <BreadcrumbItem linkAs="span">{place.name}</BreadcrumbItem>
            </Breadcrumb>
        </Col>
    </Row>
    <Row>
        <Col>
            <img src={place.coverImageUrl} />
            <h1>{place.name}</h1>
            <h2>{place.address}</h2>
            <a href={place.facebookUrl} className="bi bi-facebook"></a>
        </Col>
    </Row>
  </Container>
}
