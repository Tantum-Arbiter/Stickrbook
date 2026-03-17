# ComfyUI Workflows - Scene-First Pipeline

**Optimized for SD 3.5 Medium** (`sd3.5_medium_incl_clips_t5xxlfp8scaled.safetensors`)

## ⚠️ SD 3.5 Medium Limitations

| Feature | Status | Notes |
|---------|--------|-------|
| IP-Adapter | ❌ NOT AVAILABLE | No IP-Adapter models exist for SD 3.5 |
| ControlNet | ❌ NOT AVAILABLE | Only works with SD 3.5 Large, not Medium |
| Basic Generation | ✅ WORKS | Scenes, characters, props |
| Inpainting | ✅ WORKS | VAEEncodeForInpaint |
| Img2Img | ✅ WORKS | Style changes, composition |

## Workflow Overview

| # | Workflow | Purpose | Output |
|---|----------|---------|--------|
| 01 | `scene_empty` | Empty environment/setting | Background with no characters |
| 02 | `character_isolated` | Single character on white | Character for extraction |
| 03 | `prop_isolated` | Single object on white | Prop for extraction |
| 04 | `compose_img2img` | Blend character into scene | Complete page |
| 05 | `inpaint_insert` | Insert element in masked area | Modified scene |
| 06 | `refine_img2img` | Polish existing image | Refined version |
| 07 | `restyle_img2img` | Change style keeping layout | Restyled image |
| 08 | `character_variation` | New pose via detailed prompt | Character in new pose |

## Pipeline Steps

### Step 1: Create Empty Scene
```
Use: 01_scene_empty.json
Input: Style + Setting description
Output: Environment WITHOUT any characters
```

### Step 2: Create Characters  
```
Use: 02_character_isolated.json
Input: Style (SAME as scene) + Character description
Output: Single character on plain white background
```

### Step 3: Create Props (Optional)
```
Use: 03_prop_isolated.json
Input: Style (SAME as scene) + Prop description
Output: Single object on plain white background
```

### Step 4: Compose Final Image
```
Option A - Img2Img Blend (04_compose_img2img.json):
  1. Manually place character PNG on scene in image editor
  2. Use denoise 0.5-0.7 to blend seamlessly

Option B - Inpaint (05_inpaint_insert.json):
  Paint character into masked region of scene
```

### Step 5: Refine (Optional)
```
Use: 06_refine_img2img.json or 07_restyle_img2img.json
Polish colors, add details, or change style
```

## Placeholder Reference

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{STYLE}}` | Art style | `flat 2D Australian cartoon animation` |
| `{{SETTING}}` | Environment | `sunny park with playground equipment` |
| `{{CHARACTER}}` | Character desc | `friendly blue rabbit with floppy ears` |
| `{{POSE}}` | Character pose | `running, arms outstretched, happy` |
| `{{PROP}}` | Object desc | `red wooden wagon with yellow wheels` |
| `{{ACTION}}` | What character does | `hopping through flowers` |
| `{{ATMOSPHERE}}` | Mood/lighting | `warm summer afternoon, cheerful` |
| `{{LIGHTING}}` | Light description | `soft golden hour, gentle shadows` |
| `{{CHANGES}}` | What to modify | `enhance colors, add texture` |
| `{{PRESERVE}}` | What to keep | `character pose, composition` |

## Key Principles

### Style Consistency
**ALWAYS use the same `{{STYLE}}` across all workflows** for a project:
- Scene uses style X
- Characters use style X  
- Props use style X
- Composition uses style X

### Negative Prompts
Each workflow has targeted negative prompts:
- **Scene**: blocks characters, people, animals
- **Character**: blocks backgrounds, environments
- **Prop**: blocks characters and backgrounds

### Canvas Sizes
| Workflow | Size | Reason |
|----------|------|--------|
| Scene | 1080×704 | Story page landscape |
| Character | 832×1216 | Portrait for full body |
| Prop | 768×768 | Square for objects |
| Composed | 1080×704 | Final page |

## Model Requirements

- **Base Model**: `sd3.5_medium_incl_clips_t5xxlfp8scaled.safetensors`

### Optimal KSampler Settings (SD 3.5 Medium)
| Parameter | Recommended | Notes |
|-----------|-------------|-------|
| Steps | 30-40 | 35 is sweet spot |
| CFG | 5.0-6.0 | 5.5 recommended |
| Sampler | euler | Most reliable |
| Scheduler | sgm_uniform | Best for SD 3.5 |

### Character Consistency (Without IP-Adapter)
Since IP-Adapter is NOT available for SD 3.5 Medium, maintain character consistency by:
1. **Detailed Descriptions** - Use EXACT same character description every time
2. **Specific Colors** - Include precise colors (e.g., "royal blue eyes, cream-colored fur")
3. **Distinguishing Features** - List unique traits (e.g., "floppy left ear, pink nose")
4. **Save Good Seeds** - Reuse seeds that produce good character results
5. **Same Style** - Always use identical STYLE prompt

## How to Use in ComfyUI

1. Copy `.json` file to ComfyUI
2. Click **Load** → select workflow
3. **Find & Replace** all `{{PLACEHOLDER}}` values
4. Upload required images (for compose/inpaint)
5. Click **Queue Prompt**

