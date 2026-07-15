'use client';

import { useId } from 'react';
import type { FloorPlan } from '@/types';

interface FloorPlanBackgroundProps {
  floorPlan: FloorPlan;
  className?: string;
  children?: React.ReactNode;
}

function WoodBackground({ prefix }: { prefix: string }) {
  return (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id={`${prefix}-grain`} width="200" height="200" patternUnits="userSpaceOnUse">
          <rect width="200" height="200" fill="#c9a96e" />
          <rect y="0" width="200" height="3" fill="#b8944f" opacity="0.3" />
          <rect y="8" width="200" height="2" fill="#d4b87a" opacity="0.2" />
          <rect y="15" width="200" height="3" fill="#b8944f" opacity="0.25" />
          <rect y="25" width="200" height="2" fill="#d4b87a" opacity="0.15" />
          <rect y="32" width="200" height="3" fill="#b8944f" opacity="0.3" />
          <rect y="42" width="200" height="2" fill="#d4b87a" opacity="0.2" />
          <rect y="50" width="200" height="3" fill="#b8944f" opacity="0.25" />
          <rect y="60" width="200" height="2" fill="#d4b87a" opacity="0.15" />
          <rect y="68" width="200" height="3" fill="#b8944f" opacity="0.3" />
          <rect y="78" width="200" height="2" fill="#d4b87a" opacity="0.2" />
          <rect y="85" width="200" height="3" fill="#b8944f" opacity="0.25" />
          <rect y="95" width="200" height="2" fill="#d4b87a" opacity="0.15" />
          <rect y="103" width="200" height="3" fill="#b8944f" opacity="0.3" />
          <rect y="113" width="200" height="2" fill="#d4b87a" opacity="0.2" />
          <rect y="120" width="200" height="3" fill="#b8944f" opacity="0.25" />
          <rect y="130" width="200" height="2" fill="#d4b87a" opacity="0.15" />
          <rect y="138" width="200" height="3" fill="#b8944f" opacity="0.3" />
          <rect y="148" width="200" height="2" fill="#d4b87a" opacity="0.2" />
          <rect y="155" width="200" height="3" fill="#b8944f" opacity="0.25" />
          <rect y="165" width="200" height="2" fill="#d4b87a" opacity="0.15" />
          <rect y="173" width="200" height="3" fill="#b8944f" opacity="0.3" />
          <rect y="183" width="200" height="2" fill="#d4b87a" opacity="0.2" />
          <rect y="190" width="200" height="3" fill="#b8944f" opacity="0.25" />
        </pattern>
        <pattern id={`${prefix}-planks`} width="200" height="40" patternUnits="userSpaceOnUse">
          <rect width="200" height="40" fill={`url(#${prefix}-grain)`} />
          <line x1="0" y1="0" x2="200" y2="0" stroke="#a8843a" strokeWidth="1" opacity="0.4" />
          <line x1="0" y1="40" x2="200" y2="40" stroke="#a8843a" strokeWidth="1" opacity="0.4" />
          <line x1="100" y1="0" x2="100" y2="40" stroke="#a8843a" strokeWidth="0.5" opacity="0.2" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${prefix}-planks)`} />
    </svg>
  );
}

function TileBackground({ prefix }: { prefix: string }) {
  return (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id={`${prefix}-tiles`} width="60" height="60" patternUnits="userSpaceOnUse">
          <rect width="60" height="60" fill="#e8e0d4" />
          <rect x="1" y="1" width="28" height="28" rx="2" fill="#f5f0ea" />
          <rect x="31" y="1" width="28" height="28" rx="2" fill="#ede5d9" />
          <rect x="1" y="31" width="28" height="28" rx="2" fill="#ede5d9" />
          <rect x="31" y="31" width="28" height="28" rx="2" fill="#f5f0ea" />
          <line x1="0" y1="0" x2="60" y2="0" stroke="#d4c9b8" strokeWidth="1" />
          <line x1="0" y1="30" x2="60" y2="30" stroke="#d4c9b8" strokeWidth="1" />
          <line x1="0" y1="0" x2="0" y2="60" stroke="#d4c9b8" strokeWidth="1" />
          <line x1="30" y1="0" x2="30" y2="60" stroke="#d4c9b8" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${prefix}-tiles)`} />
    </svg>
  );
}

