import type { ReactNode } from "react";

/**
 * The four TinyFish tools, drawn as one little agent doing the job in person.
 * The agent is a blocky creature (square body, two arms, four legs) in white, with rectangle
 * glasses and a green hat. Each scene is a 560 x 292 drawing; motion is CSS only and stops for
 * reduced-motion visitors (see `.scene` in globals.css).
 */

const LINE = "rgba(250,249,246,0.38)";
const FAINT = "rgba(250,249,246,0.09)";
const MID = "rgba(250,249,246,0.2)";
const GREEN = "#3fbf8f";
const BODY = "#ffffff";
const EDGE = "#cfcdc4";
const INK = "#1c1c1c";

/** An arm: a thick white bar with a darker edge and a square hand. Coordinates are in the agent's own space. */
function Arm({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={EDGE} strokeWidth="10" strokeLinecap="square" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={BODY} strokeWidth="7.5" strokeLinecap="square" />
      <rect x={x2 - 6} y={y2 - 6} width="12" height="12" rx="2" fill={BODY} stroke={EDGE} strokeWidth="1.5" />
    </g>
  );
}

/** The agent. Origin is the top-left of the body (64 x 46); the hat sits above y = 0. */
function Agent({ look = 0, legs = true, arms }: { look?: number; legs?: boolean; arms?: ReactNode }) {
  return (
    <g>
      {legs
        ? [8, 20, 37, 49].map((x) => <rect key={x} x={x} y="43" width="7" height="14" fill="#e7e5dc" stroke={EDGE} strokeWidth="1" />)
        : null}
      <rect width="64" height="46" rx="4" fill={BODY} stroke={EDGE} strokeWidth="1.5" />
      {/* Rectangle glasses, with the eyes behind them. */}
      <rect x={16 + look} y="14" width="5" height="9" fill={INK} />
      <rect x={43 + look} y="14" width="5" height="9" fill={INK} />
      <rect x="9" y="10" width="19" height="17" rx="1.5" fill="rgba(160,200,190,0.22)" stroke={INK} strokeWidth="2.2" />
      <rect x="36" y="10" width="19" height="17" rx="1.5" fill="rgba(160,200,190,0.22)" stroke={INK} strokeWidth="2.2" />
      <line x1="28" y1="16" x2="36" y2="16" stroke={INK} strokeWidth="2.2" />
      <line x1="9" y1="15" x2="3" y2="13" stroke={INK} strokeWidth="2" />
      <line x1="55" y1="15" x2="61" y2="13" stroke={INK} strokeWidth="2" />
      {/* The hat: a flat crown with a brim, in the brand green. */}
      <rect x="-4" y="-6" width="72" height="7" rx="2" fill="#0b5a40" />
      <rect x="9" y="-24" width="46" height="19" rx="3" fill="#0f6e4e" />
      <rect x="9" y="-11" width="46" height="5" fill={GREEN} />
      {arms}
    </g>
  );
}

function Window({ x, y, w, h, bar = true }: { x: number; y: number; w: number; h: number; bar?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="10" fill={FAINT} stroke={LINE} strokeWidth="1.5" />
      {bar ? (
        <>
          <line x1={x} y1={y + 32} x2={x + w} y2={y + 32} stroke={MID} />
          {[18, 32, 46].map((d) => (
            <circle key={d} cx={x + d} cy={y + 16} r="4" fill={MID} />
          ))}
          <rect x={x + 64} y={y + 9} width={Math.min(170, w - 90)} height="14" rx="7" fill={FAINT} stroke={MID} />
        </>
      ) : null}
    </g>
  );
}

function Frame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 560 292" className="scene block h-auto w-full" role="img" aria-label={label}>
      <line x1="0" y1="276" x2="560" y2="276" stroke={MID} strokeDasharray="3 7" strokeLinecap="round" />
      {children}
    </svg>
  );
}

