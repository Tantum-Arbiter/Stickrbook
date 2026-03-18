"""
Edge Color Bleeding for Natural Integration

Applies subtle color bleeding from background to asset edges
for seamless, natural-looking composites.
"""

import numpy as np
import cv2
from typing import Dict


def apply_edge_color_bleeding(
    asset: np.ndarray,
    background: np.ndarray,
    mask: np.ndarray,
    position: Dict[str, int],
    strength: float = 0.3,
    bleed_distance: int = 5
) -> np.ndarray:
    """
    Apply edge color bleeding from background to asset edges
    
    This creates a natural transition where the asset edges pick up
    colors from the surrounding background, making the composite
    look more integrated and realistic.
    
    Args:
        asset: Asset image array (RGB)
        background: Background image array (RGB)
        mask: Alpha mask array (grayscale, 0-255)
        position: {'x': int, 'y': int} position on background
        strength: Bleeding strength (0-1, default 0.3)
        bleed_distance: Distance in pixels to bleed (default 5)
        
    Returns:
        Asset with edge color bleeding applied
    """
    if strength <= 0:
        return asset
    
    result = asset.copy().astype(float)
    x, y = position['x'], position['y']
    h, w = asset.shape[:2]
    bg_h, bg_w = background.shape[:2]
    
    # Ensure mask matches asset dimensions
    if mask.shape[:2] != asset.shape[:2]:
        mask = cv2.resize(mask, (asset.shape[1], asset.shape[0]))
    
    # Create edge mask (pixels near the edge of the subject)
    # Use distance transform to find pixels within bleed_distance of edge
    mask_binary = (mask > 127).astype(np.uint8)
    
    # Erode to find inner edge
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (bleed_distance * 2 + 1, bleed_distance * 2 + 1))
    mask_eroded = cv2.erode(mask_binary, kernel, iterations=1)
    
    # Edge region = original mask - eroded mask
    edge_mask = mask_binary - mask_eroded
    
    # Create distance-based falloff (stronger bleeding at outer edge)
    dist_transform = cv2.distanceTransform(mask_binary, cv2.DIST_L2, 5)
    dist_transform = np.clip(dist_transform / bleed_distance, 0, 1)
    
    # Invert so edges have higher values
    edge_weight = (1 - dist_transform) * edge_mask
    edge_weight = np.clip(edge_weight * strength, 0, 1)
    
    # Extract background region at asset position
    src_x1 = max(0, -x)
    src_y1 = max(0, -y)
    src_x2 = min(w, bg_w - x)
    src_y2 = min(h, bg_h - y)
    
    dst_x1 = max(0, x)
    dst_y1 = max(0, y)
    dst_x2 = dst_x1 + (src_x2 - src_x1)
    dst_y2 = dst_y1 + (src_y2 - src_y1)
    
    if src_x2 <= src_x1 or src_y2 <= src_y1:
        return asset  # No overlap
    
    # Get background colors at asset position
    bg_region = background[dst_y1:dst_y2, dst_x1:dst_x2].astype(float)
    
    # Apply Gaussian blur to background for smoother color bleeding
    bg_blurred = cv2.GaussianBlur(bg_region, (bleed_distance * 2 + 1, bleed_distance * 2 + 1), 0)
    
    # Blend asset with blurred background at edges
    asset_region = result[src_y1:src_y2, src_x1:src_x2]
    edge_weight_region = edge_weight[src_y1:src_y2, src_x1:src_x2]
    
    # Expand edge weight to 3 channels
    if len(edge_weight_region.shape) == 2:
        edge_weight_region = edge_weight_region[:, :, np.newaxis]
    
    # Blend: asset * (1 - edge_weight) + background * edge_weight
    blended_region = (
        asset_region * (1 - edge_weight_region) +
        bg_blurred * edge_weight_region
    )
    
    result[src_y1:src_y2, src_x1:src_x2] = blended_region
    
    return np.clip(result, 0, 255).astype(np.uint8)


def apply_ambient_occlusion(
    asset: np.ndarray,
    mask: np.ndarray,
    strength: float = 0.2,
    distance: int = 10
) -> np.ndarray:
    """
    Apply subtle ambient occlusion darkening at asset edges
    
    This simulates the natural darkening that occurs where objects
    meet surfaces, adding depth and realism.
    
    Args:
        asset: Asset image array (RGB)
        mask: Alpha mask array (grayscale, 0-255)
        strength: AO strength (0-1, default 0.2)
        distance: AO distance in pixels (default 10)
        
    Returns:
        Asset with ambient occlusion applied
    """
    if strength <= 0:
        return asset
    
    result = asset.copy().astype(float)
    
    # Ensure mask matches asset dimensions
    if mask.shape[:2] != asset.shape[:2]:
        mask = cv2.resize(mask, (asset.shape[1], asset.shape[0]))
    
    # Create distance transform from edges
    mask_binary = (mask > 127).astype(np.uint8)
    dist_transform = cv2.distanceTransform(mask_binary, cv2.DIST_L2, 5)
    
    # Normalize and invert (edges = 1, center = 0)
    ao_mask = np.clip(1 - (dist_transform / distance), 0, 1)
    
    # Apply darkening at edges
    darkening = 1 - (ao_mask * strength)
    
    # Expand to 3 channels
    if len(darkening.shape) == 2:
        darkening = darkening[:, :, np.newaxis]
    
    result = result * darkening
    
    return np.clip(result, 0, 255).astype(np.uint8)

