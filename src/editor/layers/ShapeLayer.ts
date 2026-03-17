/**
 * ShapeLayer
 * 
 * Layer type for vector shapes.
 */

import { BaseLayer } from './BaseLayer';
import type { ShapeLayerData } from '../types';

export class ShapeLayer extends BaseLayer {
  shapeType: 'rectangle' | 'ellipse' | 'polygon' | 'line';
  fill: string;
  stroke?: {
    color: string;
    width: number;
  };
  cornerRadius?: number;
  points?: { x: number; y: number }[];

  constructor(data: ShapeLayerData) {
    super(data);
    this.shapeType = data.shapeType;
    this.fill = data.fill;
    this.stroke = data.stroke;
    this.cornerRadius = data.cornerRadius;
    this.points = data.points;
  }

  /**
   * Update shape properties
   */
  setFill(color: string): void {
    this.fill = color;
  }

  /**
   * Update stroke properties
   */
  setStroke(color: string, width: number): void {
    this.stroke = { color, width };
  }

  /**
   * Serialize to data object
   */
  toData(): ShapeLayerData {
    return {
      id: this.id,
      type: 'shape',
      name: this.name,
      visible: this.visible,
      locked: this.locked,
      opacity: this.opacity,
      blendMode: this.blendMode,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      scaleX: this.scaleX,
      scaleY: this.scaleY,
      parentId: this.parentId,
      zIndex: this.zIndex,
      shapeType: this.shapeType,
      fill: this.fill,
      stroke: this.stroke,
      cornerRadius: this.cornerRadius,
      points: this.points,
    };
  }

  /**
   * Clone the layer
   */
  clone(): ShapeLayer {
    return new ShapeLayer(this.toData());
  }

  /**
   * Render the layer
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    ctx.save();
    
    // Apply transformations
    ctx.globalAlpha = this.opacity;
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.scale(this.scaleX, this.scaleY);
    
    // Draw shape
    ctx.fillStyle = this.fill;
    
    if (this.shapeType === 'rectangle') {
      if (this.cornerRadius) {
        this.drawRoundedRect(ctx, -this.width / 2, -this.height / 2, this.width, this.height, this.cornerRadius);
      } else {
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
      }
    } else if (this.shapeType === 'ellipse') {
      ctx.beginPath();
      ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, 2 * Math.PI);
      ctx.fill();
    } else if (this.shapeType === 'polygon' && this.points) {
      ctx.beginPath();
      this.points.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.closePath();
      ctx.fill();
    }
    
    // Draw stroke if present
    if (this.stroke) {
      ctx.strokeStyle = this.stroke.color;
      ctx.lineWidth = this.stroke.width;
      ctx.stroke();
    }
    
    ctx.restore();
  }

  private drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }
}

