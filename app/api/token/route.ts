import { NextResponse } from 'next/server';
import SpotifyWebApi from 'spotify-web-api-js';

export async function GET(request: Request) {
  const spotifyApi = new SpotifyWebApi();
  spotifyApi.setClientId(process.env.SPOTIFY_CLIENT_ID!);
  spotifyApi.setClientSecret(process.env.SPOTIFY_CLIENT_SECRET!);

  try {
    const data = await spotifyApi.clientCredentialsGrant();
    const accessToken = data.body['access_token'];
    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error('Error getting Spotify access token:', error);
    return NextResponse.json({ error: 'Failed to get Spotify access token' }, { status: 500 });
  }
}