import { createPbInstance } from "@/services/pocketbase";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Row,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "react-bootstrap";
import { HomeSearch } from "./home-search";
import { CityEntity } from "@/entities/city.entity";
import { GenreEntity } from "@/entities/genre.entity";
import { initializePb } from "./shared/pocketbase";

export default async function Home() {
  const pb = await initializePb();

  const cities = await pb.collection("cities").getFullList<CityEntity>();
  const genres = await pb.collection("genres").getFullList<GenreEntity>();

  return (
    <Container className="pt-5">
      <Row>
        <Col>
          <HomeSearch cities={cities} genres={genres} />
        </Col>
      </Row>
    </Container>
  );
}
