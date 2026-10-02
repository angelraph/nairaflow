// Concentric-ring diagram in the Cosmos style: members sit on the outer ring, the pot in the middle,
// and one lit node is the member being paid this round.
export function RotationRing({ members, active = 0, size = 220 }: { members: number; active?: number; size?: number }) {
  const n = Math.max(2, Math.min(20, members));
  const c = 110;
  const r = 84;
  const nodeR = n > 12 ? 5 : n > 8 ? 6.5 : 8;

  const nodes = Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { x: c + r * Math.cos(angle), y: c + r * Math.sin(angle), lit: i === active };
  });

  return (
    <svg width={size} height={size} viewBox="0 0 220 220" role="img" aria-label={`${n} members in a rotating circle`}>
      <circle cx={c} cy={c} r={r} stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1" fill="none" />
      <circle cx={c} cy={c} r={56} stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1" fill="none" />
      <circle cx={c} cy={c} r={30} stroke="#ffffff" strokeOpacity="0.28" strokeWidth="1" fill="none" />
      <text x={c} y={c + 4} textAnchor="middle" fill="#ffffff" fontSize="11" letterSpacing="1.5">
        POT
      </text>
      {nodes.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={p.lit ? nodeR + 2 : nodeR}
          fill={p.lit ? "#9fe870" : "#1e1f20"}
          stroke={p.lit ? "#9fe870" : "#ffffff"}
          strokeOpacity={p.lit ? 1 : 0.45}
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}
