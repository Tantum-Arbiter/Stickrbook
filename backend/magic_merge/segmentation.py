"""
Subject Segmentation using RMBG-v1.4

Cost: $0.00 (open source)
Speed: ~1-2 seconds on GPU
Quality: Excellent
"""

import io
import base64
from PIL import Image
import numpy as np

try:
    from rembg import remove
    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False
    print("Warning: rembg not installed. Install with: pip install rembg")


def segment_subject(image_data: str) -> dict:
    """
    Remove background from subject using RMBG-v1.4
    
    Args:
        image_data: Base64 encoded image
        
    Returns:
        dict with 'mask' (base64) and 'confidence' (float)
    """
    if not REMBG_AVAILABLE:
        raise RuntimeError("rembg not installed")
    
    # Decode base64 image
    if image_data.startswith('data:image'):
        image_data = image_data.split(',')[1]
    
    image_bytes = base64.b64decode(image_data)
    input_image = Image.open(io.BytesIO(image_bytes))
    
    # Remove background
    output_image = remove(input_image)
    
    # Extract alpha channel as mask
    if output_image.mode == 'RGBA':
        mask = output_image.split()[3]  # Alpha channel
    else:
        # If no alpha, create full mask
        mask = Image.new('L', output_image.size, 255)
    
    # Calculate confidence based on mask coverage
    mask_array = np.array(mask)
    coverage = np.sum(mask_array > 128) / mask_array.size
    confidence = min(0.95, coverage * 1.1)  # Cap at 0.95
    
    # Convert mask to base64
    mask_buffer = io.BytesIO()
    mask.save(mask_buffer, format='PNG')
    mask_base64 = base64.b64encode(mask_buffer.getvalue()).decode('utf-8')
    
    return {
        'mask': f'data:image/png;base64,{mask_base64}',
        'confidence': float(confidence)
    }


def refine_mask(mask_data: str, feather: int = 2, expand: int = 0) -> str:
    """
    Refine mask with feathering and expansion
    
    Args:
        mask_data: Base64 encoded mask
        feather: Feather radius in pixels
        expand: Expand/contract pixels (positive = expand)
        
    Returns:
        Base64 encoded refined mask
    """
    import cv2
    from scipy.ndimage import gaussian_filter
    
    # Decode mask
    if mask_data.startswith('data:image'):
        mask_data = mask_data.split(',')[1]
    
    mask_bytes = base64.b64decode(mask_data)
    mask_image = Image.open(io.BytesIO(mask_bytes)).convert('L')
    mask_array = np.array(mask_image)
    
    # Expand/contract
    if expand != 0:
        kernel_size = abs(expand) * 2 + 1
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size, kernel_size))
        if expand > 0:
            mask_array = cv2.dilate(mask_array, kernel)
        else:
            mask_array = cv2.erode(mask_array, kernel)
    
    # Feather
    if feather > 0:
        mask_array = gaussian_filter(mask_array.astype(float), sigma=feather)
        mask_array = np.clip(mask_array, 0, 255).astype(np.uint8)
    
    # Convert back to base64
    refined_mask = Image.fromarray(mask_array)
    mask_buffer = io.BytesIO()
    refined_mask.save(mask_buffer, format='PNG')
    mask_base64 = base64.b64encode(mask_buffer.getvalue()).decode('utf-8')
    
    return f'data:image/png;base64,{mask_base64}'

