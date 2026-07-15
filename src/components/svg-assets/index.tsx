import React from 'react';

interface SvgProps {
  width?: number;
  height?: number;
  className?: string;
  fillColor?: string;
  strokeColor?: string;
}

// Unique ID counter to avoid SVG id collisions
let idCounter = 0;
function uid(prefix: string) { return `${prefix}-${++idCounter}`; }

// ══════════════════════════════════════════════════════════════
// TABLE PRESETS (chairs built-in)
// ══════════════════════════════════════════════════════════════

export function RoundTable2Svg({ width = 70, height = 70, fillColor = '#8B6914', strokeColor = '#6B4A1E' }: SvgProps) {
  const g = uid('rt2');
  return (
    <svg width={width} height={height} viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`${g}-t`} cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor={fillColor} stopOpacity="1.4" />
          <stop offset="40%" stopColor={fillColor} stopOpacity="1.1" />
          <stop offset="100%" stopColor={fillColor} />
        </radialGradient>
        <filter id={`${g}-sh`}><feDropShadow dx="1" dy="2" stdDeviation="2.5" floodOpacity="0.35" /></filter>
        <filter id={`${g}-cs`}><feDropShadow dx="0.5" dy="1" stdDeviation="1" floodOpacity="0.3" /></filter>
      </defs>
      {/* Chair seats */}
      {[0, 180].map((a, i) => {
        const rad = (a * Math.PI) / 180;
        const cx = 35 + Math.cos(rad) * 33;
        const cy = 35 + Math.sin(rad) * 33;
        return <circle key={i} cx={cx} cy={cy} r="7" fill="#6B4226" stroke="#4A2E18" strokeWidth="1" filter={`url(#${g}-cs)`} />;
      })}
      {/* Table top - layered rings */}
      <circle cx="35" cy="35" r="26" fill={`url(#${g}-t)`} stroke={strokeColor} strokeWidth="2" filter={`url(#${g}-sh)`} />
      <circle cx="35" cy="35" r="22" fill="none" stroke="#9B7A3A" strokeWidth="0.6" opacity="0.4" />
      <circle cx="35" cy="35" r="17" fill="none" stroke="#C9A96E" strokeWidth="0.4" opacity="0.3" />
      {/* Center plate */}
      <circle cx="35" cy="35" r="6" fill="#C9A96E" stroke="#A0843A" strokeWidth="0.5" opacity="0.5" />
    </svg>
  );
}

export function RoundTable4Svg({ width = 90, height = 90, fillColor = '#8B6914', strokeColor = '#6B4A1E' }: SvgProps) {
  const g = uid('rt4');
  return (
    <svg width={width} height={height} viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`${g}-t`} cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor={fillColor} stopOpacity="1.4" />
          <stop offset="40%" stopColor={fillColor} stopOpacity="1.1" />
          <stop offset="100%" stopColor={fillColor} />
        </radialGradient>
        <filter id={`${g}-sh`}><feDropShadow dx="1" dy="2" stdDeviation="2.5" floodOpacity="0.35" /></filter>
        <filter id={`${g}-cs`}><feDropShadow dx="0.5" dy="1" stdDeviation="1" floodOpacity="0.3" /></filter>
      </defs>
      {[0, 90, 180, 270].map((a, i) => {
        const rad = (a * Math.PI) / 180;
        return <circle key={i} cx={45 + Math.cos(rad) * 40} cy={45 + Math.sin(rad) * 40} r="7" fill="#6B4226" stroke="#4A2E18" strokeWidth="1" filter={`url(#${g}-cs)`} />;
      })}
      <circle cx="45" cy="45" r="32" fill={`url(#${g}-t)`} stroke={strokeColor} strokeWidth="2" filter={`url(#${g}-sh)`} />
      <circle cx="45" cy="45" r="27" fill="none" stroke="#9B7A3A" strokeWidth="0.6" opacity="0.4" />
      <circle cx="45" cy="45" r="20" fill="none" stroke="#C9A96E" strokeWidth="0.4" opacity="0.3" />
      <circle cx="45" cy="45" r="7" fill="#C9A96E" stroke="#A0843A" strokeWidth="0.5" opacity="0.5" />
    </svg>
  );
}

export function RoundTable6Svg({ width = 110, height = 110, fillColor = '#8B6914', strokeColor = '#6B4A1E' }: SvgProps) {
  const g = uid('rt6');
  return (
    <svg width={width} height={height} viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`${g}-t`} cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor={fillColor} stopOpacity="1.4" />
          <stop offset="40%" stopColor={fillColor} stopOpacity="1.1" />
          <stop offset="100%" stopColor={fillColor} />
        </radialGradient>
        <filter id={`${g}-sh`}><feDropShadow dx="1" dy="2" stdDeviation="2.5" floodOpacity="0.35" /></filter>
        <filter id={`${g}-cs`}><feDropShadow dx="0.5" dy="1" stdDeviation="1" floodOpacity="0.3" /></filter>
      </defs>
      {[0, 60, 120, 180, 240, 300].map((a, i) => {
        const rad = (a * Math.PI) / 180;
        return <circle key={i} cx={55 + Math.cos(rad) * 48} cy={55 + Math.sin(rad) * 48} r="7.5" fill="#6B4226" stroke="#4A2E18" strokeWidth="1" filter={`url(#${g}-cs)`} />;
      })}
      <circle cx="55" cy="55" r="38" fill={`url(#${g}-t)`} stroke={strokeColor} strokeWidth="2" filter={`url(#${g}-sh)`} />
      <circle cx="55" cy="55" r="32" fill="none" stroke="#9B7A3A" strokeWidth="0.6" opacity="0.4" />
      <circle cx="55" cy="55" r="24" fill="none" stroke="#C9A96E" strokeWidth="0.4" opacity="0.3" />
      <circle cx="55" cy="55" r="8" fill="#C9A96E" stroke="#A0843A" strokeWidth="0.5" opacity="0.5" />
    </svg>
  );
}