function GridBackground({ prefix }: { prefix: string }) {
  return (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id={`${prefix}-small`} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
        </pattern>
        <pattern id={`${prefix}-grid`} width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill={`url(#${prefix}-small)`} />
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#cbd5e1" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="#f8fafc" />
      <rect width="100%" height="100%" fill={`url(#${prefix}-grid)`} />
    </svg>
  );
}

function MarbleBackground({ prefix }: { prefix: string }) {
  return (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id={`${prefix}-mb`} width="400" height="400" patternUnits="userSpaceOnUse">
          <rect width="400" height="400" fill="#f0ece4" />
          <path d="M0 50 Q100 30 200 60 T400 40" fill="none" stroke="#d4cfc7" strokeWidth="0.8" opacity="0.4" />
          <path d="M0 120 Q150 100 300 130 T400 110" fill="none" stroke="#c9c3b9" strokeWidth="0.6" opacity="0.3" />
          <path d="M0 200 Q80 180 200 210 T400 190" fill="none" stroke="#d4cfc7" strokeWidth="0.7" opacity="0.35" />
          <path d="M0 280 Q120 260 250 290 T400 270" fill="none" stroke="#c9c3b9" strokeWidth="0.5" opacity="0.25" />
          <path d="M0 350 Q100 330 200 360 T400 340" fill="none" stroke="#d4cfc7" strokeWidth="0.6" opacity="0.3" />
        </pattern>
        <pattern id={`${prefix}-mg`} width="120" height="120" patternUnits="userSpaceOnUse">
          <rect width="120" height="120" fill={`url(#${prefix}-mb)`} />
          <line x1="0" y1="0" x2="120" y2="0" stroke="#e0dbd3" strokeWidth="1" />
          <line x1="0" y1="60" x2="120" y2="60" stroke="#e0dbd3" strokeWidth="0.5" />
          <line x1="0" y1="0" x2="0" y2="120" stroke="#e0dbd3" strokeWidth="1" />
          <line x1="60" y1="0" x2="60" y2="120" stroke="#e0dbd3" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${prefix}-mg)`} />
    </svg>
  );
}

function DarkBackground({ prefix }: { prefix: string }) {
  return (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id={`${prefix}-dw`} width="200" height="200" patternUnits="userSpaceOnUse">
          <rect width="200" height="200" fill="#1a1a2e" />
          <rect y="0" width="200" height="2" fill="#16213e" opacity="0.4" />
          <rect y="8" width="200" height="1.5" fill="#0f3460" opacity="0.2" />
          <rect y="15" width="200" height="2" fill="#16213e" opacity="0.3" />
          <rect y="25" width="200" height="1.5" fill="#0f3460" opacity="0.15" />
          <rect y="32" width="200" height="2" fill="#16213e" opacity="0.35" />
          <rect y="42" width="200" height="1.5" fill="#0f3460" opacity="0.2" />
          <rect y="50" width="200" height="2" fill="#16213e" opacity="0.25" />
          <rect y="60" width="200" height="1.5" fill="#0f3460" opacity="0.15" />
          <rect y="68" width="200" height="2" fill="#16213e" opacity="0.3" />
          <rect y="78" width="200" height="1.5" fill="#0f3460" opacity="0.2" />
          <rect y="85" width="200" height="2" fill="#16213e" opacity="0.25" />
          <rect y="95" width="200" height="1.5" fill="#0f3460" opacity="0.15" />
          <rect y="103" width="200" height="2" fill="#16213e" opacity="0.3" />
          <rect y="113" width="200" height="1.5" fill="#0f3460" opacity="0.2" />
          <rect y="120" width="200" height="2" fill="#16213e" opacity="0.25" />
          <rect y="130" width="200" height="1.5" fill="#0f3460" opacity="0.15" />
          <rect y="138" width="200" height="2" fill="#16213e" opacity="0.3" />
          <rect y="148" width="200" height="1.5" fill="#0f3460" opacity="0.2" />
          <rect y="155" width="200" height="2" fill="#16213e" opacity="0.25" />
          <rect y="165" width="200" height="1.5" fill="#0f3460" opacity="0.15" />
          <rect y="173" width="200" height="2" fill="#16213e" opacity="0.3" />
          <rect y="183" width="200" height="1.5" fill="#0f3460" opacity="0.2" />
          <rect y="190" width="200" height="2" fill="#16213e" opacity="0.25" />
        </pattern>
        <pattern id={`${prefix}-dp`} width="200" height="40" patternUnits="userSpaceOnUse">
          <rect width="200" height="40" fill={`url(#${prefix}-dw)`} />
          <line x1="0" y1="0" x2="200" y2="0" stroke="#0f3460" strokeWidth="0.8" opacity="0.3" />
          <line x1="0" y1="40" x2="200" y2="40" stroke="#0f3460" strokeWidth="0.8" opacity="0.3" />
          <line x1="100" y1="0" x2="100" y2="40" stroke="#0f3460" strokeWidth="0.4" opacity="0.15" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${prefix}-dp)`} />
    </svg>
  );
}

function OutdoorBackground({ prefix }: { prefix: string }) {
  return (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id={`${prefix}-grass`} width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#4a7c59" />
          <circle cx="5" cy="8" r="1.5" fill="#3d6b4a" opacity="0.5" />
          <circle cx="15" cy="5" r="1" fill="#5a8c69" opacity="0.4" />
          <circle cx="25" cy="10" r="1.2" fill="#3d6b4a" opacity="0.45" />
          <circle cx="35" cy="6" r="1.3" fill="#5a8c69" opacity="0.35" />
          <circle cx="8" cy="20" r="1.1" fill="#3d6b4a" opacity="0.4" />
          <circle cx="18" cy="22" r="1.4" fill="#5a8c69" opacity="0.5" />
          <circle cx="28" cy="18" r="1" fill="#3d6b4a" opacity="0.35" />
          <circle cx="38" cy="24" r="1.2" fill="#5a8c69" opacity="0.45" />
          <circle cx="3" cy="32" r="1.3" fill="#3d6b4a" opacity="0.4" />
          <circle cx="13" cy="35" r="1" fill="#5a8c69" opacity="0.5" />
          <circle cx="23" cy="30" r="1.5" fill="#3d6b4a" opacity="0.35" />
          <circle cx="33" cy="36" r="1.1" fill="#5a8c69" opacity="0.4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${prefix}-grass)`} />
    </svg>
  );
}

