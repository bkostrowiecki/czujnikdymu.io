/**
 * Sanitizes and prepares event description HTML for safe and rich rendering.
 *
 * - Interprets and preserves valid HTML tags (div, p, br, a, b, strong, i, em, ul, ol, li, etc.).
 * - Strips dangerous tags (script, iframe, style, form, input, button) and on* event handlers.
 * - Strips Facebook scraping artifacts (e.g. role="button" "Wyświetl mniej" / "Zobacz więcej").
 * - Converts plain text newlines (\n) to <br /> if no HTML tags are present.
 * - Normalizes links: ensures all <a> tags have a valid protocol (prepends https:// when missing).
 * - Ensures links open safely in a new tab (target="_blank", rel="noopener noreferrer").
 */
/**
 * Thoroughly removes UI artifacts from Facebook scraping (e.g. "Wyświetl mniej", "Pokaż mniej", "Zobacz mniej", "See less").
 */
export function cleanEventDescription(rawDescription?: string | null): string {
  if (!rawDescription) return "";

  let cleaned = rawDescription;

  // 1. Strip role="button" elements (e.g. <div role="button">...Wyświetl mniej...</div>)
  cleaned = cleaned.replace(
    /<(?:div|span|button|a)\b[^>]*role=["']button["'][^>]*>[\s\S]*?<\/(?:div|span|button|a)>/gi,
    "",
  );

  // 2. Strip elements that only enclose "Wyświetl/Pokaż/Zobacz mniej/więcej" or "See less/more"
  for (let pass = 0; pass < 4; pass++) {
    cleaned = cleaned.replace(
      /<([a-z0-9]+)\b[^>]*>(?:\s|<br\s*\/?>)*(?:(?:wyświetl|pokaż|zobacz)\s*(?:mniej|więcej)|see\s*(?:less|more))(?:\s|<br\s*\/?>)*<\/\1>/gi,
      "",
    );
    cleaned = cleaned.replace(
      /<(?:div|span|p)\b[^>]*>(?:\s|<br\s*\/?>)*<\/(?:div|span|p)>/gi,
      "",
    );
  }

  // 3. Strip standalone text phrases
  cleaned = cleaned
    .replace(/(?:wyświetl|pokaż|zobacz)\s*mniej/gi, "")
    .replace(/(?:wyświetl|pokaż|zobacz)\s*więcej/gi, "")
    .replace(/see\s*(?:less|more)/gi, "");

  // 4. Strip trailing empty tags or trailing breaks
  cleaned = cleaned
    .replace(/(?:<br\s*\/?>|\s)+$/gi, "")
    .trim();

  return cleaned;
}

export function formatEventDescriptionHtml(
  rawDescription?: string | null,
): string {
  if (!rawDescription) return "";

  let cleaned = cleanEventDescription(rawDescription)
    // Strip dangerous tags and their contents
    .replace(
      /<(?:script|style|iframe|object|embed|form|input|button)\b[^>]*>[\s\S]*?<\/(?:script|style|iframe|object|embed|form|input|button)>/gi,
      "",
    )
    .replace(
      /<(?:script|style|iframe|object|embed|form|input|button)\b[^>]*\/?>/gi,
      "",
    )
    // Strip inline event handlers (onclick, onload, etc.)
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    // Strip javascript: URLs in href attributes
    .replace(
      /\s+href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi,
      ' href="#"',
    );

  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(cleaned);

  if (!hasHtmlTags) {
    // If text is plain text without HTML, convert newlines to <br />
    cleaned = cleaned.replace(/\r\n/g, "\n").replace(/\n/g, "<br />");
  } else {
    // Ensure all <a> tags have a protocol in href, target="_blank", and rel="noopener noreferrer"
    cleaned = cleaned.replace(/<a\b([^>]*)>/gi, (_match, attrs) => {
      let updated = attrs;

      // Ensure href has https:// protocol if missing
      updated = updated.replace(
        /href\s*=\s*(?:(["'])([\s\S]*?)\1|([^\s>]+))/i,
        (
          _full: string,
          quote: string | undefined,
          quotedUrl: string | undefined,
          unquotedUrl: string | undefined,
        ) => {
          const rawUrl = quotedUrl !== undefined ? quotedUrl : unquotedUrl;
          let trimmed = (rawUrl || "").trim();
          const q = quote || '"';

          if (!trimmed) {
            return `href=${q}#${q}`;
          }

          if (trimmed.startsWith("//")) {
            trimmed = `https:${trimmed}`;
          } else if (!/^(?:https?:\/\/|mailto:|tel:|#)/i.test(trimmed)) {
            if (trimmed.startsWith("/")) {
              trimmed = `https://facebook.com${trimmed}`;
            } else {
              trimmed = `https://${trimmed}`;
            }
          }

          return `href=${q}${trimmed}${q}`;
        },
      );

      if (!/target\s*=/i.test(updated)) {
        updated += ' target="_blank"';
      }
      if (!/rel\s*=/i.test(updated)) {
        updated += ' rel="noopener noreferrer"';
      } else {
        updated = updated.replace(
          /rel\s*=\s*["']([^"']*)["']/i,
          (_m: string, val: string) => {
            const parts = new Set(val.split(/\s+/).filter(Boolean));
            parts.add("noopener");
            parts.add("noreferrer");
            return `rel="${Array.from(parts).join(" ")}"`;
          },
        );
      }
      return `<a${updated}>`;
    });
  }

  return cleaned.trim();
}
