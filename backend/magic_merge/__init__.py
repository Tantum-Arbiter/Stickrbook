"""
Magic Merge - Cost-Effective AI Compositing Service

Uses open-source models for professional-quality image compositing:
- RMBG-v1.4 for background removal
- CLIP for scene analysis
- Depth-Anything for depth estimation
- OpenCV for color harmonization and Poisson blending
"""

from .routes import router

__all__ = ["router"]

