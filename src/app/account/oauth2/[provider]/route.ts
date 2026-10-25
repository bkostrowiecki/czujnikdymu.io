import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { syncUserAvatar } from "@/app/shared/pocketbase-avatar";
import { setSsrPbCookie } from "@/app/shared/pocketbase-ssr";
import { createPbInstance } from "@/services/pocketbase";

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

  const codeVerifier = await cookiesReq.get("codeVerifier");
  const code = searchParams.get("code");

  if (!codeVerifier || !code) {
    return new NextResponse("Missing verifier or code", { status: 400 });
  }

  try {
    const response = await pb
      .collection("users")
      .authWithOAuth2Code(provider, code, codeVerifier.value, redirectUrl, {});

    if (response.record && response.token) {
      try {
        await syncUserAvatar(
          pb,
          response.record.id,
          response.meta as Record<string, unknown> | undefined,
        );
      } catch (avatarError) {
        console.error("Failed to sync avatar:", avatarError);
      }

      await setSsrPbCookie(pb);
      cookiesReq.delete("codeVerifier");

      return NextResponse.redirect(domain);
    } else {
      return NextResponse.redirect(
        `${domain}/zaloguj-sie?error=true&provider=${provider}`,
      );
    }
  } catch (error: unknown) {
    console.log(`ERROR`);
    console.error(error);
    return new NextResponse("Error", { status: 500 });
  }
};
