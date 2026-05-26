'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AirportRow } from '@/lib/database.types';
import { buildSkyscannerSearchUrl, type CabinClass } from '@/lib/affiliate';
import {
  POPULAR_AIRPORTS,
  findAirport,
  formatAirportLabel,
} from '@/lib/popular-airports';

// FlyMyTicket flight-search widget styled as a physical airline boarding pass.
// Two-pane layout on desktop: main ticket on the left, perforated stub on the
// right. On mobile the stub collapses and the field grid stacks.
//
// We still drive the same Skyscanner-affiliate redirect on submit — only the
// chrome changes.

type TripType = 'return' | 'one-way';
type Tone = 'dark' | 'light';

interface Props {
  origin: AirportRow;
  destination: AirportRow;
  // `tone` is kept for prop-compatibility with route pages that pass it, but
  // the boarding-pass design is intentionally a single look.
  tone?: Tone;
}

// ─── date helpers ───────────────────────────────────────────────────────
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function plusDaysISO(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function formatTicketDate(iso: string): string {
  if (!iso) return '—— / ——';
  const d = new Date(iso + 'T00:00:00Z');
  // dd/mm/yyyy — the format printed on most boarding passes.
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatShortDate(iso: string): string {
  if (!iso) return '—— ——';
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

// Boarding-pass branding colours — FlyMyTicket royal-blue palette.
// TICKET_RED / TICKET_RED_DARK / TICKET_RED_TINT keep their names for diff
// readability; the values are now blue. Cream body stays the same so the
// printed-ticket feel is preserved.
const TICKET_RED      = '#1B1FE3';   // header bar, search button, accents — FlyMyTicket blue
const TICKET_RED_DARK = '#1518C3';   // hover
const TICKET_CREAM    = '#FFFDF8';   // body paper (unchanged)
const TICKET_RED_TINT = '#E8E9FB';   // soft pale-blue inner-card background
const BRAND_PURPLE    = '#A039F0';   // .com mark accent from the logo
const BRAND_YELLOW    = '#FBBF24';   // warm amber accent for perforation cutouts

const SHADOW =
  'shadow-[0_30px_60px_-15px_rgba(5,32,60,0.35),0_12px_24px_-6px_rgba(5,32,60,0.22)]';

// How long the "boarding" animation runs before we actually navigate to
// Skyscanner. Long enough to read "Searching cheapest flights…" but short
// enough that users don't feel stalled. Keep in sync with the framer-motion
// transition durations below.
const LAUNCH_DURATION_MS = 1400;

export function FlightSearchWidget({ origin, destination }: Props) {
  const [tripType, setTripType] = useState<TripType>('return');
  const [from, setFrom] = useState<AirportRow>(origin);
  const [to, setTo] = useState<AirportRow>(destination);
  const [depart, setDepart] = useState<string>('');
  const [ret, setRet] = useState<string>('');
  const [adults, setAdults] = useState(1);
  const [cabin, setCabin] = useState<CabinClass>('economy');
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    const today = todayISO();
    setDepart(plusDaysISO(today, 4));
    setRet(plusDaysISO(today, 11));
  }, []);

  const minDepart = todayISO();
  const minReturn = depart ? plusDaysISO(depart, 1) : minDepart;

  const searchUrl = useMemo(
    () =>
      buildSkyscannerSearchUrl({
        originIata: from.iata,
        destinationIata: to.iata,
        departDate: depart || undefined,
        returnDate: tripType === 'return' && ret ? ret : undefined,
        adults,
        cabin,
      }),
    [from.iata, to.iata, depart, ret, tripType, adults, cabin]
  );

  function swap() {
    setFrom(to);
    setTo(from);
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLaunching) return;       // debounce — once boarded, you can't board twice
    setIsLaunching(true);
    // Drive the boarding animation, then hand off to Skyscanner in the same
    // tab. Same-tab nav (not _blank) so the back button returns to FlyMyTicket.
    window.setTimeout(() => {
      window.location.href = searchUrl;
    }, LAUNCH_DURATION_MS);
  }

  // Generate a faux flight number from the origin/destination IATAs — purely
  // decorative, makes the ticket feel real.
  const flightNo = `FM ${from.iata.slice(0, 2).toUpperCase()}${to.iata.slice(0, 2).toUpperCase()}`;

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div
        className={`relative rounded-2xl ${SHADOW} ${
          isLaunching ? 'overflow-visible' : 'overflow-hidden'
        }`}
        style={{ background: TICKET_CREAM }}
      >
        {/* Brand accent stripe — picks up the purple bar over .com in the
            FlyMyTicket logo and runs it across the whole widget top. */}
        <div className="h-[3px] w-full" style={{ background: BRAND_PURPLE }} aria-hidden />

        {/* Flight strip — absolutely positioned on the CARD wrapper so it
            spans the full card height regardless of which column (main or
            stub) is taller. Sits behind the grid; the header's blue bg
            naturally covers it in the header area. */}
        <FlightStrip />

        {/* Hole-punch perforation cutouts — two semicircles on the seam
            (240px from the card's right edge). Filled with white so they
            read as actual punched-through holes against the boarding pass
            body, instead of the blue header colour they had previously. */}
        <div
          className="pointer-events-none absolute inset-y-0 right-[240px] z-30 hidden w-0 md:block"
          aria-hidden
        >
          <span
            className="absolute -left-3 -top-3 h-6 w-6 rounded-full border-2 shadow-inner"
            style={{ background: 'white', borderColor: BRAND_PURPLE }}
          />
          <span
            className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full border-2 shadow-inner"
            style={{ background: 'white', borderColor: BRAND_PURPLE }}
          />
        </div>

        {/* `items-start` on the grid keeps each column at its own natural
            height instead of stretching both to match the tallest. Whatever
            height difference there is between the main column and the stub
            ends up as a sliver at the BOTTOM of the shorter column — which
            is invisible because both columns share the cream background. */}
        <div className="relative grid grid-cols-1 items-start md:grid-cols-[1fr_240px]">
          {/* ─── MAIN TICKET ─────────────────────────────────────────── */}
          <div className="relative">
            {/* Header bar — `h-12` (slim) so the strip matches the trip
                summary stub header on the right. Both halves use the same
                h-12 now so the perforation seam stays perfectly straight. */}
            <header
              className="flex h-12 items-center justify-between px-5 text-white md:px-7"
              style={{ background: TICKET_RED }}
            >
              <div className="flex items-center gap-2.5">
                <PlaneMark />
                {/* Brand mark — same /fly_my_tic_logo.png as nav + footer.
                    h-12 inside the boarding-pass header (now h-16). */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/final.png"
                  alt="flymyticket.com"
                  className="h-6 w-auto"
                />
              </div>
              <span className="text-xs font-bold tracking-[0.35em] md:text-sm">
                BOOK YOUR TICKET
              </span>
            </header>

            {/* Body — content area only. Flight strip lives on the card
                wrapper (not here) so it can span the full card height. */}
            <div className="relative">
              <div className="px-5 py-5 md:py-6 md:pl-24 md:pr-7">
                {/* Row 1 — primary route info */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_auto_1.2fr]">
                  <TicketField label="From">
                    <AirportCombobox airport={from} onChange={setFrom} />
                  </TicketField>

                  <div className="hidden items-end justify-center pb-1 md:flex">
                    <SwapButton onClick={swap} />
                  </div>

                  <TicketField label="To">
                    <AirportCombobox airport={to} onChange={setTo} />
                  </TicketField>
                </div>

                {/* Row 2 — ticket-style data row */}
                <div className="mt-5 grid grid-cols-2 gap-y-4 gap-x-5 md:grid-cols-4">
                  <TicketField label="Date">
                    <DatePill value={depart} min={minDepart} onChange={setDepart} />
                  </TicketField>

                  <TicketField label="Return" muted={tripType === 'one-way'}>
                    {tripType === 'return' ? (
                      <DatePill value={ret} min={minReturn} onChange={setRet} />
                    ) : (
                      <p className="text-base font-bold leading-tight text-red-700/60">ONE WAY</p>
                    )}
                  </TicketField>

                  <TicketField label="Class">
                    <select
                      value={cabin}
                      onChange={(e) => setCabin(e.target.value as CabinClass)}
                      className="w-full bg-transparent text-base font-bold leading-tight text-fg outline-none"
                      style={{ fontFamily: 'monospace' }}
                    >
                      <option value="economy">ECON</option>
                      <option value="premiumeconomy">PREM</option>
                      <option value="business">BUSI</option>
                      <option value="first">FRST</option>
                    </select>
                  </TicketField>

                  <TicketField label="Pax">
                    <select
                      value={adults}
                      onChange={(e) => setAdults(Number(e.target.value))}
                      className="w-full bg-transparent text-base font-bold leading-tight text-fg outline-none"
                      style={{ fontFamily: 'monospace' }}
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>{n} ADT</option>
                      ))}
                    </select>
                  </TicketField>
                </div>

                {/* Trip-type toggle — small pill row, like the fare class buttons on a boarding pass */}
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <TripPill
                    active={tripType === 'return'}
                    onClick={() => setTripType('return')}
                  >
                    Return
                  </TripPill>
                  <TripPill
                    active={tripType === 'one-way'}
                    onClick={() => setTripType('one-way')}
                  >
                    One Way
                  </TripPill>
                  <span
                    className="ml-auto hidden text-[10px] uppercase tracking-[0.25em] md:inline"
                    style={{ color: '#888', fontFamily: 'monospace' }}
                  >
                    E-TKT {flightNo.replace(' ', '')} · {formatShortDate(depart)}
                  </span>
                </div>

              </div>
            </div>
          </div>

          {/* ─── PERFORATED STUB ─────────────────────────────────────── */}
          {/* Left seam uses a background-image dashed pattern instead of
              CSS `border-dashed` so the dashes are uniform AND reach both
              edges — `border-dashed` truncates the last dash to fit.
              Circle cutouts removed; the uninterrupted line reads as a
              cleaner perforation.

              On submit, the stub "tears off along the perforation": it
              translates right and rotates a few degrees while fading out,
              like a real boarding-pass stub being ripped away. The card
              wrapper's overflow flips to `visible` for the duration so the
              stub can clear the card's rounded corners. */}
          <motion.aside
            className="relative hidden md:block"
            style={{
              background: TICKET_CREAM,
              backgroundImage:
                // 2px-wide vertical dashed line: 6px dash + 4px gap
                `linear-gradient(to bottom, ${TICKET_RED} 0 6px, transparent 6px 10px)`,
              backgroundSize: '2px 10px',
              backgroundRepeat: 'repeat-y',
              backgroundPosition: '0 0',
              paddingLeft: '2px', // make room for the dashed line on the left
              transformOrigin: 'left center', // hinge the rotation at the perforation
            }}
            animate={
              isLaunching
                ? { x: 600, rotate: 8, opacity: 0 }
                : { x: 0, rotate: 0, opacity: 1 }
            }
            transition={{
              duration: 0.7,
              ease: [0.5, 0, 0.75, 0], // ease-in-quart: gentle pull, then a snap
            }}
          >
            {/* Stub header — same h-12 as the main header so the red bars
                are perfectly flush across the perforation. */}
            <div
              className="flex h-12 items-center px-5 text-white"
              style={{ background: TICKET_RED }}
            >
              <p className="text-[10px] font-bold tracking-[0.3em]">TRIP SUMMARY</p>
            </div>

            {/* Stub body — From + To share a row to save vertical space;
                Date on its own; Class + Pax also share. */}
            <div className="space-y-2 px-5 py-4 text-fg" style={{ fontFamily: 'monospace' }}>
              <div className="flex gap-4">
                <StubRow label="From" value={`${from.city.toUpperCase()} ${from.iata.toUpperCase()}`} />
                <StubRow label="To"   value={`${to.city.toUpperCase()} ${to.iata.toUpperCase()}`} />
              </div>
              <StubRow label="Date" value={formatTicketDate(depart)} />
              <div className="flex gap-4">
                <StubRow label="Class" value={cabin.toUpperCase().slice(0, 4)} />
                <StubRow label="Pax"   value={`${adults} ADT`} />
              </div>

              {/* E-ticket caption — kept small, sits above the action */}
              <div className="pt-1">
                <p className="text-[9px] font-bold tracking-[0.3em] text-red-700/70">E-TICKET</p>
                <p className="mt-0.5 text-xs font-bold tracking-wide">
                  {flightNo.replace(' ', '')}-{adults}{cabin.charAt(0).toUpperCase()}
                </p>
              </div>

              {/* Search button — fills the stub width, sits at the bottom
                  of the stub as the obvious next step. Still inside the
                  form so the submit works. Disabled during launch so the
                  user can't fire a second time mid-animation. */}
              <button
                type="submit"
                disabled={isLaunching}
                className="mt-3 block w-full rounded-md px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition disabled:cursor-wait disabled:opacity-90"
                style={{ background: TICKET_RED }}
                onMouseEnter={(e) => {
                  if (!isLaunching) e.currentTarget.style.background = TICKET_RED_DARK;
                }}
                onMouseLeave={(e) => {
                  if (!isLaunching) e.currentTarget.style.background = TICKET_RED;
                }}
              >
                Search →
              </button>
            </div>
          </motion.aside>
        </div>

        {/* ─── LAUNCH OVERLAY ──────────────────────────────────────────
            Three coordinated bits appear when isLaunching:
              1. The "torn perforation" indicator on the main ticket where
                 the stub used to attach — a hint that the stub really did
                 detach, not just disappear.
              2. A plane SVG launches diagonally from the bottom-left of the
                 ticket and flies off the top-right of the viewport.
              3. A "Searching cheapest flights…" overlay drops into the
                 space the stub vacated so the user knows we're working.
            All three live OUTSIDE the grid so they paint above everything. */}
        <AnimatePresence>
          {isLaunching && (
            <>
              {/* Torn perforation — a fresh dashed line in the main-ticket
                  area, marking where the stub used to attach. */}
              <motion.div
                key="tear-line"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.35, duration: 0.2 }}
                className="pointer-events-none absolute inset-y-0 right-[240px] z-20 hidden w-px md:block"
                style={{
                  backgroundImage:
                    `linear-gradient(to bottom, ${TICKET_RED} 0 6px, transparent 6px 10px)`,
                  backgroundSize: '1px 10px',
                  backgroundRepeat: 'repeat-y',
                }}
                aria-hidden
              />

              {/* Plane takeoff — launches from inside the ticket body,
                  shoots up-and-right past the viewport edge. */}
              <motion.div
                key="launch-plane"
                initial={{ x: 0, y: 0, rotate: 0, opacity: 0, scale: 0.8 }}
                animate={{
                  x: '90vw',
                  y: '-60vh',
                  rotate: -38,
                  opacity: [0, 1, 1, 0],
                  scale: 1.4,
                }}
                transition={{
                  duration: 1.2,
                  delay: 0.25,
                  times: [0, 0.15, 0.75, 1],
                  ease: 'easeIn',
                }}
                className="pointer-events-none absolute z-50 left-10 bottom-10 text-white"
                aria-hidden
              >
                <svg width="56" height="56" viewBox="0 0 24 24" fill={TICKET_RED}>
                  <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1L15 22v-1.5L13 19v-5.5z" />
                </svg>
              </motion.div>

              {/* Searching overlay — drops into the now-vacated stub slot.
                  Subtle pulse on the dots so it reads as "working". */}
              <motion.div
                key="searching-panel"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.35 }}
                className="pointer-events-none absolute inset-y-0 right-0 z-40 hidden w-[240px] flex-col items-center justify-center gap-3 px-5 md:flex"
                aria-live="polite"
              >
                <SearchingSpinner />
                <p
                  className="text-center text-[11px] font-bold uppercase tracking-[0.25em]"
                  style={{ color: TICKET_RED, fontFamily: 'monospace' }}
                >
                  Searching<br />cheapest flights
                  <span className="inline-flex w-6 justify-start">
                    <DotsLoader />
                  </span>
                </p>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile fallback overlay — on mobile the stub is hidden, so the
          launch animation has to live somewhere else. A simple full-card
          curtain with the same searching text. */}
      <AnimatePresence>
        {isLaunching && (
          <motion.div
            key="mobile-curtain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-2xl md:hidden"
            style={{ background: 'rgba(255,253,248,0.94)' }}
            aria-live="polite"
          >
            <div className="flex flex-col items-center gap-3">
              <SearchingSpinner />
              <p
                className="text-center text-xs font-bold uppercase tracking-[0.25em]"
                style={{ color: TICKET_RED, fontFamily: 'monospace' }}
              >
                Searching cheapest flights<DotsLoader />
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}

// ─── launch-animation bits ──────────────────────────────────────────────

function SearchingSpinner() {
  // Tiny plane orbiting a circle — keeps the boarding-pass theme.
  return (
    <div className="relative h-10 w-10" aria-hidden>
      <div
        className="absolute inset-0 rounded-full border-2 border-dashed"
        style={{ borderColor: TICKET_RED, animation: 'spin 2.4s linear infinite' }}
      />
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ animation: 'spin 1.6s linear infinite' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={TICKET_RED} style={{ transform: 'translate(0,-12px) rotate(45deg)' }}>
          <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1L15 22v-1.5L13 19v-5.5z" />
        </svg>
      </div>
    </div>
  );
}

function DotsLoader() {
  // CSS-only three-dot bounce, inherits color.
  return (
    <span className="inline-flex gap-0.5 ml-0.5" aria-hidden>
      <span style={{ animation: 'dotpulse 1.4s ease-in-out 0s infinite' }}>.</span>
      <span style={{ animation: 'dotpulse 1.4s ease-in-out 0.2s infinite' }}>.</span>
      <span style={{ animation: 'dotpulse 1.4s ease-in-out 0.4s infinite' }}>.</span>
    </span>
  );
}

// ─── sub-components ─────────────────────────────────────────────────────

function TicketField({
  label,
  children,
  muted,
}: {
  label: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className={muted ? 'opacity-60' : ''}>
      <p
        className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em]"
        style={{ color: TICKET_RED, fontFamily: 'monospace' }}
      >
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

function StubRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold tracking-[0.25em]" style={{ color: TICKET_RED }}>
        {label.toUpperCase()}
      </p>
      <p className="mt-0.5 truncate text-sm font-bold leading-tight">{value}</p>
    </div>
  );
}

