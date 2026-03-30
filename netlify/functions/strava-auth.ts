import type { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  const clientId = process.env.STRAVA_CLIENT_ID;
  if (!clientId) {
    return Response.json({ error: "Strava not configured on server" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const redirectUri = searchParams.get("redirect_uri");
  if (!redirectUri) {
    return Response.json({ error: "redirect_uri required" }, { status: 400 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "read,activity:read_all",
    approval_prompt: "auto",
  });

  return Response.json({ url: `https://www.strava.com/oauth/authorize?${params}` });
};

export const config = { path: "/api/strava-auth" };
