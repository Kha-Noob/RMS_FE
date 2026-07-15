'use client';

import { Pannellum } from 'pannellum-react';

interface PannellumViewerProps {
  imageUrl: string;
  className?: string;
}

export default function PannellumViewer({ imageUrl, className = '' }: PannellumViewerProps) {
  return (
    <div className={`w-full h-full ${className}`} style={{ minHeight: '400px' }}>
      <Pannellum
        image={imageUrl}
        autoLoad={true}
        showControls={true}
        compass={true}
        showZoomCtrl={true}
        keyboardZoom={true}
        mouseZoom={true}
        hfov={110}
        minHfov={50}
        maxHfov={120}
        width="100%"
        height="100%"
      />
    </div>
  );
}
