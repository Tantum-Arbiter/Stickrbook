# Quick Start Guide - Story Generator

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies

**Windows:**
```cmd
pip install -r scripts\requirements.txt
```

**Mac/Linux:**
```bash
pip3 install -r scripts/requirements.txt
```

### Step 2: Start the Backend

Make sure your Stickrbook backend is running on `http://localhost:8000`

### Step 3: Generate Images!

**Windows:**
```cmd
REM Generate 5 watercolour images
scripts\generate_story.bat watercolour 5

REM Generate all styles
scripts\generate_story.bat all 5

REM Generate oil paintings for ocean theme
scripts\generate_story.bat oil-painting 5 ocean-voyage
```

**Mac/Linux:**
```bash
# Generate 5 watercolour images
./scripts/generate_story.sh watercolour 5

# Generate all styles
./scripts/generate_story.sh all 5

# Generate oil paintings for ocean theme
./scripts/generate_story.sh oil-painting 5 ocean-voyage
```

**Direct Python:**
```bash
# Generate 5 watercolour images
python scripts/story_generator.py --style watercolour --count 5

# Generate all styles
python scripts/story_generator.py --style all --count 5

# Generate multiple specific styles
python scripts/story_generator.py --style watercolour oil-painting donaldson --count 5

# Generate for specific theme
python scripts/story_generator.py --theme ocean-voyage --style all --count 5
```

## 📋 Available Options

### Art Styles
- `watercolour` - Soft watercolor painting
- `oil-painting` - Rich oil painting with thick brushstrokes
- `digital-cartoon` - Vibrant digital cartoon illustration
- `donaldson` - Julia Donaldson/Gruffalo style
- `sketch` - Detailed pencil sketch
- `all` - Generate in all 5 styles

### Themes
- `forest-adventure` - Magical forest with woodland creatures
- `ocean-voyage` - Sailing adventures and sea life
- `mountain-quest` - Mountain climbing and alpine scenes
- `garden-magic` - Enchanted gardens and insects

### Categories (Auto-generated)
Each theme includes:
- **Scenes** (1080x704) - Backgrounds and environments
- **Characters** (832x1216) - Isolated characters on transparent background
- **Objects** (832x1216) - Props and items

## 📊 What Gets Generated

For each style, the script randomly selects and generates:
- 5 scene/background images
- 5 character images
- 5 object images

**Example with all styles:**
- 5 scenes × 5 styles = 25 scene images
- 5 characters × 5 styles = 25 character images  
- 5 objects × 5 styles = 25 object images
- **Total: 75 images**

## 📁 Output Structure

```
generated_stories/
└── forest-adventure_20260319_143022/
    ├── manifest.json              # Metadata for all images
    ├── watercolour/
    │   ├── scenes/
    │   │   ├── scenes_01_watercolour.png
    │   │   ├── scenes_02_watercolour.png
    │   │   └── ...
    │   ├── characters/
    │   │   └── ...
    │   └── objects/
    │       └── ...
    ├── oil-painting/
    │   └── ...
    ├── digital-cartoon/
    │   └── ...
    ├── donaldson/
    │   └── ...
    └── sketch/
        └── ...
```

## 💡 Pro Tips

1. **Start Small**: Test with `--count 2` first
   ```bash
   python scripts/story_generator.py --style watercolour --count 2
   ```

2. **One Style at a Time**: For faster iteration
   ```bash
   python scripts/story_generator.py --style watercolour --count 5
   ```

3. **Check Progress**: The script shows real-time progress bars

4. **Review Manifest**: Check `manifest.json` for all prompts and metadata

5. **GPU Memory**: Large batches take time - be patient!

## 🎨 Example Prompts

The script uses high-quality, detailed prompts like:

**Scene:**
> "A magical forest clearing with dappled sunlight filtering through ancient oak trees, mushrooms and wildflowers carpeting the ground, soft watercolor painting, gentle washes, flowing colors, paper texture"

**Character:**
> "A friendly fox with bright orange fur, intelligent amber eyes, wearing a small green vest and carrying a leather satchel, rich oil painting, thick impasto brushstrokes, vibrant colors"

**Object:**
> "A magical glowing acorn that radiates soft golden light, resting on a bed of moss, vibrant digital cartoon illustration, bold colors, clean lines"

## 🔧 Troubleshooting

**"Connection refused"**
- Make sure the backend is running on http://localhost:8000
- Check with: `curl http://localhost:8000/health`

**"Job timeout"**
- Normal for first generation (model loading)
- Subsequent generations are faster
- Increase timeout in script if needed

**"Module not found"**
- Install dependencies: `pip install -r scripts/requirements.txt`

**"Permission denied" (Mac/Linux)**
- Make script executable: `chmod +x scripts/generate_story.sh`

## 🎯 Common Use Cases

### Create a Complete Storybook Set
```bash
# Generate all styles for forest adventure
python scripts/story_generator.py --theme forest-adventure --style all --count 5
```

### Test Different Styles
```bash
# Compare watercolour vs oil painting
python scripts/story_generator.py --style watercolour oil-painting --count 3
```

### Focus on Characters
```bash
# Generate just characters (modify script to skip scenes/objects)
python scripts/story_generator.py --style donaldson --count 10
```

### Build a Theme Collection
```bash
# Generate all themes in watercolour
for theme in forest-adventure ocean-voyage mountain-quest garden-magic; do
    python scripts/story_generator.py --theme $theme --style watercolour --count 5
done
```

## 📖 Next Steps

1. Review generated images in `generated_stories/`
2. Check `manifest.json` for prompts and metadata
3. Use images in your storybook projects
4. Experiment with different themes and styles
5. Customize prompts in `story_generator.py` for your needs

Happy generating! 🎨✨

