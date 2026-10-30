import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Volume2, 
  Plus, 
  Sparkles, 
  Heart, 
  Calendar 
} from 'lucide-react';
import { PhotoMemory } from '../types';
import { INITIAL_PHOTOS } from '../data/initialData';
import { speakText } from '../utils/audio';

interface PhotoAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  canAddPhoto?: boolean;
}

export const PhotoAlbumModal: React.FC<PhotoAlbumModalProps> = ({
  isOpen,
  onClose,
  canAddPhoto = true
}) => {
  const [photos, setPhotos] = useState<PhotoMemory[]>(INITIAL_PHOTOS);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('All');
  const [activePhoto, setActivePhoto] = useState<PhotoMemory | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newAlbum, setNewAlbum] = useState('Family Trips');
  const [newUrl, setNewUrl] = useState('');

  if (!isOpen) return null;

  const albums = ['All', 'Family Trips', 'Celebrations'];

  const filteredPhotos = selectedAlbum === 'All'
    ? photos
    : photos.filter((p) => p.album === selectedAlbum);

  const handleReadCaption = (photo: PhotoMemory) => {
    speakText(`${photo.title}. ${photo.caption}`);
  };

  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim() && newCaption.trim()) {
      const created: PhotoMemory = {
        id: `p-${Date.now()}`,
        title: newTitle,
        album: newAlbum,
        date: 'Recent',
        caption: newCaption,
        imageUrl: newUrl || 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80',
        tags: ['New Memory']
      };
      setPhotos([created, ...photos]);
      setShowAddForm(false);
      setNewTitle('');
      setNewCaption('');
      setNewUrl('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-[#F8F7F0]">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-[#263238] font-['Poppins']">
              Memory Albums &amp; Photos
            </h2>
          </div>
          {canAddPhoto && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-xl bg-[#3B664B] text-white text-xs font-semibold hover:bg-[#2D4F3B] flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Memory</span>
            </button>
          )}
        </div>

        {/* Album Filter Tabs */}
        <div className="px-6 pt-4 flex space-x-2 overflow-x-auto">
          {albums.map((alb) => (
            <button
              key={alb}
              onClick={() => setSelectedAlbum(alb)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedAlbum === alb
                  ? 'bg-[#3B664B] text-white'
                  : 'bg-[#F8F7F0] text-gray-600 hover:bg-gray-200'
              }`}
            >
              {alb}
            </button>
          ))}
        </div>

        {/* Add Photo Form */}
        {showAddForm && (
          <form onSubmit={handleAddPhoto} className="mx-6 my-4 p-4 bg-[#F8F7F0] rounded-2xl border border-gray-200 space-y-3">
            <h4 className="text-xs font-bold text-[#263238]">Add New Family Memory</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Photo Title (e.g. Tea on the veranda)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                required
              />
              <select
                value={newAlbum}
                onChange={(e) => setNewAlbum(e.target.value)}
                className="text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
              >
                <option value="Family Trips">Family Trips</option>
                <option value="Celebrations">Celebrations</option>
              </select>
            </div>
            <textarea
              placeholder="Comforting caption for patient..."
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
              rows={2}
              required
            />
            <input
              type="url"
              placeholder="Image URL (optional, defaults to family garden)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#3B664B] text-white hover:bg-[#2D4F3B]"
              >
                Save Photo Memory
              </button>
            </div>
          </form>
        )}

        {/* Photos Grid */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setActivePhoto(photo)}
              className="group bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col"
            >
              <div className="relative h-44 overflow-hidden bg-gray-100">
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-xs text-[#2D4F3B]">
                  {photo.album}
                </span>
                <span className="absolute bottom-3 right-3 px-2 py-1 rounded-md text-[10px] font-semibold bg-black/60 text-white flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{photo.date}</span>
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#263238] font-['Poppins']">
                    {photo.title}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {photo.caption}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReadCaption(photo);
                    }}
                    className="flex items-center space-x-1.5 text-xs text-[#3B664B] font-semibold hover:underline"
                    title="Read caption aloud"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Hear Story</span>
                  </button>
                  <Heart className="w-4 h-4 text-red-400 fill-red-400/20" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Full Image Modal Viewer */}
        {activePhoto && (
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 animate-in fade-in">
            <div className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden p-5 shadow-2xl">
              <button
                onClick={() => setActivePhoto(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 z-10"
              >
                ✕
              </button>
              <img
                src={activePhoto.imageUrl}
                alt={activePhoto.title}
                className="w-full h-64 object-cover rounded-2xl mb-4"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{activePhoto.date}</span>
                <button
                  onClick={() => handleReadCaption(activePhoto)}
                  className="px-3 py-1.5 rounded-xl bg-[#A8C9B0]/30 text-[#2D4F3B] text-xs font-bold flex items-center space-x-1.5"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Read Story Aloud</span>
                </button>
              </div>
              <h3 className="text-lg font-bold text-[#263238] mt-2 font-['Poppins']">
                {activePhoto.title}
              </h3>
              <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                {activePhoto.caption}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