export function RoundTable8Svg({ width = 130, height = 130, fillColor = '#8B6914', strokeColor = '#6B4A1E' }: SvgProps) {
  const g = uid('rt8');
  return (
    <svg width={width} height={height} viewBox="0 0 130 130" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`${g}-t`} cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor={fillColor} stopOpacity="1.4" />
          <stop offset="40%" stopColor={fillColor} stopOpacity="1.1" />
          <stop offset="100%" stopColor={fillColor} />
        </radialGradient>
        <filter id={`${g}-sh`}><feDropShadow dx="1" dy="2" stdDeviation="2.5" floodOpacity="0.35" /></filter>
        <filter id={`${g}-cs`}><feDropShadow dx="0.5" dy="1" stdDeviation="1" floodOpacity="0.3" /></filter>
      </defs>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => {
        const rad = (a * Math.PI) / 180;
        return <circle key={i} cx={65 + Math.cos(rad) * 56} cy={65 + Math.sin(rad) * 56} r="7.5" fill="#6B4226" stroke="#4A2E18" strokeWidth="1" filter={`url(#${g}-cs)`} />;
      })}
      <circle cx="65" cy="65" r="46" fill={`url(#${g}-t)`} stroke={strokeColor} strokeWidth="2" filter={`url(#${g}-sh)`} />
      <circle cx="65" cy="65" r="39" fill="none" stroke="#9B7A3A" strokeWidth="0.6" opacity="0.4" />
      <circle cx="65" cy="65" r="30" fill="none" stroke="#C9A96E" strokeWidth="0.4" opacity="0.3" />
      <circle cx="65" cy="65" r="9" fill="#C9A96E" stroke="#A0843A" strokeWidth="0.5" opacity="0.5" />
    </svg>
  );
}

export function SquareTable4Svg({ width = 90, height = 90, fillColor = '#8B6914', strokeColor = '#6B4A1E' }: SvgProps) {
  const g = uid('sq4');
  return (
    <svg width={width} height={height} viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${g}-t`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={fillColor} stopOpacity="1.4" />
          <stop offset="50%" stopColor={fillColor} stopOpacity="1.1" />
          <stop offset="100%" stopColor={fillColor} />
        </linearGradient>
        <filter id={`${g}-sh`}><feDropShadow dx="1" dy="2" stdDeviation="2.5" floodOpacity="0.35" /></filter>
        <filter id={`${g}-cs`}><feDropShadow dx="0.5" dy="1" stdDeviation="1" floodOpacity="0.3" /></filter>
      </defs>
      {[{ x: 18, y: 18 }, { x: 72, y: 18 }, { x: 18, y: 72 }, { x: 72, y: 72 }].map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="7" fill="#6B4226" stroke="#4A2E18" strokeWidth="1" filter={`url(#${g}-cs)`} />
      ))}
      <rect x="14" y="14" width="62" height="62" rx="5" fill={`url(#${g}-t)`} stroke={strokeColor} strokeWidth="2" filter={`url(#${g}-sh)`} />
      <rect x="22" y="22" width="46" height="46" rx="3" fill="none" stroke="#9B7A3A" strokeWidth="0.6" opacity="0.4" />
      <rect x="30" y="30" width="30" height="30" rx="2" fill="none" stroke="#C9A96E" strokeWidth="0.4" opacity="0.3" />
    </svg>
  );
}

export function RectangleTable6Svg({ width = 150, height = 80, fillColor = '#8B6914', strokeColor = '#6B4A1E' }: SvgProps) {
  const g = uid('r6');
  return (
    <svg width={width} height={height} viewBox="0 0 150 80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${g}-t`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={fillColor} stopOpacity="1.3" />
          <stop offset="50%" stopColor={fillColor} stopOpacity="1.0" />
          <stop offset="100%" stopColor={fillColor} stopOpacity="1.3" />
        </linearGradient>
        <filter id={`${g}-sh`}><feDropShadow dx="1" dy="2" stdDeviation="2.5" floodOpacity="0.35" /></filter>
        <filter id={`${g}-cs`}><feDropShadow dx="0.5" dy="1" stdDeviation="1" floodOpacity="0.3" /></filter>
      </defs>
      {[30, 75, 120].map((x, i) => (
        <React.Fragment key={i}>
          <circle cx={x} cy={15} r="6.5" fill="#6B4226" stroke="#4A2E18" strokeWidth="1" filter={`url(#${g}-cs)`} />
          <circle cx={x} cy={65} r="6.5" fill="#6B4226" stroke="#4A2E18" strokeWidth="1" filter={`url(#${g}-cs)`} />
        </React.Fragment>
      ))}
      <rect x="14" y="22" width="122" height="36" rx="5" fill={`url(#${g}-t)`} stroke={strokeColor} strokeWidth="2" filter={`url(#${g}-sh)`} />
      <rect x="22" y="28" width="106" height="24" rx="3" fill="none" stroke="#9B7A3A" strokeWidth="0.5" opacity="0.4" />
    </svg>
  );
}

export function RectangleTable8Svg({ width = 180, height = 80, fillColor = '#8B6914', strokeColor = '#6B4A1E' }: SvgProps) {
  const g = uid('r8');
  return (
    <svg width={width} height={height} viewBox="0 0 180 80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${g}-t`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={fillColor} stopOpacity="1.3" />
          <stop offset="50%" stopColor={fillColor} stopOpacity="1.0" />
          <stop offset="100%" stopColor={fillColor} stopOpacity="1.3" />
        </linearGradient>
        <filter id={`${g}-sh`}><feDropShadow dx="1" dy="2" stdDeviation="2.5" floodOpacity="0.35" /></filter>
        <filter id={`${g}-cs`}><feDropShadow dx="0.5" dy="1" stdDeviation="1" floodOpacity="0.3" /></filter>
      </defs>
      {[30, 70, 110, 150].map((x, i) => (
        <React.Fragment key={i}>
          <circle cx={x} cy={15} r="6.5" fill="#6B4226" stroke="#4A2E18" strokeWidth="1" filter={`url(#${g}-cs)`} />
          <circle cx={x} cy={65} r="6.5" fill="#6B4226" stroke="#4A2E18" strokeWidth="1" filter={`url(#${g}-cs)`} />
        </React.Fragment>
      ))}
      <rect x="14" y="22" width="152" height="36" rx="5" fill={`url(#${g}-t)`} stroke={strokeColor} strokeWidth="2" filter={`url(#${g}-sh)`} />
      <rect x="22" y="28" width="136" height="24" rx="3" fill="none" stroke="#9B7A3A" strokeWidth="0.5" opacity="0.4" />
    </svg>
  );
}

