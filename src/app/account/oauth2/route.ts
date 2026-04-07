import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export const GET = async (
  request: NextRequest,
  ctx: RouteContext<"/account/oauth2">,
) => {
    const cookiesReq = await cookies();

    const { searchParams } = new URL(request.url);

    const codeVerifier = searchParams.get('codeVerifier');
    const oAuthUrl = searchParams.get('oAuthUrl');

    if (!codeVerifier || !oAuthUrl) {
        return new Response('Error');
    }

    cookiesReq.set('codeVerifier', codeVerifier);

    const decodedUrl = Buffer.from(oAuthUrl, 'base64url').toString('utf8');

    return Response.redirect(decodedUrl);
};
