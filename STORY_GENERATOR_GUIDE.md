# 🎨 Stickrbook Story Generator - Complete Guide

## Overview

The **Stickrbook Story Generator** is a powerful command-line automation tool that generates high-quality children's storybook images across multiple art styles and themes. It fills out all UI elements programmatically and generates batches of images automatically.

## ✨ Features

### 🎨 5 Professional Art Styles

1. **Watercolour** - Soft washes, flowing colors, paper texture, delicate brushstrokes
2. **Oil Painting** - Thick impasto, vibrant colors, textured canvas, classical technique
3. **Digital Cartoon** - Bold colors, clean lines, modern style, smooth gradients
4. **Julia Donaldson Style (Gruffalo)** - Whimsical Axel Scheffler style, charming characters
5. **Pencil Sketch** - Detailed pencil, hand-drawn, graphite shading, artistic linework

### 📚 4 Rich Story Themes

Each theme includes **5 scenes**, **5 characters**, and **5 objects** with expertly crafted prompts:

1. **Forest Adventure** - Magical forests, woodland creatures, mystical objects
2. **Ocean Voyage** - Sailing ships, sea life, nautical items
3. **Mountain Quest** - Alpine peaks, mountain animals, climbing gear
4. **Garden Magic** - Enchanted gardens, insects, gardening tools

### 🎯 3 Image Categories

- **Scenes** (1080x704) - Backgrounds and environments
- **Characters** (832x1216) - Isolated characters on transparent background
- **Objects** (832x1216) - Props and items

## 🚀 Quick Start

### Installation

```bash
# Install Python dependencies
pip install -r scripts/requirements.txt

# Make shell script executable (Mac/Linux)
chmod +x scripts/generate_story.sh
```

### Basic Usage

**Windows:**
```cmd
REM Generate 5 watercolour images
scripts\generate_story.bat watercolour 5

REM Generate all styles
scripts\generate_story.bat all 5
```

**Mac/Linux:**
```bash
# Generate 5 watercolour images
./scripts/generate_story.sh watercolour 5

# Generate all styles
./scripts/generate_story.sh all 5
```

**Direct Python:**
```bash
# Generate 5 watercolour images
python scripts/story_generator.py --style watercolour --count 5

# Generate all 5 styles
python scripts/story_generator.py --style all --count 5

# Generate specific styles
python scripts/story_generator.py --style watercolour oil-painting donaldson --count 5

# Generate for specific theme
python scripts/story_generator.py --theme ocean-voyage --style all --count 5
```

## 📖 Detailed Examples

### Example 1: Complete Story Set

Generate a complete set of images for the forest adventure theme:

```bash
python scripts/story_generator.py --theme forest-adventure --style all --count 5
```

**Output:**
- 5 scenes × 5 styles = **25 scene images**
- 5 characters × 5 styles = **25 character images**
- 5 objects × 5 styles = **25 object images**
- **Total: 75 high-quality images**

### Example 2: Compare Art Styles

Generate the same content in different styles to compare:

```bash
python scripts/story_generator.py --style watercolour oil-painting digital-cartoon --count 3
```

### Example 3: Focus on One Style

Perfect for creating a consistent storybook:

```bash
python scripts/story_generator.py --theme garden-magic --style donaldson --count 5
```

### Example 4: Quick Test

Test the setup with minimal generation:

```bash
python scripts/story_generator.py --style watercolour --count 2
```

## 📋 Command-Line Options

```
--theme THEME         Story theme to generate
                      Choices: forest-adventure, ocean-voyage, 
                               mountain-quest, garden-magic
                      Default: forest-adventure

--style STYLE [...]   Art style(s) to use
                      Choices: watercolour, oil-painting, digital-cartoon,
                               donaldson, sketch, all
                      Default: watercolour

--count COUNT         Number of images per category (scenes/characters/objects)
                      Default: 5

--output OUTPUT       Output directory
                      Default: generated_stories

--list-themes         List available themes and exit

--list-styles         List available art styles and exit
```

## 📁 Output Structure

