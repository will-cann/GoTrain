import type { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  const apiKey = process.env.HEVY_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Hevy not configured on server" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") || "1";
  const pageSize = searchParams.get("pageSize") || "5";

  const response = await fetch(
    `https://api.hevyapp.com/v1/workouts?page=${page}&pageSize=${pageSize}`,
    {
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();
  return Response.json(data, { status: response.status });
};

export const config = { path: "/api/hevy-workouts" };
