import React from 'react';

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  type?: 'character' | 'movie';
}

const CachedImage: React.FC<CachedImageProps> = ({ src, type, ...props }) => {
  return <img src={src} {...props} loading="lazy" />;
};

export default CachedImage;

