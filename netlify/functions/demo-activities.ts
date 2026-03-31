export default async () => {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return Response.json({ error: "Strava demo not configured" }, { status: 503 });
  }

  // Exchange refresh token for a fresh access token
  const tokenRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!tokenRes.ok) {
    return Response.json({ error: "Failed to refresh Strava token" }, { status: 502 });
  }

  const tokenData = await tokenRes.json();

  // Fetch last 7 days of activities
  const now = Math.floor(Date.now() / 1000);
  const oneWeekAgo = now - 7 * 24 * 60 * 60;

  const activitiesRes = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?after=${oneWeekAgo}`,
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
  );

  if (!activitiesRes.ok) {
    return Response.json({ error: "Failed to fetch activities" }, { status: 502 });
  }

  const activities = await activitiesRes.json();
  return Response.json(activities);
};

export const config = { path: "/api/demo-activities" };
