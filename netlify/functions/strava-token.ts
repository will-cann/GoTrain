import type { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return Response.json({ error: "Strava not configured on server" }, { status: 503 });
  }

  const body = await req.json();
  const payload: Record<string, string> = {
    client_id: clientId,
    client_secret: clientSecret,
  };

  if (body.code) {
    payload.code = body.code;
    payload.grant_type = "authorization_code";
  } else if (body.refresh_token) {
    payload.refresh_token = body.refresh_token;
    payload.grant_type = "refresh_token";
  } else {
    return Response.json({ error: "code or refresh_token required" }, { status: 400 });
  }

  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    return Response.json({ error: data.message || "Token exchange failed", details: data }, { status: response.status });
  }
  return Response.json(data);
};

export const config = { path: "/api/strava-token" };
