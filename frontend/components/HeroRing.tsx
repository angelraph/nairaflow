// The hero diagram, in the spirit of the Cosmos globe: concentric rings that turn slowly, members on the
// outer ring, the pot at the centre, and one lit node that is the member being paid this round.
// Labels are fixed to the frame; only the rings and nodes move.
const C = 200;

function ringNodes(count: number, r: number, offset = 0) {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 + offset;
    return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
  });
}

export function HeroRing() {
  const outer = ringNodes(6, 150, -Math.PI / 2);
  const mid = ringNodes(4, 96, 0.4);
  const origin = { transformOrigin: `${C}px ${C}px` } as const;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]">
      <svg viewBox="0 0 400 400" className="h-full w-full" role="img" aria-label="Six members around a shared pot, one of them being paid this round">
        <circle cx={C} cy={C} r={190} stroke="#ffffff" strokeOpacity="0.07" fill="none" />
        <circle cx={C} cy={C} r={150} stroke="#ffffff" strokeOpacity="0.2" fill="none" />
        <circle cx={C} cy={C} r={96} stroke="#ffffff" strokeOpacity="0.14" fill="none" strokeDasharray="2 6" />
        <circle cx={C} cy={C} r={46} stroke="#085556" strokeOpacity="0.9" fill="none" />

        <g className="animate-orbit-slow" style={origin}>
          {outer.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={i === 0 ? 11 : 8} fill={i === 0 ? "#9fe870" : "#000000"} stroke={i === 0 ? "#9fe870" : "#ffffff"} strokeOpacity={i === 0 ? 1 : 0.5} strokeWidth="1.5" />
            </g>
          ))}
        </g>

        <g className="animate-orbit-fast" style={origin}>
          {mid.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#ffffff" fillOpacity="0.55" />
          ))}
        </g>

        <g className="animate-orbit-mid" style={origin}>
          <circle cx={C} cy={C - 190} r="4" fill="#22e2a8" />
        </g>

        <image href="/brand/mark-640.png" x={C - 33} y={C - 26} width="66" height="51" />
        <text x={C} y={C + 66} textAnchor="middle" fill="#ffffff" fillOpacity="0.75" fontSize="10" letterSpacing="2.4">
          POT
        </text>
      </svg>

      <span className="absolute left-0 top-[10%] hidden text-xs tracking-wide text-slate sm:block">
        <span className="mr-2 inline-block h-px w-8 bg-sand align-middle" />
        Members pay in
      </span>
      <span className="absolute bottom-[12%] right-0 hidden text-xs tracking-wide text-slate sm:block">
        One is paid each round
        <span className="ml-2 inline-block h-px w-8 bg-sand align-middle" />
      </span>
      <span className="absolute bottom-0 left-[8%] hidden text-xs tracking-wide text-slate sm:block">
        <span className="mr-2 inline-block h-px w-8 bg-sand align-middle" />
        A contract holds the pot
      </span>
    </div>
  );
}
