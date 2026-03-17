/**
 * CompositionGrid Component
 *
 * Canvas overlay that draws composition guides (Rule of Thirds, Golden Ratio, etc.)
 * Positioned absolutely over the editor canvas.
 */

import { useEffect, useRef } from 'react';
import { useEditorStore } from '../../store';

export type GridType = 'none' | 'thirds' | 'golden' | 'diagonal' | 'center';

export interface CompositionGridProps {
  gridType: string;
  className?: string;
}

export function CompositionGrid({ gridType, className = '' }: CompositionGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { canvasWidth, canvasHeight, zoom } = useEditorStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gridType === 'none') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match editor canvas
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear previous drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set line style
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.6)';
    ctx.lineWidth = 1;

    const w = canvas.width;
    const h = canvas.height;

    switch (gridType) {
      case 'thirds':
        drawRuleOfThirds(ctx, w, h);
        break;
      case 'golden':
        drawGoldenRatio(ctx, w, h);
        break;
      case 'diagonal':
        drawDiagonals(ctx, w, h);
        break;
      case 'center':
        drawCenterCross(ctx, w, h);
        break;
    }
  }, [gridType, canvasWidth, canvasHeight, zoom]);

  if (gridType === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      className={`composition-grid-canvas ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
}

function drawRuleOfThirds(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.beginPath();
  // Vertical lines at 1/3 and 2/3
  ctx.moveTo(w / 3, 0);
  ctx.lineTo(w / 3, h);
  ctx.moveTo((w * 2) / 3, 0);
  ctx.lineTo((w * 2) / 3, h);
  // Horizontal lines at 1/3 and 2/3
  ctx.moveTo(0, h / 3);
  ctx.lineTo(w, h / 3);
  ctx.moveTo(0, (h * 2) / 3);
  ctx.lineTo(w, (h * 2) / 3);
  ctx.stroke();

  // Draw intersection points
  ctx.fillStyle = 'rgba(255, 200, 100, 0.8)';
  const points = [
    [w / 3, h / 3],
    [(w * 2) / 3, h / 3],
    [w / 3, (h * 2) / 3],
    [(w * 2) / 3, (h * 2) / 3],
  ];
  points.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawGoldenRatio(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const phi = 1.618;
  const gw1 = w / phi;
  const gw2 = w - gw1;
  const gh1 = h / phi;
  const gh2 = h - gh1;

  ctx.beginPath();
  // Vertical golden lines
  ctx.moveTo(gw2, 0);
  ctx.lineTo(gw2, h);
  ctx.moveTo(gw1, 0);
  ctx.lineTo(gw1, h);
  // Horizontal golden lines
  ctx.moveTo(0, gh2);
  ctx.lineTo(w, gh2);
  ctx.moveTo(0, gh1);
  ctx.lineTo(w, gh1);
  ctx.stroke();

  // Draw golden spiral approximation (simplified)
  ctx.strokeStyle = 'rgba(255, 150, 50, 0.5)';
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(gw1, gh1, Math.min(gw2, gh2), 0, Math.PI / 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawDiagonals(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.beginPath();
  // Main diagonals
  ctx.moveTo(0, 0);
  ctx.lineTo(w, h);
  ctx.moveTo(w, 0);
  ctx.lineTo(0, h);
  ctx.stroke();
}

function drawCenterCross(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.beginPath();
  // Vertical center
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  // Horizontal center
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();

  // Center point
  ctx.fillStyle = 'rgba(255, 200, 100, 0.8)';
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 6, 0, Math.PI * 2);
  ctx.fill();
}

