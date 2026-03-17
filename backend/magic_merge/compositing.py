"""
Image Compositing using OpenCV Poisson Blending

Cost: $0.00 (open source)
Speed: <1 second
Quality: Excellent
"""

import io
import base64
import numpy as np
from PIL import Image
import cv2
from typing import Dict, Tuple


def composite_images(
    asset_data: str,
    background_data: str,
    mask_data: str,
    position: Dict[str, int],
    scale: float = 1.0,
    shadow: Dict = None,
    seam_blending: bool = True
) -> Dict:
    """
    Composite asset onto background with optional shadow and seam blending
    
    Args:
        asset_data: Base64 encoded asset image
        background_data: Base64 encoded background image
        mask_data: Base64 encoded mask image
        position: {'x': int, 'y': int} position on background
        scale: Scale factor for asset
        shadow: Optional shadow parameters
        seam_blending: Use Poisson blending for seamless compositing
        
    Returns:
        dict with 'result' (base64 composited image)
    """
    # Decode images
    asset = decode_image(asset_data)
    background = decode_image(background_data)
    mask = decode_image(mask_data, mode='L')
    
    # Scale asset if needed
    if scale != 1.0:
        new_size = (int(asset.width * scale), int(asset.height * scale))
        asset = asset.resize(new_size, Image.LANCZOS)
        mask = mask.resize(new_size, Image.LANCZOS)
    
    # Convert to numpy arrays
    asset_array = np.array(asset.convert('RGB'))
    bg_array = np.array(background.convert('RGB'))
    mask_array = np.array(mask)
    
    # Add shadow if specified
    if shadow:
        bg_array = add_shadow(bg_array, mask_array, position, shadow)
    
    # Composite using Poisson blending or alpha blending
    if seam_blending and cv2 is not None:
        result = poisson_blend(asset_array, bg_array, mask_array, position)
    else:
        result = alpha_blend(asset_array, bg_array, mask_array, position)
    
    # Convert result to base64
    result_image = Image.fromarray(result)
    result_buffer = io.BytesIO()
    result_image.save(result_buffer, format='PNG', quality=95)
    result_base64 = base64.b64encode(result_buffer.getvalue()).decode('utf-8')
    
    return {
        'result': f'data:image/png;base64,{result_base64}'
    }


def poisson_blend(
    source: np.ndarray,
    target: np.ndarray,
    mask: np.ndarray,
    position: Dict[str, int]
) -> np.ndarray:
    """
    Seamless Poisson blending using OpenCV
    
    Args:
        source: Source image array (RGB)
        target: Target/background image array (RGB)
        mask: Binary mask array
        position: {'x': int, 'y': int} center position
        
    Returns:
        Blended image array
    """
    # Ensure mask is binary
    mask_binary = (mask > 128).astype(np.uint8) * 255
    
    # Calculate center point
    center = (position['x'] + source.shape[1] // 2, position['y'] + source.shape[0] // 2)
    
    # Ensure source and mask are same size
    if source.shape[:2] != mask_binary.shape[:2]:
        mask_binary = cv2.resize(mask_binary, (source.shape[1], source.shape[0]))
    
    try:
        # Poisson blending (NORMAL_CLONE for natural blending)
        result = cv2.seamlessClone(
            source,
            target,
            mask_binary,
            center,
            cv2.NORMAL_CLONE
        )
        return result
    except Exception as e:
        print(f"Poisson blending failed: {e}, falling back to alpha blending")
        return alpha_blend(source, target, mask_binary, position)


def alpha_blend(
    source: np.ndarray,
    target: np.ndarray,
    mask: np.ndarray,
    position: Dict[str, int]
) -> np.ndarray:
    """
    Simple alpha blending
    
    Args:
        source: Source image array
        target: Target image array
        mask: Alpha mask array
        position: {'x': int, 'y': int} top-left position
        
    Returns:
        Blended image array
    """
    result = target.copy()
    
    x, y = position['x'], position['y']
    h, w = source.shape[:2]
    
    # Ensure we don't go out of bounds
    x = max(0, min(x, target.shape[1] - w))
    y = max(0, min(y, target.shape[0] - h))
    
    # Normalize mask to 0-1
    alpha = mask.astype(float) / 255.0
    if len(alpha.shape) == 2:
        alpha = alpha[:, :, np.newaxis]
    
    # Blend
    result[y:y+h, x:x+w] = (
        source * alpha + result[y:y+h, x:x+w] * (1 - alpha)
    ).astype(np.uint8)
    
    return result


def add_shadow(
    background: np.ndarray,
    mask: np.ndarray,
    position: Dict[str, int],
    shadow_params: Dict
) -> np.ndarray:
    """
    Add drop shadow to background
    
    Args:
        background: Background image array
        mask: Subject mask
        position: Subject position
        shadow_params: {'x': int, 'y': int, 'blur': int, 'opacity': float}
        
    Returns:
        Background with shadow added
    """
    result = background.copy()
    
    # Create shadow mask
    shadow_mask = mask.copy()
    
    # Blur shadow
    blur_radius = shadow_params.get('blur', 20)
    if blur_radius > 0:
        shadow_mask = cv2.GaussianBlur(shadow_mask, (blur_radius*2+1, blur_radius*2+1), 0)
    
    # Position shadow
    shadow_x = position['x'] + shadow_params.get('x', 10)
    shadow_y = position['y'] + shadow_params.get('y', 10)
    
    # Apply shadow with opacity
    opacity = shadow_params.get('opacity', 0.5)
    h, w = shadow_mask.shape[:2]
    
    # Ensure we don't go out of bounds
    shadow_x = max(0, min(shadow_x, background.shape[1] - w))
    shadow_y = max(0, min(shadow_y, background.shape[0] - h))
    
    # Darken background where shadow is
    shadow_alpha = (shadow_mask.astype(float) / 255.0 * opacity)[:, :, np.newaxis]
    result[shadow_y:shadow_y+h, shadow_x:shadow_x+w] = (
        result[shadow_y:shadow_y+h, shadow_x:shadow_x+w] * (1 - shadow_alpha * 0.5)
    ).astype(np.uint8)
    
    return result


def decode_image(data: str, mode: str = 'RGB') -> Image.Image:
    """Decode base64 image data"""
    if data.startswith('data:image'):
        data = data.split(',')[1]
    image_bytes = base64.b64decode(data)
    return Image.open(io.BytesIO(image_bytes)).convert(mode)

