// Inline SVG dotted-world-map background, drawn as a SVG <pattern> of dots
// clipped to simplified continent paths. Used as a subtle texture behind the
// search-widget area of the homepage so the white block has some "travel"
// character without competing with the boarding pass card sitting on top.
//
// Implementation notes:
//   • viewBox is 1000x500 to roughly match a 2:1 world-map aspect.
//   • A single <pattern id="dots"> defines the dot grid (10px cell, 1.4px
//     circle). Pattern reuse keeps the markup compact — every continent path
//     just sets fill="url(#dots)" rather than embedding its own dot field.
//   • Continent paths are intentionally low-poly. Geographic accuracy isn't
//     the point at 4% opacity — the user just needs the silhouette to read
//     as "world".
//   • Stroke is omitted; dots alone do the job.
//
// Use:
//   <WorldDotsBackground className="absolute inset-0" />
// at the same DOM level as the content you want to sit on top.

interface Props {
  className?: string;
  /** 0–1. Defaults to 0.05 (very subtle). Bump up to verify it's rendering. */
  opacity?: number;
  /** Dot colour. Defaults to the FlyMyTicket brand blue. */
  color?: string;
}

export function WorldDotsBackground({
  className = '',
  opacity = 0.05,
  color = '#1B1FE3',
}: Props) {
  return (
    <div
      className={`pointer-events-none select-none ${className}`}
      aria-hidden
      style={{ opacity }}
    >
      {/* preserveAspectRatio=slice (cover) — the SVG scales to cover the
          full section width AND height, cropping whichever dimension
          overflows. On wide sections this means the top/bottom of the map
          gets clipped a little, but the continents stretch out into the
          left/right gutters that `meet` left empty (and that the widget /
          cards don't cover anyway). End result: dotted continents visible
          in the white space around the centred content. */}
      <svg
        viewBox="0 0 1000 500"
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 10×10 px tile with a tiny circle in the centre — clipped by
              continent paths to form the dotted-landmass look. */}
          <pattern
            id="world-dots"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="5" cy="5" r="1.4" fill={color} />
          </pattern>
        </defs>

        {/* Continents — simplified polygons. The shapes aren't cartographically
            accurate but they read as the right landmasses once dotted. */}
        <g fill="url(#world-dots)">
          {/* NORTH AMERICA — Alaska sweep down through US to Mexico */}
          <path d="M 80,80 L 200,70 L 260,90 L 280,150 L 270,210 L 240,260 L 200,290 L 170,290 L 140,260 L 120,210 L 100,160 L 80,120 Z" />
          {/* GREENLAND — small lobe top-right of N. America */}
          <path d="M 320,60 L 370,55 L 380,90 L 360,120 L 330,110 Z" />
          {/* CENTRAL AMERICA bridge */}
          <path d="M 220,300 L 250,310 L 260,330 L 240,340 L 220,330 Z" />
          {/* SOUTH AMERICA — broad north, taper south */}
          <path d="M 260,340 L 320,330 L 340,380 L 330,440 L 300,470 L 280,460 L 270,420 L 260,380 Z" />
          {/* EUROPE */}
          <path d="M 470,110 L 530,100 L 560,130 L 555,170 L 520,180 L 480,170 L 465,140 Z" />
          {/* AFRICA — north bulge, south taper */}
          <path d="M 480,200 L 555,200 L 575,240 L 570,310 L 550,360 L 525,390 L 500,370 L 485,320 L 475,260 Z" />
          {/* MIDDLE EAST */}
          <path d="M 565,190 L 605,190 L 615,225 L 600,245 L 575,240 Z" />
          {/* ASIA — Russia + China + SE Asia mass */}
          <path d="M 560,80 L 720,70 L 830,90 L 870,130 L 880,180 L 850,220 L 800,240 L 740,250 L 690,240 L 640,220 L 605,195 L 575,170 L 560,130 Z" />
          {/* INDIAN SUBCONTINENT */}
          <path d="M 660,240 L 700,240 L 705,275 L 685,290 L 665,275 Z" />
          {/* SOUTHEAST ASIA / INDONESIA archipelago — three small lobes */}
          <path d="M 770,280 L 810,275 L 825,300 L 800,315 L 775,305 Z" />
          <path d="M 830,300 L 855,295 L 860,315 L 840,322 Z" />
          {/* AUSTRALIA */}
          <path d="M 810,370 L 880,365 L 905,395 L 890,425 L 850,430 L 815,415 L 805,395 Z" />
          {/* NEW ZEALAND */}
          <path d="M 915,425 L 935,430 L 930,455 L 915,450 Z" />
        </g>
      </svg>
    </div>
  );
}
