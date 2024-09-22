'use client'

import { useState } from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const PITCH_CLASS = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];

interface AudioFeatures {
  acousticness: number;
  danceability: number;
  energy: number;
  instrumentalness: number;
  liveness: number;
  speechiness: number;
  bpm: number;
  key: string;
}

export default function SpotifyAnalyzer() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<any | null>(null);
  const [audioFeatures, setAudioFeatures] = useState<AudioFeatures | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/spotify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });
      const results = await response.json();
      setSearchResults(results);
    } catch (err) {
      setError('Failed to search tracks. Please try again.');
      console.error(err);
    }
    setIsLoading(false);
  };

  const handleTrackSelect = async (track: any) => {
    setSelectedTrack(track);
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/spotify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trackId: track.id }),
      });
      const features = await response.json();
      setAudioFeatures({
        acousticness: features.acousticness,
        danceability: features.danceability,
        energy: features.energy,
        instrumentalness: features.instrumentalness,
        liveness: features.liveness,
        speechiness: features.speechiness,
        bpm: features.tempo,
        key: `${PITCH_CLASS[features.key]} ${features.mode === 1 ? 'Major' : 'Minor'}`,
      });
    } catch (err) {
      setError('Failed to get audio features. Please try again.');
      console.error(err);
    }
    setIsLoading(false);
  };

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
  };
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