import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Card, Col, Container, Row } from "react-bootstrap";
import { ArtistTile } from "@/app/artists/artist-tile";
import { GigTile } from "@/app/gigs/gig-tile";
import { PlaceTile } from "@/app/places/place-tile";
import { getPbFileUrl } from "@/app/shared/pocketbase-files";
import { initializeSsrPb } from "@/app/shared/pocketbase-ssr";
import type { ArtistEntity } from "@/entities/artist.entity";
import type { CityEntity } from "@/entities/city.entity";
import type { GenreEntity } from "@/entities/genre.entity";
import type { GigEntity } from "@/entities/gig.entity";
import type { PlaceEntity } from "@/entities/place.entity";
import { normalizeFilterPresets } from "@/shared/filter-presets";
import { SavedPresetsManager } from "./saved-presets-manager";
import { SignOutButton } from "./sign-out-button";

export const dynamic = "force-dynamic";

const providerLabels: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  discord: "Discord",
  facebook: "Facebook",
  microsoft: "Microsoft",
  apple: "Apple",
  spotify: "Spotify",
  twitch: "Twitch",
  twitter: "Twitter / X",
};

function getProviderLabel(provider: string): string {
  return providerLabels[provider] || provider;
}

function getSortLabel(sort?: string): string {
  if (sort === "date-desc") return "Data malejąco (najpóźniejsze)";
  if (sort === "name-asc") return "Alfabetycznie (A - Z)";
  return "Data rosnąco (najbliższe)";
}

type FavoriteGigRecord = {
  id: string;
  gig: string;
  expand?: {
    gig?: GigEntity;
  };
};

type FavoritePlaceRecord = {
  id: string;
  place: string;
  expand?: {
    place?: PlaceEntity;
  };
};

type FavoriteArtistRecord = {
  id: string;
  artist: string;
  expand?: {
    artist?: ArtistEntity;
  };
};

