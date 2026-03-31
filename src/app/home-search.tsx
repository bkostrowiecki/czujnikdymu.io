"use client";

import { CityEntity } from "@/entities/city.entity";
import { GenreEntity } from "@/entities/genre.entity";
import {
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Button,
} from "react-bootstrap";

export function HomeSearch({
  cities,
  genres,
}: {
  cities: CityEntity[];
  genres: GenreEntity[];
}) {
  return (
    <Stack>
      <div>
        <h2>Miasta</h2>
        <ToggleButtonGroup type="checkbox" className="gap-2">
          {cities.length > 0 &&
            cities.map((city) => {
              return (
                <ToggleButton
                  variant="success"
                  className="rounded-pill"
                  type="checkbox"
                  id={city.id}
                  value={city.id}
                  name="city"
                >
                  {city.name}
                </ToggleButton>
              );
            })}
        </ToggleButtonGroup>
      </div>
      <div className="mt-4">
        <h2>Gatunki</h2>
        <ToggleButtonGroup type="checkbox" className="gap-2">
          {genres.length > 0 &&
            genres.map((genre) => {
              return (
                <ToggleButton
                  key={genre.id}
                  variant="outline-info"
                  className="rounded-pill"
                  id={genre.id}
                  value={genre.id}
                  name="genre"
                >
                  {genre.name}
                </ToggleButton>
              );
            })}
        </ToggleButtonGroup>
      </div>
      <div className="pt-5">
        <Button size="lg">Wyszukaj</Button>
      </div>
    </Stack>
  );
}
