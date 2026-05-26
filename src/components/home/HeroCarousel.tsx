'use client';

import { useEffect, useState } from 'react';

// Rotating image carousel for the hero. All images stack in the same box;
// the active one fades to opacity 1, the rest sit at 0. Crossfade gives a
// smoother feel than a slide animation and avoids horizontal layout shifts.
//
// Filenames sit in /public/flyme_img/ as-is (spaces + double extensions are
// preserved). We URL-encode each path so the browser can fetch them cleanly.

interface Slide {
  src: string;
  alt: string;
}

const SLIDES: Slide[] = [
  { src: '/flyme_img/Beach.jpg.jpeg',         alt: 'Beach shoreline' },
  { src: '/flyme_img/Eeifel tower.jpg.jpeg',  alt: 'Eiffel Tower, Paris' },
  { src: '/flyme_img/Japan.jpg.jpeg',         alt: 'Japan landscape' },
  { src: '/flyme_img/Rome.jpg.jpeg',          alt: 'Rome cityscape' },
  { src: '/flyme_img/Sea.jpg.jpeg',           alt: 'Ocean view' },
  { src: '/flyme_img/Swiss.png',              alt: 'Swiss Alps' },
];

// Interval between slide changes (ms). 5 seconds is the OTA sweet spot —
// long enough to absorb the image, short enough to keep motion alive.
const INTERVAL_MS = 5_000;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0" aria-roledescription="carousel">
      {SLIDES.map((slide, i) => {
        const active = i === index;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={slide.src}
            src={encodeURI(slide.src)}
            alt={slide.alt}
            // The first image is eager-loaded so the LCP isn't blocked on
            // network; the rest can wait — they're invisible until they're
            // rotated in.
            loading={i === 0 ? 'eager' : 'lazy'}
            aria-hidden={!active}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              active ? 'opacity-100' : 'opacity-0'
            }`}
          />
        );
      })}
    </div>
  );
}
