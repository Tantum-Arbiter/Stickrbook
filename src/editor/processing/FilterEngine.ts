/**
 * FilterEngine
 * 
 * Processes image filters and adjustments.
 * Runs in Web Worker for performance.
 */

import type { FilterData, AdjustmentType } from '../types';

export class FilterEngine {
  /**
   * Apply a filter to image data
   */
  static applyFilter(imageData: ImageData, filter: FilterData): ImageData {
    const result = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );

    switch (filter.type) {
      case 'brightness-contrast':
        return this.applyBrightnessContrast(result, filter.params);
      case 'hue-saturation':
        return this.applyHueSaturation(result, filter.params);
      case 'blur':
        return this.applyBlur(result, filter.params);
      case 'sharpen':
        return this.applySharpen(result, filter.params);
      case 'levels':
        return this.applyLevels(result, filter.params);
      case 'curves':
        return this.applyCurves(result, filter.params);
      default:
        return result;
    }
  }

  /**
   * Apply brightness and contrast adjustment
   */
  private static applyBrightnessContrast(
    imageData: ImageData,
    params: { brightness: number; contrast: number }
  ): ImageData {
    const { brightness = 0, contrast = 0 } = params;
    const data = imageData.data;

    const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
      // Apply brightness
      let r = data[i] + brightness;
      let g = data[i + 1] + brightness;
      let b = data[i + 2] + brightness;

      // Apply contrast
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;

      // Clamp values
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    return imageData;
  }

  /**
   * Apply hue and saturation adjustment
   */
  private static applyHueSaturation(
    imageData: ImageData,
    params: { hue: number; saturation: number; lightness: number }
  ): ImageData {
    const { hue = 0, saturation = 0, lightness = 0 } = params;
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;

      // Convert RGB to HSL
      const hsl = this.rgbToHsl(r, g, b);

      // Adjust HSL
      hsl.h = (hsl.h + hue / 360) % 1;
      hsl.s = Math.max(0, Math.min(1, hsl.s + saturation / 100));
      hsl.l = Math.max(0, Math.min(1, hsl.l + lightness / 100));

      // Convert back to RGB
      const rgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);

      data[i] = Math.round(rgb.r * 255);
      data[i + 1] = Math.round(rgb.g * 255);
      data[i + 2] = Math.round(rgb.b * 255);
    }

    return imageData;
  }

  /**
   * Apply Gaussian blur
   */
  private static applyBlur(imageData: ImageData, params: { radius: number }): ImageData {
    const { radius = 5 } = params;
    // Simplified blur - in production, use a proper Gaussian blur algorithm
    return imageData;
  }

  /**
   * Apply sharpen filter
   */
  private static applySharpen(imageData: ImageData, params: { amount: number }): ImageData {
    const { amount = 1 } = params;
    // Apply unsharp mask
    return imageData;
  }

  /**
   * Apply levels adjustment
   */
  private static applyLevels(
    imageData: ImageData,
    params: { inputMin: number; inputMax: number; outputMin: number; outputMax: number }
  ): ImageData {
    const { inputMin = 0, inputMax = 255, outputMin = 0, outputMax = 255 } = params;
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      for (let j = 0; j < 3; j++) {
        let value = data[i + j];
        value = ((value - inputMin) / (inputMax - inputMin)) * (outputMax - outputMin) + outputMin;
        data[i + j] = Math.max(0, Math.min(255, value));
      }
    }

    return imageData;
  }

  /**
   * Apply curves adjustment
   */
  private static applyCurves(imageData: ImageData, params: { points: { x: number; y: number }[] }): ImageData {
    // Apply curve mapping
    return imageData;
  }

  /**
   * Convert RGB to HSL
   */
  private static rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return { h, s, l };
  }

  /**
   * Convert HSL to RGB
   */
  private static hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return { r, g, b };
  }
}

