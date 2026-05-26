import { useState, useEffect } from 'react';

export function useImagePreloader(imageUrls: string[]) {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let loadedCount = 0;
    const totalImages = imageUrls.length;

    if (totalImages === 0) {
      setImagesLoaded(true);
      return;
    }

    const imageObjects = imageUrls.map(url => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        loadedCount++;
        setProgress((loadedCount / totalImages) * 100);
        if (loadedCount === totalImages) {
          setImagesLoaded(true);
        }
      };
      img.onerror = () => {
        loadedCount++; // Continue even on error to prevent getting stuck
        setProgress((loadedCount / totalImages) * 100);
        if (loadedCount === totalImages) {
          setImagesLoaded(true);
        }
      }
      return img;
    });

    return () => {
      imageObjects.forEach(img => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [imageUrls]);

  return { imagesLoaded, progress };
}