/** Fetch: the agent pulls data straight off the page and tosses it into a storage bucket. */
function FetchScene() {
  return (
    <Frame label="An agent pulls rows of data off a web page and drops them into a bucket">
      <Window x={24} y={34} w={236} h={242} />
      <rect x="44" y="84" width="120" height="10" rx="3" fill={MID} />
      <rect x="44" y="104" width="180" height="7" rx="3" fill={FAINT} />
      <rect x="44" y="118" width="150" height="7" rx="3" fill={FAINT} />
      {[146, 176, 206].map((y) => (
        <rect key={y} x="44" y={y} width="198" height="22" rx="4" fill="rgba(63,191,143,0.16)" stroke={GREEN} strokeOpacity="0.55" />
      ))}
      <rect x="44" y="238" width="90" height="7" rx="3" fill={FAINT} />

      {/* Data flying from the page into the bucket. */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i} className="sc-chip" style={{ animationDelay: `${i * 0.9}s` }}>
          <rect x="236" y={150 + (i % 3) * 30} width="20" height="13" rx="3" fill={GREEN} />
          <line x1="240" y1={156 + (i % 3) * 30} x2="252" y2={156 + (i % 3) * 30} stroke={INK} strokeWidth="2" strokeLinecap="round" />
        </g>
      ))}

      <g transform="translate(308 219)">
        <Agent
          look={-3}
          arms={
            <>
              <g className="sc-pull" style={{ transformOrigin: "0px 24px" }}>
                <Arm x1={0} y1={24} x2={-44} y2={-6} />
              </g>
              <Arm x1={64} y1={24} x2={88} y2={34} />
            </>
          }
        />
      </g>

      {/* The bucket. */}
      <g>
        <path d="M412 238 H488 L478 276 H422 Z" fill="#2f2f2c" stroke={LINE} strokeWidth="1.5" strokeLinejoin="round" />
        <ellipse cx="450" cy="238" rx="38" ry="7" fill="#1c1c1c" stroke={LINE} strokeWidth="1.5" />
        <path d="M416 238 C416 196 484 196 484 238" fill="none" stroke={LINE} strokeWidth="2.5" />
        <path d="M424 252 H476" stroke={GREEN} strokeWidth="2" strokeOpacity="0.7" />
      </g>
    </Frame>
  );
}

/** Search: the agent sweeps a handheld magnifying glass over a page of results to find the right one. */
function SearchScene() {
  return (
    <Frame label="An agent sweeps a magnifying glass over a page of search results">
      <Window x={24} y={34} w={290} h={242} />
      <rect x="44" y="84" width="190" height="22" rx="11" fill={FAINT} stroke={MID} />
      {[0, 1, 2, 3, 4].map((k) => (
        <g key={k}>
          <rect
            x="44"
            y={122 + k * 30}
            width="250"
            height="22"
            rx="4"
            fill={k === 2 ? "rgba(63,191,143,0.2)" : FAINT}
            stroke={k === 2 ? GREEN : "none"}
            strokeOpacity="0.7"
          />
          <rect x="54" y={130 + k * 30} width={k === 2 ? 150 : 90 + ((k * 37) % 80)} height="6" rx="3" fill={k === 2 ? GREEN : MID} />
        </g>
      ))}

      <g transform="translate(372 219)">
        <Agent
          look={-3}
          arms={
            <>
              <g className="sc-scan" style={{ transformOrigin: "0px 24px" }}>
                <Arm x1={0} y1={24} x2={-46} y2={-2} />
                {/* Handle, then the lens. */}
                <line x1={-50} y1={-6} x2={-70} y2={-26} stroke="#a8a69c" strokeWidth="6" strokeLinecap="round" />
                <circle cx={-96} cy={-50} r="28" fill="rgba(255,255,255,0.08)" stroke={BODY} strokeWidth="5" />
                <path d="M-112 -62 A 20 20 0 0 1 -96 -70" fill="none" stroke={BODY} strokeOpacity="0.8" strokeWidth="3" strokeLinecap="round" />
              </g>
              <Arm x1={64} y1={24} x2={86} y2={34} />
            </>
          }
        />
      </g>
    </Frame>
  );
}

/** Agent: the agent is inside the page, walking along it and working the form by hand. */
function BrowseScene() {
  return (
    <Frame label="An agent walks along a web page and works its search form by hand">
      <Window x={24} y={34} w={512} h={242} />
      <rect x="48" y="84" width="140" height="10" rx="3" fill={MID} />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={330 + i * 62} y="86" width="46" height="6" rx="3" fill={FAINT} />
      ))}

      {/* The form: an address field and a button. They light up as the agent reaches them. */}
      <rect x="48" y="130" width="230" height="30" rx="7" fill={FAINT} stroke={MID} />
      <rect className="sc-glow-a" x="48" y="130" width="230" height="30" rx="7" fill="none" stroke={GREEN} strokeWidth="2.5" />
      <rect className="sc-type" x="60" y="140" width="150" height="10" rx="3" fill={GREEN} fillOpacity="0.85" style={{ transformOrigin: "60px 145px" }} />
      <rect x="296" y="130" width="96" height="30" rx="15" fill="#0f6e4e" stroke={GREEN} strokeOpacity="0.6" />
      <rect className="sc-glow-b" x="296" y="130" width="96" height="30" rx="15" fill="none" stroke={GREEN} strokeWidth="2.5" />
      <rect x="318" y="141" width="52" height="8" rx="4" fill="#faf9f6" fillOpacity="0.9" />

      {[0, 1].map((i) => (
        <rect key={i} x="420" y={128 + i * 24} width="94" height="16" rx="4" fill={FAINT} />
      ))}
      <rect x="48" y="186" width="200" height="6" rx="3" fill={FAINT} />
      <rect x="48" y="200" width="160" height="6" rx="3" fill={FAINT} />

      {/* Footprints along the page's floor, and the agent walking them. */}
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} x={70 + i * 20} y="272" width="6" height="3" rx="1" fill={GREEN} fillOpacity="0.45" />
      ))}
      <g transform="translate(60 219)">
        <g className="sc-walk">
          <g className="sc-bob">
            <Agent
              look={2}
              arms={
                <>
                  <Arm x1={-2} y1={22} x2={-10} y2={-44} />
                  <Arm x1={66} y1={26} x2={78} y2={34} />
                </>
              }
            />
          </g>
        </g>
      </g>
    </Frame>
  );
}

