'use client'

import { useState, useEffect } from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import SpotifyWebApi from 'spotify-web-api-js'

const spotifyApi = new SpotifyWebApi()

const CLIENT_ID = '8c73acd8debd48349f454af6404fa5fe'
const CLIENT_SECRET = 'c21c9541b43644bf8a2f62972d33484f'

export default function SpotifyTrackAnalyzer() {
  const [token, setToken] = useState('')
  const [search, setSearch] = useState('')
  const [tracks, setTracks] = useState([])
  const [selectedTrack, setSelectedTrack] = useState(null)
  const [audioFeatures, setAudioFeatures] = useState(null)

  useEffect(() => {
    const getToken = async () => {
      const result = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
        },
        body: 'grant_type=client_credentials'
      })

      const data = await result.json()
      setToken(data.access_token)
      spotifyApi.setAccessToken(data.access_token)
    }

    getToken()
  }, [])

  const searchTracks = async () => {
    const result = await spotifyApi.searchTracks(search)
    setTracks(result.tracks.items)
  }

  const analyzeTrack = async (track) => {
    setSelectedTrack(track)
    const features = await spotifyApi.getAudioFeaturesForTrack(track.id)
    setAudioFeatures(features)
  }

  const chartData = audioFeatures ? [
    { feature: 'Danceability', value: audioFeatures.danceability },
    { feature: 'Energy', value: audioFeatures.energy },
    { feature: 'Acousticness', value: audioFeatures.acousticness },
    { feature: 'Instrumentalness', value: audioFeatures.instrumentalness },
    { feature: 'Liveness', value: audioFeatures.liveness },
    { feature: 'Valence', value: audioFeatures.valence }
  ] : []

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Spotify Track Analyzer</h1>
        <div className="flex mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for a track"
            className="flex-grow px-4 py-2 rounded-l-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={searchTracks}
            className="px-6 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Search
          </button>
        </div>
        <div className="bg-white rounded-md shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Search Results</h2>
          <ul className="space-y-2">
            {tracks.map((track) => (
              <li key={track.id}>
                <button
                  onClick={() => analyzeTrack(track)}
                  className="text-blue-500 hover:underline"
                >
                  {track.name} - {track.artists[0].name}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {selectedTrack && (
          <div className="mt-8 bg-white rounded-md shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">{selectedTrack.name} - {selectedTrack.artists[0].name}</h2>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="feature" />
                <PolarRadiusAxis angle={30} domain={[0, 1]} />
                <Radar name="Audio Features" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}