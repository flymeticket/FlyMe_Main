// Static hero banner — single Maldives/ocean photo, no carousel. The search
// widget lives in its own white section below (HeroVideo), so the photo here
// runs cleanly edge-to-edge with just a headline overlay on top.
//
// Server component (no 'use client') — nothing here needs interactivity now
// that the rotating carousel is gone. Slightly cheaper to ship.

const HERO_IMAGE = '/flyme_img/Sea.jpg.jpeg';

export function HeroBanner() {
  return (
    <section
      className="relative isolate h-[360px] w-full overflow-hidden md:h-[460px]"
      aria-label="Featured destination"
    >
      {/* Single full-bleed photo — eager-loaded since this is the LCP. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={encodeURI(HERO_IMAGE)}
        alt="Maldives ocean view"
        loading="eager"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      {/* Dark bottom-up gradient for headline legibility on the photo. */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30"
        aria-hidden
      />

      {/* Overlay copy — bottom-anchored above the photo. Location caption
          removed; just the headline + tagline now. */}
      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-14 md:px-10 md:pb-20">
        <div className="mx-auto w-full max-w-6xl text-white">
          <h1 className="text-3xl font-extrabold leading-[1.1] tracking-tight drop-shadow-md md:text-5xl">
            Where will you fly next?
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/90 drop-shadow md:text-base">
            Compare flights, hotels and cars across 500+ travel partners —
            then book the cheapest fare on the same site you searched.
          </p>
        </div>
      </div>
    </section>
  );
}
