#!/usr/bin/env python3
"""
Stickrbook Story Generator - Automated Image Generation CLI

Generates high-quality children's storybook images across multiple art styles:
- Watercolour
- Oil Painting
- Digital Cartoon
- Julia Donaldson Style (Gruffalo)
- Sketch

Usage:
    python scripts/story_generator.py --style watercolour --count 5
    python scripts/story_generator.py --style all --count 5
    python scripts/story_generator.py --theme forest-adventure --style oil-painting
"""

import argparse
import asyncio
import json
import random
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import aiohttp
import base64
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn
from rich.table import Table
from rich.panel import Panel

# Initialize Rich console for beautiful output
console = Console()

# ============================================================
# Configuration
# ============================================================

API_BASE_URL = "http://localhost:8000"
OUTPUT_DIR = Path("generated_stories")

# ============================================================
# Art Style Definitions
# ============================================================

ART_STYLES = {
    "watercolour": {
        "name": "Watercolour",
        "style_prompt": "soft watercolor painting, gentle washes, flowing colors, paper texture, delicate brushstrokes, translucent layers, artistic blending, children's book illustration",
        "negative": "digital, sharp edges, harsh lines, photorealistic, 3D render, oil painting, acrylic",
        "cfg": 5.5,
        "steps": 35,
    },
    "oil-painting": {
        "name": "Oil Painting",
        "style_prompt": "rich oil painting, thick impasto brushstrokes, vibrant colors, textured canvas, classical painting technique, artistic masterpiece, children's storybook art",
        "negative": "watercolor, digital art, flat colors, photograph, 3D render, sketch",
        "cfg": 6.0,
        "steps": 40,
    },
    "digital-cartoon": {
        "name": "Digital Cartoon",
        "style_prompt": "vibrant digital cartoon illustration, bold colors, clean lines, modern children's book style, playful character design, smooth gradients, professional digital art",
        "negative": "realistic, photograph, watercolor, oil painting, sketch, messy, blurry",
        "cfg": 5.0,
        "steps": 30,
    },
    "donaldson": {
        "name": "Julia Donaldson Style (Gruffalo)",
        "style_prompt": "whimsical storybook illustration in the style of Axel Scheffler, charming character design, expressive faces, detailed forest scenes, warm earthy colors, classic children's book art, Gruffalo style",
        "negative": "realistic, photograph, digital cartoon, anime, manga, dark, scary",
        "cfg": 5.5,
        "steps": 35,
    },
    "sketch": {
        "name": "Pencil Sketch",
        "style_prompt": "detailed pencil sketch, hand-drawn illustration, graphite shading, artistic linework, children's book concept art, expressive sketching, traditional drawing",
        "negative": "colored, painted, digital, photorealistic, 3D render, messy, rough",
        "cfg": 5.0,
        "steps": 30,
    },
}

# ============================================================
# Story Content Library
# ============================================================

