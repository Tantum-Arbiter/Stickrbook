"""
Magic Merge API Routes

Cost-effective AI compositing endpoints using open-source models.
Target: <$0.01 per operation
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional, List
import logging
import base64
import io
from PIL import Image
import numpy as np

from .segmentation import segment_subject, refine_mask
from .scene_analysis import analyze_scene
from .harmonization import harmonize_colors
from .advanced_harmonization import advanced_harmonize
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
    seamBlending: bool = False  # Disabled by default - Poisson causes ghosting with characters
    blendMode: str = 'normal'  # 'normal' (best for characters), 'mixed', 'monochrome'


class CompositeResponse(BaseModel):
    result: str  # Base64 encoded composited image


class MagicMergeRequest(BaseModel):
    """Full Magic Merge pipeline request"""
    asset: str
    background: str
    position: Dict[str, int]
    scale: float = 1.0
    harmonize: bool = True  # Enabled by default
    harmonizeStrength: float = 0.5  # Moderate strength for natural blending
    advancedHarmonization: bool = True  # Use advanced multi-zone color grading (recommended)
    shadow: Optional[Dict] = None
    seamBlending: bool = False  # Disabled by default - Poisson causes ghosting with transparent characters
    blendMode: str = 'normal'  # 'normal' (best for characters), 'mixed' (detail but can ghost), 'monochrome' (color match)
    edgeBlending: bool = True  # Edge color bleeding for seamless integration
    edgeBlendingStrength: float = 0.3  # Subtle edge color bleeding


class MagicMergeResponse(BaseModel):
    """Full Magic Merge pipeline response"""
    result: str
    mask: str
    sceneAnalysis: Dict
    adjustments: Dict
    confidence: float


class AICompositeRequest(BaseModel):
    """AI-powered img2img compositing request"""
    asset: str  # Base64 encoded asset (character/prop)
    background: str  # Base64 encoded background
    position: Dict[str, int]  # {x, y}
    scale: float = 1.0
    style: str  # Art style description
    character: Optional[str] = None  # Character description
    action: Optional[str] = None  # What the character is doing
    setting: Optional[str] = None  # Setting description
    denoise: float = 0.6  # How much AI blending (0.5-0.7 recommended)
    steps: int = 35
    cfg: float = 5.5
    seed: Optional[int] = None


class AICompositeResponse(BaseModel):
    """AI-powered compositing response"""
    result: str  # Base64 encoded blended image
    jobId: str  # ComfyUI job ID for tracking


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
            if request.advancedHarmonization:
                logger.info("Step 3: Advanced harmonization (multi-zone color grading)...")
                harmonize_result = advanced_harmonize(
                    request.asset,
                    request.background,
                    scene_analysis,
                    mask_data=segment_result['mask'],
                    strength=request.harmonizeStrength
                )
            else:
                logger.info("Step 3: Basic harmonization...")
                harmonize_result = harmonize_colors(
                    request.asset,
                    request.background,
                    scene_analysis,
                    strength=request.harmonizeStrength
                )
            harmonized_asset = harmonize_result['result']
            adjustments = harmonize_result['adjustments']

        # Step 4: Composite (use alpha blending by default to avoid ghosting)
        logger.info("Step 4: Compositing...")
        composite_result = composite_images(
            harmonized_asset,
            request.background,
            segment_result['mask'],
            request.position,
            request.scale,
            request.shadow,
            seam_blending=request.seamBlending,  # Use request parameter (default False)
            blend_mode=request.blendMode,
            edge_blending=request.edgeBlending,  # Edge color bleeding for natural integration
            edge_blending_strength=request.edgeBlendingStrength
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


@router.post("/ai-composite", response_model=AICompositeResponse)
async def ai_composite(request: AICompositeRequest):
    """
    AI-powered compositing using ComfyUI img2img workflow

    This uses Stable Diffusion to artistically blend the character into the background,
    matching the art style perfectly. Slower than Magic Merge but produces more
    natural artistic integration.

    Cost: GPU compute time
    Speed: ~30-60 seconds
    Quality: AI-blended, style-matched
    """
    try:
        from comfyui_client import comfyui_client
        import random

        logger.info("AI Composite: Starting img2img blending...")

        # Step 1: Create a rough composite using basic alpha blending
        logger.info("Step 1: Creating rough composite...")

        # Decode images
        asset_data = base64.b64decode(request.asset.split(',')[1] if ',' in request.asset else request.asset)
        bg_data = base64.b64decode(request.background.split(',')[1] if ',' in request.background else request.background)

        asset_img = Image.open(io.BytesIO(asset_data)).convert('RGBA')
        bg_img = Image.open(io.BytesIO(bg_data)).convert('RGB')

        # Scale asset
        if request.scale != 1.0:
            new_size = (int(asset_img.width * request.scale), int(asset_img.height * request.scale))
            asset_img = asset_img.resize(new_size, Image.Resampling.LANCZOS)

        # Create composite by pasting asset onto background
        composite = bg_img.copy()
        composite.paste(asset_img, (request.position['x'], request.position['y']), asset_img)

        # Convert to base64
        buffer = io.BytesIO()
        composite.save(buffer, format='PNG')
        composite_b64 = base64.b64encode(buffer.getvalue()).decode()

        # Step 2: Upload composite to ComfyUI
        logger.info("Step 2: Uploading composite to ComfyUI...")
        composite_filename = await comfyui_client.upload_image(
            buffer.getvalue(),
            f"composite_{random.randint(1000, 9999)}.png"
        )

        # Step 3: Build img2img workflow
        logger.info("Step 3: Building img2img workflow...")
        seed = request.seed if request.seed is not None else random.randint(0, 2**32 - 1)

        # Build prompt
        style_desc = request.style or "children's storybook illustration"
        char_desc = request.character or "character"
        action_desc = request.action or "standing naturally"
        setting_desc = request.setting or "in the scene"

        positive_prompt = f"""Children's storybook illustration with character naturally integrated in scene.

