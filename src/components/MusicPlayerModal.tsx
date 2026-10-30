import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Music, 
  Radio 
} from 'lucide-react';
import { MusicTrack } from '../types';
import { INITIAL_MUSIC_TRACKS } from '../data/initialData';
import { ambientPlayer } from '../utils/audio';

interface MusicPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MusicPlayerModal: React.FC<MusicPlayerModalProps> = ({ isOpen, onClose }) => {
  const [tracks] = useState<MusicTrack[]>(INITIAL_MUSIC_TRACKS);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(25);

  const currentTrack = tracks[currentIdx];

  useEffect(() => {
    // Check if player is currently playing
    const activeType = ambientPlayer.getPlayingType();
    if (activeType && activeType === currentTrack.soundType) {
      setIsPlaying(true);
    }
  }, [currentTrack]);

  // Simulated progress bar movement
  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 0 : prev + 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  if (!isOpen) return null;

  const togglePlay = () => {
    if (isPlaying) {
      ambientPlayer.stop();
      setIsPlaying(false);
    } else {
      ambientPlayer.start(currentTrack.soundType);
      setIsPlaying(true);
    }
  };

  const nextTrack = () => {
    const next = (currentIdx + 1) % tracks.length;
    setCurrentIdx(next);
    setProgress(0);
    ambientPlayer.start(tracks[next].soundType);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    const prev = (currentIdx - 1 + tracks.length) % tracks.length;
    setCurrentIdx(prev);
    setProgress(0);
    ambientPlayer.start(tracks[prev].soundType);
    setIsPlaying(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col p-6 max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-[#263238] font-['Poppins']">
              Calming Music
            </h2>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#1DB954]/15 text-[#1DB954] text-xs font-bold">
            <Radio className="w-3.5 h-3.5" />
            <span>Spotify Calm</span>
          </div>
        </div>

        {/* Album Artwork & Visualizer matching Screen 10 */}
        <div className="my-6 text-center">
          <div className="relative w-48 h-48 mx-auto rounded-3xl bg-gradient-to-tr from-[#A8C9B0] via-[#D8EAF5] to-[#E7DFFA] p-1.5 shadow-xl">
            <div className="w-full h-full rounded-[22px] bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center p-4">
              <div className={`w-20 h-20 rounded-2xl bg-[#3B664B] text-white flex items-center justify-center shadow-md mb-2 transition-transform duration-700 ${
                isPlaying ? 'scale-105 rotate-3' : ''
              }`}>
                <Music className="w-10 h-10" />
              </div>
              <span className="text-xs font-bold text-[#2D4F3B] uppercase tracking-wider">
                {currentTrack.category}
              </span>
            </div>
          </div>

          <div className="mt-5">
            <h3 className="text-xl font-bold text-[#263238] font-['Poppins']">
              {currentTrack.title}
            </h3>
            <p className="text-sm font-medium text-gray-500 mt-0.5">
              {currentTrack.subtitle}
            </p>
          </div>
        </div>

        {/* Progress Slider */}
        <div className="space-y-1.5 px-2">
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden cursor-pointer">
            <div
              className="bg-[#3B664B] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-gray-400 font-medium">
            <span>{Math.floor((progress * 15 * 60) / 100 / 60)}:00</span>
            <span>{currentTrack.duration}</span>
          </div>
        </div>

        {/* Main Player Controls matching Screen 10 */}
        <div className="flex items-center justify-center space-x-6 my-4">
          <button
            onClick={prevTrack}
            className="p-3 text-gray-500 hover:text-[#263238] transition-colors"
            title="Previous track"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-[#3B664B] hover:bg-[#2D4F3B] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-1" />
            )}
          </button>

          <button
            onClick={nextTrack}
            className="p-3 text-gray-500 hover:text-[#263238] transition-colors"
            title="Next track"
          >
            <SkipForward className="w-6 h-6" />
          </button>
        </div>

        {/* Playlist Selection */}
        <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pt-2 border-t border-gray-100">
          {tracks.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => {
                setCurrentIdx(idx);
                setProgress(0);
                ambientPlayer.start(t.soundType);
                setIsPlaying(true);
              }}
              className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                currentIdx === idx
                  ? 'bg-[#EEF6FB] font-bold text-[#1E4D6B]'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Volume2 className="w-3.5 h-3.5 text-[#3B664B]" />
                <span>{t.title}</span>
              </div>
              <span className="text-[10px] text-gray-400">{t.duration}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};
