"""
Color Harmonization using OpenCV

Cost: $0.00 (open source)
Speed: <1 second
Quality: Good
"""

import io
import base64
import numpy as np
from PIL import Image
import cv2
from typing import Dict


def harmonize_colors(
    asset_data: str,
    background_data: str,
    scene_analysis: Dict,
    strength: float = 0.7
) -> Dict:
    """
    Harmonize asset colors to match background scene
    
    Args:
        asset_data: Base64 encoded asset image
        background_data: Base64 encoded background image
        scene_analysis: Scene analysis from scene_analysis.py
        strength: Harmonization strength (0-1)
        
    Returns:
        dict with 'result' (base64), 'adjustments', and 'confidence'
    """
    # Decode images
    if asset_data.startswith('data:image'):
        asset_data = asset_data.split(',')[1]
    if background_data.startswith('data:image'):
        background_data = background_data.split(',')[1]
    
    asset_bytes = base64.b64decode(asset_data)
    bg_bytes = base64.b64decode(background_data)

    asset_image = Image.open(io.BytesIO(asset_bytes))
    bg_image = Image.open(io.BytesIO(bg_bytes)).convert('RGB')

    # Preserve alpha channel if present
    has_alpha = asset_image.mode == 'RGBA'
    if has_alpha:
        alpha_channel = asset_image.split()[3]  # Save alpha
        asset_rgb = asset_image.convert('RGB')
    else:
        asset_rgb = asset_image.convert('RGB')

    # Convert to numpy arrays
    asset_array = np.array(asset_rgb)
    bg_array = np.array(bg_image)
    
    # Calculate color statistics
    asset_mean = np.mean(asset_array, axis=(0, 1))
    bg_mean = np.mean(bg_array, axis=(0, 1))
    
    asset_std = np.std(asset_array, axis=(0, 1))
    bg_std = np.std(bg_array, axis=(0, 1))
    
    # Color transfer (Reinhard method)
    # Normalize asset to match background statistics
    result = asset_array.astype(float)
    
    # Apply color transfer with strength
    for c in range(3):  # RGB channels
        result[:, :, c] = (result[:, :, c] - asset_mean[c]) * (bg_std[c] / asset_std[c]) + bg_mean[c]
    
    # Blend with original based on strength
    result = asset_array * (1 - strength) + result * strength
    result = np.clip(result, 0, 255).astype(np.uint8)
    
    # Apply lighting adjustments
    lighting = scene_analysis.get('lighting', {})
    intensity = lighting.get('intensity', 0.5)
    
    # Adjust brightness to match scene
    hsv = cv2.cvtColor(result, cv2.COLOR_RGB2HSV).astype(float)
    target_brightness = intensity * 255
    current_brightness = np.mean(hsv[:, :, 2])
    brightness_adjustment = (target_brightness - current_brightness) * strength
    
    hsv[:, :, 2] = np.clip(hsv[:, :, 2] + brightness_adjustment, 0, 255)
    result = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB)
    
    # Calculate adjustments made
    hue_shift = 0  # Could calculate from color transfer
    saturation_change = (bg_std.mean() / asset_std.mean() - 1) * 100 * strength
    brightness_change = brightness_adjustment / 255 * 100
    
    # Convert result to base64
    result_image = Image.fromarray(result)

    # Restore alpha channel if original had one
    if has_alpha:
        result_rgba = Image.new('RGBA', result_image.size)
        result_rgba.paste(result_image, (0, 0))
        result_rgba.putalpha(alpha_channel)
        result_image = result_rgba

    result_buffer = io.BytesIO()
    result_image.save(result_buffer, format='PNG')
    result_base64 = base64.b64encode(result_buffer.getvalue()).decode('utf-8')
    
    return {
        'result': f'data:image/png;base64,{result_base64}',
        'adjustments': {
            'hue': float(hue_shift),
            'saturation': float(saturation_change),
            'brightness': float(brightness_change)
        },
        'confidence': 0.85  # Fixed confidence for color transfer
    }


def match_histogram(source: np.ndarray, reference: np.ndarray) -> np.ndarray:
    """
    Match histogram of source image to reference image
    
    Args:
        source: Source image array
        reference: Reference image array
        
    Returns:
        Matched image array
    """
    matched = np.zeros_like(source)
    
    for channel in range(3):
        # Calculate CDFs
        source_values, source_counts = np.unique(source[:, :, channel].ravel(), return_counts=True)
        reference_values, reference_counts = np.unique(reference[:, :, channel].ravel(), return_counts=True)
        
        source_cdf = np.cumsum(source_counts).astype(float)
        source_cdf /= source_cdf[-1]
        
        reference_cdf = np.cumsum(reference_counts).astype(float)
        reference_cdf /= reference_cdf[-1]
        
        # Create lookup table
        lookup = np.interp(source_cdf, reference_cdf, reference_values)
        
        # Apply lookup table
        matched[:, :, channel] = lookup[np.searchsorted(source_values, source[:, :, channel])]
    
    return matched.astype(np.uint8)