/** Monitor: the agent sits at a desk with a coffee and watches for what changed overnight. */
function MonitorScene() {
  return (
    <Frame label="An agent sits at a desk with a coffee, watching a screen for changes">
      {/* The wall clock: it reads 7:00, when the morning check runs. */}
      <g>
        <circle cx="86" cy="66" r="26" fill={FAINT} stroke={LINE} strokeWidth="1.5" />
        <line x1="86" y1="66" x2="86" y2="48" stroke={BODY} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="86" y1="66" x2="70" y2="76" stroke={BODY} strokeWidth="3" strokeLinecap="round" />
        <circle cx="86" cy="66" r="2.5" fill={GREEN} />
      </g>

      {/* The agent, leaning in toward the screen. */}
      <g transform="translate(100 150)">
        <g className="sc-lean">
          <Agent
            look={3}
            arms={
              <>
                <Arm x1={0} y1={26} x2={-6} y2={44} />
                <Arm x1={64} y1={26} x2={104} y2={30} />
              </>
            }
          />
        </g>
      </g>

      {/* The coffee, with steam. */}
      <g>
        <rect x="190" y="162" width="30" height="34" rx="4" fill="#f3f1ec" stroke={EDGE} strokeWidth="1.5" />
        <path d="M220 170 h8 a8 8 0 0 1 0 16 h-8" fill="none" stroke={BODY} strokeWidth="3.5" />
        <rect x="193" y="165" width="24" height="7" fill="#6b4a32" />
        {[198, 205, 212].map((x, i) => (
          <path
            key={x}
            className="sc-steam"
            style={{ animationDelay: `${i * 0.6}s` }}
            d={`M${x} 156 q-4 -7 0 -13 q4 -7 0 -13`}
            fill="none"
            stroke={BODY}
            strokeOpacity="0.7"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ))}
      </g>

      {/* The desk, in front of the agent's legs. */}
      <rect x="40" y="196" width="500" height="12" rx="3" fill="rgba(250,249,246,0.28)" />
      <rect x="40" y="208" width="500" height="68" fill="rgba(250,249,246,0.06)" />
      <line x1="40" y1="208" x2="540" y2="208" stroke={MID} />

      {/* The screen: yesterday beside today, with the change picked out. */}
      <rect x="258" y="56" width="262" height="124" rx="9" fill="#1c1c1c" stroke={LINE} strokeWidth="2" />
      <rect x="378" y="180" width="22" height="16" fill={MID} />
      <rect x="352" y="193" width="74" height="5" rx="2" fill={LINE} />
      <text x="276" y="80" fill={BODY} fillOpacity="0.55" fontSize="11" fontFamily="inherit">
        Yesterday
      </text>
      <text x="396" y="80" fill={BODY} fillOpacity="0.9" fontSize="11" fontFamily="inherit">
        Today
      </text>
      <line x1="388" y1="68" x2="388" y2="166" stroke={MID} />
      {[0, 1, 2, 3, 4].map((k) => (
        <g key={k}>
          <rect x="276" y={92 + k * 15} width={84 - ((k * 13) % 30)} height="8" rx="3" fill={MID} />
          <rect
            className={k === 2 ? "sc-pulse" : undefined}
            x="396"
            y={92 + k * 15}
            width={k === 2 ? 104 : 84 - ((k * 13) % 30)}
            height="8"
            rx="3"
            fill={k === 2 ? GREEN : MID}
          />
        </g>
      ))}
      <rect className="sc-pulse" x="470" y="146" width="40" height="14" rx="7" fill="none" stroke={GREEN} />
      <text className="sc-pulse" x="480" y="157" fill={GREEN} fontSize="9" fontWeight="600" fontFamily="inherit">
        NEW
      </text>
    </Frame>
  );
}

const SCENES: Record<string, () => ReactNode> = {
  Fetch: FetchScene,
  Search: SearchScene,
  Agent: BrowseScene,
  Monitor: MonitorScene,
};

/** The drawing for a TinyFish tool, or nothing for a tool without one. */
export function AgentScene({ tool }: { tool: string }) {
  const Scene = SCENES[tool];
  return Scene ? <Scene /> : null;
}
