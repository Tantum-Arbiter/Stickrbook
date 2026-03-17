"""
Scene Analysis using CLIP and Depth-Anything

Cost: $0.00 (open source)
Speed: ~2-3 seconds on GPU
Quality: Good
"""

import io
import base64
import numpy as np
from PIL import Image
from typing import Dict, List

try:
    from transformers import CLIPProcessor, CLIPModel, pipeline
    import torch
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("Warning: transformers not installed. Install with: pip install transformers torch")


# Global model cache
_clip_model = None
_clip_processor = None
_depth_estimator = None


def get_clip_model():
    """Lazy load CLIP model"""
    global _clip_model, _clip_processor
    if _clip_model is None:
        _clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        _clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    return _clip_model, _clip_processor


def get_depth_estimator():
    """Lazy load depth estimation model"""
    global _depth_estimator
    if _depth_estimator is None:
        _depth_estimator = pipeline("depth-estimation", model="LiheYoung/depth-anything-small-hf")
    return _depth_estimator


def analyze_scene(image_data: str) -> Dict:
    """
    Analyze background scene for lighting, colors, and depth
    
    Args:
        image_data: Base64 encoded image
        
    Returns:
        dict with lighting, dominantColors, and depth info
    """
    if not TRANSFORMERS_AVAILABLE:
        raise RuntimeError("transformers not installed")
    
    # Decode image
    if image_data.startswith('data:image'):
        image_data = image_data.split(',')[1]
    
    image_bytes = base64.b64decode(image_data)
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    
    # Analyze dominant colors
    dominant_colors = extract_dominant_colors(image)
    
    # Estimate lighting direction and intensity
    lighting = estimate_lighting(image)
    
    # Estimate depth (optional, can be slow)
    # depth_map = estimate_depth(image)
    
    return {
        'lighting': lighting,
        'dominantColors': dominant_colors,
        # 'depth': depth_map  # Commented out for speed
    }


def extract_dominant_colors(image: Image.Image, n_colors: int = 5) -> List[str]:
    """
    Extract dominant colors from image using k-means clustering
    
    Args:
        image: PIL Image
        n_colors: Number of dominant colors to extract
        
    Returns:
        List of hex color strings
    """
    from sklearn.cluster import KMeans
    
    # Resize for speed
    image_small = image.resize((150, 150))
    pixels = np.array(image_small).reshape(-1, 3)
    
    # K-means clustering
    kmeans = KMeans(n_clusters=n_colors, random_state=42, n_init=10)
    kmeans.fit(pixels)
    
    # Get cluster centers (dominant colors)
    colors = kmeans.cluster_centers_.astype(int)
    
    # Convert to hex
    hex_colors = [f'#{r:02x}{g:02x}{b:02x}' for r, g, b in colors]
    
    return hex_colors


def estimate_lighting(image: Image.Image) -> Dict:
    """
    Estimate lighting direction and intensity from image
    
    Args:
        image: PIL Image
        
    Returns:
        dict with direction (degrees), intensity (0-1), temperature (K)
    """
    # Convert to grayscale for analysis
    gray = np.array(image.convert('L'))
    
    # Calculate gradients to find light direction
    grad_y, grad_x = np.gradient(gray.astype(float))
    
    # Average gradient direction
    avg_grad_x = np.mean(grad_x)
    avg_grad_y = np.mean(grad_y)
    
    # Convert to angle (0 = right, 90 = down, 180 = left, 270 = up)
    direction = np.degrees(np.arctan2(avg_grad_y, avg_grad_x)) % 360
    
    # Estimate intensity from overall brightness
    intensity = np.mean(gray) / 255.0
    
    # Estimate color temperature from RGB balance
    rgb = np.array(image)
    avg_r = np.mean(rgb[:, :, 0])
    avg_b = np.mean(rgb[:, :, 2])
    
    # Warm (high R) = low K, Cool (high B) = high K
    # Map to 2000K-10000K range
    temperature = 6000 + (avg_b - avg_r) * 20
    temperature = max(2000, min(10000, temperature))
    
    return {
        'direction': float(direction),
        'intensity': float(intensity),
        'temperature': int(temperature)
    }


def estimate_depth(image: Image.Image) -> List[List[float]]:
    """
    Estimate depth map using Depth-Anything model
    
    Args:
        image: PIL Image
        
    Returns:
        2D array of depth values (normalized 0-1)
    """
    depth_estimator = get_depth_estimator()
    
    # Estimate depth
    depth = depth_estimator(image)
    depth_map = np.array(depth["depth"])
    
    # Normalize to 0-1
    depth_normalized = (depth_map - depth_map.min()) / (depth_map.max() - depth_map.min())
    
    # Downsample for smaller payload
    from scipy.ndimage import zoom
    depth_small = zoom(depth_normalized, 0.25)  # 4x smaller
    
    return depth_small.tolist()