function TripPill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  const style = active
    ? { background: TICKET_RED, color: 'white', borderColor: TICKET_RED }
    : { background: 'transparent', color: TICKET_RED, borderColor: TICKET_RED };
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border px-3.5 py-1 text-xs font-bold uppercase tracking-wider transition"
      style={style}
    >
      {children}
    </button>
  );
}

function BoardingMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        className="text-[9px] font-bold tracking-[0.3em]"
        style={{ color: TICKET_RED }}
      >
        {label.toUpperCase()}
      </p>
      <p
        className="text-base font-bold leading-tight"
        style={{ color: TICKET_RED_DARK, fontFamily: 'monospace' }}
      >
        {value}
      </p>
    </div>
  );
}

function PlaneMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1L15 22v-1.5L13 19v-5.5z" />
    </svg>
  );
}

function SwapButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Swap origin and destination"
      className="flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white shadow-sm transition hover:rotate-180 hover:scale-110"
      style={{ borderColor: TICKET_RED, color: TICKET_RED }}
    >
      <svg
        width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
      >
        <polyline points="17 1 21 5 17 9" /><path d="M3 5h18" />
        <polyline points="7 15 3 19 7 23" /><path d="M21 19H3" />
      </svg>
    </button>
  );
}

// Flight strip — sits on the boarding-pass CARD WRAPPER (not the body),
// spanning from just below the blue header (top-14 = 56px) to the
// bottom of the card. This keeps the plane animation contained in the
// white "body" area only — it never appears over the blue header.
function FlightStrip() {
  return (
    <div
      className="absolute left-0 hidden w-16 md:block"
      style={{
        top: '48px',                         // exactly h-12, just below the header
        bottom: '0',
        background: 'white',
        // Dashed right edge — pattern of 6px dash + 4px gap, repeating
        // vertically from top to bottom with no truncation.
        backgroundImage:
          `linear-gradient(to bottom, ${TICKET_RED} 0 6px, transparent 6px 10px)`,
        backgroundSize: '2px 10px',
        backgroundRepeat: 'repeat-y',
        backgroundPosition: '100% 0',
      }}
      aria-hidden
    >
      {/* Plane climbs from the bottom of the strip to the top on loop.
          No trail/jet behind it — just the icon moving up. */}
      <div className="relative h-full overflow-hidden">
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: 0,
            animation: 'takeoff 6s linear infinite',
          }}
          aria-hidden
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#111">
            <path d="M12 2 L13 8 L21 12.5 L21 14.5 L13 12.5 L13 17 L15 19 L15 21 L12 20 L9 21 L9 19 L11 17 L11 12.5 L3 14.5 L3 12.5 L11 8 Z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// (kept the old function below if you want to bring back the bars later)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _OldBarcodeStrip() {
  const widths  = [3, 1, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 1, 2, 4, 1, 3, 1, 2, 2, 1, 3, 1, 4, 1, 2, 3];
  const heights = ['full', 'short', 'full', 'mid', 'full', 'full', 'short', 'full', 'mid', 'full',
                   'full', 'short', 'full', 'full', 'mid', 'full', 'short', 'full', 'full', 'mid',
                   'full', 'full', 'short', 'full', 'mid', 'full', 'full', 'short', 'full', 'full'];

  const BAR_TOP = 90;                          // top of the bar field
  const BAR_BOTTOM = 50;                       // distance from svg bottom
  const FIELD = 400 - BAR_TOP - BAR_BOTTOM;    // bar field height (260)

  let x = 4;
  const bars = widths.map((w, i) => {
    const tag = heights[i];
    const h = tag === 'full' ? FIELD : tag === 'mid' ? FIELD * 0.7 : FIELD * 0.4;
    const y = BAR_TOP + (FIELD - h) / 2;
    const bar = { x, w, h, y };
    x += w + 1;
    return bar;
  });

  return (
    <div
      className="absolute inset-y-0 left-0 hidden w-16 shrink-0 border-r-4 md:block"
      style={{ background: 'white', borderColor: TICKET_RED }}
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 60 400"
        preserveAspectRatio="none"
        aria-hidden
      >
        {/* ── COCKTAIL UMBRELLA (top-left) ─────────────────────── */}
        {/* All black to match the rest of the barcode. */}
        <g transform="translate(8, 10)">
          {/* Half-circle canopy */}
          <path d="M 0 14 A 14 14 0 0 1 28 14 Z" fill="#111" />
          {/* Scallop bottom edge */}
          <path d="M 0 14 Q 3.5 18 7 14 Q 10.5 18 14 14 Q 17.5 18 21 14 Q 24.5 18 28 14"
                fill="#111" />
          {/* Radial ribs (white slivers cutting through the canopy) */}
          <path d="M 14 0 L 14 14 M 4 4 L 14 14 M 24 4 L 14 14"
                stroke="white" strokeWidth="0.6" />
          {/* Stem coming down through the bars */}
          <line x1="14" y1="14" x2="14" y2="78" stroke="#111" strokeWidth="0.9" />
          {/* J-shaped handle */}
          <path d="M 14 78 Q 14 84 19 84" fill="none" stroke="#111" strokeWidth="0.9" />
        </g>

        {/* ── STRAW (top-right) ─────────────────────────────────── */}
        {/* Two thin parallel lines going up-right, with a bend */}
        <g stroke="#111" strokeWidth="1.4" fill="none" strokeLinecap="round">
          <line x1="42" y1="86" x2="50" y2="6" />
          <line x1="46" y1="86" x2="54" y2="6" />
          {/* Tiny rim ellipse so the straw "exits" cleanly into the drink */}
          <ellipse cx="48" cy="84" rx="4" ry="1.2" fill="#111" />
        </g>

        {/* ── BARCODE BARS (the cocktail body) ──────────────────── */}
        {bars.map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            fill="#111"
          />
        ))}

        {/* ── NUMBER CAPTION ────────────────────────────────────── */}
        <text
          x="30"
          y="370"
          textAnchor="middle"
          fill="#222"
          fontSize="10"
          fontFamily="monospace"
          letterSpacing="1"
          fontWeight="700"
        >
          7812*5988
        </text>
      </svg>
    </div>
  );
}