export default async function AccountPage() {
  const pb = await initializeSsrPb();
  const user = pb.authStore.record;

  if (!user) {
    redirect("/zaloguj-sie");
  }

  const avatarUrl =
    getPbFileUrl(user, user.avatar as string, pb) || "/default-avatar.png";

  let externalAuths: { id: string; provider: string; created: string }[] = [];
  try {
    externalAuths = (await pb
      .collection("users")
      .listExternalAuths(user.id)) as any;
  } catch (err) {
    console.error("Nie udało się pobrać metod logowania:", err);
  }

  let favoriteGigs: GigEntity[] = [];
  try {
    const favorites = await pb
      .collection("favoriteGigs")
      .getFullList<FavoriteGigRecord>({
        filter: `user = "${user.id}"`,
        expand: "gig,gig.place,gig.artists,gig.artists.genres",
        sort: "-created",
      });
    favoriteGigs = favorites
      .map((fav) => fav.expand?.gig)
      .filter((gig): gig is GigEntity => !!gig);
  } catch (err) {
    console.error("Nie udało się pobrać ulubionych koncertów:", err);
  }

  let favoritePlaces: PlaceEntity[] = [];
  try {
    const favorites = await pb
      .collection("favoritePlaces")
      .getFullList<FavoritePlaceRecord>({
        filter: `user = "${user.id}"`,
        expand: "place",
        sort: "-created",
      });
    favoritePlaces = favorites
      .map((fav) => fav.expand?.place)
      .filter((place): place is PlaceEntity => !!place);
  } catch (err) {
    console.error("Nie udało się pobrać ulubionych miejsc:", err);
  }

  let favoriteArtists: ArtistEntity[] = [];
  try {
    const favorites = await pb
      .collection("favoriteArtists")
      .getFullList<FavoriteArtistRecord>({
        filter: `user = "${user.id}"`,
        expand: "artist,artist.genres",
        sort: "-created",
      });
    favoriteArtists = favorites
      .map((fav) => fav.expand?.artist)
      .filter((artist): artist is ArtistEntity => !!artist);
  } catch (err) {
    console.error("Nie udało się pobrać ulubionych wykonawców:", err);
  }

  let allCities: CityEntity[] = [];
  let allGenres: GenreEntity[] = [];
  try {
    [allCities, allGenres] = await Promise.all([
      pb.collection("cities").getFullList<CityEntity>({ sort: "name" }),
      pb.collection("genres").getFullList<GenreEntity>({ sort: "name" }),
    ]);
  } catch (err) {
    console.error("Nie udało się pobrać miast lub gatunków:", err);
  }

  const userPresets = normalizeFilterPresets(user.searchFilters);

  return (
    <Container className="pt-5 pb-5">
      <Row className="justify-content-center g-4">
        {/* Profil użytkownika */}
        <Col lg={5}>
          <Card className="shadow-lg p-3 pt-2 h-100" body>
            <div className="d-flex align-items-center gap-3 mb-3">
              <img
                src={avatarUrl}
                alt="avatar"
                width={64}
                height={64}
                className="rounded-circle"
                style={{ objectFit: "cover" }}
              />
              <div>
                <h4 className="mb-0">{user.name || "Użytkownik"}</h4>
                {user.email && (
                  <small className="text-muted">{user.email as string}</small>
                )}
              </div>
            </div>

            <hr />

            <h5 className="mb-3">Metoda logowania</h5>

            {externalAuths.length > 0 ? (
              <ul className="list-unstyled mb-0">
                {externalAuths.map((auth) => (
                  <li
                    key={auth.id}
                    className="d-flex align-items-center gap-2 mb-2"
                  >
                    <span className="badge bg-primary">
                      {getProviderLabel(auth.provider)}
                    </span>
                    <small className="text-muted">
                      Połączono{" "}
                      {new Date(auth.created).toLocaleDateString("pl-PL", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted mb-0">
                Brak powiązanych zewnętrznych metod logowania.
              </p>
            )}

            <hr />

            <SignOutButton />
          </Card>
        </Col>

        {/* Zapisane zestawy filtrów */}
        <Col lg={5}>
          <SavedPresetsManager
            initialPresets={userPresets}
            cities={allCities}
            genres={allGenres}
            userId={user.id}
          />
        </Col>
      </Row>

      {/* Ulubione koncerty */}
      <Row className="justify-content-center mt-5">
        <Col lg={10}>
          <h3 className="mb-3 d-flex align-items-center gap-2">
            <i className="bi bi-heart-fill text-danger" />
            Twoje ulubione koncerty
            {favoriteGigs.length > 0 && (
              <span className="text-body-secondary fs-5 fw-normal">
                ({favoriteGigs.length})
              </span>
            )}
          </h3>

          {favoriteGigs.length > 0 ? (
            <Row className="g-4">
              {favoriteGigs.map((gig) => (
                <Col key={gig.id} xs={12} md={6} lg={4}>
                  <GigTile gig={gig} />
                </Col>
              ))}
            </Row>
          ) : (
            <Card className="shadow-sm p-4 text-center" body>
              <i
                className="bi bi-heart text-muted d-block mb-2"
                style={{ fontSize: "2rem" }}
              />
              <p className="text-muted mb-2">
                Nie masz jeszcze ulubionych koncertów.
              </p>
              <Link href="/koncerty" className="btn btn-outline-primary btn-sm">
                Przeglądaj koncerty
              </Link>
            </Card>
          )}
        </Col>
      </Row>

      {/* Ulubione miejsca */}
      <Row className="justify-content-center mt-5">
        <Col lg={10}>
          <h3 className="mb-3 d-flex align-items-center gap-2">
            <i className="bi bi-geo-alt-fill text-danger" />
            Twoje ulubione miejsca
            {favoritePlaces.length > 0 && (
              <span className="text-body-secondary fs-5 fw-normal">
                ({favoritePlaces.length})
              </span>
            )}
          </h3>

          {favoritePlaces.length > 0 ? (
            <Row className="g-4">
              {favoritePlaces.map((place) => (
                <Col key={place.id} xs={12} md={6} lg={4}>
                  <PlaceTile place={place} />
                </Col>
              ))}
            </Row>
          ) : (
            <Card className="shadow-sm p-4 text-center" body>
              <i
                className="bi bi-geo-alt text-muted d-block mb-2"
                style={{ fontSize: "2rem" }}
              />
              <p className="text-muted mb-2">
                Nie masz jeszcze ulubionych miejsc.
              </p>
              <Link href="/miejsca" className="btn btn-outline-primary btn-sm">
                Przeglądaj miejsca
              </Link>
            </Card>
          )}
        </Col>
      </Row>

      {/* Ulubieni wykonawcy */}
      <Row className="justify-content-center mt-5">
        <Col lg={10}>
          <h3 className="mb-3 d-flex align-items-center gap-2">
            <i className="bi bi-people-fill text-warning" />
            Twoi ulubieni wykonawcy
            {favoriteArtists.length > 0 && (
              <span className="text-body-secondary fs-5 fw-normal">
                ({favoriteArtists.length})
              </span>
            )}
          </h3>

          {favoriteArtists.length > 0 ? (
            <Row className="g-4">
              {favoriteArtists.map((artist) => (
                <Col key={artist.id} xs={12} md={6} lg={4}>
                  <ArtistTile artist={artist} />
                </Col>
              ))}
            </Row>
          ) : (
            <Card className="shadow-sm p-4 text-center" body>
              <i
                className="bi bi-people text-muted d-block mb-2"
                style={{ fontSize: "2rem" }}
              />
              <p className="text-muted mb-2">
                Nie masz jeszcze ulubionych wykonawców.
              </p>
              <Link
                href="/wykonawcy"
                className="btn btn-outline-primary btn-sm"
              >
                Przeglądaj wykonawców
              </Link>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
}