STORY_THEMES = {
    "forest-adventure": {
        "name": "Forest Adventure",
        "scenes": [
            "A magical forest clearing with dappled sunlight filtering through ancient oak trees, mushrooms and wildflowers carpeting the ground",
            "A cozy woodland cottage with a thatched roof, smoke curling from the chimney, surrounded by berry bushes",
            "A babbling brook winding through mossy rocks, with a small wooden bridge crossing over it",
            "A mysterious cave entrance hidden behind a waterfall, with glowing crystals visible inside",
            "A towering tree with a door carved into its trunk, spiral staircase visible inside leading upward",
        ],
        "characters": [
            "A friendly fox with bright orange fur, intelligent amber eyes, wearing a small green vest and carrying a leather satchel",
            "A wise old owl with speckled brown feathers, large round spectacles perched on her beak, sitting on a gnarled branch",
            "A cheerful hedgehog with soft brown spines, rosy cheeks, wearing a blue scarf and carrying a tiny lantern",
            "A mischievous squirrel with a bushy tail, bright eyes, holding an acorn, wearing a red cap",
            "A gentle deer with dappled coat, kind eyes, flowers woven into her antlers, standing gracefully",
        ],
        "objects": [
            "A magical glowing acorn that radiates soft golden light, resting on a bed of moss",
            "An ancient leather-bound book with golden clasps, pages filled with mysterious symbols and maps",
            "A small wooden treasure chest overflowing with colorful gems and golden coins",
            "A delicate glass bottle containing swirling rainbow-colored mist, cork stopper with wax seal",
            "A rustic woven basket filled with wild berries, mushrooms, and forest herbs",
        ],
    },
    "ocean-voyage": {
        "name": "Ocean Voyage",
        "scenes": [
            "A vast turquoise ocean with gentle waves, a distant island with palm trees on the horizon, seagulls soaring overhead",
            "An old wooden sailing ship with billowing white sails, colorful flags, and a crow's nest, floating on calm waters",
            "An underwater coral reef teeming with colorful fish, swaying seaweed, and mysterious rock formations",
            "A sandy beach with seashells scattered about, tide pools reflecting the sky, driftwood and beach grass",
            "A lighthouse standing tall on rocky cliffs, beam of light cutting through evening mist, waves crashing below",
        ],
        "characters": [
            "A brave young sailor mouse with a striped shirt, captain's hat, telescope in hand, standing confidently",
            "A friendly dolphin with sleek gray skin, playful smile, leaping gracefully through ocean waves",
            "A wise old sea turtle with a weathered shell covered in barnacles, kind ancient eyes, swimming slowly",
            "A colorful parrot with vibrant red, blue, and yellow feathers, perched on a ship's railing, wings spread",
            "A cheerful crab with bright red shell, one claw raised in greeting, scuttling along the beach",
        ],
        "objects": [
            "An antique brass compass with intricate engravings, needle pointing north, resting on a nautical map",
            "A glass bottle with a rolled parchment message inside, cork sealed with red wax, floating in water",
            "A wooden ship's wheel with brass fittings, worn from years of use, mounted on deck",
            "A treasure map on aged parchment, marked with an X, coffee-stained edges, compass rose in corner",
            "A diving helmet made of brass and glass, with round portholes, sitting on a wooden dock",
        ],
    },
    "mountain-quest": {
        "name": "Mountain Quest",
        "scenes": [
            "Snow-capped mountain peaks piercing through clouds, eagles soaring in the clear blue sky above",
            "A winding mountain path with stone steps, prayer flags fluttering in the wind, wildflowers along the edges",
            "A cozy mountain cabin with smoke rising from chimney, surrounded by pine trees and snow patches",
            "A crystal-clear mountain lake reflecting the peaks, surrounded by smooth stones and alpine flowers",
            "A mysterious cave entrance in the mountainside, icicles hanging from the opening, soft glow from within",
        ],
        "characters": [
            "A determined mountain goat with white fluffy coat, curved horns, sure-footed stance on rocky ledge",
            "A friendly yeti with soft white fur, gentle smile, carrying a walking stick made from a tree branch",
            "A brave mountain climber rabbit wearing a red jacket, backpack, and climbing gear, looking upward",
            "A wise eagle with golden-brown feathers, piercing eyes, perched majestically on a rocky outcrop",
            "A playful marmot with brown fur, standing on hind legs, whiskers twitching, holding a wildflower",
        ],
        "objects": [
            "A sturdy wooden walking stick with carved patterns, leather strap, metal tip for ice",
            "A warm woolen blanket with traditional mountain patterns, folded neatly, vibrant colors",
            "A metal camping lantern with warm glowing light inside, handle for carrying, sitting on a rock",
            "A leather-bound journal with sketches of mountains, pressed flowers between pages, pencil attached",
            "A rope coiled neatly with climbing carabiners attached, well-worn from adventures, resting on stone",
        ],
    },
    "garden-magic": {
        "name": "Garden Magic",
        "scenes": [
            "A vibrant flower garden bursting with roses, tulips, and daisies, butterflies dancing in the air",
            "A secret garden behind an ivy-covered stone wall, with a rusty iron gate slightly ajar",
            "A vegetable patch with neat rows of carrots, tomatoes, and lettuce, scarecrow standing guard",
            "A greenhouse with glass panels, exotic plants inside, watering can and gardening tools nearby",
            "A fairy ring of mushrooms in a moonlit garden, fireflies glowing softly, magical atmosphere",
        ],
        "characters": [
            "A hardworking bee with fuzzy yellow and black stripes, tiny pollen baskets on legs, hovering near flowers",
            "A gentle ladybug with bright red shell and black spots, delicate wings, crawling on a leaf",
            "A curious caterpillar with green segmented body, tiny feet, munching on a cabbage leaf",
            "A graceful butterfly with iridescent blue wings, delicate antennae, resting on a sunflower",
            "A friendly garden gnome with white beard, red pointed hat, blue jacket, holding a tiny shovel",
        ],
        "objects": [
            "A rustic watering can made of copper, aged patina, long spout, sitting among flower pots",
            "A pair of well-worn gardening gloves with floral pattern, dirt-stained, resting on a wooden bench",
            "A woven wicker basket filled with freshly picked vegetables and flowers, handle wrapped in ribbon",
            "A small hand trowel with wooden handle, metal blade, stuck in rich dark soil",
            "A terracotta flower pot with hand-painted designs, filled with blooming geraniums",
        ],
    },
}

