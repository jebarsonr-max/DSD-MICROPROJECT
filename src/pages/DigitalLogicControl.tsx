import React from 'react';
import {
  Cpu,
  ToggleLeft,
  ToggleRight,
  BookOpen,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';

/* ─── Boolean Helpers ─── */
function andGate(a: boolean, b: boolean, c: boolean): boolean {
  return a && b && c;
}

function orGate(a: boolean, b: boolean, c: boolean): boolean {
  return a || b || c;
}

/* ─── Full 8-Row Truth Table with Inverted Signals ─── */
interface TruthRow {
  row: number;
  i: boolean;
  w: boolean;
  f: boolean;
  notI: boolean;
  notW: boolean;
  notF: boolean;
  sort: boolean;
  alert: boolean;
  action: string;
}

const TRUTH_ROWS: TruthRow[] = [
  { row: 0, i: false, w: false, f: false, notI: true,  notW: true,  notF: true,  sort: false, alert: true,  action: 'Safety Divert (Invalid ID + Overweight + Invalid Flight)' },
  { row: 1, i: false, w: false, f: true,  notI: true,  notW: true,  notF: false, sort: false, alert: true,  action: 'Safety Divert (Invalid ID + Overweight)' },
  { row: 2, i: false, w: true,  f: false, notI: true,  notW: false, notF: true,  sort: false, alert: true,  action: 'Safety Divert (Invalid ID + Invalid Flight)' },
  { row: 3, i: false, w: true,  f: true,  notI: true,  notW: false, notF: false, sort: false, alert: true,  action: 'Safety Divert (Invalid ID Tag)' },
  { row: 4, i: true,  w: false, f: false, notI: false, notW: true,  notF: true,  sort: false, alert: true,  action: 'Safety Divert (Overweight + Invalid Flight)' },
  { row: 5, i: true,  w: false, f: true,  notI: false, notW: true,  notF: false, sort: false, alert: true,  action: 'Safety Divert (Overweight Baggage)' },
  { row: 6, i: true,  w: true,  f: false, notI: false, notW: false, notF: true,  sort: false, alert: true,  action: 'Safety Divert (Flight Manifest Mismatch)' },
  { row: 7, i: true,  w: true,  f: true,  notI: false, notW: false, notF: false, sort: true,  alert: false, action: 'NORMAL SORT → Automatic Destination Chute' },
];

/* ─── LED Indicator Component ─── */
const Led: React.FC<{ on: boolean; color?: string; size?: number }> = ({
  on,
  color = '#16A36A',
  size = 14,
}) => (
  <span
    className="inline-block rounded-full border transition-all duration-200"
    style={{
      width: size,
      height: size,
      backgroundColor: on ? color : '#94A3B8',
      borderColor: on ? color : '#64748B',
      boxShadow: on ? `0 0 10px ${color}` : 'none',
    }}
  />
);

/* ─── Bit Badge Component ─── */
const BitBadge: React.FC<{ label: string; value: boolean; activeColor?: string }> = ({
  label,
  value,
  activeColor = '#16A36A',
}) => (
  <span
    className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded border transition-colors"
    style={{
      backgroundColor: value ? `${activeColor}15` : '#F1F5F9',
      color: value ? activeColor : '#64748B',
      borderColor: value ? `${activeColor}50` : '#CBD5E1',
    }}
  >
    {label}={value ? '1' : '0'}
  </span>
);

export const DigitalLogicControl: React.FC = () => {
  const { logicSandbox, setLogicSandbox, settings } = useApp();
  const { I, W, F } = logicSandbox;

  /* ─── Digital Gate Logic Calculations ─── */
  const notI = !I;
  const notW = !W;
  const notF = !F;
  const SORT = andGate(I, W, F);
  const ALERT = orGate(notI, notW, notF);

  // Wire trace highlight color constants (Green for HIGH, Grey for LOW)
  const HIGH_COLOR = '#16A36A'; // Green for logic HIGH
  const LOW_COLOR = '#94A3B8';  // Grey for logic LOW

  const wireColor = (val: boolean) => (val ? HIGH_COLOR : LOW_COLOR);

  const sortingDecision = SORT
    ? 'NORMAL SORT → Automatic destination lane assignment'
    : ALERT
    ? 'SAFETY DIVERT → Lane 06 (Manual Inspection Chute)'
    : 'NO DECISION';

  return (
    <div className="space-y-6">
      {/* ── Top Header Banner ── */}
      <div className="bg-white p-5 rounded-2xl border border-aviation-border shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-aviation-accent" />
            <h2 className="text-lg font-bold text-aviation-navy">Digital Logic Control Unit (DSD Module)</h2>
            <span className="text-xs font-mono font-bold bg-[#EAF3FC] text-aviation-accent px-2.5 py-0.5 rounded-full border border-[#C5DFF8]">
              COMBINATORIAL LOGIC CIRCUIT
            </span>
          </div>
          <p className="text-xs text-aviation-textSecondary mt-1 max-w-3xl leading-relaxed">
            Real-time interactive digital logic simulation showing the 3-input AND gate for baggage sorting authorization,
            NOT gate inverters, and the 3-input OR gate for De Morgan's fault divert detection.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-aviation-textSecondary">Comparator Threshold:</span>
          <span className="px-3 py-1 rounded-full bg-[#EAF3FC] text-aviation-accent font-mono font-bold border border-[#C5DFF8]">
            W ≤ {settings.maxBaggageWeight} kg
          </span>
        </div>
      </div>

      {/* ── Interactive Input Switches (Signal I, W, F) ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-aviation-navy">
            Primary Logic Input Terminals (Toggle to observe real-time circuit response)
          </span>
          <span className="text-xs text-aviation-textSecondary">
            Active Pattern: <strong className="font-mono text-aviation-navy">[{I ? '1' : '0'}, {W ? '1' : '0'}, {F ? '1' : '0'}]</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              key: 'I' as const,
              value: I,
              name: 'Signal I — Baggage ID',
              tag: 'RFID / BARCODE SCAN',
              desc: 'Valid RFID or barcode scan verified against passenger flight manifest.',
              highLabel: 'I = 1 (VALID TAG)',
              lowLabel: 'I = 0 (TAG MISSING / INVALID)',
            },
            {
              key: 'W' as const,
              value: W,
              name: 'Signal W — Weight Compliance',
              tag: 'DIGITAL COMPARATOR (A ≤ B)',
              desc: `Weight load cell reading ≤ configured threshold limit (${settings.maxBaggageWeight} kg).`,
              highLabel: `W = 1 (WEIGHT OK ≤ ${settings.maxBaggageWeight} kg)`,
              lowLabel: 'W = 0 (OVERWEIGHT VIOLATION)',
            },
            {
              key: 'F' as const,
              value: F,
              name: 'Signal F — Flight Manifest',
              tag: 'AIRLINE GATE ASSIGNMENT',
              desc: 'Flight number is active, assigned to departure gate, and not cancelled.',
              highLabel: 'F = 1 (FLIGHT ACTIVE & ASSIGNED)',
              lowLabel: 'F = 0 (FLIGHT CANCELLED / UNKNOWN)',
            },
          ].map(({ key, value, name, tag, desc, highLabel, lowLabel }) => (
            <div
              key={key}
              onClick={() => setLogicSandbox({ [key]: !value })}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all select-none shadow-subtle ${
                value
                  ? 'bg-[#E8F7F0] border-[#16A36A] hover:bg-[#DEF2E8]'
                  : 'bg-[#FCEBEB] border-[#DC4545] hover:bg-[#F8DCDC]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-aviation-textSecondary bg-white/70 px-2 py-0.5 rounded border border-aviation-border">
                  {tag}
                </span>
                {value ? (
                  <ToggleRight className="w-8 h-8 text-[#16A36A]" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-[#DC4545]" />
                )}
              </div>

              <div className="text-sm font-bold text-aviation-navy">{name}</div>
              <p className="text-xs text-aviation-textSecondary mt-1 leading-relaxed min-h-[36px]">{desc}</p>

              <div className="mt-3 pt-2.5 border-t border-aviation-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Led on={value} color="#16A36A" size={12} />
                  <span className="text-xs font-mono font-bold text-aviation-navy">
                    {value ? highLabel : lowLabel}
                  </span>
                </div>
                <span className={`text-[11px] font-mono font-extrabold px-2 py-0.5 rounded ${value ? 'bg-[#16A36A] text-white' : 'bg-[#DC4545] text-white'}`}>
                  LOGIC {value ? '1' : '0'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── REDESIGNED DIGITAL LOGIC CIRCUIT SCHEMATIC ── */}
      <Card
        title="Combinatorial Logic Circuit Schematic (ANSI / IEEE Standard)"
        subtitle="Live circuit simulation: Green traces indicate Logic HIGH (1); Grey traces indicate Logic LOW (0)"
      >
        <div className="overflow-x-auto bg-[#F8FAFC] rounded-xl border border-aviation-border p-5">
          <svg
            viewBox="0 0 1020 480"
            className="w-full min-w-[800px] h-auto select-none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background Canvas */}
            <rect width="1020" height="480" rx="12" fill="#FFFFFF" stroke="#E4EAF1" strokeWidth="1.5" />

            {/* Grid Pattern Guide Lines (Subtle) */}
            <g stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4">
              <line x1="260" y1="20" x2="260" y2="460" />
              <line x1="490" y1="20" x2="490" y2="460" />
              <line x1="720" y1="20" x2="720" y2="460" />
            </g>

            {/* Stage Headers */}
            <text x="70" y="32" fill="#17365D" fontSize="11" fontWeight="bold" letterSpacing="1">STAGE 1: INPUT TERMINALS</text>
            <text x="350" y="32" fill="#17365D" fontSize="11" fontWeight="bold" letterSpacing="1">STAGE 2: LOGIC GATES</text>
            <text x="750" y="32" fill="#17365D" fontSize="11" fontWeight="bold" letterSpacing="1">STAGE 3: DECISION OUTPUTS</text>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 1. INPUT TERMINALS (Left Column)                                  */}
            {/* ═════════════════════════════════════════════════════════════════ */}

            {/* Signal I Terminal */}
            <g>
              <circle cx="70" cy="75" r="18" fill={wireColor(I)} stroke="#0F233D" strokeWidth="2" />
              <text x="70" y="81" fill="#FFFFFF" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="monospace">I</text>
              <text x="100" y="70" fill="#17365D" fontSize="12" fontWeight="bold">Signal I (Baggage ID)</text>
              <text x="100" y="85" fill="#718096" fontSize="11">RFID / Barcode Verified</text>
              <rect x="100" y="90" width="62" height="18" rx="4" fill={I ? '#E8F7F0' : '#F1F5F9'} stroke={wireColor(I)} strokeWidth="1" />
              <text x="131" y="103" fill={wireColor(I)} fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">I = {I ? '1' : '0'}</text>
            </g>

            {/* Signal W Terminal */}
            <g>
              <circle cx="70" cy="165" r="18" fill={wireColor(W)} stroke="#0F233D" strokeWidth="2" />
              <text x="70" y="171" fill="#FFFFFF" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="monospace">W</text>
              <text x="100" y="160" fill="#17365D" fontSize="12" fontWeight="bold">Signal W (Weight Compliance)</text>
              <text x="100" y="175" fill="#718096" fontSize="11">Load Cell Weight ≤ Max</text>
              <rect x="100" y="180" width="62" height="18" rx="4" fill={W ? '#E8F7F0' : '#F1F5F9'} stroke={wireColor(W)} strokeWidth="1" />
              <text x="131" y="193" fill={wireColor(W)} fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">W = {W ? '1' : '0'}</text>
            </g>

            {/* Signal F Terminal */}
            <g>
              <circle cx="70" cy="255" r="18" fill={wireColor(F)} stroke="#0F233D" strokeWidth="2" />
              <text x="70" y="261" fill="#FFFFFF" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="monospace">F</text>
              <text x="100" y="250" fill="#17365D" fontSize="12" fontWeight="bold">Signal F (Flight Manifest)</text>
              <text x="100" y="265" fill="#718096" fontSize="11">Active Flight & Gate</text>
              <rect x="100" y="270" width="62" height="18" rx="4" fill={F ? '#E8F7F0' : '#F1F5F9'} stroke={wireColor(F)} strokeWidth="1" />
              <text x="131" y="283" fill={wireColor(F)} fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">F = {F ? '1' : '0'}</text>
            </g>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 2. TOP CIRCUIT: 3-INPUT AND GATE (SORT = I · W · F)               */}
            {/* ═════════════════════════════════════════════════════════════════ */}

            {/* Wire from I to AND Pin 1 (y = 80) */}
            <path d="M 88 75 L 240 75" stroke={wireColor(I)} strokeWidth="2.5" fill="none" />
            <circle cx="240" cy="75" r="4.5" fill={wireColor(I)} />
            <path d="M 240 75 L 460 75 L 460 85 L 510 85" stroke={wireColor(I)} strokeWidth="2.5" fill="none" />
            <text x="475" y="78" fill={wireColor(I)} fontSize="10" fontWeight="bold" fontFamily="monospace">I</text>

            {/* Wire from W to AND Pin 2 (y = 115) */}
            <path d="M 88 165 L 270 165" stroke={wireColor(W)} strokeWidth="2.5" fill="none" />
            <circle cx="270" cy="165" r="4.5" fill={wireColor(W)} />
            <path d="M 270 165 L 450 165 L 450 115 L 510 115" stroke={wireColor(W)} strokeWidth="2.5" fill="none" />
            <text x="475" y="110" fill={wireColor(W)} fontSize="10" fontWeight="bold" fontFamily="monospace">W</text>

            {/* Wire from F to AND Pin 3 (y = 145) */}
            <path d="M 88 255 L 300 255" stroke={wireColor(F)} strokeWidth="2.5" fill="none" />
            <circle cx="300" cy="255" r="4.5" fill={wireColor(F)} />
            <path d="M 300 255 L 440 255 L 440 145 L 510 145" stroke={wireColor(F)} strokeWidth="2.5" fill="none" />
            <text x="475" y="140" fill={wireColor(F)} fontSize="10" fontWeight="bold" fontFamily="monospace">F</text>

            {/* AND Gate Body (ANSI 3-Input AND Gate) */}
            <g id="and-gate">
              <path
                d="M 510 65 L 565 65 Q 625 65 625 115 Q 625 165 565 165 L 510 165 Z"
                fill="#EAF3FC"
                stroke="#17365D"
                strokeWidth="2.5"
              />
              <text x="555" y="110" fill="#17365D" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">AND</text>
              <text x="555" y="126" fill="#2878D0" fontSize="10" fontWeight="bold" textAnchor="middle">3-INPUT</text>
            </g>

            {/* AND Gate Output Wire to SORT Block */}
            <path d="M 625 115 L 740 115" stroke={wireColor(SORT)} strokeWidth="3.5" fill="none" />
            <text x="682" y="105" fill={wireColor(SORT)} fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              SORT = I · W · F
            </text>

            {/* SORT Output Indicator Block */}
            <g>
              <rect
                x="740"
                y="83"
                width="240"
                height="64"
                rx="10"
                fill={SORT ? '#E8F7F0' : '#F8FAFC'}
                stroke={SORT ? '#16A36A' : '#CBD5E1'}
                strokeWidth="2"
              />
              <circle cx="765" cy="115" r="9" fill={wireColor(SORT)} />
              <text x="785" y="106" fill="#17365D" fontSize="13" fontWeight="bold">SORT OUTPUT</text>
              <text x="785" y="124" fill={SORT ? '#16A36A' : '#64748B'} fontSize="11" fontWeight="bold" fontFamily="monospace">
                {SORT ? '1 (HIGH) — DISPATCH AUTHORIZED' : '0 (LOW) — SORT INHIBITED'}
              </text>
              <text x="785" y="137" fill="#718096" fontSize="10">Automatic Flight Destination Chute</text>
            </g>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 3. MIDDLE SECTION: 3 NOT GATES (INVERTERS: I', W', F')            */}
            {/* ═════════════════════════════════════════════════════════════════ */}

            {/* Dropdown wire for I -> NOT Gate 1 (y = 310) */}
            <path d="M 240 75 L 240 310 L 340 310" stroke={wireColor(I)} strokeWidth="2.5" fill="none" />
            <text x="250" y="302" fill={wireColor(I)} fontSize="10" fontWeight="bold" fontFamily="monospace">I</text>

            {/* NOT Gate 1 Symbol (Inverting I -> I') */}
            <g id="not-gate-1">
              <polygon points="340,295 380,310 340,325" fill="#FFF8E7" stroke="#E99A25" strokeWidth="2" />
              <circle cx="386" cy="310" r="5.5" fill="#FFF8E7" stroke="#E99A25" strokeWidth="2" />
              <text x="352" y="314" fill="#92400E" fontSize="9" fontWeight="bold">NOT</text>
            </g>
            {/* Inverted I' Wire */}
            <path d="M 392 310 L 440 310 L 440 345 L 525 345" stroke={wireColor(notI)} strokeWidth="2.5" fill="none" />
            <text x="445" y="340" fill={wireColor(notI)} fontSize="10" fontWeight="bold" fontFamily="monospace">
              I' = {notI ? '1' : '0'}
            </text>

            {/* Dropdown wire for W -> NOT Gate 2 (y = 370) */}
            <path d="M 270 165 L 270 370 L 340 370" stroke={wireColor(W)} strokeWidth="2.5" fill="none" />
            <text x="280" y="362" fill={wireColor(W)} fontSize="10" fontWeight="bold" fontFamily="monospace">W</text>

            {/* NOT Gate 2 Symbol (Inverting W -> W') */}
            <g id="not-gate-2">
              <polygon points="340,355 380,370 340,385" fill="#FFF8E7" stroke="#E99A25" strokeWidth="2" />
              <circle cx="386" cy="370" r="5.5" fill="#FFF8E7" stroke="#E99A25" strokeWidth="2" />
              <text x="352" y="374" fill="#92400E" fontSize="9" fontWeight="bold">NOT</text>
            </g>
            {/* Inverted W' Wire */}
            <path d="M 392 370 L 535 370" stroke={wireColor(notW)} strokeWidth="2.5" fill="none" />
            <text x="445" y="365" fill={wireColor(notW)} fontSize="10" fontWeight="bold" fontFamily="monospace">
              W' = {notW ? '1' : '0'}
            </text>

            {/* Dropdown wire for F -> NOT Gate 3 (y = 430) */}
            <path d="M 300 255 L 300 430 L 340 430" stroke={wireColor(F)} strokeWidth="2.5" fill="none" />
            <text x="310" y="422" fill={wireColor(F)} fontSize="10" fontWeight="bold" fontFamily="monospace">F</text>

            {/* NOT Gate 3 Symbol (Inverting F -> F') */}
            <g id="not-gate-3">
              <polygon points="340,415 380,430 340,445" fill="#FFF8E7" stroke="#E99A25" strokeWidth="2" />
              <circle cx="386" cy="430" r="5.5" fill="#FFF8E7" stroke="#E99A25" strokeWidth="2" />
              <text x="352" y="434" fill="#92400E" fontSize="9" fontWeight="bold">NOT</text>
            </g>
            {/* Inverted F' Wire */}
            <path d="M 392 430 L 440 430 L 440 395 L 525 395" stroke={wireColor(notF)} strokeWidth="2.5" fill="none" />
            <text x="445" y="405" fill={wireColor(notF)} fontSize="10" fontWeight="bold" fontFamily="monospace">
              F' = {notF ? '1' : '0'}
            </text>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 4. BOTTOM CIRCUIT: 3-INPUT OR GATE (ALERT = I' + W' + F')         */}
            {/* ═════════════════════════════════════════════════════════════════ */}

            {/* 3-Input OR Gate Body (ANSI 3-Input OR Gate with Concave Back & Shield Front) */}
            <g id="or-gate">
              <path
                d="M 520 320 Q 555 370 520 420 Q 590 420 635 370 Q 590 320 520 320 Z"
                fill="#FEF6E9"
                stroke="#E99A25"
                strokeWidth="2.5"
              />
              <text x="568" y="366" fill="#92400E" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">OR</text>
              <text x="568" y="382" fill="#B45309" fontSize="10" fontWeight="bold" textAnchor="middle">3-INPUT</text>
            </g>

            {/* OR Gate Output Wire to ALERT Block */}
            <path d="M 635 370 L 740 370" stroke={wireColor(ALERT)} strokeWidth="3.5" fill="none" />
            <text x="687" y="360" fill={wireColor(ALERT)} fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              ALERT = I' + W' + F'
            </text>

            {/* ALERT Output Indicator Block */}
            <g>
              <rect
                x="740"
                y="338"
                width="240"
                height="64"
                rx="10"
                fill={ALERT ? '#FCEBEB' : '#F8FAFC'}
                stroke={ALERT ? '#DC4545' : '#CBD5E1'}
                strokeWidth="2"
              />
              <circle cx="765" cy="370" r="9" fill={ALERT ? '#DC4545' : '#94A3B8'} />
              <text x="785" y="361" fill="#17365D" fontSize="13" fontWeight="bold">ALERT OUTPUT</text>
              <text x="785" y="379" fill={ALERT ? '#DC4545' : '#64748B'} fontSize="11" fontWeight="bold" fontFamily="monospace">
                {ALERT ? '1 (HIGH) — SECURITY DIVERT' : '0 (LOW) — ALL CONDITIONS MET'}
              </text>
              <text x="785" y="392" fill="#718096" fontSize="10">Divert to Lane 06 (Manual Inspection)</text>
            </g>

            {/* Visual Logic Divider Line */}
            <line x1="480" y1="210" x2="980" y2="210" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="6 3" />
            <text x="730" y="206" fill="#64748B" fontSize="10" fontStyle="italic">De Morgan Complementary Logic: ALERT = (I · W · F)'</text>
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-aviation-border flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="w-3.5 h-3.5 rounded-full bg-[#16A36A] inline-block" />
              <strong className="text-aviation-navy">Logic 1 (HIGH)</strong>
              <span className="text-aviation-textSecondary">— Signal Valid / Active (+5V TTL)</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="w-3.5 h-3.5 rounded-full bg-[#94A3B8] inline-block" />
              <strong className="text-aviation-navy">Logic 0 (LOW)</strong>
              <span className="text-aviation-textSecondary">— Signal Invalid / Inhibited (0V Ground)</span>
            </div>
          </div>
          <div className="text-aviation-textSecondary">
            De Morgan's Theorem: <code className="font-mono font-bold text-aviation-navy">(I · W · F)' = I' + W' + F'</code>
          </div>
        </div>
      </Card>

      {/* ── Active Output Summary Card ── */}
      <div
        className="rounded-2xl p-5 border-2 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-subtle"
        style={{
          backgroundColor: SORT ? '#E8F7F0' : '#FCEBEB',
          borderColor: SORT ? '#16A36A' : '#DC4545',
        }}
      >
        <div className="flex items-center gap-3">
          {SORT ? (
            <CheckCircle2 className="w-8 h-8 text-[#16A36A] flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-[#DC4545] flex-shrink-0" />
          )}
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-aviation-textSecondary">
              CURRENT AUTOMATION DECISION
            </div>
            <div className="text-base font-bold text-aviation-navy mt-0.5">{sortingDecision}</div>
            <div className="text-xs text-aviation-textSecondary mt-0.5">
              Inputs: I={I ? '1' : '0'}, W={W ? '1' : '0'}, F={F ? '1' : '0'} → SORT={SORT ? '1' : '0'}, ALERT={ALERT ? '1' : '0'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-white border border-aviation-border shadow-xs text-aviation-navy">
            GATE 1 (AND): {SORT ? '1 (PASS)' : '0 (INHIBIT)'}
          </span>
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-white border border-aviation-border shadow-xs text-aviation-navy">
            GATE 2 (OR): {ALERT ? '1 (DIVERT)' : '0 (CLEAR)'}
          </span>
        </div>
      </div>

      {/* ── Complete Truth Table & Academic Viva Notes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Truth Table */}
        <Card
          title="Complete Truth Table (8 Input Combinations)"
          subtitle="Real-time highlight indicates currently active logic combination"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs font-mono">
              <thead>
                <tr className="border-b border-aviation-border bg-[#F8FAFC]">
                  <th className="py-2.5 px-2 text-aviation-textSecondary font-bold">#</th>
                  <th className="py-2.5 px-2 text-aviation-navy font-bold">I</th>
                  <th className="py-2.5 px-2 text-aviation-navy font-bold">W</th>
                  <th className="py-2.5 px-2 text-aviation-navy font-bold">F</th>
                  <th className="py-2.5 px-2 text-[#92400E] font-bold">I'</th>
                  <th className="py-2.5 px-2 text-[#92400E] font-bold">W'</th>
                  <th className="py-2.5 px-2 text-[#92400E] font-bold">F'</th>
                  <th className="py-2.5 px-2 text-[#16A36A] font-bold">SORT</th>
                  <th className="py-2.5 px-2 text-[#DC4545] font-bold">ALERT</th>
                  <th className="py-2.5 px-2 text-aviation-textSecondary font-sans font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aviation-border">
                {TRUTH_ROWS.map((row) => {
                  const active = row.i === I && row.w === W && row.f === F;
                  return (
                    <tr
                      key={row.row}
                      className={`transition-colors ${
                        active
                          ? 'bg-[#EAF3FC] font-extrabold ring-1 ring-[#2878D0]'
                          : 'hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <td className="py-2 px-1 text-aviation-textMuted">{row.row}</td>
                      <td className="py-2 px-1">{row.i ? '1' : '0'}</td>
                      <td className="py-2 px-1">{row.w ? '1' : '0'}</td>
                      <td className="py-2 px-1">{row.f ? '1' : '0'}</td>
                      <td className="py-2 px-1 text-[#92400E]">{row.notI ? '1' : '0'}</td>
                      <td className="py-2 px-1 text-[#92400E]">{row.notW ? '1' : '0'}</td>
                      <td className="py-2 px-1 text-[#92400E]">{row.notF ? '1' : '0'}</td>
                      <td className={`py-2 px-1 font-bold ${row.sort ? 'text-[#16A36A]' : 'text-[#94A3B8]'}`}>
                        {row.sort ? '1' : '0'}
                      </td>
                      <td className={`py-2 px-1 font-bold ${row.alert ? 'text-[#DC4545]' : 'text-[#94A3B8]'}`}>
                        {row.alert ? '1' : '0'}
                      </td>
                      <td className="py-2 px-2 font-sans text-[11px] text-aviation-textSecondary text-left">
                        {row.sort ? (
                          <span className="text-[#16A36A] font-semibold">→ Dest. Lane</span>
                        ) : (
                          <span className="text-[#DC4545]">→ Lane 06 (Divert)</span>
                        )}
                        {active && (
                          <span className="ml-1.5 bg-[#2878D0] text-white text-[9px] font-mono px-1.5 py-0.2 rounded font-bold">
                            CURRENT
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* DSD Academic Viva Voce Guide */}
        <Card
          title="DSD Viva Voce — Key Principles"
          subtitle="Essential digital electronics concepts for faculty oral examination"
        >
          <div className="space-y-3 text-xs">
            {[
              {
                q: '1. Why is a 3-input AND gate used for SORT?',
                a: 'All three preconditions (valid ID tag I, weight within limit W, and active flight manifest F) must be simultaneously TRUE (logic 1) for automated flight routing. A 3-input AND gate guarantees that if any single input is 0, SORT evaluates to 0, inhibiting incorrect dispatch.',
              },
              {
                q: "2. How is De Morgan's Theorem applied for ALERT?",
                a: "By De Morgan's Law: (I · W · F)' = I' + W' + F'. Rather than inverting the AND output, the fault detector feeds inverted signals I', W', and F' into an OR gate. Any single failure produces an inverted 1, immediately driving ALERT = 1 to trigger the Lane 06 inspection divert chute.",
              },
              {
                q: '3. What is the Digital Magnitude Comparator?',
                a: `The weight load cell converts analog force to an n-bit binary word A. The comparator continuously evaluates A against reference threshold B (${settings.maxBaggageWeight} kg). The comparator asserts binary signal W = (A ≤ B) directly into the AND gate.`,
              },
              {
                q: '4. Why are NOT Inverter gates necessary?',
                a: "NOT gates invert primary signals I, W, F into complementary fault flags I', W', F'. In a digital circuit, inverters provide isolation and polarity inversion required for independent fault signaling and fail-safe safety mechanisms.",
              },
              {
                q: '5. Is this Combinatorial or Sequential Logic?',
                a: 'The decision engine is Combinatorial Logic: output states depend purely on the present inputs with zero propagation memory. In the broader baggage handling system, a Mealy or Moore Sequential FSM models conveyor belt station transitions.',
              },
            ].map((item) => (
              <div key={item.q} className="p-3 rounded-xl bg-[#F8FAFC] border border-aviation-border">
                <div className="font-bold text-aviation-navy flex gap-1.5 items-start">
                  <BookOpen className="w-3.5 h-3.5 text-aviation-accent mt-0.5 flex-shrink-0" />
                  {item.q}
                </div>
                <p className="text-aviation-textSecondary mt-1 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