// ─── airport combobox (datalist-backed) ─────────────────────────────────
function AirportCombobox({
  airport,
  onChange,
}: {
  airport: AirportRow;
  onChange: (a: AirportRow) => void;
}) {
  const listId = useId();
  const [query, setQuery] = useState(formatAirportLabel(airport));

  useEffect(() => {
    setQuery(formatAirportLabel(airport));
  }, [airport]);

  function commit(raw: string) {
    const hit = findAirport(raw);
    if (hit) {
      onChange(hit);
      setQuery(formatAirportLabel(hit));
    } else {
      setQuery(formatAirportLabel(airport));
    }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <input
          type="text"
          list={listId}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit((e.target as HTMLInputElement).value);
            }
          }}
          onFocus={(e) => e.currentTarget.select()}
          placeholder="City or airport"
          autoComplete="off"
          spellCheck={false}
          className="w-full bg-transparent text-xl font-bold leading-tight text-fg outline-none placeholder:text-fg-muted/70"
          style={{ fontFamily: 'monospace' }}
          aria-label="Origin or destination city"
        />
        <ChevronDownIcon />
      </div>
      <p className="mt-0.5 truncate text-[11px] uppercase tracking-wider text-fg-muted">
        {airport.iata.toUpperCase()} · {truncate(airport.name, 26)}
      </p>
      <datalist id={listId}>
        {POPULAR_AIRPORTS.map((a) => (
          <option key={a.iata} value={formatAirportLabel(a)}>
            {a.country}
          </option>
        ))}
      </datalist>
    </>
  );
}