# ============================================================
# API Client
# ============================================================

class StickrbookAPI:
    """Client for Stickrbook API"""

    def __init__(self, base_url: str = API_BASE_URL):
        self.base_url = base_url
        self.session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def create_book(self, title: str, description: str, preset: str = "friendly-dragon") -> Dict:
        """Create a new book"""
        async with self.session.post(
            f"{self.base_url}/v1/storyboard/books",
            json={
                "title": title,
                "description": description,
                "preset_name": preset,
            }
        ) as resp:
            resp.raise_for_status()
            return await resp.json()

    async def generate_variations(
        self,
        book_id: str,
        prompt: str,
        style_config: Dict,
        generation_mode: str = "scene",
        width: int = 1080,
        height: int = 704,
        num_variations: int = 1,
    ) -> Dict:
        """Generate image variations"""

        # Build full prompt with style
        full_prompt = f"{prompt}, {style_config['style_prompt']}"
        negative_prompt = f"{style_config['negative']}, low quality, blurry, distorted, deformed, ugly, bad anatomy"

        async with self.session.post(
            f"{self.base_url}/v1/storyboard/books/{book_id}/pages/1/variations",
            json={
                "prompt": full_prompt,
                "negative_prompt": negative_prompt,
                "generation_mode": generation_mode,
                "width": width,
                "height": height,
                "num_variations": num_variations,
                "preset_override": {
                    "cfg": style_config["cfg"],
                    "steps": style_config["steps"],
                }
            }
        ) as resp:
            resp.raise_for_status()
            return await resp.json()

    async def get_job_status(self, job_id: str) -> Dict:
        """Get job status"""
        async with self.session.get(f"{self.base_url}/v1/jobs/{job_id}") as resp:
            resp.raise_for_status()
            return await resp.json()

    async def wait_for_job(self, job_id: str, timeout: int = 300) -> Dict:
        """Wait for job to complete"""
        start_time = time.time()

        while time.time() - start_time < timeout:
            status = await self.get_job_status(job_id)

            if status["status"] in ["completed", "complete"]:
                return status
            elif status["status"] == "failed":
                raise Exception(f"Job failed: {status.get('error_message', 'Unknown error')}")

            await asyncio.sleep(2)

        raise TimeoutError(f"Job {job_id} timed out after {timeout}s")

    async def download_image(self, url: str, output_path: Path):
        """Download image from URL"""
        async with self.session.get(url) as resp:
            resp.raise_for_status()
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'wb') as f:
                f.write(await resp.read())


# ============================================================
# Generation Logic
# ============================================================