export default function FloorPlanBackground({ floorPlan, className = '', children }: FloorPlanBackgroundProps) {
  const prefix = useId();
  const bgMode = floorPlan.backgroundMode;
  const fitMode = floorPlan.floorDiagramFitMode || 'contain';
  const objectFit = fitMode === 'fill' ? 'fill' : fitMode;
  const imageTransform = {
    left: `${floorPlan.floorDiagramX ?? 0}%`,
    top: `${floorPlan.floorDiagramY ?? 0}%`,
    width: `${floorPlan.floorDiagramWidth ?? 100}%`,
    height: `${floorPlan.floorDiagramHeight ?? 100}%`,
    transform: `scale(${floorPlan.floorDiagramScale ?? 1}) rotate(${floorPlan.floorDiagramRotation ?? 0}deg)`,
    transformOrigin: 'center center',
  };

  return (
    <div className={`relative ${className}`} style={{ width: '100%', height: '100%' }}>
      <div className="absolute inset-0 z-0 pointer-events-none" data-floor-background="true">
        {bgMode === 'CUSTOM_IMAGE' && floorPlan.floorDiagramImageUrl ? (
          <div className="absolute pointer-events-none" style={imageTransform}>
            <img
              src={floorPlan.floorDiagramImageUrl}
              alt="Floor plan background"
              className="w-full h-full select-none"
              style={{ objectFit }}
              draggable={false}
            />
          </div>
        ) : bgMode === 'DEFAULT_MARBLE' ? (
          <MarbleBackground prefix={prefix} />
        ) : bgMode === 'DEFAULT_DARK' ? (
          <DarkBackground prefix={prefix} />
        ) : bgMode === 'DEFAULT_OUTDOOR' ? (
          <OutdoorBackground prefix={prefix} />
        ) : bgMode === 'DEFAULT_TILE' ? (
          <TileBackground prefix={prefix} />
        ) : bgMode === 'DEFAULT_GRID' ? (
          <GridBackground prefix={prefix} />
        ) : bgMode === 'DEFAULT_WOOD' ? (
          <WoodBackground prefix={prefix} />
        ) : null}
      </div>
      <div className="absolute inset-0 z-10">
        {children}
      </div>
    </div>
  );
}
