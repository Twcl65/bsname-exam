// =============================================
// S3 Image Component
// Description: Component for displaying images from S3 with fallback support
// =============================================

import React, { useState } from 'react';
import Image from 'next/image';

interface S3ImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
  quality?: number;
  fill?: boolean;
  sizes?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function S3Image({
  src,
  alt,
  width,
  height,
  className,
  fallbackSrc = '/placeholder-image.jpg',
  priority = false,
  quality = 75,
  fill = false,
  sizes,
  style,
  onClick,
}: S3ImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImageSrc(fallbackSrc);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // If it's a remote URL, use it directly
  if (src?.startsWith('https://')) {
    return (
      <div className={`relative ${className || ''}`} style={style} onClick={onClick}>
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
        )}
        <Image
          src={imageSrc}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          priority={priority}
          quality={quality}
          sizes={sizes}
          onError={handleError}
          onLoad={handleLoad}
          className={`transition-opacity duration-300 object-cover ${fill ? 'w-full h-full' : ''} ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        />
      </div>
    );
  }

  // If it's a local API route, use the existing image serving route
  return (
    <div className={`relative ${className || ''}`} style={style} onClick={onClick}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      <Image
        src={imageSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        sizes={sizes}
        onError={handleError}
        onLoad={handleLoad}
        className={`transition-opacity duration-300 object-cover ${fill ? 'w-full h-full' : ''} ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      />
    </div>
  );
}

// Utility function to get image URL
export function getImageUrl(imageId: string, type: 'profile' | 'subject' | 'question' | 'option-a' | 'option-b' | 'option-c' | 'option-d' | 'uploaded'): string {
  if (!imageId) return '';
  
  // If it's already a remote URL, return as is
  if (imageId.startsWith('https://')) {
    return imageId;
  }
  
  // Otherwise, use the API route
  return `/api/images/${type}/${imageId}`;
}

// Utility function to check if URL is a remote URL
export function isS3Url(url: string): boolean {
  return url?.startsWith('https://');
}