async def generate_story_images(
    theme: str,
    styles: List[str],
    count_per_category: int = 5,
    output_dir: Path = OUTPUT_DIR,
):
    """Generate story images for a theme across multiple styles"""

    if theme not in STORY_THEMES:
        console.print(f"[red]Error: Theme '{theme}' not found[/red]")
        console.print(f"Available themes: {', '.join(STORY_THEMES.keys())}")
        return

    theme_data = STORY_THEMES[theme]
    console.print(Panel(f"[bold cyan]Generating Story: {theme_data['name']}[/bold cyan]"))

    # Create output directory
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    session_dir = output_dir / f"{theme}_{timestamp}"
    session_dir.mkdir(parents=True, exist_ok=True)

    # Save generation manifest
    manifest = {
        "theme": theme,
        "theme_name": theme_data["name"],
        "styles": styles,
        "count_per_category": count_per_category,
        "timestamp": timestamp,
        "generated_images": [],
    }

    async with StickrbookAPI() as api:
        # Create a book for this generation session
        book = await api.create_book(
            title=f"{theme_data['name']} - {timestamp}",
            description=f"Auto-generated story images for {theme_data['name']}",
        )
        book_id = book["id"]
        console.print(f"[green]✓[/green] Created book: {book_id}")

        # Generate images for each style
        for style_key in styles:
            if style_key not in ART_STYLES:
                console.print(f"[yellow]Warning: Style '{style_key}' not found, skipping[/yellow]")
                continue

            style_config = ART_STYLES[style_key]
            style_dir = session_dir / style_key
            style_dir.mkdir(exist_ok=True)

            console.print(f"\n[bold magenta]Style: {style_config['name']}[/bold magenta]")

            # Generate for each category
            categories = [
                ("scenes", theme_data["scenes"], "scene", 1080, 704),
                ("characters", theme_data["characters"], "character", 832, 1216),
                ("objects", theme_data["objects"], "object", 832, 1216),
            ]

            for category_name, prompts, gen_mode, width, height in categories:
                category_dir = style_dir / category_name
                category_dir.mkdir(exist_ok=True)

                console.print(f"\n  [cyan]Category: {category_name.title()}[/cyan]")

                # Randomly select prompts
                selected_prompts = random.sample(prompts, min(count_per_category, len(prompts)))

                with Progress(
                    SpinnerColumn(),
                    TextColumn("[progress.description]{task.description}"),
                    BarColumn(),
                    TaskProgressColumn(),
                    console=console,
                ) as progress:
                    task = progress.add_task(
                        f"Generating {category_name}...",
                        total=len(selected_prompts)
                    )

                    for idx, prompt in enumerate(selected_prompts, 1):
                        try:
                            # Submit generation job
                            result = await api.generate_variations(
                                book_id=book_id,
                                prompt=prompt,
                                style_config=style_config,
                                generation_mode=gen_mode,
                                width=width,
                                height=height,
                                num_variations=1,
                            )

                            job_id = result["job_ids"][0]

                            # Wait for completion
                            job_status = await api.wait_for_job(job_id)

                            # Download image
                            if job_status.get("outputs"):
                                output = job_status["outputs"][0]
                                download_url = f"{api.base_url}{output['download_url']}"

                                filename = f"{category_name}_{idx:02d}_{style_key}.png"
                                output_path = category_dir / filename

                                await api.download_image(download_url, output_path)

                                # Add to manifest
                                manifest["generated_images"].append({
                                    "style": style_key,
                                    "category": category_name,
                                    "prompt": prompt,
                                    "filename": str(output_path.relative_to(session_dir)),
                                    "job_id": job_id,
                                })

                                console.print(f"    [green]✓[/green] {filename}")

                            progress.update(task, advance=1)

                        except Exception as e:
                            console.print(f"    [red]✗[/red] Failed: {str(e)}")
                            progress.update(task, advance=1)
                            continue

    # Save manifest
    manifest_path = session_dir / "manifest.json"
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)

    # Print summary
    console.print("\n" + "="*60)
    console.print(Panel(
        f"[bold green]Generation Complete![/bold green]\n\n"
        f"Theme: {theme_data['name']}\n"
        f"Styles: {len(styles)}\n"
        f"Images: {len(manifest['generated_images'])}\n"
        f"Output: {session_dir}",
        title="Summary"
    ))

    # Create summary table
    table = Table(title="Generated Images by Style and Category")
    table.add_column("Style", style="cyan")
    table.add_column("Scenes", justify="right", style="green")
    table.add_column("Characters", justify="right", style="yellow")
    table.add_column("Objects", justify="right", style="magenta")
    table.add_column("Total", justify="right", style="bold")

    for style_key in styles:
        if style_key not in ART_STYLES:
            continue

        style_images = [img for img in manifest["generated_images"] if img["style"] == style_key]
        scenes = len([img for img in style_images if img["category"] == "scenes"])
        characters = len([img for img in style_images if img["category"] == "characters"])
        objects = len([img for img in style_images if img["category"] == "objects"])
        total = len(style_images)

        table.add_row(
            ART_STYLES[style_key]["name"],
            str(scenes),
            str(characters),
            str(objects),
            str(total),
        )

    console.print(table)