export function VipSofaSvg({ width = 140, height = 140, fillColor = '#6B3A1F', strokeColor = '#D4AF37' }: SvgProps) {
  const g = uid('vip');
  return (
    <svg width={width} height={height} viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`${g}-t`} cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor={fillColor} stopOpacity="1.4" />
          <stop offset="50%" stopColor={fillColor} stopOpacity="1.1" />
          <stop offset="100%" stopColor={fillColor} stopOpacity="0.7" />
        </radialGradient>
        <filter id={`${g}-sh`}><feDropShadow dx="2" dy="3" stdDeviation="3" floodOpacity="0.4" /></filter>
        <filter id={`${g}-cs`}><feDropShadow dx="0.5" dy="1" stdDeviation="1" floodOpacity="0.3" /></filter>
      </defs>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => {
        const rad = (a * Math.PI) / 180;
        return <circle key={i} cx={70 + Math.cos(rad) * 58} cy={70 + Math.sin(rad) * 58} r="7.5" fill="#4A2810" stroke="#D4AF37" strokeWidth="1.5" filter={`url(#${g}-cs)`} />;
      })}
      <circle cx="70" cy="70" r="50" fill={`url(#${g}-t)`} stroke={strokeColor} strokeWidth="3" filter={`url(#${g}-sh)`} />
      <circle cx="70" cy="70" r="43" fill="none" stroke="#D4AF37" strokeWidth="1" opacity="0.4" />
      <circle cx="70" cy="70" r="35" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.3" />
      <text x="70" y="74" textAnchor="middle" fill="#D4AF37" fontSize="12" fontWeight="bold" fontFamily="serif">VIP</text>
    </svg>
  );
}