// ─── date pill ──────────────────────────────────────────────────────────
function DatePill({
  value,
  min,
  onChange,
}: {
  value: string;
  min: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  function openPicker() {
    const el = ref.current;
    if (!el) return;
    try { el.showPicker(); } catch { el.focus(); el.click(); }
  }
  return (
    <button
      type="button"
      onClick={openPicker}
      className="block w-full cursor-pointer text-left"
    >
      <div className="flex items-center gap-1.5">
        <p
          className="text-lg font-bold leading-tight text-fg"
          style={{ fontFamily: 'monospace' }}
        >
          {value ? formatTicketDate(value) : '——/——/————'}
        </p>
        <CalendarIcon />
      </div>
      <input
        ref={ref}
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        aria-label="Date"
      />
    </button>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

// ─── tiny inline icons ──────────────────────────────────────────────────
// Small affordances showing fields are interactive: chevron for city
// pickers, calendar for date pickers. Coloured to match the brand blue
// labels so they read as part of the field.
function ChevronDownIcon() {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke={TICKET_RED} strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden
      className="shrink-0"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke={TICKET_RED} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden
      className="shrink-0"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8"  y1="2" x2="8"  y2="6" />
      <line x1="3"  y1="10" x2="21" y2="10" />
    </svg>
  );
}
