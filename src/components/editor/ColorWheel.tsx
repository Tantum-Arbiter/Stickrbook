/**
 * ColorWheel Component
 *
 * Canvas-based HSL color wheel for hue/saturation control.
 * Matches vanilla storyboard.html implementation.
 */

import { useRef, useEffect, useCallback, useState } from 'react';

export interface ColorWheelProps {
  hue: number; // 0-360
  saturation: number; // 0-200 (100 = neutral)
  disabled?: boolean;
  onChange: (hue: number, saturation: number) => void;
  className?: string;
}

export function ColorWheel({
  hue,
  saturation,
  disabled = false,
  onChange,
  className = '',
}: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const size = 120;
  const radius = size / 2 - 2;

  // Draw the color wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw the color wheel
    for (let angle = 0; angle < 360; angle++) {
      const startAngle = (angle - 1) * Math.PI / 180;
      const endAngle = (angle + 1) * Math.PI / 180;

      // Create gradient from center (desaturated) to edge (full saturation)
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, `hsl(${angle}, 0%, 50%)`);
      gradient.addColorStop(0.5, `hsl(${angle}, 50%, 50%)`);
      gradient.addColorStop(1, `hsl(${angle}, 100%, 50%)`);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }, []);

  // Update pointer position based on hue/saturation
  useEffect(() => {
    const pointer = pointerRef.current;
    if (!pointer) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const angle = hue * Math.PI / 180;
    
    // Saturation 100 = center, 200 = edge
    const normalizedSat = Math.max(0, Math.min(100, saturation - 100));
    const distance = (normalizedSat / 100) * radius;

    const x = centerX + distance * Math.cos(angle);
    const y = centerY + distance * Math.sin(angle);

    pointer.style.left = `${x}px`;
    pointer.style.top = `${y}px`;
    pointer.style.backgroundColor = `hsl(${hue}, ${Math.min(saturation, 100)}%, 50%)`;
  }, [hue, saturation, radius]);

  const updateFromPosition = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const centerX = size / 2;
    const centerY = size / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const clampedDistance = Math.min(distance, radius);

    let newHue = Math.atan2(dy, dx) * 180 / Math.PI;
    newHue = (newHue + 360) % 360;
    const newSaturation = 100 + (clampedDistance / radius) * 100;

    onChange(Math.round(newHue), Math.round(newSaturation));
  }, [radius, onChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    updateFromPosition(e.clientX, e.clientY);
  }, [disabled, updateFromPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    updateFromPosition(e.clientX, e.clientY);
  }, [isDragging, updateFromPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className={`color-wheel-container ${className}`}>
      <div className="color-wheel-wrapper">
        <canvas
          ref={canvasRef}
          className={`color-wheel-canvas ${disabled ? 'disabled' : ''}`}
          width={size}
          height={size}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        <div ref={pointerRef} className="color-wheel-pointer" />
      </div>
      <span className="color-wheel-label">Drag to adjust Hue &amp; Saturation</span>
    </div>
  );
}

// Utility: HSL to Hex
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

