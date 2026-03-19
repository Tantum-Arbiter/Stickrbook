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
from typing import Dict
from .edge_blending import apply_edge_color_bleeding, apply_ambient_occlusion


def composite_images(
    asset_data: str,
    background_data: str,
    mask_data: str,
    position: Dict[str, int],
    scale: float = 1.0,
    shadow: Dict = None,
    seam_blending: bool = True,
    blend_mode: str = 'mixed',
    edge_blending: bool = True,
    edge_blending_strength: float = 0.3
) -> Dict:
    """
    Composite asset onto background with advanced blending options

    Args:
        asset_data: Base64 encoded asset image
        background_data: Base64 encoded background image
        mask_data: Base64 encoded mask image
        position: {'x': int, 'y': int} position on background
        scale: Scale factor for asset
        shadow: Optional shadow parameters
        seam_blending: Use Poisson blending for seamless compositing
        blend_mode: 'mixed' (best detail), 'monochrome' (best color match), 'normal' (balanced)
        edge_blending: Apply edge color bleeding for natural integration (default True)
        edge_blending_strength: Strength of edge color bleeding (0-1, default 0.3)

    Returns:
        dict with 'result' (base64 composited image)
    """
    # Decode images
    # Don't force mode on asset - preserve RGBA if present to detect transparency
    asset = decode_image(asset_data, mode=None)
    background = decode_image(background_data, mode='RGB')
    mask = decode_image(mask_data, mode='L')

    # Scale asset if needed
    if scale != 1.0:
        new_size = (int(asset.width * scale), int(asset.height * scale))
        asset = asset.resize(new_size, Image.LANCZOS)
        mask = mask.resize(new_size, Image.LANCZOS)

    # Convert to numpy arrays
    # IMPORTANT: If asset has alpha channel, composite it onto white background first
    # This prevents ghosting from transparent pixels with black/gray RGB values
    if asset.mode == 'RGBA':
        # Create white background
        white_bg = Image.new('RGB', asset.size, (255, 255, 255))
        # Composite asset onto white using its alpha channel
        white_bg.paste(asset, (0, 0), asset)
        asset_array = np.array(white_bg)
    else:
        asset_array = np.array(asset.convert('RGB'))

    bg_array = np.array(background.convert('RGB'))
    mask_array = np.array(mask)

    # Apply edge color bleeding for natural integration (before compositing)
    if edge_blending:
        asset_array = apply_edge_color_bleeding(
            asset_array,
            bg_array,
            mask_array,
            position,
            strength=edge_blending_strength
        )

    # Add shadow if specified
    if shadow:
        bg_array = add_shadow(bg_array, mask_array, position, shadow)

    # Composite using Poisson blending or alpha blending
    # NOTE: Poisson blending can cause ghosting with transparent characters
    # Use alpha blending for better color preservation
    if seam_blending and cv2 is not None:
        try:
            result = poisson_blend(asset_array, bg_array, mask_array, position, blend_mode)
        except Exception as e:
            print(f"Poisson blending failed: {e}, using alpha blend")
            result = alpha_blend(asset_array, bg_array, mask_array, position)
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
    position: Dict[str, int],
    blend_mode: str = 'normal'
) -> np.ndarray:
    """
    Seamless Poisson blending using OpenCV with improved quality

    Args:
        source: Source image array (RGB)
        target: Target/background image array (RGB)
        mask: Binary mask array
        position: {'x': int, 'y': int} center position
        blend_mode: 'normal' (default - best for characters), 'mixed', or 'monochrome'

    Returns:
        Blended image array
    """
    # Refine mask for better edge quality
    mask_refined = refine_mask_for_blending(mask)

    # Calculate center point
    center = (position['x'] + source.shape[1] // 2, position['y'] + source.shape[0] // 2)

    # Ensure source and mask are same size
    if source.shape[:2] != mask_refined.shape[:2]:
        mask_refined = cv2.resize(mask_refined, (source.shape[1], source.shape[0]))

    try:
        # Use NORMAL_CLONE by default - best for character compositing
        # MIXED_CLONE can cause ghosting with transparent characters
        if blend_mode == 'normal':
            result = cv2.seamlessClone(
                source,
                target,
                mask_refined,
                center,
                cv2.NORMAL_CLONE  # Best for preserving colors
            )
        elif blend_mode == 'mixed':
            result = cv2.seamlessClone(
                source,
                target,
                mask_refined,
                center,
                cv2.MIXED_CLONE  # Preserves texture but can ghost
            )
        elif blend_mode == 'monochrome':
            result = cv2.seamlessClone(
                source,
                target,
                mask_refined,
                center,
                cv2.MONOCHROME_TRANSFER  # Best for color matching
            )
        else:
            result = cv2.seamlessClone(
                source,
                target,
                mask_refined,
                center,
                cv2.NORMAL_CLONE
            )
        return result
    except Exception as e:
        print(f"Poisson blending failed: {e}, falling back to enhanced alpha blending")
        return enhanced_alpha_blend(source, target, mask_refined, position)


def refine_mask_for_blending(mask: np.ndarray, feather: int = 0) -> np.ndarray:
    """
    Refine mask for better blending quality

    Args:
        mask: Input mask array
        feather: Feather amount in pixels (default: 0 - no feathering for Poisson)

    Returns:
        Refined binary mask
    """
    # Ensure mask is grayscale
    if len(mask.shape) == 3:
        mask = cv2.cvtColor(mask, cv2.COLOR_RGB2GRAY)

    # Use simple threshold (NOT adaptive - that corrupts RMBG masks!)
    # RMBG produces high-quality alpha masks that should be preserved
    # Higher threshold to ensure only solid areas are included
    _, mask_binary = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)

    # Clean up noise with morphological operations (minimal)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    mask_binary = cv2.morphologyEx(mask_binary, cv2.MORPH_CLOSE, kernel)

    # Erode slightly to avoid edge artifacts in Poisson blending
    mask_binary = cv2.erode(mask_binary, kernel, iterations=1)

    # NO feathering for Poisson blending - it needs hard edges
    # Feathering causes ghosting in seamlessClone

    return mask_binary


