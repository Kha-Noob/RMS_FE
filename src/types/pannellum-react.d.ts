declare module 'pannellum-react' {
  import { Component } from 'react';

  interface PannellumProps {
    image?: string;
    autoLoad?: boolean;
    showControls?: boolean;
    compass?: boolean;
    showZoomCtrl?: boolean;
    keyboardZoom?: boolean;
    mouseZoom?: boolean;
    hfov?: number;
    minHfov?: number;
    maxHfov?: number;
    yaw?: number;
    pitch?: number;
    haov?: number;
    vaov?: number;
    vOffset?: number;
    minPitch?: number;
    maxPitch?: number;
    minYaw?: number;
    maxYaw?: number;
    autoRotate?: number;
    preview?: string;
    title?: string;
    author?: string;
    orientationOnByDefault?: boolean;
    draggable?: boolean;
    showFullscreenCtrl?: boolean;
    cssClass?: string;
    width?: string;
    height?: string;
    onLoad?: () => void;
    onError?: (error: unknown) => void;
  }

  export class Pannellum extends Component<PannellumProps> {}
  export class PannellumVideo extends Component<PannellumProps> {}
}
