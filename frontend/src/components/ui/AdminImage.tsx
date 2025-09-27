import React, { useState } from 'react';
import { adminApiService } from '../../services/adminApi';

interface AdminImageProps {
  imagePath: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

const AdminImage: React.FC<AdminImageProps> = ({ 
  imagePath, 
  alt, 
  className = "w-16 h-16 rounded-lg object-cover border border-gray-200",
  fallbackClassName = "w-16 h-16 rounded-lg border border-gray-300 bg-gray-100 flex items-center justify-center"
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    const constructedUrl = adminApiService.getImageUrl(imagePath);
    console.log('❌ Error loading image:');
    console.log('  Original path:', imagePath);
    console.log('  Constructed URL:', constructedUrl);
    console.log('  Base URL:', import.meta.env.VITE_API_URL || 'http://localhost:4000');
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    console.log('✅ Image loaded successfully:', adminApiService.getImageUrl(imagePath));
    setImageLoading(false);
  };

  if (imageError || !imagePath) {
    return (
      <div className={fallbackClassName}>
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative">
      {imageLoading && (
        <div className={fallbackClassName}>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        </div>
      )}
      <img
        src={adminApiService.getImageUrl(imagePath)}
        alt={alt}
        className={`${className} ${imageLoading ? 'hidden' : ''}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{ display: imageLoading ? 'none' : 'block' }}
      />
    </div>
  );
};

export default AdminImage;