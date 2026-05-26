import { FlightSearchWidget } from '@/components/flights/FlightSearchWidget';
import { WorldDotsBackground } from '@/components/home/WorldDotsBackground';
import type { AirportRow } from '@/lib/database.types';

// White search-widget section. Sits BELOW the photo carousel as its own
// cleanly-separated block — no pull-up overlap, no negative margins. The
// boarding-pass widget is the focal element here, on a calm white canvas.
//
// A very-low-opacity dotted world map sits behind the widget as ambient
// texture, picking up the "travel" theme without competing for attention.
// Opacity 0.05 means the map is barely visible at distance but rewards
// closer inspection — Skyscanner/Booking-style background flourish.

export function HeroVideo({
  defaultOrigin,
  defaultDestination,
}: {
  defaultOrigin: AirportRow;
  defaultDestination: AirportRow;
}) {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Dotted world map texture — absolute, fills the section. Sits at
          z-0 so the widget naturally paints over it. */}
      <WorldDotsBackground
        className="absolute inset-0 z-0"
        opacity={0.1}
      />

      {/* More vertical padding (py-14 / py-20) gives the world map room to
          show above + below the widget at its natural 2:1 aspect ratio. */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-14 md:px-10 md:py-20">
        <FlightSearchWidget
          origin={defaultOrigin}
          destination={defaultDestination}
          tone="light"
        />
      </div>
    </section>
  );
}
