import { createPbInstance } from "@/services/pocketbase";
import { cookies } from "next/headers";
import Client, { cookieParse } from "pocketbase";

export async function initializeSsrPb() {
  const pb = createPbInstance();

  const reqCookies = await cookies();

  pb.authStore.loadFromCookie(decodeURIComponent(reqCookies.toString()) || '');

  if (!pb.authStore.isValid) {
    pb.authStore.clear();
  }

  try {
    pb.authStore.isValid && await pb.collection('users').authRefresh();
  } catch (_) {
    pb.authStore.clear();
  }

  return pb;
}

export async function setSsrPbCookie(pb: Client) {
  (await cookies()).set('pb_auth', pb.authStore.exportToCookie().replace('pb_auth=', ''));
}

export async function clearSsrPbCookie() {
  (await cookies()).set('pb_auth', '');
}
