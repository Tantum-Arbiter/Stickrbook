"""
Professional Background Removal for Characters and Objects

Uses RMBG-v1.4 (from Magic Merge) for high-quality transparency.
Replaces the basic threshold-based white background removal.
"""

import base64
import io
import logging
from PIL import Image
import numpy as np

logger = logging.getLogger(__name__)

# Try to import RMBG from magic_merge
try:
    from magic_merge.segmentation import segment_subject
    RMBG_AVAILABLE = True
except ImportError:
    RMBG_AVAILABLE = False
    logger.warning("RMBG not available - falling back to threshold-based removal")


def apply_professional_transparency(image_data: bytes, fallback_threshold: int = 240) -> bytes:
    """
    Apply professional background removal using RMBG-v1.4.
    Falls back to threshold-based removal if RMBG is not available.
    
    Args:
        image_data: Raw PNG/JPEG image bytes
        fallback_threshold: Threshold for fallback method (0-255)
        
    Returns:
        PNG image bytes with alpha channel (true transparency)
    """
    if RMBG_AVAILABLE:
        try:
            return _apply_rmbg_transparency(image_data)
        except Exception as e:
            logger.error(f"RMBG transparency failed: {e}, falling back to threshold method")
            return _apply_threshold_transparency(image_data, fallback_threshold)
    else:
        return _apply_threshold_transparency(image_data, fallback_threshold)


def _apply_rmbg_transparency(image_data: bytes) -> bytes:
    """
    Apply RMBG-v1.4 for professional background removal.
    
    This provides:
    - Clean edges on hair, fur, feathers
    - Proper semi-transparent regions
    - No white halos
    - Professional quality
    
    Args:
        image_data: Raw image bytes
        
    Returns:
        PNG with alpha channel
    """
    # Convert image bytes to base64
    image_base64 = base64.b64encode(image_data).decode('utf-8')
    data_uri = f"data:image/png;base64,{image_base64}"
    
    # Use RMBG to segment the subject
    logger.info("Applying RMBG background removal...")
    result = segment_subject(data_uri)
    
    # Extract mask (base64 encoded)
    mask_data_uri = result['mask']
    mask_base64 = mask_data_uri.split(',')[1] if ',' in mask_data_uri else mask_data_uri
    
    # Load original image and mask
    original_image = Image.open(io.BytesIO(image_data)).convert('RGB')
    mask_bytes = base64.b64decode(mask_base64)
    mask_image = Image.open(io.BytesIO(mask_bytes)).convert('L')
    
    # Ensure mask matches image size
    if mask_image.size != original_image.size:
        mask_image = mask_image.resize(original_image.size, Image.LANCZOS)
    
    # Create RGBA image with mask as alpha channel
    rgba_image = Image.new('RGBA', original_image.size)
    rgba_image.paste(original_image, (0, 0))
    rgba_image.putalpha(mask_image)
    
    # Convert to PNG bytes
    output = io.BytesIO()
    rgba_image.save(output, format='PNG', optimize=True)
    
    logger.info(f"RMBG transparency applied successfully (confidence: {result.get('confidence', 0):.2f})")
    return output.getvalue()


def _apply_threshold_transparency(image_data: bytes, threshold: int = 240) -> bytes:
    """
    Fallback: Simple threshold-based background removal.
    Makes light pixels (close to white) transparent.
    
    This is the old method - less accurate but fast.
    
    Args:
        image_data: Raw image bytes
        threshold: Brightness threshold (0-255)
        
    Returns:
        PNG with alpha channel
    """
    try:
        # Load image
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGBA if needed
        if image.mode != 'RGBA':
            image = image.convert('RGBA')
        
        # Get pixel data
        data = image.getdata()
        
        # Make light pixels transparent
        new_data = []
        for pixel in data:
            r, g, b, a = pixel
            # If pixel is very light (close to white), make transparent
            if r > threshold and g > threshold and b > threshold:
                new_data.append((r, g, b, 0))  # Fully transparent
            else:
                new_data.append(pixel)
        
        # Update image
        image.putdata(new_data)
        
        # Convert to PNG bytes
        output = io.BytesIO()
        image.save(output, format='PNG')
        
        logger.info(f"Threshold transparency applied (threshold: {threshold})")
        return output.getvalue()
        
    except Exception as e:
        logger.error(f"Threshold transparency failed: {e}")
        return image_data


def check_transparency_quality(image_data: bytes) -> dict:
    """
    Analyze the quality of transparency in an image.
    
    Returns:
        dict with metrics:
        - has_alpha: bool
        - transparent_pixels: int
        - semi_transparent_pixels: int
        - opaque_pixels: int
        - edge_quality: float (0-1, higher is better)
    """
    try:
        image = Image.open(io.BytesIO(image_data))
        
        if image.mode != 'RGBA':
            return {
                'has_alpha': False,
                'transparent_pixels': 0,
                'semi_transparent_pixels': 0,
                'opaque_pixels': image.width * image.height,
                'edge_quality': 0.0
            }
        
        # Get alpha channel
        alpha = np.array(image.split()[3])
        
        # Count pixel types
        transparent = np.sum(alpha == 0)
        semi_transparent = np.sum((alpha > 0) & (alpha < 255))
        opaque = np.sum(alpha == 255)
        
        # Estimate edge quality (more semi-transparent = better edges)
        total_pixels = alpha.size
        edge_quality = semi_transparent / total_pixels if total_pixels > 0 else 0.0
        
        return {
            'has_alpha': True,
            'transparent_pixels': int(transparent),
            'semi_transparent_pixels': int(semi_transparent),
            'opaque_pixels': int(opaque),
            'edge_quality': float(edge_quality)
        }
        
    except Exception as e:
        logger.error(f"Transparency quality check failed: {e}")
        return {'error': str(e)}

