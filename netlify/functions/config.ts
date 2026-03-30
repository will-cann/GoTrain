export default async () => {
  return Response.json({
    stravaConfigured: Boolean(process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET),
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    hevyConfigured: Boolean(process.env.HEVY_API_KEY),
  });
};

export const config = { path: "/api/config" };
