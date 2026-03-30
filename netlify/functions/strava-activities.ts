import type { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return Response.json({ error: "Authorization header required" }, { status: 401 });
  }

  const now = Math.floor(Date.now() / 1000);
  const oneWeekAgo = now - 7 * 24 * 60 * 60;

  const response = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?after=${oneWeekAgo}`,
    { headers: { Authorization: authHeader } }
  );

  const data = await response.json();
  return Response.json(data, { status: response.status });
};

export const config = { path: "/api/strava-activities" };