# ============================================================
# CLI Interface
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description="Stickrbook Story Generator - Automated Image Generation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate 5 images per category in watercolour style
  python scripts/story_generator.py --style watercolour --count 5

  # Generate images in all styles
  python scripts/story_generator.py --style all --count 5

  # Generate for specific theme
  python scripts/story_generator.py --theme ocean-voyage --style oil-painting

  # Generate multiple styles
  python scripts/story_generator.py --style watercolour oil-painting digital-cartoon
        """
    )

    parser.add_argument(
        "--theme",
        type=str,
        default="forest-adventure",
        choices=list(STORY_THEMES.keys()),
        help="Story theme to generate (default: forest-adventure)"
    )

    parser.add_argument(
        "--style",
        type=str,
        nargs="+",
        default=["watercolour"],
        help="Art style(s) to use. Use 'all' for all styles. (default: watercolour)"
    )

    parser.add_argument(
        "--count",
        type=int,
        default=5,
        help="Number of images per category (scenes/characters/objects) (default: 5)"
    )

    parser.add_argument(
        "--output",
        type=Path,
        default=OUTPUT_DIR,
        help=f"Output directory (default: {OUTPUT_DIR})"
    )

    parser.add_argument(
        "--list-themes",
        action="store_true",
        help="List available themes and exit"
    )

    parser.add_argument(
        "--list-styles",
        action="store_true",
        help="List available art styles and exit"
    )

    args = parser.parse_args()

    # List themes
    if args.list_themes:
        console.print("[bold cyan]Available Themes:[/bold cyan]\n")
        for key, theme in STORY_THEMES.items():
            console.print(f"  [green]{key}[/green]: {theme['name']}")
            console.print(f"    - {len(theme['scenes'])} scenes")
            console.print(f"    - {len(theme['characters'])} characters")
            console.print(f"    - {len(theme['objects'])} objects\n")
        return

    # List styles
    if args.list_styles:
        console.print("[bold cyan]Available Art Styles:[/bold cyan]\n")
        for key, style in ART_STYLES.items():
            console.print(f"  [green]{key}[/green]: {style['name']}")
            console.print(f"    CFG: {style['cfg']}, Steps: {style['steps']}\n")
        return

    # Parse styles
    styles = args.style
    if "all" in styles:
        styles = list(ART_STYLES.keys())

    # Validate styles
    invalid_styles = [s for s in styles if s not in ART_STYLES]
    if invalid_styles:
        console.print(f"[red]Error: Invalid style(s): {', '.join(invalid_styles)}[/red]")
        console.print(f"Available styles: {', '.join(ART_STYLES.keys())}")
        sys.exit(1)

    # Run generation
    try:
        asyncio.run(generate_story_images(
            theme=args.theme,
            styles=styles,
            count_per_category=args.count,
            output_dir=args.output,
        ))
    except KeyboardInterrupt:
        console.print("\n[yellow]Generation cancelled by user[/yellow]")
        sys.exit(1)
    except Exception as e:
        console.print(f"\n[red]Error: {str(e)}[/red]")
        sys.exit(1)


if __name__ == "__main__":
    main()

