import React, { useRef } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { UserAvatar } from './UserAvatar';

interface ImageUploaderProps {
  photoURL?: string | null;
  name: string;
  onChangePhoto: (dataUrl: string | null) => void;
  label?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  photoURL,
  name,
  onChangePhoto,
  label = 'Profile Photo (Optional)'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress & resize image to max 400x400 canvas for fast loading
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        onChangePhoto(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2.5 my-2">
      <span className="text-xs font-semibold text-gray-700">{label}</span>

      <div className="relative group">
        <UserAvatar
          src={photoURL}
          name={name || 'User'}
          size="xl"
          className="ring-4 ring-[#A8C9B0]/40 transition-transform group-hover:scale-105"
        />

        {/* Upload Overlay Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-0 right-0 p-2 rounded-full bg-[#3B664B] hover:bg-[#2D4F3B] text-white shadow-md border-2 border-white transition-all cursor-pointer"
          title="Upload Profile Picture"
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center space-x-2 text-xs">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-[#3B664B] font-bold hover:underline cursor-pointer"
        >
          {photoURL ? 'Change Picture' : 'Upload Picture'}
        </button>

        {photoURL && (
          <>
            <span className="text-gray-300">•</span>
            <button
              type="button"
              onClick={() => onChangePhoto(null)}
              className="text-red-600 hover:text-red-800 font-medium flex items-center space-x-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Remove</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
