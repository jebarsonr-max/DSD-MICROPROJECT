import React from 'react';
import {
  Cpu,
  ToggleLeft,
  ToggleRight,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common/Card';

/* ─── Boolean helpers ─── */
function andGate(a: boolean, b: boolean, c: boolean) { return a && b && c; }
function orGate(a: boolean, b: boolean, c: boolean) { return a || b || c; }

/* ─── Full Truth Table (8 rows × 3 inputs) ─── */
const TRUTH_ROWS: { i: boolean; w: boolean; f: boolean; sort: boolean; alert: boolean }[] = [
  { i: false, w: false, f: false, sort: false, alert: true },
  { i: false, w: false, f: true,  sort: false, alert: true },
  { i: false, w: true,  f: false, sort: false, alert: true },
  { i: false, w: true,  f: true,  sort: false, alert: true },
  { i: true,  w: false, f: false, sort: false, alert: true },
  { i: true,  w: false, f: true,  sort: false, alert: true },
  { i: true,  w: true,  f: false, sort: false, alert: true },
  { i: true,  w: true,  f: true,  sort: true,  alert: false },
];

/* ─── LED indicator ─── */
const Led: React.FC<{ on: boolean; color?: string }> = ({ on, color = '#16A36A' }) => (
  <span
    className="inline-block w-4 h-4 rounded-full border-2 transition-all duration-200"
    style={{
      backgroundColor: on ? color : '#1E293B',
      borderColor: on ? color : '#334155',
      boxShadow: on ? `0 0 8px ${color}80` : 'none',
    }}
  />
);

/* ─── Bit chip badge ─── */
const Bit: React.FC<{ label: string; value: boolean; color?: string }> = ({ label, value, color }) => (
  <span
    className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded"
    style={{
      backgroundColor: value ? (color ?? '#16A36A') + '20' : '#1E293B',
      color: value ? (color ?? '#16A36A') : '#94A3B8',
      border: `1px solid ${value ? (color ?? '#16A36A') + '60' : '#334155'}`,
    }}
  >
    {label}={value ? '1' : '0'}
  </span>
);

export const DigitalLogicControl: React.FC = () => {
  const { logicSandbox, setLogicSandbox, settings } = useApp();
  const { I, W, F } = logicSandbox;

  /* ─── Gate Computations ─── */
  const notI = !I;
  const notW = !W;
  const notF = !F;
  const SORT  = andGate(I, W, F);
  const ALERT = orGate(notI, notW, notF);

  const sortingDecision = SORT
    ? 'NORMAL SORT → Automatic destination lane assignment'
    : ALERT
    ? 'SAFETY DIVERT → Lane 06 (Manual Inspection)'
    : 'NO DECISION';

  return (
    <div className="space-y-6">
      {/* ── Banner ── */}
      <div className="bg-white p-5 rounded-2xl border border-aviation-border shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-aviation-navy">Digital Logic Control Unit (DSD Module)</h2>
            <span className="text-xs font-mono font-bold bg-[#EAF3FC] text-aviation-accent px-2.5 py-0.5 rounded-full border border-[#C5DFF8]">
              COMBINATORIAL LOGIC VIVA
            </span>
          </div>
          <p className="text-xs text-aviation-textSecondary mt-0.5">
            3-input AND gate, De Morgan's OR fault detector, digital weight comparator and NOT gate inverters.
            Toggle the binary input switches below to observe real-time gate responses.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-aviation-textSecondary">CLK State:</span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F7F0] text-aviation-success font-mono font-bold border border-[#C2EBDA]">
            <span className="w-2 h-2 rounded-full bg-aviation-success animate-pulse" />
            HIGH (SYNCED)
          </span>
        </div>
      </div>

      {/* ── Interactive Input Switches ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            key: 'I' as keyof typeof logicSandbox,
            value: I,
            label: 'Input Terminal I',
            name: 'Baggage Identification',
            desc: `Valid RFID/Barcode tag verified against passenger manifest. When I=0, bag cannot enter automatic sort.`,
          },
          {
            key: 'W' as keyof typeof logicSandbox,
            value: W,
            label: 'Input Terminal W',
            name: 'Weight Compliance',
            desc: `Digital comparator signal: Measured Weight ≤ ${settings.maxBaggageWeight} kg. W=0 triggers overweight divert.`,
          },
          {
            key: 'F' as keyof typeof logicSandbox,
            value: F,
            label: 'Input Terminal F',
            name: 'Flight Validity',
            desc: `Flight number is in active manifest, gate assigned, and not Cancelled. F=0 triggers manifest divert.`,
          },
        ].map(({ key, value, label, name, desc }) => (
          <div
            key={key}
            onClick={() => setLogicSandbox({ [key]: !value })}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${
              value
                ? 'bg-[#E8F7F0] border-[#16A36A]/50 hover:border-[#16A36A]'
                : 'bg-[#FCEBEB] border-[#DC4545]/40 hover:border-[#DC4545]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-aviation-textSecondary">
                {label}
              </span>
              {value ? (
                <ToggleRight className="w-8 h-8 text-aviation-success" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-aviation-danger" />
              )}
            </div>
            <div className="text-base font-bold text-aviation-navy">{name}</div>
            <p className="text-[11px] text-aviation-textSecondary mt-1 leading-relaxed">{desc}</p>
            <div className="mt-3 flex items-center gap-2 text-xs font-mono font-bold">
              <Led on={value} color={value ? '#16A36A' : '#DC4545'} />
              <span
                className="px-2 py-0.5 rounded"
                style={{
                  backgroundColor: value ? '#16A36A' : '#DC4545',
                  color: 'white',
                }}
              >
                {key} = {value ? '1 (HIGH)' : '0 (LOW)'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Hardware LED Console ── */}
      <div className="bg-[#0B1522] rounded-2xl p-5 border-2 border-[#1E293B] shadow-elevated">
        <div className="text-[11px] font-mono text-[#64748B] uppercase tracking-widest mb-4">
          AeroSort AI — Digital Logic Control Unit / PLC OUTPUT REGISTER
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* AND Gate */}
          <div className="bg-[#1E293B] rounded-xl p-4 border border-[#334155]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Gate 1 — 3-Input AND</div>
                <div className="font-mono font-bold text-white text-sm mt-0.5">SORT = I · W · F</div>
              </div>
              <Led on={SORT} color="#16A36A" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Bit label="I" value={I} />
              <span className="text-[#475569] font-mono font-bold self-center">AND</span>
              <Bit label="W" value={W} />
              <span className="text-[#475569] font-mono font-bold self-center">AND</span>
              <Bit label="F" value={F} />
              <span className="text-[#475569] font-mono font-bold self-center">=</span>
              <Bit label="SORT" value={SORT} color="#16A36A" />
            </div>
            <div className="mt-3 text-xs font-mono text-[#94A3B8]">
              Output:{' '}
              <span className={SORT ? 'text-[#16A36A] font-bold' : 'text-[#DC4545] font-bold'}>
                {SORT ? '1 — AUTOMATIC DESTINATION SORT ENABLED' : '0 — SORT INHIBITED'}
              </span>
            </div>
          </div>

          {/* OR Gate (Fault Detector) */}
          <div className="bg-[#1E293B] rounded-xl p-4 border border-[#334155]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Gate 2 — Fault Detector OR</div>
                <div className="font-mono font-bold text-white text-sm mt-0.5">ALERT = I' + W' + F'</div>
              </div>
              <Led on={ALERT} color="#DC4545" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Bit label="I'" value={notI} color="#DC4545" />
              <span className="text-[#475569] font-mono font-bold self-center">OR</span>
              <Bit label="W'" value={notW} color="#E99A25" />
              <span className="text-[#475569] font-mono font-bold self-center">OR</span>
              <Bit label="F'" value={notF} color="#E99A25" />
              <span className="text-[#475569] font-mono font-bold self-center">=</span>
              <Bit label="ALERT" value={ALERT} color="#DC4545" />
            </div>
            <div className="mt-3 text-xs font-mono text-[#94A3B8]">
              Output:{' '}
              <span className={ALERT ? 'text-[#DC4545] font-bold' : 'text-[#16A36A] font-bold'}>
                {ALERT ? '1 — FAULT DETECTED → LANE 06 DIVERT' : '0 — NO FAULT DETECTED'}
              </span>
            </div>
          </div>
        </div>

        {/* NOT Gates row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "NOT I (I')", input: I, output: notI, desc: 'ID Error signal' },
            { label: "NOT W (W')", input: W, output: notW, desc: 'Weight error signal' },
            { label: "NOT F (F')", input: F, output: notF, desc: 'Flight error signal' },
          ].map((ng) => (
            <div key={ng.label} className="bg-[#1E293B] rounded-lg p-3 border border-[#334155] text-center">
              <div className="text-[10px] font-mono text-[#64748B] mb-2 uppercase tracking-wider">NOT GATE</div>
              <div className="font-mono font-bold text-white text-xs">{ng.label}</div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Bit label="IN" value={ng.input} />
                <span className="text-[#475569] font-mono">→</span>
                <Bit label="OUT" value={ng.output} color="#E99A25" />
              </div>
              <div className="text-[10px] text-[#64748B] mt-1">{ng.desc}</div>
            </div>
          ))}
        </div>

        {/* Final Decision output */}
        <div
          className="rounded-xl p-4 border-2 flex items-center justify-between"
          style={{
            backgroundColor: SORT ? '#16A36A20' : '#DC454520',
            borderColor: SORT ? '#16A36A60' : '#DC454560',
          }}
        >
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8]">
              FINAL SORTING DECISION OUTPUT
            </div>
            <div className="font-mono font-bold text-white text-base mt-1">{sortingDecision}</div>
          </div>
          <div className="flex items-center gap-3">
            <Led on={SORT} color="#16A36A" />
            <span className="text-xs font-mono font-bold" style={{ color: SORT ? '#16A36A' : '#DC4545' }}>
              {SORT ? 'PASS' : 'DIVERT'}
            </span>
          </div>
        </div>
      </div>

      {/* ── SVG Circuit Diagram ── */}
      <Card
        title="Combinatorial Logic Circuit Schematic"
        subtitle="ANSI/IEEE standard gate symbols — wiring traces highlight based on current input state"
      >
        <div className="overflow-x-auto bg-[#F8FAFC] rounded-xl border border-aviation-border p-4">
          <svg viewBox="0 0 760 260" className="w-full min-w-[640px] h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* ── Background ── */}
            <rect width="760" height="260" rx="8" fill="#F8FAFC" />

            {/* ── Input terminal circles ── */}
            {/* I */}
            <circle cx="40" cy="50" r="12" fill={I ? '#16A36A' : '#DC4545'} />
            <text x="36" y="55" fill="white" fontSize="13" fontWeight="bold" fontFamily="monospace">I</text>
            <text x="58" y="55" fill="#17365D" fontSize="12" fontWeight="600">Valid ID</text>

            {/* W */}
            <circle cx="40" cy="130" r="12" fill={W ? '#16A36A' : '#DC4545'} />
            <text x="34" y="135" fill="white" fontSize="13" fontWeight="bold" fontFamily="monospace">W</text>
            <text x="58" y="135" fill="#17365D" fontSize="12" fontWeight="600">Weight OK</text>

            {/* F */}
            <circle cx="40" cy="210" r="12" fill={F ? '#16A36A' : '#DC4545'} />
            <text x="36" y="215" fill="white" fontSize="13" fontWeight="bold" fontFamily="monospace">F</text>
            <text x="58" y="215" fill="#17365D" fontSize="12" fontWeight="600">Flight Valid</text>

            {/* ── Wires: inputs → AND gate ── */}
            <path d={`M 52 50 L 190 50 L 190 85 L 240 85`} stroke={I ? '#16A36A' : '#CBD5E1'} strokeWidth="2.5" fill="none" />
            <path d={`M 52 130 L 240 130`} stroke={W ? '#16A36A' : '#CBD5E1'} strokeWidth="2.5" fill="none" />
            <path d={`M 52 210 L 190 210 L 190 175 L 240 175`} stroke={F ? '#16A36A' : '#CBD5E1'} strokeWidth="2.5" fill="none" />

            {/* ── 3-Input AND Gate body (rect + arc) ── */}
            <rect x="240" y="70" width="50" height="120" rx="0" fill="#EAF3FC" stroke="#17365D" strokeWidth="2.5" />
            <path d="M 290 70 Q 350 70 350 130 Q 350 190 290 190 Z" fill="#EAF3FC" stroke="#17365D" strokeWidth="2.5" />
            <text x="248" y="118" fill="#17365D" fontSize="11" fontWeight="bold">AND</text>
            <text x="248" y="135" fill="#17365D" fontSize="10">3-IN</text>
            <text x="248" y="150" fill="#17365D" fontSize="10">GATE</text>

            {/* ── Wire: AND gate → SORT output ── */}
            <path d={`M 350 130 L 450 130`} stroke={SORT ? '#16A36A' : '#CBD5E1'} strokeWidth="3" fill="none" />

            {/* ── SORT Output indicator ── */}
            <rect x="450" y="108" width="150" height="44" rx="8" fill={SORT ? '#16A36A' : '#F1F5F9'} stroke={SORT ? '#16A36A' : '#CBD5E1'} strokeWidth="2" />
            <text x="470" y="128" fill={SORT ? 'white' : '#718096'} fontSize="11" fontWeight="bold">SORT (AND OUT)</text>
            <text x="470" y="143" fill={SORT ? 'white' : '#94A3B8'} fontSize="10">{SORT ? '1 — DISPATCH PASS' : '0 — INHIBIT'}</text>

            {/* ── NOT Gate for I' (top branch) ── */}
            <path d={`M 155 50 L 155 20`} stroke={I ? '#16A36A' : '#CBD5E1'} strokeWidth="1.5" strokeDasharray="4 2" />
            <polygon points="140,12 170,12 155,28" fill={notI ? '#FCEBEB' : '#F1F5F9'} stroke="#E99A25" strokeWidth="1.5" />
            <circle cx="155" cy="31" r="4" fill="#E99A25" />
            <text x="163" y="16" fill="#64748B" fontSize="10" fontFamily="monospace">I'={notI ? '1' : '0'}</text>

            {/* ── Wire I' → OR gate ── */}
            <path d={`M 159 31 L 580 31 L 580 100`} stroke={notI ? '#E99A25' : '#CBD5E1'} strokeWidth="1.5" fill="none" />

            {/* ── NOT Gate for W' ── */}
            <path d={`M 155 130 L 155 240`} stroke={W ? '#16A36A' : '#CBD5E1'} strokeWidth="1.5" strokeDasharray="4 2" />
            <polygon points="140,232 170,232 155,248" fill={notW ? '#FCEBEB' : '#F1F5F9'} stroke="#E99A25" strokeWidth="1.5" />
            <circle cx="155" cy="251" r="4" fill="#E99A25" />
            <text x="163" y="254" fill="#64748B" fontSize="10" fontFamily="monospace">W'={notW ? '1' : '0'}</text>

            {/* Wire W' → OR gate (bottom input) */}
            <path d={`M 159 251 L 580 251 L 580 200`} stroke={notW ? '#E99A25' : '#CBD5E1'} strokeWidth="1.5" fill="none" />

            {/* ── NOT Gate for F' ── */}
            <path d={`M 52 210 L 100 210 L 100 141`} stroke={F ? '#16A36A' : '#CBD5E1'} strokeWidth="1.5" strokeDasharray="4 2" />
            {/* small not circle on the branch wire */}
            <circle cx="100" cy="138" r="4" fill="#E99A25" stroke="#E99A25" />
            <text x="104" y="138" fill="#64748B" fontSize="10" fontFamily="monospace">F'={notF ? '1' : '0'}</text>
            {/* Wire F' → OR gate (middle input) */}
            <path d={`M 100 134 L 580 134 L 580 150`} stroke={notF ? '#E99A25' : '#CBD5E1'} strokeWidth="1.5" fill="none" />

            {/* ── 3-Input OR Gate body ── */}
            <path d="M 560 90 L 560 210 Q 540 150 560 90 Z" fill="#FEF6E9" stroke="#E99A25" strokeWidth="0" />
            <path d="M 560 90 Q 650 90 660 150 Q 650 210 560 210 Q 590 150 560 90 Z" fill="#FEF6E9" stroke="#E99A25" strokeWidth="2.5" />
            <text x="580" y="145" fill="#92400E" fontSize="11" fontWeight="bold">OR</text>
            <text x="576" y="160" fill="#92400E" fontSize="10">3-IN</text>

            {/* OR output wire */}
            <path d={`M 660 150 L 700 150`} stroke={ALERT ? '#DC4545' : '#CBD5E1'} strokeWidth="3" fill="none" />

            {/* ── ALERT Output indicator ── */}
            <rect x="700" y="128" width="50" height="44" rx="8" fill={ALERT ? '#DC4545' : '#F1F5F9'} stroke={ALERT ? '#DC4545' : '#CBD5E1'} strokeWidth="2" />
            <text x="708" y="147" fill={ALERT ? 'white' : '#718096'} fontSize="10" fontWeight="bold">ALERT</text>
            <text x="712" y="162" fill={ALERT ? 'white' : '#94A3B8'} fontSize="10">{ALERT ? '= 1' : '= 0'}</text>
          </svg>
        </div>
      </Card>

      {/* ── Truth Table & DSD Notes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Truth Table */}
        <Card
          title="Complete Truth Table — 8 Input Combinations"
          subtitle="Active row highlighted in real-time based on current switch state"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs font-mono">
              <thead>
                <tr className="border-b border-aviation-border">
                  <th className="pb-2.5 px-2 text-aviation-textSecondary font-bold">Row</th>
                  <th className="pb-2.5 px-2 text-aviation-navy font-bold">I</th>
                  <th className="pb-2.5 px-2 text-aviation-navy font-bold">W</th>
                  <th className="pb-2.5 px-2 text-aviation-navy font-bold">F</th>
                  <th className="pb-2.5 px-2 text-[#16A36A] font-bold">SORT (AND)</th>
                  <th className="pb-2.5 px-2 text-[#DC4545] font-bold">ALERT (OR)</th>
                  <th className="pb-2.5 px-2 text-aviation-textSecondary font-sans font-bold">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aviation-border">
                {TRUTH_ROWS.map((row, idx) => {
                  const active = row.i === I && row.w === W && row.f === F;
                  return (
                    <tr
                      key={idx}
                      className={`transition-colors ${
                        active
                          ? 'bg-aviation-lightBlue font-extrabold'
                          : 'hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <td className="py-2 px-2 text-aviation-textMuted">{idx}</td>
                      <td className="py-2 px-2">{row.i ? '1' : '0'}</td>
                      <td className="py-2 px-2">{row.w ? '1' : '0'}</td>
                      <td className="py-2 px-2">{row.f ? '1' : '0'}</td>
                      <td className={`py-2 px-2 font-bold ${row.sort ? 'text-[#16A36A]' : 'text-[#94A3B8]'}`}>
                        {row.sort ? '1' : '0'}
                      </td>
                      <td className={`py-2 px-2 font-bold ${row.alert ? 'text-[#DC4545]' : 'text-[#94A3B8]'}`}>
                        {row.alert ? '1' : '0'}
                      </td>
                      <td className="py-2 px-2 font-sans text-[11px] text-aviation-textSecondary">
                        {row.sort ? '→ Dest. Lane' : '→ Lane 06'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* DSD Academic Notes */}
        <Card
          title="DSD Viva Voce — Key Concepts"
          subtitle="Theoretical principles for faculty oral evaluation"
        >
          <div className="space-y-3 text-xs">
            {[
              {
                q: '1. Why use a 3-input AND gate for SORT?',
                a: 'All three conditions must simultaneously hold for safe automatic routing. A single failure (bad ID, overweight, or invalid flight) must prevent the bag from entering high-speed flight chutes to avoid mis-sorting and load imbalance.',
              },
              {
                q: "2. How does De Morgan's theorem apply?",
                a: "ALERT = (I·W·F)' = I' + W' + F' by De Morgan's law. The OR gate detects any single fault condition and raises the security divert signal. This demonstrates that the complement of an AND is an OR of complements.",
              },
              {
                q: '3. What is a Digital Magnitude Comparator?',
                a: `The 24-bit ADC output word A (measured weight) is compared to reference register B (${settings.maxBaggageWeight} kg). The comparator outputs W = (A ≤ B). This is a 1-bit binary comparator fed directly into the AND gate.`,
              },
              {
                q: '4. Why are NOT gates needed?',
                a: "NOT gates (inverters) produce the complement signals I', W', F'. These are the inputs to the fault-detection OR gate. Without NOT gates, the fault detection circuit cannot implement De Morgan's equation.",
              },
              {
                q: '5. What type of logic circuit is this?',
                a: 'This is a Combinatorial (non-sequential) logic circuit. Output depends only on current input values with no clock-edge memory. For a sequential implementation, a Mealy or Moore FSM can represent conveyor station states.',
              },
            ].map((item) => (
              <div key={item.q} className="p-3 rounded-lg bg-[#F8FAFC] border border-aviation-border">
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
