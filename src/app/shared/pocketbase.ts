import { createPbInstance } from "@/services/pocketbase";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function initializePb(res: NextResponse) {
  const pb = createPbInstance();

  const reqCookies = await cookies();

  pb.authStore.loadFromCookie(reqCookies.toString() || '');

  pb.authStore.onChange(() => {
    res.headers.set('set-cookie', pb.authStore.exportToCookie());
  });

  try {
      pb.authStore.isValid && await pb.collection('users').authRefresh();
  } catch (_) {
      pb.authStore.clear();
  }

  return pb;
}
