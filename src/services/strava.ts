const STRAVA_BASE_URL = 'https://www.strava.com/api/v3';
const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

export interface StravaActivity {
    id: number;
    name: string;
    type: string;
    start_date: string;
    distance: number;
    moving_time: number;
    total_elevation_gain: number;
}

export const getStravaAuthUrl = (clientId: string, redirectUri: string) => {
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'read,activity:read_all',
        approval_prompt: 'auto',
    });
    return `${STRAVA_AUTH_URL}?${params.toString()}`;
};

export const exchangeToken = async (
    clientId: string,
    clientSecret: string,
    code: string
) => {
    const response = await fetch(STRAVA_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to exchange token');
    }

    return response.json();
};

export const refreshToken = async (
    clientId: string,
    clientSecret: string,
    refreshToken: string
) => {
    const response = await fetch(STRAVA_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to refresh token');
    }

    return response.json();
};

export const getRecentActivities = async (accessToken: string) => {
    const now = Math.floor(Date.now() / 1000);
    const oneWeekAgo = now - 7 * 24 * 60 * 60;

    const response = await fetch(
        `${STRAVA_BASE_URL}/athlete/activities?after=${oneWeekAgo}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error('Failed to fetch activities');
    }

    return response.json() as Promise<StravaActivity[]>;
};