```
generated_stories/
└── forest-adventure_20260319_143022/
    ├── manifest.json              # Complete metadata
    ├── watercolour/
    │   ├── scenes/
    │   │   ├── scenes_01_watercolour.png
    │   │   ├── scenes_02_watercolour.png
    │   │   ├── scenes_03_watercolour.png
    │   │   ├── scenes_04_watercolour.png
    │   │   └── scenes_05_watercolour.png
    │   ├── characters/
    │   │   ├── characters_01_watercolour.png
    │   │   └── ...
    │   └── objects/
    │       ├── objects_01_watercolour.png
    │       └── ...
    ├── oil-painting/
    │   ├── scenes/
    │   ├── characters/
    │   └── objects/
    ├── digital-cartoon/
    │   └── ...
    ├── donaldson/
    │   └── ...
    └── sketch/
        └── ...
```

### Manifest File

The `manifest.json` contains complete metadata:

```json
{
  "theme": "forest-adventure",
  "theme_name": "Forest Adventure",
  "styles": ["watercolour", "oil-painting"],
  "count_per_category": 5,
  "timestamp": "20260319_143022",
  "generated_images": [
    {
      "style": "watercolour",
      "category": "scenes",
      "prompt": "A magical forest clearing with dappled sunlight...",
      "filename": "watercolour/scenes/scenes_01_watercolour.png",
      "job_id": "jr_01HQXXX..."
    }
  ]
}
```

## 🎨 Sample Prompts

The script uses high-quality, detailed prompts optimized for each art style:

### Scene Example (Watercolour)
```
A magical forest clearing with dappled sunlight filtering through ancient oak trees, 
mushrooms and wildflowers carpeting the ground, soft watercolor painting, gentle washes, 
flowing colors, paper texture, delicate brushstrokes, translucent layers, artistic blending, 
children's book illustration
```

### Character Example (Oil Painting)
```
A friendly fox with bright orange fur, intelligent amber eyes, wearing a small green vest 
and carrying a leather satchel, rich oil painting, thick impasto brushstrokes, vibrant colors, 
textured canvas, classical painting technique, artistic masterpiece, children's storybook art
```

### Object Example (Digital Cartoon)
```
A magical glowing acorn that radiates soft golden light, resting on a bed of moss,
vibrant digital cartoon illustration, bold colors, clean lines, modern children's book style,
playful design, smooth gradients, professional digital art
```

## 🎯 Story Theme Details

### Forest Adventure
**Scenes:**
- Magical forest clearing with dappled sunlight
- Cozy woodland cottage with thatched roof
- Babbling brook with stepping stones
- Mysterious cave entrance with glowing crystals
- Ancient tree with a door in its trunk

**Characters:**
- Friendly fox with bright orange fur
- Wise old owl with spectacles
- Cheerful hedgehog with tiny backpack
- Mischievous squirrel gathering acorns
- Gentle deer with flower crown

**Objects:**
- Magical glowing acorn
- Ancient leather-bound book
- Wooden treasure chest
- Glass bottle with rainbow mist
- Woven basket with forest herbs

### Ocean Voyage
**Scenes:**
- Vast turquoise ocean with distant island
- Old wooden sailing ship
- Underwater coral reef
- Sandy beach with seashells
- Lighthouse on rocky cliffs

**Characters:**
- Brave sailor mouse with captain's hat
- Friendly dolphin leaping through waves
- Wise sea turtle with barnacled shell
- Colorful parrot with spread wings
- Cheerful crab with raised claw

**Objects:**
- Antique brass compass
- Message in a bottle
- Wooden ship's wheel
- Treasure map on aged parchment
- Brass diving helmet

### Mountain Quest
**Scenes:**
- Snow-capped mountain peaks
- Winding mountain path with prayer flags
- Cozy mountain cabin
- Crystal-clear mountain lake
- Mysterious cave entrance

**Characters:**
- Determined mountain goat
- Friendly yeti with walking stick
- Brave climber rabbit
- Wise eagle on rocky outcrop
- Playful marmot with wildflower

**Objects:**
- Sturdy wooden walking stick
- Warm woolen blanket
- Metal camping lantern
- Leather-bound mountain journal
- Climbing rope with carabiners

### Garden Magic
**Scenes:**
- Vibrant flower garden
- Secret garden behind ivy wall
- Vegetable patch with scarecrow
- Greenhouse with exotic plants
- Fairy ring of mushrooms

