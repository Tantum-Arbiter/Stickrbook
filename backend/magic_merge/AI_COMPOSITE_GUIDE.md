# AI Composite - Img2Img Artistic Blending

## Overview

The AI Composite endpoint uses ComfyUI's Stable Diffusion img2img workflow to artistically blend characters into backgrounds, matching the art style perfectly.

## Comparison: OpenCV vs AI Composite

| Feature | Magic Merge (OpenCV) | AI Composite (Img2Img) |
|---------|---------------------|------------------------|
| **Technology** | OpenCV image processing | Stable Diffusion 3.5 Medium |
| **Speed** | 4-6 seconds | 30-60 seconds |
| **Cost** | $0.00 | GPU compute time |
| **Quality** | Photorealistic compositing | Artistic style matching |
| **Control** | Precise placement | AI interpretation |
| **Use Case** | Fast, accurate placement | Perfect art style integration |

---

## When to Use AI Composite

✅ **Use AI Composite when:**
- You want the character to match the illustration style **exactly**
- You're okay with 30-60 second processing time
- You want AI to handle lighting, shadows, and color grading automatically
- You need seamless artistic integration (no "pasted on" look)
- The background has a distinct art style (watercolor, cartoon, etc.)

❌ **Don't use AI Composite when:**
- You need instant results
- You want pixel-perfect control over placement
- You're working with photorealistic images
- You're doing rapid iteration

---

## API Endpoint

### Request

```bash
POST /v1/magic-merge/ai-composite
```

```json
{
  "asset": "data:image/png;base64,...",
  "background": "data:image/png;base64,...",
  "position": {"x": 100, "y": 100},
  "scale": 1.0,
  "style": "children's storybook illustration, watercolor style",
  "character": "young girl with red dress",
  "action": "standing naturally in the scene",
  "setting": "sunny meadow with flowers",
  "denoise": 0.6,
  "steps": 35,
  "cfg": 5.5,
  "seed": null
}
```

### Parameters

- **asset** (required): Base64 encoded character/prop image
- **background** (required): Base64 encoded background image
- **position** (required): `{x, y}` position to place the asset
- **scale** (optional): Scale factor for the asset (default: 1.0)
- **style** (required): Art style description (e.g., "watercolor children's book illustration")
- **character** (optional): Character description
- **action** (optional): What the character is doing
- **setting** (optional): Setting description
- **denoise** (optional): AI blending strength (0.5-0.7 recommended, default: 0.6)
  - `0.5`: Subtle blending, preserves composition
  - `0.6`: Balanced blending (recommended)
  - `0.7`: Strong blending, more AI interpretation
- **steps** (optional): Diffusion steps (default: 35)
- **cfg** (optional): Classifier-free guidance (default: 5.5)
- **seed** (optional): Random seed for reproducibility

### Response

```json
{
  "result": "data:image/png;base64,...",
  "jobId": "prompt_abc123"
}
```

---

## How It Works

1. **Create Rough Composite**
   - Uses basic alpha blending to place the character on the background
   - Scales and positions the asset at the specified location

2. **Upload to ComfyUI**
   - Uploads the rough composite to ComfyUI's input folder

3. **Build Img2Img Workflow**
   - Creates a workflow based on `04_compose_img2img.json`
   - Uses the composite as the init image
   - Applies the style, character, and setting prompts

4. **AI Blending**
   - Stable Diffusion processes the image with the specified denoise strength
   - AI harmonizes colors, lighting, and style
   - Removes compositing artifacts
   - Matches the art style perfectly

5. **Return Result**
   - Downloads the blended image from ComfyUI
   - Returns as base64 encoded PNG

---

## Frontend Integration

The LayerPanel now uses AI Composite by default:

```typescript
const response = await fetch(`${API_BASE_URL}/magic-merge/ai-composite`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    asset: assetBase64,
    background: backgroundBase64,
    position: { x: Math.round(layer.x), y: Math.round(layer.y) },
    scale: finalScale,
    style: currentBook?.artStyle || "children's storybook illustration",
    character: asset.name || "character",
    action: "naturally integrated in the scene",
    setting: "matching the background environment",
    denoise: 0.6,
    steps: 35,
    cfg: 5.5,
  }),
});
```

---

## Tips for Best Results

1. **Denoise Strength**
   - Start with `0.6` for balanced results
   - Lower (`0.5`) if the character is changing too much
   - Higher (`0.7`) if you want more artistic interpretation

2. **Style Description**
   - Be specific: "watercolor children's book illustration with soft edges"
   - Match the background's actual style
   - Include medium (watercolor, digital painting, etc.)

3. **Character Description**
   - Include key features: "young girl with red dress and brown hair"
   - Helps AI preserve character identity

4. **Action & Setting**
   - Describe what the character is doing: "standing naturally"
   - Describe the environment: "in a sunny meadow"
   - Helps AI understand context for lighting/shadows

---

## Troubleshooting

**Character looks different:**
- Lower the `denoise` value to 0.5
- Make the character description more detailed

**Blending too subtle:**
- Increase `denoise` to 0.65-0.7
- Check that style description matches the background

**Takes too long:**
- Reduce `steps` to 25-30 (faster but lower quality)
- Consider using Magic Merge (OpenCV) instead for instant results

**ComfyUI timeout:**
- Check that ComfyUI is running
- Check that SD 3.5 Medium model is loaded
- Increase timeout in the code if needed

---

## Switching Back to OpenCV Magic Merge

If you want to switch back to the fast OpenCV compositing, change the endpoint in `LayerPanel.tsx`:

```typescript
// Change from:
const response = await fetch(`${API_BASE_URL}/magic-merge/ai-composite`, {

// To:
const response = await fetch(`${API_BASE_URL}/magic-merge/magic-merge`, {
```

And update the request body to use the Magic Merge parameters (see `COMPOSITING_IMPROVEMENTS.md`).

