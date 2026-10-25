import type Client from "pocketbase";

export function extractOAuthAvatarUrl(
  meta: Record<string, unknown> | null | undefined,
): string | null {
  if (!meta || typeof meta !== "object") return null;

  if (typeof meta.avatarURL === "string" && meta.avatarURL.trim()) {
    return meta.avatarURL.trim();
  }
  if (typeof meta.avatarUrl === "string" && meta.avatarUrl.trim()) {
    return meta.avatarUrl.trim();
  }

  const raw = meta.rawUser;
  if (raw && typeof raw === "object") {
    const rawRecord = raw as Record<string, unknown>;

    if (typeof rawRecord.picture === "string" && rawRecord.picture.trim()) {
      return rawRecord.picture.trim();
    }

    if (
      typeof rawRecord.picture === "object" &&
      rawRecord.picture !== null &&
      typeof (rawRecord.picture as Record<string, unknown>).data === "object" &&
      (rawRecord.picture as Record<string, unknown>).data !== null &&
      typeof (
        (rawRecord.picture as Record<string, unknown>).data as Record<
          string,
          unknown
        >
      ).url === "string"
    ) {
      const url = (
        (rawRecord.picture as Record<string, unknown>).data as Record<
          string,
          unknown
        >
      ).url as string;
      if (url.trim()) return url.trim();
    }

    if (
      typeof rawRecord.avatar_url === "string" &&
      rawRecord.avatar_url.trim()
    ) {
      return rawRecord.avatar_url.trim();
    }

    if (Array.isArray(rawRecord.images) && rawRecord.images.length > 0) {
      const firstImg = rawRecord.images[0];
      if (
        typeof firstImg === "object" &&
        firstImg !== null &&
        typeof (firstImg as Record<string, unknown>).url === "string"
      ) {
        const url = (firstImg as Record<string, unknown>).url as string;
        if (url.trim()) return url.trim();
      }
    }

    if (
      typeof rawRecord.profile_image_url_https === "string" &&
      rawRecord.profile_image_url_https.trim()
    ) {
      return rawRecord.profile_image_url_https.trim();
    }
    if (
      typeof rawRecord.profile_image_url === "string" &&
      rawRecord.profile_image_url.trim()
    ) {
      return rawRecord.profile_image_url.trim();
    }
  }

  return null;
}

export async function downloadAvatarFile(
  url: string,
  userId: string,
): Promise<File | null> {
  if (!url || !url.startsWith("http")) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`Failed to fetch avatar from ${url}, status: ${res.status}`);
      return null;
    }

    const contentType = (res.headers.get("content-type") || "image/jpeg")
      .split(";")[0]
      .trim()
      .toLowerCase();

    if (!contentType.startsWith("image/")) {
      console.warn(`Unexpected content-type for avatar: ${contentType}`);
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return null;
    }

    let ext = "jpg";
    if (contentType.includes("png")) ext = "png";
    else if (contentType.includes("webp")) ext = "webp";
    else if (contentType.includes("gif")) ext = "gif";
    else if (contentType.includes("svg")) ext = "svg";
    else if (contentType.includes("jpeg") || contentType.includes("jpg"))
      ext = "jpg";

    const fileName = `avatar_${userId}_${Date.now()}.${ext}`;
    return new File([arrayBuffer], fileName, { type: contentType });
  } catch (err) {
    console.warn(`Error downloading avatar from ${url}:`, err);
    return null;
  }
}

export async function syncUserAvatar(
  pb: Client,
  userId: string,
  meta: Record<string, unknown> | null | undefined,
): Promise<boolean> {
  const avatarUrl = extractOAuthAvatarUrl(meta);
  if (!avatarUrl) {
    return false;
  }

  try {
    const avatarFile = await downloadAvatarFile(avatarUrl, userId);
    if (!avatarFile) {
      return false;
    }

    const formData = new FormData();
    formData.append("avatar", avatarFile);

    const currentUser = pb.authStore.record;
    if (!currentUser?.name) {
      const metaName =
        meta?.name ??
        (meta?.rawUser as Record<string, unknown> | undefined)?.name;
      if (typeof metaName === "string" && metaName.trim()) {
        formData.append("name", metaName.trim());
      }
    }

    const updatedRecord = await pb
      .collection("users")
      .update(userId, formData, { requestKey: null });

    if (pb.authStore.record?.id === userId) {
      pb.authStore.save(pb.authStore.token, updatedRecord);
    }

    return true;
  } catch (err) {
    console.error(`Failed to update avatar for user ${userId}:`, err);
    return false;
  }
}