**Characters:**
- Hardworking bee with pollen baskets
- Gentle ladybug on a leaf
- Curious caterpillar munching cabbage
- Graceful butterfly with blue wings
- Friendly garden gnome

**Objects:**
- Rustic copper watering can
- Floral gardening gloves
- Wicker basket with vegetables
- Small hand trowel
- Terracotta flower pot

## 💡 Pro Tips

1. **Start Small**: Test with `--count 2` before large batches
2. **One Style at a Time**: Faster iteration and easier review
3. **Monitor Progress**: Watch the beautiful progress bars in real-time
4. **Review Manifest**: Check prompts and metadata in `manifest.json`
5. **GPU Memory**: Large batches take time - be patient!
6. **Backend First**: Always ensure backend is running before starting

## 🔧 Troubleshooting

### Connection Errors
**Problem**: `Connection refused` or `Cannot connect to backend`

**Solution**:
- Ensure backend is running: `http://localhost:8000`
- Test with: `curl http://localhost:8000/health`
- Start backend from the backend directory

### Timeout Errors
**Problem**: `Job timeout after 300s`

**Solution**:
- Normal for first generation (model loading)
- Subsequent generations are much faster
- Increase timeout in script if needed (edit `wait_for_job` timeout)

### Module Not Found
**Problem**: `ModuleNotFoundError: No module named 'aiohttp'`

**Solution**:
```bash
pip install -r scripts/requirements.txt
```

### Permission Denied (Mac/Linux)
**Problem**: `Permission denied: ./scripts/generate_story.sh`

**Solution**:
```bash
chmod +x scripts/generate_story.sh
```

## 📊 Performance

- **First Generation**: ~30-60s (model loading)
- **Subsequent Generations**: ~10-20s per image
- **Batch of 75 images** (all styles, 5 each): ~20-30 minutes
- **GPU**: GTX 3080 10GB recommended
- **Parallel Processing**: Jobs are processed sequentially to avoid GPU memory issues

## 🎨 Customization

### Adding New Themes

Edit `scripts/story_generator.py` and add to `STORY_THEMES`:

```python
"my-theme": {
    "name": "My Theme",
    "scenes": [
        "Scene prompt 1",
        "Scene prompt 2",
        # ... 3 more
    ],
    "characters": [
        "Character prompt 1",
        # ... 4 more
    ],
    "objects": [
        "Object prompt 1",
        # ... 4 more
    ],
}
```

### Modifying Art Styles

Edit `ART_STYLES` in `scripts/story_generator.py`:

```python
"my-style": {
    "name": "My Style",
    "style_prompt": "my custom style, artistic technique, visual characteristics",
    "negative": "things to avoid",
    "cfg": 7.0,
    "steps": 30,
}
```

## 📚 Files Reference

- **`scripts/story_generator.py`** - Main CLI tool (577 lines)
- **`scripts/requirements.txt`** - Python dependencies
- **`scripts/README.md`** - Comprehensive documentation
- **`scripts/QUICK_START.md`** - Quick start guide
- **`scripts/generate_story.bat`** - Windows wrapper
- **`scripts/generate_story.sh`** - Mac/Linux wrapper
- **`STORY_GENERATOR_GUIDE.md`** - This guide

## 🚀 Next Steps

1. **Install dependencies**: `pip install -r scripts/requirements.txt`
2. **Start backend**: Ensure it's running on `http://localhost:8000`
3. **Test generation**: `python scripts/story_generator.py --style watercolour --count 2`
4. **Review output**: Check `generated_stories/` directory
5. **Scale up**: Generate full sets with `--style all --count 5`
6. **Use in projects**: Import images into your storybook projects

## 🎉 Success!

You now have a powerful automation tool that can generate hundreds of high-quality storybook images with a single command!

**Example Full Generation:**
```bash
# Generate complete storybook asset library
python scripts/story_generator.py --theme forest-adventure --style all --count 5
```

This creates **75 professional images** ready for your children's storybook projects! 🎨📚✨

---

**Happy Generating!** 🚀

For questions or issues, check the troubleshooting section or review the detailed README.md.

