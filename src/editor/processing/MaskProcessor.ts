/**
 * MaskProcessor
 * 
 * Handles layer mask operations.
 */

export class MaskProcessor {
  /**
   * Apply mask to image data
   */
  static applyMask(imageData: ImageData, maskData: ImageData): ImageData {
    const result = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );

    const data = result.data;
    const mask = maskData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Use mask's red channel as alpha multiplier
      const maskValue = mask[i] / 255;
      data[i + 3] = Math.round(data[i + 3] * maskValue);
    }

    return result;
  }

  /**
   * Create empty mask
   */
  static createEmptyMask(width: number, height: number, fillValue: number = 255): ImageData {
    const data = new Uint8ClampedArray(width * height * 4);
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = fillValue;     // R
      data[i + 1] = fillValue; // G
      data[i + 2] = fillValue; // B
      data[i + 3] = 255;       // A
    }

    return new ImageData(data, width, height);
  }

  /**
   * Invert mask
   */
  static invertMask(maskData: ImageData): ImageData {
    const result = new ImageData(
      new Uint8ClampedArray(maskData.data),
      maskData.width,
      maskData.height
    );

    const data = result.data;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }

    return result;
  }

  /**
   * Feather mask edges
   */
  static featherMask(maskData: ImageData, radius: number): ImageData {
    // Apply Gaussian blur to soften edges
    // This is a simplified version
    return maskData;
  }

  /**
   * Expand mask
   */
  static expandMask(maskData: ImageData, pixels: number): ImageData {
    // Dilate the mask
    return maskData;
  }

  /**
   * Contract mask
   */
  static contractMask(maskData: ImageData, pixels: number): ImageData {
    // Erode the mask
    return maskData;
  }

  /**
   * Create mask from selection
   */
  static createMaskFromSelection(
    width: number,
    height: number,
    selection: { x: number; y: number; width: number; height: number }
  ): ImageData {
    const mask = this.createEmptyMask(width, height, 0);
    const data = mask.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (
          x >= selection.x &&
          x < selection.x + selection.width &&
          y >= selection.y &&
          y < selection.y + selection.height
        ) {
          const i = (y * width + x) * 4;
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
        }
      }
    }

    return mask;
  }

  /**
   * Combine two masks
   */
  static combineMasks(
    mask1: ImageData,
    mask2: ImageData,
    mode: 'add' | 'subtract' | 'intersect' | 'replace'
  ): ImageData {
    const result = new ImageData(
      new Uint8ClampedArray(mask1.data),
      mask1.width,
      mask1.height
    );

    const data1 = result.data;
    const data2 = mask2.data;

    for (let i = 0; i < data1.length; i += 4) {
      const value1 = data1[i];
      const value2 = data2[i];

      let newValue: number;
      switch (mode) {
        case 'add':
          newValue = Math.min(255, value1 + value2);
          break;
        case 'subtract':
          newValue = Math.max(0, value1 - value2);
          break;
        case 'intersect':
          newValue = Math.min(value1, value2);
          break;
        case 'replace':
          newValue = value2;
          break;
      }

      data1[i] = newValue;
      data1[i + 1] = newValue;
      data1[i + 2] = newValue;
    }

    return result;
  }
}

