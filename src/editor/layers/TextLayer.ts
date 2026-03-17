/**
 * TextLayer
 * 
 * Layer type for text with typography controls.
 */

import { BaseLayer } from './BaseLayer';
import type { TextLayerData } from '../types';

export class TextLayer extends BaseLayer {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  textAlign: 'left' | 'center' | 'right';
  textDecoration: string;
  lineHeight: number;
  letterSpacing: number;
  fill: string;
  stroke?: {
    color: string;
    width: number;
  };

  constructor(data: TextLayerData) {
    super(data);
    this.text = data.text;
    this.fontFamily = data.fontFamily;
    this.fontSize = data.fontSize;
    this.fontWeight = data.fontWeight;
    this.fontStyle = data.fontStyle;
    this.textAlign = data.textAlign;
    this.textDecoration = data.textDecoration;
    this.lineHeight = data.lineHeight;
    this.letterSpacing = data.letterSpacing;
    this.fill = data.fill;
    this.stroke = data.stroke;
  }

  /**
   * Update text content
   */
  setText(text: string): void {
    this.text = text;
  }

  /**
   * Update font properties
   */
  setFont(properties: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    fontStyle?: string;
  }): void {
    Object.assign(this, properties);
  }

  /**
   * Serialize to data object
   */
  toData(): TextLayerData {
    return {
      id: this.id,
      type: 'text',
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
      text: this.text,
      fontFamily: this.fontFamily,
      fontSize: this.fontSize,
      fontWeight: this.fontWeight,
      fontStyle: this.fontStyle,
      textAlign: this.textAlign,
      textDecoration: this.textDecoration,
      lineHeight: this.lineHeight,
      letterSpacing: this.letterSpacing,
      fill: this.fill,
      stroke: this.stroke,
    };
  }

  /**
   * Clone the layer
   */
  clone(): TextLayer {
    return new TextLayer(this.toData());
  }

  /**
   * Render the layer
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    ctx.save();
    
    // Apply transformations
    ctx.globalAlpha = this.opacity;
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.scale(this.scaleX, this.scaleY);
    
    // Set font
    ctx.font = `${this.fontStyle} ${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = this.textAlign;
    ctx.fillStyle = this.fill;
    
    // Draw stroke if present
    if (this.stroke) {
      ctx.strokeStyle = this.stroke.color;
      ctx.lineWidth = this.stroke.width;
      ctx.strokeText(this.text, 0, 0);
    }
    
    // Draw text
    ctx.fillText(this.text, 0, 0);
    
    ctx.restore();
  }
}

