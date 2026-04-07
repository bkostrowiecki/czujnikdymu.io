import { initializeSsrPb, setSsrPbCookie } from "@/app/shared/pocketbase-ssr";
import { createPbInstance } from "@/services/pocketbase";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  request: NextRequest,
  ctx: RouteContext<"/account/oauth2/[provider]">,
) => {
  const { searchParams } = new URL(request.url);
  const { provider } = await ctx.params;

  const cookiesReq = await cookies();

  const url = new URL(request.url);

  const redirectUrl = `${url.protocol}//${url.host}${url.pathname}`;
  const domain = `${url.protocol}//${url.host}`;

  // const redirectUrl = `http://localhost:3000/account/oauth2/google`;

  console.log(`url`, redirectUrl);

  const pb = await createPbInstance();

  const codeVerifier = await cookiesReq.get('codeVerifier');

  if (!codeVerifier) {
    return new Response('No verifier');
  }

  try {
    const response = await pb
      .collection("users")
      .authWithOAuth2Code(
        provider,
        searchParams.get("code")!.toString(),
        codeVerifier.value,
        redirectUrl, {}
      );

    if (response.record && response.token) {
      await setSsrPbCookie(pb);

      return Response.redirect(domain);
    } else {
      return Response.redirect(`${domain}/zaloguj-sie?error=true&provider=${provider}`);
    }
  } catch (error: any) {
    console.log(`ERROR`);
    console.error(error);
    return new Response("Error");
  }
};