STYLE:
{style_desc}

CHARACTER:
{char_desc}

ACTION:
{action_desc}

SETTING:
{setting_desc}

RULES:
- Harmonize character with scene seamlessly
- Consistent lighting between character and background
- Consistent art style throughout
- Smooth edges, no visible compositing artifacts
- No text, no watermark, no logo"""

        negative_prompt = "visible edges, harsh compositing, different styles, inconsistent lighting, cut-and-paste look, photorealistic, 3d render, text, watermark, logo"

        # Build workflow (based on 04_compose_img2img.json)
        workflow = {
            "1": {
                "inputs": {
                    "seed": seed,
                    "steps": request.steps,
                    "cfg": request.cfg,
                    "sampler_name": "euler",
                    "scheduler": "sgm_uniform",
                    "denoise": request.denoise,
                    "model": ["3", 0],
                    "positive": ["5", 0],
                    "negative": ["6", 0],
                    "latent_image": ["10", 0]
                },
                "class_type": "KSampler",
                "_meta": {"title": "KSampler"}
            },
            "3": {
                "inputs": {"ckpt_name": "sd3.5_medium_incl_clips_t5xxlfp8scaled.safetensors"},
                "class_type": "CheckpointLoaderSimple",
                "_meta": {"title": "Load Checkpoint"}
            },
            "4": {
                "inputs": {"samples": ["1", 0], "vae": ["3", 2]},
                "class_type": "VAEDecode",
                "_meta": {"title": "VAE Decode"}
            },
            "5": {
                "inputs": {
                    "text": positive_prompt,
                    "clip": ["3", 1]
                },
                "class_type": "CLIPTextEncode",
                "_meta": {"title": "Positive - COMPOSE"}
            },
            "6": {
                "inputs": {
                    "text": negative_prompt,
                    "clip": ["3", 1]
                },
                "class_type": "CLIPTextEncode",
                "_meta": {"title": "Negative Prompt"}
            },
            "8": {
                "inputs": {"filename_prefix": "ai_composite", "images": ["4", 0]},
                "class_type": "SaveImage",
                "_meta": {"title": "Save Composed"}
            },
            "9": {
                "inputs": {"image": composite_filename, "upload": "image"},
                "class_type": "LoadImage",
                "_meta": {"title": "Load Composite"}
            },
            "10": {
                "inputs": {"pixels": ["9", 0], "vae": ["3", 2]},
                "class_type": "VAEEncode",
                "_meta": {"title": "Encode Composite"}
            }
        }

        # Step 4: Submit to ComfyUI
        logger.info("Step 4: Submitting to ComfyUI...")
        prompt_id = await comfyui_client.submit_prompt(workflow)
        if not prompt_id:
            raise Exception("Failed to submit workflow to ComfyUI")

        # Step 5: Wait for completion
        logger.info(f"Step 5: Waiting for ComfyUI (prompt_id: {prompt_id})...")
        max_wait = 300  # 5 minutes
        poll_interval = 2
        elapsed = 0

        while elapsed < max_wait:
            import asyncio
            history = await comfyui_client.get_history(prompt_id)

            if history and "outputs" in history:
                for node_id, output in history["outputs"].items():
                    if "images" in output:
                        for img_info in output["images"]:
                            filename = img_info["filename"]
                            subfolder = img_info.get("subfolder", "")
                            image_data = await comfyui_client.get_image(
                                filename, subfolder, img_info.get("type", "output")
                            )

                            # Convert to base64
                            result_b64 = f"data:image/png;base64,{base64.b64encode(image_data).decode()}"

                            logger.info("AI Composite complete!")
                            return AICompositeResponse(
                                result=result_b64,
                                jobId=prompt_id
                            )

            await asyncio.sleep(poll_interval)
            elapsed += poll_interval

        raise Exception("AI composite timed out waiting for ComfyUI")

    except Exception as e:
        logger.error(f"AI Composite failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

