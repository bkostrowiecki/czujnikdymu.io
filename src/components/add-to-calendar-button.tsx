"use client";

import { useState } from "react";
import { Button } from "react-bootstrap";

export interface CalendarGigData {
  id: string;
  title: string;
  description?: string;
  startsAt?: string;
  sourceUrl?: string;
  place?: {
    name?: string;
    city?: string;
    address?: string;
  };
  artists?: Array<{ name: string }>;
}

export interface AddToCalendarButtonProps {
  gig: CalendarGigData;
  className?: string;
  size?: "sm" | "lg";
  variant?: string;
}

export function AddToCalendarButton({
  gig,
  className = "",
  size = "sm",
  variant = "outline-light",
}: AddToCalendarButtonProps) {
  const [downloaded, setDownloaded] = useState(false);

  if (!gig.startsAt) {
    return null;
  }

  const normalizedDateStr = gig.startsAt.includes("T")
    ? gig.startsAt
    : gig.startsAt.replace(" ", "T");
  const startDate = new Date(normalizedDateStr);

  if (Number.isNaN(startDate.getTime())) {
    return null;
  }

  // Domyślny czas trwania koncertu: 3 godziny
  const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

  const locationParts = [
    gig.place?.name,
    gig.place?.address,
    gig.place?.city,
  ].filter(Boolean);
  const location = locationParts.join(", ");

  const gigPageUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/koncerty/${gig.id}`
      : `https://czujnikdymu.pl/koncerty/${gig.id}`;

  const cleanDescription = (gig.description || "")
    .replace(/<br\s*[/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const truncatedDesc =
    cleanDescription.length > 500
      ? `${cleanDescription.slice(0, 500)}...`
      : cleanDescription;

  const artistsLine =
    gig.artists && gig.artists.length > 0
      ? `Wykonawcy: ${gig.artists.map((a) => a.name).join(", ")}`
      : "";

  const lines = [
    gig.title,
    location ? `Miejsce: ${location}` : "",
    artistsLine,
    `Więcej informacji: ${gigPageUrl}`,
    gig.sourceUrl ? `Źródło: ${gig.sourceUrl}` : "",
    truncatedDesc ? `\nOpis:\n${truncatedDesc}` : "",
  ].filter(Boolean);

  const description = lines.join("\n\n");

  const formatGoogleUtc = (date: Date) => {
    return date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  };

  const handleAddToCalendar = () => {
    const escapeIcs = (str: string) => {
      return str
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\r?\n/g, "\\n");
    };

    const dtStamp = formatGoogleUtc(new Date());
    const dtStart = formatGoogleUtc(startDate);
    const dtEnd = formatGoogleUtc(endDate);

    const icsLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Czujnik Dymu//PL",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:gig-${gig.id}@czujnikdymu.pl`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeIcs(gig.title)}`,
      location ? `LOCATION:${escapeIcs(location)}` : "",
      `DESCRIPTION:${escapeIcs(description)}`,
      `URL;VALUE=URI:${escapeIcs(gigPageUrl)}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].filter(Boolean);

    const icsContent = icsLines.join("\r\n");
    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    const slug = gig.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    a.download = `${slug || "koncert"}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    setDownloaded(true);
    setTimeout(() => {
      setDownloaded(false);
    }, 2500);
  };

  return (
    <Button
      variant={downloaded ? "outline-success" : variant}
      size={size}
      onClick={handleAddToCalendar}
      className={`d-inline-flex align-items-center gap-2 px-3 py-1 shadow-sm ${className}`}
      style={{
        borderColor: downloaded ? undefined : "rgba(255, 255, 255, 0.25)",
        transition: "all 0.2s ease",
      }}
      title="Dodaj do swojego domyślnego kalendarza"
      type="button"
    >
      <i
        className={`bi ${downloaded
            ? "bi-check-lg text-success"
            : "bi-calendar-plus text-primary"
          } fs-6`}
      />
      <span>{downloaded ? "Dodano wpis" : "Dodaj do kalendarza"}</span>
    </Button>
  );
}
