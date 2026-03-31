import { createPbInstance } from "@/services/pocketbase";
import { cookies } from "next/headers";

export async function initializePb() {
  const pb = createPbInstance();

  const reqCookies = await cookies();

  pb.authStore.loadFromCookie(reqCookies.toString() || '');

  pb.authStore.onChange(() => {
    reqCookies.set('set-cookie', pb.authStore.exportToCookie());
  });

  try {
    pb.authStore.isValid && await pb.collection('users').authRefresh();
  } catch (_) {
    pb.authStore.clear();
  }

  return pb;
}
