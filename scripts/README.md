# Stickrbook Story Generator

Automated CLI tool for generating high-quality children's storybook images across multiple art styles.

## Features

- **5 Art Styles**: Watercolour, Oil Painting, Digital Cartoon, Julia Donaldson Style (Gruffalo), Pencil Sketch
- **4 Story Themes**: Forest Adventure, Ocean Voyage, Mountain Quest, Garden Magic
- **3 Categories**: Scenes/Backgrounds, Characters, Objects
- **Automated Generation**: Randomly selects and generates images with progress tracking
- **Beautiful CLI**: Rich terminal UI with progress bars and summaries

## Installation

1. **Install Python dependencies**:
```bash
pip install -r scripts/requirements.txt
```

2. **Ensure backend is running**:
```bash
# The backend must be running on http://localhost:8000
# Start it from the backend directory
```

## Usage

### Basic Usage

Generate 5 images per category in watercolour style:
```bash
python scripts/story_generator.py --style watercolour --count 5
```

### Generate All Styles

Generate images in all 5 art styles:
```bash
python scripts/story_generator.py --style all --count 5
```

### Specific Theme

Generate for a specific story theme:
```bash
python scripts/story_generator.py --theme ocean-voyage --style oil-painting --count 5
```

### Multiple Styles

Generate in multiple specific styles:
```bash
python scripts/story_generator.py --style watercolour oil-painting digital-cartoon --count 5
```

### List Available Options

List all available themes:
```bash
python scripts/story_generator.py --list-themes
```

List all available art styles:
```bash
python scripts/story_generator.py --list-styles
```

## Command-Line Options

```
--theme THEME         Story theme to generate (default: forest-adventure)
                      Choices: forest-adventure, ocean-voyage, mountain-quest, garden-magic

--style STYLE [...]   Art style(s) to use. Use 'all' for all styles.
                      Choices: watercolour, oil-painting, digital-cartoon, donaldson, sketch

--count COUNT         Number of images per category (default: 5)

--output OUTPUT       Output directory (default: generated_stories)

--list-themes         List available themes and exit

--list-styles         List available art styles and exit
```

## Art Styles

### 1. Watercolour
Soft watercolor painting with gentle washes, flowing colors, paper texture, and delicate brushstrokes.

### 2. Oil Painting
Rich oil painting with thick impasto brushstrokes, vibrant colors, and textured canvas.

### 3. Digital Cartoon
Vibrant digital cartoon illustration with bold colors, clean lines, and modern children's book style.

### 4. Julia Donaldson Style (Gruffalo)
Whimsical storybook illustration in the style of Axel Scheffler with charming character design and expressive faces.

### 5. Pencil Sketch
Detailed pencil sketch with hand-drawn illustration, graphite shading, and artistic linework.

## Story Themes

### Forest Adventure
- **Scenes**: Magical forest clearings, woodland cottages, babbling brooks, mysterious caves, towering trees
- **Characters**: Friendly fox, wise owl, cheerful hedgehog, mischievous squirrel, gentle deer
- **Objects**: Glowing acorns, ancient books, treasure chests, magical bottles, woven baskets

### Ocean Voyage
- **Scenes**: Vast oceans, sailing ships, coral reefs, sandy beaches, lighthouses
- **Characters**: Sailor mouse, friendly dolphin, wise sea turtle, colorful parrot, cheerful crab
- **Objects**: Brass compass, message in bottle, ship's wheel, treasure map, diving helmet

### Mountain Quest
- **Scenes**: Snow-capped peaks, mountain paths, cozy cabins, crystal lakes, mysterious caves
- **Characters**: Mountain goat, friendly yeti, climber rabbit, wise eagle, playful marmot
- **Objects**: Walking stick, woolen blanket, camping lantern, mountain journal, climbing rope

### Garden Magic
- **Scenes**: Flower gardens, secret gardens, vegetable patches, greenhouses, fairy rings
- **Characters**: Hardworking bee, gentle ladybug, curious caterpillar, graceful butterfly, garden gnome
- **Objects**: Watering can, gardening gloves, wicker basket, hand trowel, terracotta pot

## Output Structure

Generated images are organized in the following structure:

```
generated_stories/
└── forest-adventure_20260319_143022/
    ├── manifest.json
    ├── watercolour/
    │   ├── scenes/
    │   │   ├── scenes_01_watercolour.png
    │   │   ├── scenes_02_watercolour.png
    │   │   └── ...
    │   ├── characters/
    │   │   ├── characters_01_watercolour.png
    │   │   └── ...
    │   └── objects/
    │       ├── objects_01_watercolour.png
    │       └── ...
    ├── oil-painting/
    │   └── ...
    └── ...
```

The `manifest.json` file contains metadata about all generated images including prompts, job IDs, and file paths.

## Examples

### Generate a Complete Story Set

Generate 5 images per category across all styles for the forest adventure theme:
```bash
python scripts/story_generator.py --theme forest-adventure --style all --count 5
```

This will generate:
- 5 scenes × 5 styles = 25 scene images
- 5 characters × 5 styles = 25 character images
- 5 objects × 5 styles = 25 object images
- **Total: 75 images**

### Quick Test

Generate just 2 images per category in watercolour:
```bash
python scripts/story_generator.py --style watercolour --count 2
```

## Tips

1. **Start Small**: Begin with `--count 2` to test the setup before generating large batches
2. **Monitor Progress**: The script shows real-time progress with spinners and progress bars
3. **Check Output**: Review the `manifest.json` file to see all generated images and their prompts
4. **Backend Required**: Ensure the Stickrbook backend is running before starting generation
5. **GPU Memory**: Large batches may take time depending on your GPU; be patient!

## Troubleshooting

**Connection Error**: Ensure the backend is running on `http://localhost:8000`

**Timeout Error**: Increase the timeout in the script or reduce the number of concurrent generations

**Out of Memory**: Reduce `--count` or generate one style at a time

## License

Part of the Stickrbook project.

