import React, { useEffect } from 'react';
import { updateImageMetadata } from '../lib/storage';

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  type: 'character' | 'movie';
}

const CachedImage: React.FC<CachedImageProps> = ({ src, type, ...props }) => {
  useEffect(() => {
    if (src) {
      updateImageMetadata(src, type);
    }
  }, [src, type]);

  return <img src={src} {...props} />;
};

export default CachedImage;
