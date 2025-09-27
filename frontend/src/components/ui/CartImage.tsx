import React, { useState } from 'react';
import { apiService } from '../../services/api';

interface CartImageProps {
  imagePath: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  isPng?: boolean;
}

const CartImage: React.FC<CartImageProps> = ({ 
  imagePath, 
  alt, 
  className = "w-full h-full object-cover",
  containerClassName = "",
  isPng = false
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    const constructedUrl = apiService.getImageUrl(imagePath);
    console.log('❌ Error loading cart image:');
    console.log('  Original path:', imagePath);
    console.log('  Constructed URL:', constructedUrl);
    console.log('  Base URL:', import.meta.env.VITE_API_URL || 'http://localhost:4000');
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    console.log('✅ Cart image loaded successfully:', apiService.getImageUrl(imagePath));
    setImageLoading(false);
  };

  const fallbackBg = isPng ? 'bg-gray-100' : 'bg-primary-50';

  if (imageError || !imagePath) {
    return (
      <div className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 ${fallbackBg} flex items-center justify-center ${containerClassName}`}>
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 ${fallbackBg} ${containerClassName}`}>
      {imageLoading && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        </div>
      )}
      <img
        src={apiService.getImageUrl(imagePath)}
        alt={alt}
        className={`${className} ${imageLoading ? 'hidden' : ''}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{ display: imageLoading ? 'none' : 'block' }}
      />
    </div>
  );
};

export default CartImage;