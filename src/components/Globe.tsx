import { LuxuryText } from './ui/LuxuryText';

export function Globe() {
  return (
    <div className="relative w-full h-screen bg-[#050505] overflow-hidden flex items-center justify-center">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-60"
      >
        <source src="/globe-loop.mp4" type="video/mp4" />
      </video>
      
      <div className="relative z-10 text-center flex flex-col items-center justify-center bg-black/40 p-12 rounded-2xl backdrop-blur-sm border border-white/10">
        <LuxuryText as="h2" className="text-4xl md:text-6xl mb-6 font-light">
          Global Reach
        </LuxuryText>
        <p className="text-white/70 max-w-2xl mx-auto text-lg md:text-xl font-light mb-10 leading-relaxed">
          From international executives to global industries, our clients trust us to deliver on time, every time. Experience seamless travel across 150+ countries.
        </p>
        <button className="px-8 py-4 bg-white text-black text-sm uppercase tracking-widest hover:bg-white/90 transition-colors duration-300">
          Book The Flight
        </button>
      </div>
    </div>
  );
}