export function BoothSvg({ width = 120, height = 100, fillColor = '#8B6914', strokeColor = '#6B4A1E' }: SvgProps) {
  const g = uid('booth');
  return (
    <svg width={width} height={height} viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${g}-t`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={fillColor} stopOpacity="1.3" />
          <stop offset="100%" stopColor={fillColor} />
        </linearGradient>
        <filter id={`${g}-sh`}><feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" /></filter>
        <filter id={`${g}-cs`}><feDropShadow dx="0.5" dy="1" stdDeviation="1" floodOpacity="0.3" /></filter>
      </defs>
      {/* Back bench */}
      <rect x="5" y="58" width="110" height="30" rx="8" fill="#6B4226" stroke="#4A2E18" strokeWidth="2" filter={`url(#${g}-sh)`} />
      <rect x="10" y="62" width="100" height="22" rx="5" fill="#8B5E3C" opacity="0.5" />
      {/* Table */}
      <rect x="12" y="12" width="96" height="42" rx="5" fill={`url(#${g}-t)`} stroke={strokeColor} strokeWidth="2" filter={`url(#${g}-sh)`} />
      <rect x="20" y="18" width="80" height="30" rx="3" fill="none" stroke="#9B7A3A" strokeWidth="0.5" opacity="0.4" />
      {/* Chair dots */}
      {[25, 60, 95].map((x, i) => (
        <React.Fragment key={i}>
          <circle cx={x} cy={12} r="6" fill="#6B4226" stroke="#4A2E18" strokeWidth="0.8" filter={`url(#${g}-cs)`} />
          <circle cx={x} cy={54} r="6" fill="#6B4226" stroke="#4A2E18" strokeWidth="0.8" filter={`url(#${g}-cs)`} />
        </React.Fragment>
      ))}
    </svg>
  );
}

export function BarCounterSvg({ width = 200, height = 60, fillColor = '#2A4A4A', strokeColor = '#1C3030' }: SvgProps) {
  const g = uid('bar');
  return (
    <svg width={width} height={height} viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${g}-t`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={fillColor} stopOpacity="1.3" />
          <stop offset="100%" stopColor={fillColor} />
        </linearGradient>
        <filter id={`${g}-sh`}><feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.35" /></filter>
      </defs>
      <rect x="5" y="10" width="190" height="44" rx="6" fill={`url(#${g}-t)`} stroke={strokeColor} strokeWidth="2" filter={`url(#${g}-sh)`} />
      {/* Counter top surface */}
      <rect x="10" y="14" width="180" height="14" rx="4" fill="#4A7C7C" opacity="0.6" />
      <line x1="10" y1="28" x2="190" y2="28" stroke="#1C3030" strokeWidth="1" opacity="0.3" />
      {/* Bottles on back bar */}
      {[25, 55, 85, 115, 145, 175].map((x, i) => (
        <React.Fragment key={i}>
          <rect x={x - 4} y="2" width="8" height="12" rx="2" fill={i % 2 === 0 ? '#DAA520' : '#8B0000'} opacity="0.7" />
          <rect x={x - 2} y="0" width="4" height="3" rx="1" fill="#C0C0C0" opacity="0.5" />
        </React.Fragment>
      ))}
      {/* Bar stools */}
      {[40, 100, 160].map((x, i) => (
        <circle key={i} cx={x} cy={52} r="5" fill="#2A2A2A" stroke="#1a1a1a" strokeWidth="0.8" />
      ))}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
// LEGACY TABLES (kept for compat)
// ══════════════════════════════════════════════════════════════

export function RoundTableSvg({ width = 80, height = 80, fillColor, strokeColor }: SvgProps) { return <RoundTable4Svg width={width} height={height} fillColor={fillColor} strokeColor={strokeColor} />; }
export function SquareTableSvg({ width = 80, height = 80, fillColor, strokeColor }: SvgProps) { return <SquareTable4Svg width={width} height={height} fillColor={fillColor} strokeColor={strokeColor} />; }
export function RectangleTableSvg({ width = 140, height = 70, fillColor, strokeColor }: SvgProps) { return <RectangleTable6Svg width={width} height={height} fillColor={fillColor} strokeColor={strokeColor} />; }
export function VipTableSvg({ width = 120, height = 120, fillColor, strokeColor }: SvgProps) { return <VipSofaSvg width={width} height={height} fillColor={fillColor} strokeColor={strokeColor} />; }
export function ChairSvg({ width = 30, height = 30, fillColor = '#6B4226', strokeColor = '#4A2E18' }: SvgProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id="ch-sh"><feDropShadow dx="0.5" dy="1" stdDeviation="1" floodOpacity="0.3" /></filter></defs>
      <circle cx="15" cy="15" r="10" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" filter="url(#ch-sh)" />
      <circle cx="15" cy="15" r="7" fill="#8B5E3C" opacity="0.5" />
    </svg>
  );
}
export function BenchSvg({ width = 120, height = 40, fillColor = '#6B4226', strokeColor = '#4A2E18' }: SvgProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id="bn-sh"><feDropShadow dx="1" dy="1" stdDeviation="1.5" floodOpacity="0.25" /></filter></defs>
      <rect x="5" y="8" width="110" height="24" rx="5" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" filter="url(#bn-sh)" />
      <rect x="10" y="11" width="100" height="18" rx="3" fill="#8B5E3C" opacity="0.4" />
      <rect x="10" y="28" width="6" height="8" rx="1" fill="#4A2E18" />
      <rect x="104" y="28" width="6" height="8" rx="1" fill="#4A2E18" />
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
// RESTAURANT
// ══════════════════════════════════════════════════════════════

export function CashierSvg({ width = 100, height = 60 }: SvgProps) {
  const g = uid('cash');
  return (
    <svg width={width} height={height} viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${g}-t`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#DAA520" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
        <filter id={`${g}-sh`}><feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.35" /></filter>
      </defs>
      <rect x="5" y="12" width="90" height="43" rx="5" fill={`url(#${g}-t)`} stroke="#8B6914" strokeWidth="2" filter={`url(#${g}-sh)`} />
      <rect x="12" y="18" width="76" height="10" rx="3" fill="#8B6914" opacity="0.5" />
      {/* Register drawer */}
      <rect x="30" y="32" width="40" height="16" rx="3" fill="#2F4F4F" stroke="#1C3030" strokeWidth="1" />
      <circle cx="50" cy="40" r="4" fill="#1C3030" />
      <circle cx="50" cy="40" r="2" fill="#DAA520" opacity="0.6" />
      <text x="50" y="9" textAnchor="middle" fill="#8B6914" fontSize="7" fontWeight="bold" fontFamily="sans-serif">CASHIER</text>
    </svg>
  );
}

export function ReceptionSvg({ width = 120, height = 60 }: SvgProps) {
  const g = uid('rec');
  return (
    <svg width={width} height={height} viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${g}-t`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5A8ABA" />
          <stop offset="100%" stopColor="#36648B" />
        </linearGradient>
        <filter id={`${g}-sh`}><feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" /></filter>
      </defs>
      <rect x="5" y="18" width="110" height="37" rx="6" fill={`url(#${g}-t)`} stroke="#2B4FA0" strokeWidth="2" filter={`url(#${g}-sh)`} />
      <rect x="10" y="22" width="100" height="12" rx="3" fill="#2B4FA0" opacity="0.5" />
      {/* Desk */}
      <rect x="35" y="36" width="50" height="14" rx="3" fill="#1E3A6E" stroke="#152C52" strokeWidth="1" />
      <circle cx="60" cy="43" r="3" fill="#DAA520" opacity="0.5" />
      <text x="60" y="12" textAnchor="middle" fill="#2B4FA0" fontSize="7" fontWeight="bold" fontFamily="sans-serif">RECEPTION</text>
      <circle cx="18" cy="12" r="3" fill="#DAA520" opacity="0.6" />
      <circle cx="102" cy="12" r="3" fill="#DAA520" opacity="0.6" />
    </svg>
  );
}

export function BarSvg({ width = 200, height = 50, fillColor, strokeColor }: SvgProps) { return <BarCounterSvg width={width} height={height} fillColor={fillColor} strokeColor={strokeColor} />; }

export function StageSvg({ width = 200, height = 100 }: SvgProps) {
  const g = uid('stage');
  return (
    <svg width={width} height={height} viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${g}-t`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A00000" />
          <stop offset="100%" stopColor="#6B0000" />
        </linearGradient>
        <filter id={`${g}-sh`}><feDropShadow dx="2" dy="3" stdDeviation="3" floodOpacity="0.4" /></filter>
      </defs>
      <rect x="5" y="18" width="190" height="77" rx="6" fill={`url(#${g}-t)`} stroke="#4A0000" strokeWidth="2" filter={`url(#${g}-sh)`} />
      {/* Curtain drape effect */}
      <path d="M5 18 Q50 30 100 18 Q150 6 195 18" fill="none" stroke="#FFD700" strokeWidth="1.5" opacity="0.4" />
      <path d="M10 25 Q55 35 100 25 Q145 15 190 25" fill="none" stroke="#FFD700" strokeWidth="0.8" opacity="0.3" />
      {/* Spotlight cones */}
      {[50, 100, 150].map((x, i) => (
        <React.Fragment key={i}>
          <circle cx={x} cy={12} r="6" fill="#FFD700" opacity="0.6" />
          <path d={`M${x - 3} 18 L${x - 15} 95 L${x + 15} 95 L${x + 3} 18`} fill="#FFD700" opacity="0.04" />
        </React.Fragment>
      ))}
      {/* Stage floor edge */}
      <line x1="10" y1="88" x2="190" y2="88" stroke="#FFD700" strokeWidth="1" opacity="0.3" />
      <text x="100" y="62" textAnchor="middle" fill="#FFD700" fontSize="14" fontWeight="bold" fontFamily="sans-serif" opacity="0.5">STAGE</text>
    </svg>
  );
}

export function KitchenSvg({ width = 150, height = 120 }: SvgProps) {
  const g = uid('kit');
  return (
    <svg width={width} height={height} viewBox="0 0 150 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${g}-t`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF6347" />
          <stop offset="100%" stopColor="#CC3318" />
        </linearGradient>
        <filter id={`${g}-sh`}><feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" /></filter>
      </defs>
      <rect x="5" y="5" width="140" height="110" rx="5" fill={`url(#${g}-t)`} stroke="#AA2010" strokeWidth="2" filter={`url(#${g}-sh)`} opacity="0.9" />
      {/* Counter surfaces */}
      <rect x="10" y="10" width="130" height="35" rx="3" fill="#AA2010" opacity="0.4" />
      <rect x="10" y="52" width="60" height="55" rx="3" fill="#AA2010" opacity="0.3" />
      <rect x="78" y="52" width="62" height="55" rx="3" fill="#AA2010" opacity="0.3" />
      {/* Burners */}
      {[35, 80, 125].map((x, i) => (
        <React.Fragment key={i}>
          <circle cx={x} cy={27} r="10" fill="#FFD700" opacity="0.2" stroke="#FFD700" strokeWidth="0.5" />
          <circle cx={x} cy={27} r="5" fill="#FFD700" opacity="0.15" />
        </React.Fragment>
      ))}
      {/* Sink */}
      <rect x="85" y="62" width="40" height="30" rx="4" fill="#C0C0C0" opacity="0.3" stroke="#C0C0C0" strokeWidth="0.5" />
      <text x="75" y="85" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="sans-serif" opacity="0.8">KITCHEN</text>
    </svg>
  );
}

export function DjBoothSvg({ width = 80, height = 80 }: SvgProps) {
  const g = uid('dj');
  return (
    <svg width={width} height={height} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${g}-t`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5B1A9E" />
          <stop offset="100%" stopColor="#2E0057" />
        </linearGradient>
        <filter id={`${g}-sh`}><feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.35" /></filter>
      </defs>
      <rect x="10" y="14" width="60" height="56" rx="6" fill={`url(#${g}-t)`} stroke="#1A0033" strokeWidth="2" filter={`url(#${g}-sh)`} />
      {/* Turntables */}
      <circle cx="28" cy="36" r="12" fill="#1A0033" stroke="#7B00D4" strokeWidth="1.5" />
      <circle cx="28" cy="36" r="4" fill="#7B00D4" />
      <circle cx="55" cy="36" r="10" fill="#1A0033" stroke="#7B00D4" strokeWidth="1.5" />
      <circle cx="55" cy="36" r="3" fill="#7B00D4" />
      {/* Mixer */}
      <rect x="20" y="56" width="40" height="10" rx="2" fill="#1A0033" />
      {[28, 36, 44, 52].map((x, i) => (
        <rect key={i} x={x} y="57" width="3" height="8" rx="1" fill="#7B00D4" opacity="0.7" />
      ))}
      <text x="40" y="10" textAnchor="middle" fill="#9B30FF" fontSize="7" fontWeight="bold">DJ</text>
    </svg>
  );
}

export function BuffetSvg({ width = 180, height = 60 }: SvgProps) {
  const g = uid('buf');
  return (
    <svg width={width} height={height} viewBox="0 0 180 60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${g}-t`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#CD853F" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
        <filter id={`${g}-sh`}><feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" /></filter>
      </defs>
      <rect x="5" y="12" width="170" height="43" rx="5" fill={`url(#${g}-t)`} stroke="#6B4A1E" strokeWidth="2" filter={`url(#${g}-sh)`} />
      <rect x="10" y="16" width="160" height="12" rx="3" fill="#8B6914" opacity="0.5" />
      {/* Serving dishes */}
      {[30, 65, 100, 135].map((x, i) => (
        <React.Fragment key={i}>
          <ellipse cx={x} cy="22" rx="12" ry="5" fill="#DAA520" opacity="0.6" />
          <rect x={x - 10} y="32" width="20" height="16" rx="2" fill="#8B6914" opacity="0.4" />
        </React.Fragment>
      ))}
      <text x="90" y="52" textAnchor="middle" fill="#5C4A1E" fontSize="7" fontWeight="bold" fontFamily="sans-serif" opacity="0.6">BUFFET</text>
    </svg>
  );
}

export function WineShelfSvg({ width = 60, height = 120 }: SvgProps) {
  const g = uid('wine');
  return (
    <svg width={width} height={height} viewBox="0 0 60 120" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id={`${g}-sh`}><feDropShadow dx="1" dy="1" stdDeviation="1.5" floodOpacity="0.25" /></filter></defs>
      <rect x="5" y="5" width="50" height="110" rx="4" fill="#3A1E14" stroke="#2D1B1A" strokeWidth="1.5" filter={`url(#${g}-sh)`} />
      {[20, 50, 80].map((y, i) => (
        <React.Fragment key={i}>
          <rect x="8" y={y} width="44" height="3" fill="#2D1B1A" />
          {[15, 30, 45].map((x, j) => (
            <React.Fragment key={j}>
              <rect x={x - 3} y={y - 12} width="6" height="12" rx="3" fill={j % 2 === 0 ? '#722F37' : '#2E5B2E'} opacity="0.85" />
              <rect x={x - 1} y={y - 14} width="2" height="3" fill="#2D1B1A" />
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}
    </svg>
  );
}

export function CoffeeStationSvg({ width = 100, height = 60 }: SvgProps) {
  const g = uid('coffee');
  return (
    <svg width={width} height={height} viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${g}-t`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7B5B3A" />
          <stop offset="100%" stopColor="#4A3525" />
        </linearGradient>
        <filter id={`${g}-sh`}><feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" /></filter>
      </defs>
      <rect x="5" y="12" width="90" height="43" rx="5" fill={`url(#${g}-t)`} stroke="#3D2A1C" strokeWidth="2" filter={`url(#${g}-sh)`} />
      {/* Espresso machines */}
      <rect x="12" y="18" width="32" height="28" rx="4" fill="#3D2A1C" stroke="#2A1E12" strokeWidth="1" />
      <rect x="55" y="18" width="32" height="28" rx="4" fill="#3D2A1C" stroke="#2A1E12" strokeWidth="1" />
      {/* Steam */}
      <path d="M28 14 Q30 8 32 14" fill="none" stroke="#C0C0C0" strokeWidth="1" opacity="0.4" />
      <path d="M71 14 Q73 8 75 14" fill="none" stroke="#C0C0C0" strokeWidth="1" opacity="0.4" />
      <text x="50" y="8" textAnchor="middle" fill="#4A3525" fontSize="7" fontWeight="bold" fontFamily="sans-serif">COFFEE</text>
    </svg>
  );
}

export function WaitingAreaSvg({ width = 100, height = 60 }: SvgProps) {
  const g = uid('wait');
  return (
    <svg width={width} height={height} viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id={`${g}-sh`}><feDropShadow dx="1" dy="1" stdDeviation="1.5" floodOpacity="0.2" /></filter></defs>
      <rect x="5" y="5" width="90" height="50" rx="5" fill="#E8DCC8" stroke="#C4B5A0" strokeWidth="1.5" filter={`url(#${g}-sh)`} />
      {/* Sofa seats */}
      <rect x="10" y="28" width="35" height="20" rx="5" fill="#B8A080" stroke="#9C8A6C" strokeWidth="1" />
      <rect x="55" y="28" width="35" height="20" rx="5" fill="#B8A080" stroke="#9C8A6C" strokeWidth="1" />
      <text x="50" y="20" textAnchor="middle" fill="#8B7355" fontSize="8" fontWeight="bold" fontFamily="sans-serif">WAITING</text>
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
// BUILDING
// ══════════════════════════════════════════════════════════════

export function WallSvg({ width = 200, height = 20, fillColor = '#4A4A4A' }: SvgProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="20" rx="2" fill={fillColor} />
      <line x1="0" y1="10" x2="200" y2="10" stroke="#1a1a1a" strokeWidth="0.5" opacity="0.5" />
      {[0, 40, 80, 120, 160].map((x, i) => (
        <line key={i} x1={x} y1="0" x2={x} y2="20" stroke="#1a1a1a" strokeWidth="0.3" opacity="0.3" />
      ))}
    </svg>
  );
}

export function GlassWallSvg({ width = 200, height = 10 }: SvgProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 200 10" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="glass-g" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#B0D4F1" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#87CEEB" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#B0D4F1" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <rect width="200" height="10" fill="url(#glass-g)" stroke="#4682B4" strokeWidth="1.5" rx="1" />
      {[20, 60, 100, 140, 180].map((x, i) => (
        <line key={i} x1={x} y1="0" x2={x} y2="10" stroke="#4682B4" strokeWidth="0.5" opacity="0.4" />
      ))}
    </svg>
  );
}

export function DoorSvg({ width = 80, height = 20, fillColor = '#A0623D', strokeColor = '#4A2510' }: SvgProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 80 20" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="2" width="70" height="16" rx="2" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
      <rect x="10" y="5" width="60" height="10" rx="1" fill="#8B5E3C" opacity="0.5" />
      <circle cx="62" cy="10" r="2.5" fill="#DAA520" stroke="#B8860B" strokeWidth="0.5" />
      <path d="M 5 2 Q 5 -8 40 -8 Q 75 -8 75 2" fill="none" stroke="#4A2510" strokeWidth="1" strokeDasharray="3,2" />
    </svg>
  );
}

export function DoubleDoorSvg({ width = 120, height = 20, fillColor = '#A0623D', strokeColor = '#4A2510' }: SvgProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 120 20" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="2" width="50" height="16" rx="2" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
      <rect x="65" y="2" width="50" height="16" rx="2" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
      <circle cx="50" cy="10" r="2" fill="#DAA520" />
      <circle cx="70" cy="10" r="2" fill="#DAA520" />
      <path d="M 5 2 Q 5 -8 30 -8 Q 55 -8 55 2" fill="none" stroke="#4A2510" strokeWidth="1" strokeDasharray="3,2" />
      <path d="M 65 2 Q 65 -8 90 -8 Q 115 -8 115 2" fill="none" stroke="#4A2510" strokeWidth="1" strokeDasharray="3,2" />
    </svg>
  );
}

export function SlidingDoorSvg({ width = 100, height = 15 }: SvgProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 100 15" xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="2" x2="100" y2="2" stroke="#708090" strokeWidth="2.5" />
      <rect x="5" y="4" width="40" height="10" rx="1" fill="#87CEEB" stroke="#4682B4" strokeWidth="1" opacity="0.75" />
      <rect x="55" y="4" width="40" height="10" rx="1" fill="#87CEEB" stroke="#4682B4" strokeWidth="1" opacity="0.75" />
      <circle cx="43" cy="9" r="1.5" fill="#4682B4" />
      <circle cx="57" cy="9" r="1.5" fill="#4682B4" />
    </svg>
  );
}

export function EmergencyExitSvg({ width = 80, height = 20 }: SvgProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 80 20" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="20" rx="3" fill="#CC0000" />
      <rect x="2" y="2" width="76" height="16" rx="2" fill="#FF0000" opacity="0.8" />
      <text x="40" y="13" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="sans-serif">EXIT</text>
      <path d="M 65 7 L 72 10 L 65 13" fill="none" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

export function WindowSvg({ width = 80, height = 15, fillColor = '#B0D4F1', strokeColor = '#4682B4' }: SvgProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 80 15" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="76" height="11" rx="2" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
      <line x1="40" y1="2" x2="40" y2="13" stroke="#4682B4" strokeWidth="1" opacity="0.5" />
      <line x1="2" y1="7.5" x2="78" y2="7.5" stroke="#4682B4" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

export function StairsSvg({ width = 80, height = 120, fillColor = '#909090', strokeColor = '#505050' }: SvgProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 80 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="70" height="110" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
      {Array.from({ length: 8 }, (_, i) => (
        <React.Fragment key={i}>
          <rect x="10" y={10 + i * 13} width="60" height="11" rx="1" fill={i % 2 === 0 ? '#A0A0A0' : '#787878'} stroke="#505050" strokeWidth="0.5" />
          <line x1="12" y1={15 + i * 13} x2="68" y2={15 + i * 13} stroke="white" strokeWidth="0.3" opacity="0.2" />
        </React.Fragment>
      ))}
      {/* Arrow */}
      <path d="M35 55 L40 45 L45 55" fill="none" stroke="#404040" strokeWidth="1.5" />
      <line x1="40" y1="45" x2="40" y2="75" stroke="#404040" strokeWidth="1.5" />
    </svg>
  );
}

export function ElevatorSvg({ width = 60, height = 60 }: SvgProps) {
  const g = uid('elev');
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id={`${g}-sh`}><feDropShadow dx="1" dy="1" stdDeviation="1.5" floodOpacity="0.25" /></filter></defs>
      <rect x="5" y="5" width="50" height="50" rx="4" fill="#C8C8C8" stroke="#808080" strokeWidth="1.5" filter={`url(#${g}-sh)`} />
      <rect x="10" y="10" width="18" height="40" rx="1" fill="#B0B0B0" stroke="#808080" strokeWidth="0.5" />
      <rect x="32" y="10" width="18" height="40" rx="1" fill="#B0B0B0" stroke="#808080" strokeWidth="0.5" />
      <line x1="30" y1="10" x2="30" y2="50" stroke="#808080" strokeWidth="1" />
      {/* Arrow indicators */}
      <path d="M19 20 L19 15 L16 18 M19 15 L22 18" fill="none" stroke="#606060" strokeWidth="1" />
      <path d="M41 40 L41 45 L38 42 M41 45 L44 42" fill="none" stroke="#606060" strokeWidth="1" />
    </svg>
  );
}

export function ToiletSvg({ width = 60, height = 60, variant = 'male', className = '' }: SvgProps & { variant?: 'male' | 'female' | 'accessible' }) {
  const color = variant === 'male' ? '#4169E1' : variant === 'female' ? '#FF69B4' : '#4682B4';
  const label = variant === 'male' ? 'WC MEN' : variant === 'female' ? 'WC WOMEN' : 'WC ACCESS';
  const icon = variant === 'male' ? '\u2642' : variant === 'female' ? '\u2640' : '\u267F';
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><filter id="wc-sh"><feDropShadow dx="1" dy="1" stdDeviation="1.5" floodOpacity="0.2" /></filter></defs>
      <rect x="5" y="5" width="50" height="50" rx="8" fill={color} opacity="0.15" stroke={color} strokeWidth="2" filter="url(#wc-sh)" />
      <text x="30" y="32" textAnchor="middle" fill={color} fontSize="22" fontWeight="bold">{icon}</text>
      <text x="30" y="48" textAnchor="middle" fill={color} fontSize="6" fontWeight="bold">{label}</text>
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
// DECORATION
// ══════════════════════════════════════════════════════════════

export function PlantSvg({ width = 40, height = 40 }: SvgProps) {
  const g = uid('plant');
  return (
    <svg width={width} height={height} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id={`${g}-sh`}><feDropShadow dx="0.5" dy="1" stdDeviation="1" floodOpacity="0.25" /></filter></defs>
      {/* Pot */}
      <rect x="14" y="30" width="12" height="8" rx="2" fill="#8B4513" stroke="#5C2E0E" strokeWidth="1" />
      <rect x="12" y="28" width="16" height="4" rx="2" fill="#A0623D" stroke="#6B3A1F" strokeWidth="0.5" />
      {/* Foliage - layered circles */}
      <circle cx="20" cy="22" r="10" fill="#228B22" opacity="0.7" filter={`url(#${g}-sh)`} />
      <circle cx="15" cy="18" r="7" fill="#2E8B57" opacity="0.8" />
      <circle cx="25" cy="16" r="8" fill="#3CB371" opacity="0.7" />
      <circle cx="20" cy="14" r="6" fill="#228B22" opacity="0.9" />
      {/* Leaf veins */}
      <line x1="20" y1="14" x2="20" y2="22" stroke="#1A6B1A" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

export function TreeSvg({ width = 60, height = 60 }: SvgProps) {
  const g = uid('tree');
  return (
    <svg width={width} height={height} viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id={`${g}-sh`}><feDropShadow dx="1" dy="1" stdDeviation="2" floodOpacity="0.3" /></filter></defs>
      {/* Trunk */}
      <rect x="27" y="34" width="6" height="18" rx="2" fill="#6B3A1F" stroke="#4A2510" strokeWidth="0.5" />
      {/* Canopy layers */}
      <circle cx="30" cy="24" r="16" fill="#228B22" opacity="0.5" filter={`url(#${g}-sh)`} />
      <circle cx="22" cy="20" r="11" fill="#2E8B57" opacity="0.7" />
      <circle cx="38" cy="18" r="13" fill="#3CB371" opacity="0.6" />
      <circle cx="30" cy="14" r="9" fill="#228B22" opacity="0.85" />
      <circle cx="25" cy="12" r="5" fill="#2E8B57" opacity="0.5" />
      {/* Shadow */}
      <ellipse cx="30" cy="54" rx="10" ry="3" fill="#2A2A2A" opacity="0.1" />
    </svg>
  );
}

export function DividerSvg({ width = 100, height = 10, fillColor = '#D2B48C', strokeColor = '#8B7355' }: SvgProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 100 10" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="10" rx="2" fill={fillColor} stroke={strokeColor} strokeWidth="1" />
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={i * 10 + 1} y="1" width="8" height="8" rx="1" fill="#C4A87C" opacity="0.5" />
      ))}
    </svg>
  );
}

export function CarpetSvg({ width = 120, height = 80, fillColor = '#800020', strokeColor = '#5C0015' }: SvgProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="carpet-p" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill={fillColor} />
          <rect x="2" y="2" width="16" height="16" rx="2" fill="#A00030" opacity="0.5" />
        </pattern>
      </defs>
      <rect x="3" y="3" width="114" height="74" rx="4" fill="url(#carpet-p)" stroke={strokeColor} strokeWidth="1.5" opacity="0.75" />
      <rect x="8" y="8" width="104" height="64" rx="2" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

export function AquariumSvg({ width = 100, height = 40 }: SvgProps) {
  const g = uid('aqua');
  return (
    <svg width={width} height={height} viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${g}-g`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00CED1" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#008B8B" stopOpacity="0.7" />
        </linearGradient>
        <filter id={`${g}-sh`}><feDropShadow dx="1" dy="1" stdDeviation="1.5" floodOpacity="0.25" /></filter>
      </defs>
      <rect x="3" y="3" width="94" height="34" rx="4" fill={`url(#${g}-g)`} stroke="#008B8B" strokeWidth="1.5" filter={`url(#${g}-sh)`} />
      <ellipse cx="25" cy="22" rx="4" ry="2.5" fill="#FF6347" opacity="0.7" />
      <ellipse cx="55" cy="18" rx="3" ry="2" fill="#FFD700" opacity="0.7" />
      <ellipse cx="75" cy="25" rx="3.5" ry="2" fill="#FF69B4" opacity="0.7" />
      <circle cx="15" cy="32" r="3" fill="#228B22" opacity="0.5" />
      <circle cx="85" cy="32" r="3" fill="#228B22" opacity="0.5" />
      {/* Bubbles */}
      <circle cx="40" cy="12" r="1.5" fill="white" opacity="0.4" />
      <circle cx="60" cy="10" r="1" fill="white" opacity="0.3" />
    </svg>
  );
}

export function FlowerSvg({ width = 30, height = 30 }: SvgProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
      {[0, 72, 144, 216, 288].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 15 + Math.cos(rad) * 7;
        const cy = 13 + Math.sin(rad) * 7;
        return <ellipse key={i} cx={cx} cy={cy} rx="4" ry="5.5" fill="#FF69B4" opacity="0.8" transform={`rotate(${angle}, ${cx}, ${cy})`} />;
      })}
      <circle cx="15" cy="13" r="4" fill="#FFD700" />
      <rect x="14" y="18" width="2" height="10" rx="1" fill="#228B22" />
    </svg>
  );
}

export function LampSvg({ width = 25, height = 25 }: SvgProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 25 25" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12.5" cy="12.5" r="11" fill="#FFD700" opacity="0.12" />
      <circle cx="12.5" cy="12.5" r="8" fill="#FFD700" opacity="0.2" />
      <circle cx="12.5" cy="12.5" r="5" fill="#FFD700" opacity="0.4" />
      <circle cx="12.5" cy="12.5" r="3" fill="#FFD700" />
      <circle cx="12.5" cy="12.5" r="1.5" fill="#FFFACD" />
    </svg>
  );
}

export function TvSvg({ width = 60, height = 40 }: SvgProps) {
  const g = uid('tv');
  return (
    <svg width={width} height={height} viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id={`${g}-sh`}><feDropShadow dx="1" dy="1" stdDeviation="1.5" floodOpacity="0.3" /></filter></defs>
      <rect x="5" y="2" width="50" height="30" rx="3" fill="#1C1C1C" stroke="#000" strokeWidth="1.5" filter={`url(#${g}-sh)`} />
      <rect x="8" y="5" width="44" height="24" rx="1" fill="#2C3E50" />
      {/* Screen glare */}
      <line x1="10" y1="7" x2="20" y2="25" stroke="white" strokeWidth="0.5" opacity="0.1" />
      <rect x="20" y="33" width="20" height="3" rx="1" fill="#333" />
      <rect x="15" y="36" width="30" height="2" rx="1" fill="#444" />
    </svg>
  );
}

export function SpeakerSvg({ width = 30, height = 30 }: SvgProps) {
  const g = uid('spk');
  return (
    <svg width={width} height={height} viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id={`${g}-sh`}><feDropShadow dx="0.5" dy="1" stdDeviation="1" floodOpacity="0.25" /></filter></defs>
      <rect x="5" y="3" width="20" height="24" rx="4" fill="#2F2F2F" stroke="#1A1A1A" strokeWidth="1.5" filter={`url(#${g}-sh)`} />
      <circle cx="15" cy="12" r="5.5" fill="#1A1A1A" stroke="#444" strokeWidth="0.5" />
      <circle cx="15" cy="12" r="2.5" fill="#444" />
      <circle cx="15" cy="22" r="3.5" fill="#1A1A1A" stroke="#444" strokeWidth="0.5" />
      <circle cx="15" cy="22" r="1.5" fill="#444" />
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
// TEXT
// ══════════════════════════════════════════════════════════════

export function TextLabelSvg({ width = 120, height = 40 }: SvgProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="40" rx="4" fill="transparent" stroke="#E0E0E0" strokeWidth="1" strokeDasharray="4,2" />
      <text x="60" y="25" textAnchor="middle" fill="#333" fontSize="12" fontFamily="sans-serif">Label</text>
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
// SVG MAP
// ══════════════════════════════════════════════════════════════

export const SVG_COMPONENTS: Record<string, React.ComponentType<SvgProps>> = {
  round_table: RoundTableSvg,
  square_table: SquareTableSvg,
  rectangle_table: RectangleTableSvg,
  vip_table: VipTableSvg,
  round_table_2: RoundTable2Svg,
  round_table_4: RoundTable4Svg,
  round_table_6: RoundTable6Svg,
  round_table_8: RoundTable8Svg,
  square_table_4: SquareTable4Svg,
  rectangle_table_6: RectangleTable6Svg,
  rectangle_table_8: RectangleTable8Svg,
  vip_sofa: VipSofaSvg,
  booth: BoothSvg,
  bar_counter: BarCounterSvg,
  chair: ChairSvg,
  bench: BenchSvg,
  cashier: CashierSvg,
  reception: ReceptionSvg,
  stage: StageSvg,
  kitchen: KitchenSvg,
  dj_booth: DjBoothSvg,
  buffet: BuffetSvg,
  wine_shelf: WineShelfSvg,
  coffee_station: CoffeeStationSvg,
  waiting_area: WaitingAreaSvg,
  wall: WallSvg,
  glass_wall: GlassWallSvg,
  door: DoorSvg,
  double_door: DoubleDoorSvg,
  sliding_door: SlidingDoorSvg,
  emergency_exit: EmergencyExitSvg,
  window: WindowSvg,
  stairs: StairsSvg,
  elevator: ElevatorSvg,
  toilet_male: (props) => <ToiletSvg {...props} variant="male" />,
  toilet_female: (props) => <ToiletSvg {...props} variant="female" />,
  toilet_accessible: (props) => <ToiletSvg {...props} variant="accessible" />,
  plant: PlantSvg,
  tree: TreeSvg,
  divider: DividerSvg,
  carpet: CarpetSvg,
  aquarium: AquariumSvg,
  flower: FlowerSvg,
  lamp: LampSvg,
  tv: TvSvg,
  speaker: SpeakerSvg,
  text_label: TextLabelSvg,
};

export function getObjectSvg(type: string): React.ComponentType<SvgProps> | null {
  return SVG_COMPONENTS[type] || null;
}
