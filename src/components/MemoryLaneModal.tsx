import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  Users, 
  MessageSquare, 
  Calendar, 
  Volume2, 
  Play, 
  Pause, 
  Plus, 
  Heart, 
  Phone 
} from 'lucide-react';
import { PhotoMemory, FamiliarFace, FamilyMessage, ImportantDate } from '../types';
import { db } from '../services/db';
import { speakText, playChime } from '../utils/audio';

interface MemoryLaneModalProps {
  isOpen: boolean;
  onClose: () => void;
  canUpload?: boolean;
}

export const MemoryLaneModal: React.FC<MemoryLaneModalProps> = ({
  isOpen,
  onClose,
  canUpload = true
}) => {
  const [activeTab, setActiveTab] = useState<'photos' | 'faces' | 'messages' | 'dates'>('photos');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoMemory | null>(null);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(false);
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newUrl, setNewUrl] = useState('');

  if (!isOpen) return null;

  const photoList: PhotoMemory[] = [
    {
      id: 'p-1',
      album: 'Family Trips',
      title: 'Visit to Mysore Palace Gardens',
      date: 'October 2022',
      caption: 'Walking through fragrant jasmine flowerbeds with Meera and little Diya.',
      imageUrl: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80',
      tags: ['Family', 'Mysore']
    },
    {
      id: 'p-2',
      album: 'Celebrations',
      title: 'Granddaughter Diya\'s 5th Birthday',
      date: 'March 2023',
      caption: 'Diya gave you the biggest slice of strawberry cake and made you laugh all afternoon.',
      imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80',
      tags: ['Diya', 'Birthday']
    },
    {
      id: 'p-3',
      album: 'Family Trips',
      title: 'Morning Walk at Cubbon Park',
      date: 'January 2024',
      caption: 'Fresh morning breeze under the giant bamboo trees with Sita.',
      imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
      tags: ['Sita', 'Park']
    },
    {
      id: 'p-4',
      album: 'Celebrations',
      title: 'Diwali Festival of Lights',
      date: 'November 2023',
      caption: 'Lighting traditional terracotta lamps together on the courtyard veranda.',
      imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
      tags: ['Diwali', 'Lights']
    },
    {
      id: 'p-5',
      album: 'Family Trips',
      title: 'Tea Garden Serenity in Ooty',
      date: 'August 2021',
      caption: 'Sipping hot cardamom tea with Rohit overlooking the emerald green hills.',
      imageUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
      tags: ['Ooty', 'Rohit']
    },
    {
      id: 'p-6',
      album: 'Celebrations',
      title: 'Family Gathering at Home',
      date: 'Pongal 2024',
      caption: 'All children and grandchildren gathered on the veranda sharing sweet jaggery pongal.',
      imageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80',
      tags: ['Pongal', 'Home']
    }
  ];

  const faces = db.getFamiliarFaces();
  const messages = db.getFamilyMessages();
  const dates = db.getImportantDates();

  const handleReadStory = (photo: PhotoMemory) => {
    speakText(`${photo.title}. ${photo.caption}`);
  };

  const handleAddPhotoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim() && newCaption.trim()) {
      setShowAddPhoto(false);
      setNewTitle('');
      setNewCaption('');
      setNewUrl('');
      playChime();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        
        {/* Header matching Section 11 */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-[#F8F7F0]">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-[#263238] font-['Poppins']">
                Memory Lane
              </h2>
              <p className="text-xs text-gray-500">
                Familiar faces, happy milestones &amp; family love
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {canUpload && activeTab === 'photos' && (
              <button
                onClick={() => setShowAddPhoto(!showAddPhoto)}
                className="px-3 py-1.5 rounded-xl bg-[#3B664B] text-white text-xs font-semibold hover:bg-[#2D4F3B] flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Memory</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Tabs matching Section 11: Photos, Faces, Messages, Dates */}
        <div className="px-6 pt-3 pb-2 bg-white border-b border-gray-100 flex space-x-2 overflow-x-auto">
          {[
            { id: 'photos', label: 'Photos', icon: ImageIcon },
            { id: 'faces', label: 'Faces', icon: Users },
            { id: 'messages', label: 'Messages', icon: MessageSquare },
            { id: 'dates', label: 'Dates', icon: Calendar }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#3B664B] text-white shadow-xs'
                    : 'bg-[#F8F7F0] text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: PHOTOS */}
          {activeTab === 'photos' && (
            <div>
              {showAddPhoto && (
                <form onSubmit={handleAddPhotoSubmit} className="mb-4 p-4 bg-[#F8F7F0] rounded-2xl border border-gray-200 space-y-2">
                  <h4 className="text-xs font-bold text-[#263238]">Add New Family Photo</h4>
                  <input
                    type="text"
                    placeholder="Memory Title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-gray-300 rounded-xl"
                    required
                  />
                  <textarea
                    placeholder="Heartwarming story for the patient..."
                    value={newCaption}
                    onChange={(e) => setNewCaption(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-gray-300 rounded-xl"
                    rows={2}
                    required
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowAddPhoto(false)}
                      className="px-3 py-1 rounded-lg text-xs font-medium text-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1 rounded-lg text-xs font-bold bg-[#3B664B] text-white"
                    >
                      Save
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {photoList.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className="group bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col"
                  >
                    <div className="relative h-32 overflow-hidden bg-gray-100">
                      <img
                        src={photo.imageUrl}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold bg-black/60 text-white">
                        {photo.date}
                      </span>
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <h4 className="text-xs font-bold text-[#263238] truncate font-['Poppins']">
                        {photo.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                        {photo.caption}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReadStory(photo);
                        }}
                        className="mt-2 text-[10px] text-[#3B664B] font-bold flex items-center space-x-1 hover:underline"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Hear Story</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: FACES */}
          {activeTab === 'faces' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {faces.map((face) => (
                <div
                  key={face.id}
                  className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-start space-x-3.5 hover:border-[#A8C9B0] transition-colors"
                >
                  <img
                    src={face.avatar}
                    alt={face.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-[#263238] truncate font-['Poppins']">
                        {face.name}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#A8C9B0]/25 text-[#2D4F3B]">
                        {face.relation}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      {face.notes}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between pt-1 border-t border-gray-100 text-[11px] text-gray-400">
                      <span>Birthday: {face.birthday || 'N/A'}</span>
                      <a
                        href={`tel:${face.phone}`}
                        className="text-[#3B664B] font-bold flex items-center space-x-1 hover:underline"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: MESSAGES */}
          {activeTab === 'messages' && (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-2 hover:border-[#A8C9B0] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <img
                        src={msg.avatar}
                        alt={msg.senderName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <span className="text-xs font-bold text-[#263238] block">
                          {msg.senderName}
                        </span>
                        <span className="text-[10px] text-gray-400">{msg.date}</span>
                      </div>
                    </div>
                    {msg.type === 'birthday' && (
                      <span className="text-xs bg-amber-50 text-amber-800 font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                        🎂 Birthday Love
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 italic bg-[#F8F7F0] p-3 rounded-xl border border-gray-100 leading-relaxed">
                    &ldquo;{msg.message}&rdquo;
                  </p>
                  <button
                    onClick={() => speakText(msg.message)}
                    className="text-[11px] text-[#3B664B] font-bold flex items-center space-x-1 hover:underline"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Play Message Aloud</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: DATES */}
          {activeTab === 'dates' && (
            <div className="space-y-3">
              {dates.map((d) => (
                <div
                  key={d.id}
                  className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between hover:border-[#A8C9B0] transition-colors"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#EEF6FB] text-[#1E4D6B] flex flex-col items-center justify-center font-bold shrink-0">
                      <Calendar className="w-5 h-5 text-[#3B664B]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#263238] font-['Poppins']">
                        {d.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {d.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#3B664B] bg-[#A8C9B0]/20 px-2.5 py-1 rounded-lg">
                      {d.date}
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-1">{d.relation}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Selected Photo Modal */}
        {selectedPhoto && (
          <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 animate-in fade-in">
            <div className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden p-5 shadow-2xl">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 z-10"
              >
                ✕
              </button>
              <img
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.title}
                className="w-full h-64 object-cover rounded-2xl mb-3"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{selectedPhoto.date}</span>
                <button
                  onClick={() => handleReadStory(selectedPhoto)}
                  className="px-3 py-1.5 rounded-xl bg-[#A8C9B0]/30 text-[#2D4F3B] text-xs font-bold flex items-center space-x-1.5"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Hear Story Aloud</span>
                </button>
              </div>
              <h3 className="text-lg font-bold text-[#263238] mt-2 font-['Poppins']">
                {selectedPhoto.title}
              </h3>
              <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                {selectedPhoto.caption}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
