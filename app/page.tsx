"use client"

import { useState, useEffect } from 'react'
import { Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
)

// Spotify API関連の定数
const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
const CLIENT_SECRET = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'
const SEARCH_ENDPOINT = 'https://api.spotify.com/v1/search'
const AUDIO_FEATURES_ENDPOINT = 'https://api.spotify.com/v1/audio-features'

// Pitchクラス配列（Keyの変換に使用）
const PITCH_CLASS = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B']

// アクセストークンを取得する関数
async function getAccessToken() {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  const data = await response.json()
  return data.access_token
}

// 曲を検索する関数
async function searchTracks(query: string) {
  const token = await getAccessToken()
  const response = await fetch(`${SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}&type=track&limit=10`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await response.json()
  return data.tracks.items
}

// 曲のオーディオ特徴を取得する関数
async function getAudioFeatures(trackId: string) {
  const token = await getAccessToken()
  const response = await fetch(`${AUDIO_FEATURES_ENDPOINT}/${trackId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await response.json()
  return {
    acousticness: data.acousticness,
    danceability: data.danceability,
    energy: data.energy,
    instrumentalness: data.instrumentalness,
    liveness: data.liveness,
    speechiness: data.speechiness,
    bpm: data.tempo,
    key: `${PITCH_CLASS[data.key]} ${data.mode === 1 ? 'Major' : 'Minor'}`,
  }
}

export default function SpotifyAnalyzer() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedTrack, setSelectedTrack] = useState(null)
  const [audioFeatures, setAudioFeatures] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSearch = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const results = await searchTracks(searchQuery)
      setSearchResults(results)
    } catch (err) {
      setError('Failed to search tracks. Please try again.')
      console.error(err)
    }
    setIsLoading(false)
  }

  const handleTrackSelect = async (track) => {
    setSelectedTrack(track)
    setIsLoading(true)
    setError(null)
    try {
      const features = await getAudioFeatures(track.id)
      setAudioFeatures(features)
    } catch (err) {
      setError('Failed to get audio features. Please try again.')
      console.error(err)
    }
    setIsLoading(false)
  }

  const chartData = {
    labels: ['Acousticness', 'Danceability', 'Energy', 'Instrumentalness', 'Liveness', 'Speechiness'],
    datasets: [
      {
        label: 'Audio Features',
        data: audioFeatures ? [
          audioFeatures.acousticness,
          audioFeatures.danceability,
          audioFeatures.energy,
          audioFeatures.instrumentalness,
          audioFeatures.liveness,
          audioFeatures.speechiness
        ] : [],
        backgroundColor: 'rgba(29, 185, 84, 0.2)',
        borderColor: 'rgb(29, 185, 84)',
        borderWidth: 1,
      },
    ],
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="bg-[#121212] rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-6">Spotify Track Analyzer</h1>
        <div className="flex space-x-4 mb-6">
          <input
            type="text"
            placeholder="Search for a track"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow bg-[#282828] text-white border-none rounded-md p-2"
            aria-label="Search for a track"
          />
          <button 
            onClick={handleSearch} 
            className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-2 px-4 rounded"
            disabled={isLoading}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
        {error && <p className="text-red-500 mb-4" role="alert">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#181818] rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Search Results</h2>
            <div className="h-[400px] overflow-y-auto">
              {searchResults.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center space-x-4 p-2 hover:bg-[#282828] cursor-pointer"
                  onClick={() => handleTrackSelect(track)}
                >
                  <img src={track.album.images[2].url} alt={track.name} className="w-10 h-10" />
                  <div>
                    <p className="font-medium">{track.name}</p>
                    <p className="text-sm text-gray-400">{track.artists[0].name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#181818] rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Audio Features</h2>
            {isLoading ? (
              <p className="text-center text-gray-400">Loading...</p>
            ) : selectedTrack && audioFeatures ? (
              <div>
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div className="bg-[#282828] p-3 rounded-md">
                    <p className="text-sm text-gray-400">BPM</p>
                    <p className="text-xl font-bold">{Math.round(audioFeatures.bpm)}</p>
                  </div>
                  <div className="bg-[#282828] p-3 rounded-md">
                    <p className="text-sm text-gray-400">Key</p>
                    <p className="text-xl font-bold">{audioFeatures.key}</p>
                  </div>
                </div>
                <Radar data={chartData} options={{
                  scales: {
                    r: {
                      angleLines: {
                        color: 'rgba(255, 255, 255, 0.1)'
                      },
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                      },
                      pointLabels: {
                        color: 'white'
                      },
                      ticks: {
                        color: 'white',
                        backdropColor: 'transparent'
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      display: false
                    }
                  }
                }} />
              </div>
            ) : (
              <p className="text-center text-gray-400">Select a track to view its audio features</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}