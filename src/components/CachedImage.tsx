import React, { useState, useEffect } from 'react';
import { getCachedImage } from '../lib/storage';

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  type: 'character' | 'movie';
}

const CachedImage: React.FC<CachedImageProps> = ({ src, type, ...props }) => {
  const [displaySrc, setDisplaySrc] = useState<string>(src);

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    const loadCache = async () => {
      try {
        const cachedUrl = await getCachedImage(src, type);
        if (isMounted) {
          setDisplaySrc(cachedUrl);
          if (cachedUrl.startsWith('blob:')) {
            objectUrl = cachedUrl;
          }
        }
      } catch (error) {
        console.error('Error loading cached image:', error);
      }
    };

    loadCache();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src, type]);

  return <img src={displaySrc} {...props} />;
};

export default CachedImage;