def enhanced_alpha_blend(
    source: np.ndarray,
    target: np.ndarray,
    mask: np.ndarray,
    position: Dict[str, int],
    feather_edges: bool = True
) -> np.ndarray:
    """
    Enhanced alpha blending with edge feathering

    Args:
        source: Source image array
        target: Target image array
        mask: Alpha mask array
        position: {'x': int, 'y': int} top-left position
        feather_edges: Apply edge feathering for smoother blend

    Returns:
        Blended image array
    """
    result = target.copy()

    x, y = position['x'], position['y']
    h, w = source.shape[:2]

    # Ensure mask matches source dimensions
    if mask.shape[:2] != source.shape[:2]:
        mask = cv2.resize(mask, (source.shape[1], source.shape[0]))

    # Apply edge feathering for smoother transitions
    if feather_edges:
        mask_float = mask.astype(float) / 255.0
        # Create distance transform for smooth falloff at edges
        mask_binary = (mask > 127).astype(np.uint8)
        dist_transform = cv2.distanceTransform(mask_binary, cv2.DIST_L2, 5)
        # Normalize and apply smooth falloff
        if dist_transform.max() > 0:
            dist_transform = dist_transform / dist_transform.max()
            # Smooth falloff at edges (3 pixel transition)
            edge_feather = np.clip(dist_transform * 3, 0, 1)
            mask_float = mask_float * edge_feather

        mask = (mask_float * 255).astype(np.uint8)

    # Calculate the region to blend (handle out of bounds)
    # Source region
    src_x1, src_y1 = 0, 0
    src_x2, src_y2 = w, h

    # Target region
    tgt_x1, tgt_y1 = x, y
    tgt_x2, tgt_y2 = x + w, y + h

    # Clip to target bounds and adjust source region accordingly
    if tgt_x1 < 0:
        src_x1 = -tgt_x1
        tgt_x1 = 0
    if tgt_y1 < 0:
        src_y1 = -tgt_y1
        tgt_y1 = 0
    if tgt_x2 > target.shape[1]:
        src_x2 = w - (tgt_x2 - target.shape[1])
        tgt_x2 = target.shape[1]
    if tgt_y2 > target.shape[0]:
        src_y2 = h - (tgt_y2 - target.shape[0])
        tgt_y2 = target.shape[0]

    # Extract the regions to blend
    source_region = source[src_y1:src_y2, src_x1:src_x2]
    mask_region = mask[src_y1:src_y2, src_x1:src_x2]
    target_region = result[tgt_y1:tgt_y2, tgt_x1:tgt_x2]

    # Ensure regions match
    if source_region.shape[:2] != target_region.shape[:2]:
        print(f"Warning: Region mismatch - source {source_region.shape}, target {target_region.shape}")
        return result

    # Normalize mask to 0-1
    alpha = mask_region.astype(float) / 255.0
    if len(alpha.shape) == 2:
        alpha = alpha[:, :, np.newaxis]

    # Blend
    result[tgt_y1:tgt_y2, tgt_x1:tgt_x2] = (
        source_region * alpha + target_region * (1 - alpha)
    ).astype(np.uint8)

    return result


