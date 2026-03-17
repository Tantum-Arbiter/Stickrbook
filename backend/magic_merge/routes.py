"""
Magic Merge API Routes

Cost-effective AI compositing endpoints using open-source models.
Target: <$0.01 per operation
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional, List
import logging

from .segmentation import segment_subject, refine_mask
from .scene_analysis import analyze_scene
from .harmonization import harmonize_colors
from .compositing import composite_images

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/magic-merge", tags=["magic-merge"])


# Request/Response Models
class SegmentRequest(BaseModel):
    image: str  # Base64 encoded image


class SegmentResponse(BaseModel):
    mask: str  # Base64 encoded mask
    confidence: float


class SceneAnalysisRequest(BaseModel):
    image: str  # Base64 encoded image


class SceneAnalysisResponse(BaseModel):
    lighting: Dict
    dominantColors: List[str]


class HarmonizeRequest(BaseModel):
    asset: str  # Base64 encoded asset
    background: str  # Base64 encoded background
    sceneAnalysis: Dict
    strength: float = 0.7


class HarmonizeResponse(BaseModel):
    result: str  # Base64 encoded harmonized asset
    adjustments: Dict
    confidence: float


class CompositeRequest(BaseModel):
    asset: str  # Base64 encoded asset
    background: str  # Base64 encoded background
    mask: str  # Base64 encoded mask
    position: Dict[str, int]  # {x, y}
    scale: float = 1.0
    shadow: Optional[Dict] = None
    seamBlending: bool = True
    blendMode: str = 'mixed'  # 'mixed', 'monochrome', or 'normal'


class CompositeResponse(BaseModel):
    result: str  # Base64 encoded composited image


class MagicMergeRequest(BaseModel):
    """Full Magic Merge pipeline request"""
    asset: str
    background: str
    position: Dict[str, int]
    scale: float = 1.0
    harmonize: bool = True
    harmonizeStrength: float = 0.5  # Reduced default for more natural results
    shadow: Optional[Dict] = None
    blendMode: str = 'normal'  # 'normal' (best for characters), 'mixed' (detail but can ghost), 'monochrome' (color match)


class MagicMergeResponse(BaseModel):
    """Full Magic Merge pipeline response"""
    result: str
    mask: str
    sceneAnalysis: Dict
    adjustments: Dict
    confidence: float


# Endpoints
@router.post("/segment", response_model=SegmentResponse)
async def segment(request: SegmentRequest):
    """
    Segment subject from background using RMBG-v1.4
    
    Cost: $0.00 (open source)
    Speed: ~1-2 seconds
    """
    try:
        result = segment_subject(request.image)
        return SegmentResponse(**result)
    except Exception as e:
        logger.error(f"Segmentation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-scene", response_model=SceneAnalysisResponse)
async def analyze(request: SceneAnalysisRequest):
    """
    Analyze background scene for lighting and colors
    
    Cost: $0.00 (open source)
    Speed: ~2-3 seconds
    """
    try:
        result = analyze_scene(request.image)
        return SceneAnalysisResponse(**result)
    except Exception as e:
        logger.error(f"Scene analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/harmonize", response_model=HarmonizeResponse)
async def harmonize(request: HarmonizeRequest):
    """
    Harmonize asset colors to match background
    
    Cost: $0.00 (open source)
    Speed: <1 second
    """
    try:
        result = harmonize_colors(
            request.asset,
            request.background,
            request.sceneAnalysis,
            request.strength
        )
        return HarmonizeResponse(**result)
    except Exception as e:
        logger.error(f"Harmonization failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/composite", response_model=CompositeResponse)
async def composite(request: CompositeRequest):
    """
    Composite asset onto background with improved Poisson blending

    Cost: $0.00 (open source)
    Speed: <1 second

    Blend Modes:
    - 'mixed': Best for preserving detail (recommended)
    - 'monochrome': Best for color matching
    - 'normal': Balanced approach
    """
    try:
        result = composite_images(
            request.asset,
            request.background,
            request.mask,
            request.position,
            request.scale,
            request.shadow,
            request.seamBlending,
            request.blendMode
        )
        return CompositeResponse(**result)
    except Exception as e:
        logger.error(f"Compositing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/magic-merge", response_model=MagicMergeResponse)
async def magic_merge(request: MagicMergeRequest):
    """
    Full Magic Merge pipeline: segment + analyze + harmonize + composite
    
    Cost: $0.00 (all open source)
    Speed: ~4-6 seconds total
    Quality: Professional
    """
    try:
        # Step 1: Segment subject
        logger.info("Step 1: Segmenting subject...")
        segment_result = segment_subject(request.asset)
        
        # Step 2: Analyze background scene
        logger.info("Step 2: Analyzing scene...")
        scene_analysis = analyze_scene(request.background)
        
        # Step 3: Harmonize colors (if requested)
        harmonized_asset = request.asset
        adjustments = {}
        
        if request.harmonize:
            logger.info("Step 3: Harmonizing colors...")
            harmonize_result = harmonize_colors(
                request.asset,
                request.background,
                scene_analysis,
                strength=request.harmonizeStrength
            )
            harmonized_asset = harmonize_result['result']
            adjustments = harmonize_result['adjustments']

        # Step 4: Composite with improved Poisson blending
        logger.info("Step 4: Compositing...")
        composite_result = composite_images(
            harmonized_asset,
            request.background,
            segment_result['mask'],
            request.position,
            request.scale,
            request.shadow,
            seam_blending=True,
            blend_mode=request.blendMode
        )
        
        logger.info("Magic Merge complete!")
        
        return MagicMergeResponse(
            result=composite_result['result'],
            mask=segment_result['mask'],
            sceneAnalysis=scene_analysis,
            adjustments=adjustments,
            confidence=segment_result['confidence']
        )
        
    except Exception as e:
        logger.error(f"Magic Merge failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

