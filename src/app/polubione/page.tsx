import type { Metadata } from "next";
import { FeedBrowser } from "@/app/feed/feed-browser";
import { initializeSsrPb } from "@/app/shared/pocketbase-ssr";
import UnexpectedError from "@/components/unexpected-error";
import { appName } from "@/const/app-name";
import type { GigEntity } from "@/entities/gig.entity";

export const metadata: Metadata = {
  title: `Polubione | ${appName}`,
  description:
    "Spersonalizowana lista koncertów Twoich ulubionych wykonawców, miejsc oraz zapisanych wydarzeń.",
};

export const dynamic = "force-dynamic";

export default async function PolubionePage() {
  try {
    const pb = await initializeSsrPb();

    const gigs = await pb.collection("gigs").getFullList<GigEntity>({
      sort: "startsAt",
      expand: "place,artists,artists.genres",
    });

    return <FeedBrowser gigs={gigs} />;
  } catch (err) {
    console.error("Failed to load gigs for favorites:", err);
    return <UnexpectedError />;
  }
}