def alpha_blend(
    source: np.ndarray,
    target: np.ndarray,
    mask: np.ndarray,
    position: Dict[str, int]
) -> np.ndarray:
    """
    Clean alpha blending without edge feathering (prevents ghosting)

    Args:
        source: Source image array (RGB)
        target: Target image array (RGB)
        mask: Alpha mask array (grayscale, 0-255)
        position: {'x': int, 'y': int} top-left position

    Returns:
        Blended image array
    """
    result = target.copy()

    x, y = position['x'], position['y']
    h, w = source.shape[:2]

    # Ensure mask matches source dimensions
    if mask.shape[:2] != source.shape[:2]:
        mask = cv2.resize(mask, (source.shape[1], source.shape[0]))

    # Calculate region bounds
    target_h, target_w = target.shape[:2]

    # Clip to target bounds
    src_x1 = max(0, -x)
    src_y1 = max(0, -y)
    src_x2 = min(w, target_w - x)
    src_y2 = min(h, target_h - y)

    dst_x1 = max(0, x)
    dst_y1 = max(0, y)
    dst_x2 = dst_x1 + (src_x2 - src_x1)
    dst_y2 = dst_y1 + (src_y2 - src_y1)

    if src_x2 <= src_x1 or src_y2 <= src_y1:
        return result  # No overlap

    # Extract regions
    source_region = source[src_y1:src_y2, src_x1:src_x2]
    target_region = target[dst_y1:dst_y2, dst_x1:dst_x2]
    mask_region = mask[src_y1:src_y2, src_x1:src_x2]

    # Normalize mask to 0-1 range
    alpha = mask_region.astype(float) / 255.0

    # Expand alpha to 3 channels for RGB blending
    if len(alpha.shape) == 2:
        alpha = alpha[:, :, np.newaxis]

    # Simple alpha blending: result = source * alpha + target * (1 - alpha)
    # NO edge feathering, NO distance transforms - just clean alpha compositing
    blended = (
        source_region.astype(float) * alpha +
        target_region.astype(float) * (1 - alpha)
    ).astype(np.uint8)

    # Place blended region into result
    result[dst_y1:dst_y2, dst_x1:dst_x2] = blended

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

    # Calculate the region to apply shadow (handle out of bounds)
    # Shadow region
    shd_x1, shd_y1 = 0, 0
    shd_x2, shd_y2 = w, h

    # Background region
    bg_x1, bg_y1 = shadow_x, shadow_y
    bg_x2, bg_y2 = shadow_x + w, shadow_y + h

    # Clip to background bounds
    if bg_x1 < 0:
        shd_x1 = -bg_x1
        bg_x1 = 0
    if bg_y1 < 0:
        shd_y1 = -bg_y1
        bg_y1 = 0
    if bg_x2 > background.shape[1]:
        shd_x2 = w - (bg_x2 - background.shape[1])
        bg_x2 = background.shape[1]
    if bg_y2 > background.shape[0]:
        shd_y2 = h - (bg_y2 - background.shape[0])
        bg_y2 = background.shape[0]

    # Extract regions
    shadow_region = shadow_mask[shd_y1:shd_y2, shd_x1:shd_x2]
    bg_region = result[bg_y1:bg_y2, bg_x1:bg_x2]

    # Ensure regions match
    if shadow_region.shape[:2] != bg_region.shape[:2]:
        print(f"Warning: Shadow region mismatch - shadow {shadow_region.shape}, bg {bg_region.shape}")
        return result

    # Darken background where shadow is
    shadow_alpha = (shadow_region.astype(float) / 255.0 * opacity)[:, :, np.newaxis]
    result[bg_y1:bg_y2, bg_x1:bg_x2] = (
        bg_region * (1 - shadow_alpha * 0.5)
    ).astype(np.uint8)

    return result


def decode_image(data: str, mode: str = None) -> Image.Image:
    """Decode base64 image data

    Args:
        data: Base64 encoded image data
        mode: Target mode ('RGB', 'RGBA', 'L', etc.). If None, preserves original mode.

    Returns:
        PIL Image
    """
    if data.startswith('data:image'):
        data = data.split(',')[1]
    image_bytes = base64.b64decode(data)
    img = Image.open(io.BytesIO(image_bytes))

    if mode is not None:
        return img.convert(mode)
    return img

