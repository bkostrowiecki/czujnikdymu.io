import { cookies } from "next/headers";
import type Client from "pocketbase";
import { cookieParse } from "pocketbase";
import { createPbInstance } from "@/services/pocketbase";

export async function initializeSsrPb() {
  const pb = createPbInstance();

  const reqCookies = await cookies();
  const pbAuth = reqCookies.get("pb_auth")?.value;

  if (pbAuth) {
    // Try to load either raw JSON or decodeURIComponent
    try {
      const decoded = decodeURIComponent(pbAuth);
      pb.authStore.loadFromCookie(`pb_auth=${decoded}`);
    } catch {
      pb.authStore.loadFromCookie(`pb_auth=${pbAuth}`);
    }
  }

  if (!pb.authStore.isValid) {
    pb.authStore.clear();
  }

  try {
    if (pb.authStore.isValid) {
      await pb.collection("users").authRefresh({ requestKey: null });
    }
  } catch (_) {
    pb.authStore.clear();
  }

  return pb;
}

export async function setSsrPbCookie(pb: Client) {
  const rawCookie = pb.authStore.exportToCookie({ httpOnly: false });
  const parsed = cookieParse(rawCookie);
  const pbAuthVal = parsed.pb_auth;

  if (pbAuthVal) {
    (await cookies()).set("pb_auth", pbAuthVal, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      httpOnly: false,
    });
  }
}

export async function clearSsrPbCookie() {
  (await cookies()).set("pb_auth", "", {
    path: "/",
    maxAge: 0,
  });
}
