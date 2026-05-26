'use client';

import { useRef, useEffect, useState } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';
import { useImagePreloader } from '@/hooks/useImagePreloader';

// Generate image sequence URLs
const frameCount = 240; // Looks like the sequence goes up to 240 based on dir output
const imageUrls = Array.from({ length: frameCount }, (_, i) => 
  `/sequence-1/ezgif-frame-${(i + 1).toString().padStart(3, '0')}.jpg`
);

export function HeroScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { imagesLoaded, progress } = useImagePreloader(imageUrls);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  // Map scroll progress to frame index
  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, frameCount - 1]);
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    return frameIndex.onChange((v) => {
      setCurrentFrame(Math.floor(v));
    });
  }, [frameIndex]);

  useEffect(() => {
    if (!imagesLoaded || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = imageUrls[currentFrame];

    img.onload = () => {
      // Clear and draw image matching 'object-cover' behavior
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.max(hRatio, vRatio);
      const centerShift_x = (canvas.width - img.width * ratio) / 2;
      const centerShift_y = (canvas.height - img.height * ratio) / 2;
      
      ctx.drawImage(img, 0, 0, img.width, img.height,
         centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
    };
  }, [currentFrame, imagesLoaded]);

  // Set canvas size on mount and resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={containerRef} className="relative h-[400vh] bg-[#050505]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {!imagesLoaded && (
          <div className="absolute inset-0 flex items-center justify-center text-white z-50">
            Loading... {Math.round(progress)}%
          </div>
        )}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full"
        />
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
          <motion.div
            style={{ opacity: useTransform(scrollYProgress, [0, 0.2, 0.4], [1, 1, 0]) }}
            className="text-center"
          >
            <h1 className="text-white text-7xl md:text-9xl font-bold tracking-tight mb-6">
              HERITAGE FLIGHTS
            </h1>
            <p className="text-white/80 text-xl md:text-2xl tracking-[0.2em] uppercase font-light">
              Elevate Your Journey
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
