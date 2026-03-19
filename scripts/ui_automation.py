"""
UI Automation for Stickrbook - Browser-based Testing

Automates the frontend UI using Playwright to test the full user workflow:
- Create projects and books
- Generate characters, objects, and scenes
- Save assets to the library

This simulates real user interactions for testing purposes.
"""

import asyncio
import argparse
import sys
from pathlib import Path
from playwright.async_api import async_playwright, Page, expect
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
FRONTEND_URL = "http://localhost:5173"
TIMEOUT = 60000  # 60 seconds for generation to complete


class StickrbookUIAutomation:
    """Automates Stickrbook UI for testing"""

    def __init__(self, headless: bool = False, slow_mo: int = 500):
        self.headless = headless
        self.slow_mo = slow_mo  # Slow down actions so you can see them
        self.page: Page = None

    async def __aenter__(self):
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=self.headless,
            slow_mo=self.slow_mo
        )
        self.context = await self.browser.new_context(
            viewport={"width": 1920, "height": 1080}
        )
        self.page = await self.context.new_page()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.context.close()
        await self.browser.close()
        await self.playwright.stop()

    async def navigate_to_app(self):
        """Navigate to the Stickrbook frontend"""
        logger.info(f"🌐 Navigating to {FRONTEND_URL}")
        await self.page.goto(FRONTEND_URL)
        await self.page.wait_for_load_state("networkidle")
        logger.info("✓ App loaded")

    async def create_project(self, name: str, description: str = "") -> str:
        """Create a new project"""
        logger.info(f"📁 Creating project: {name}")

        # Debug: Take screenshot before clicking
        await self.page.screenshot(path="debug_before_click.png")
        logger.info("Screenshot saved: debug_before_click.png")

        # Debug: Print all buttons on the page
        buttons = await self.page.query_selector_all('button')
        logger.info(f"Found {len(buttons)} buttons on page")
        for i, btn in enumerate(buttons[:10]):  # First 10 buttons
            text = await btn.inner_text()
            logger.info(f"  Button {i}: '{text}'")

        # Set up dialog handler BEFORE clicking (SidebarContent.tsx line 76)
        async def handle_dialog(dialog):
            logger.info(f"Dialog appeared with message: {dialog.message}")
            await dialog.accept(name)

        self.page.on("dialog", handle_dialog)

        # Click the "+ New" button in the Projects section (SidebarContent.tsx line 148)
        logger.info("Attempting to click '+ New' button...")
        await self.page.click('button:has-text("+ New")', timeout=10000)

        # Wait for project to appear in the list
        await self.page.wait_for_selector(f'.project-item:has-text("{name}"), .project-header:has-text("{name}")', timeout=10000)

        # Remove dialog handler
        self.page.remove_listener("dialog", handle_dialog)

        logger.info(f"✓ Project created: {name}")

        return name

    async def create_book(self, title: str) -> str:
        """Create a new book in the current project using the prompt dialog"""
        logger.info(f"📖 Creating book: {title}")

        # Set up dialog handler BEFORE clicking (ProjectTree.tsx line 96)
        async def handle_dialog(dialog):
            await dialog.accept(title)

        self.page.on("dialog", handle_dialog)

        # Click "New Book" button (based on ProjectTree.tsx line 163)
        await self.page.click('button.book-add-btn:has-text("New Book")')

        # Wait for the book to appear in the project tree
        await self.page.wait_for_selector(f'.book-item:has-text("{title}")', timeout=10000)

        # Click on the book to select it
        await self.page.click(f'.book-item:has-text("{title}")')

        # Remove dialog handler
        self.page.remove_listener("dialog", handle_dialog)

        logger.info(f"✓ Book created and selected: {title}")

        return title

    async def generate_asset(
        self,
        asset_type: str,  # "scene", "character", or "object"
        prompt: str,
        batch_name: str = "",
        count: int = 4
    ):
        """Generate an asset (scene, character, or object)"""
        logger.info(f"🎨 Generating {asset_type}: {prompt}")

        # Select generation mode (based on PromptInput.tsx mode buttons)
        mode_map = {
            "scene": "Scene",
            "character": "Character",
            "object": "Object"
        }

        # Click the mode button
        logger.info(f"Selecting {mode_map[asset_type]} mode...")
        await self.page.click(f'.mode-btn:has-text("{mode_map[asset_type]}"), button:has-text("{mode_map[asset_type]}")')

        # Wait a moment for mode to switch
        await self.page.wait_for_timeout(1000)

        # Enter prompt in the textarea
        logger.info(f"Entering prompt: {prompt}")
        await self.page.fill('textarea.prompt-input, textarea[placeholder*="describe" i]', prompt)

        # Set variation count if there's a number input
        try:
            await self.page.fill('input[type="number"]', str(count), timeout=2000)
            logger.info(f"Set variation count to {count}")
        except:
            logger.info("No variation count input found, using default")

        # Set up dialog handler BEFORE clicking Generate (PromptInput.tsx line 333)
        async def handle_dialog(dialog):
            logger.info(f"Batch name dialog appeared: {dialog.message}")
            await dialog.accept(batch_name if batch_name else "")

        self.page.on("dialog", handle_dialog)

        # Click Generate button (based on PromptInput.tsx line 948-963)
        logger.info("Clicking Generate button...")
        await self.page.click('button.auto-gen-btn:has-text("Generate"), button:has-text("Generate Variations")')

        # Wait a moment for the request to be sent
        await self.page.wait_for_timeout(2000)
        logger.info(f"⏳ Generation submitted, waiting for results (up to {TIMEOUT/1000} seconds)...")

        # Wait for generation to complete (variations appear in grid)
        # Don't wait for "Submitting" state as it might be too fast
        await self.page.wait_for_selector('.variation-card, .variation-item, img[src*="job"], img[src*="output"]', timeout=TIMEOUT)

        # Remove dialog handler
        self.page.remove_listener("dialog", handle_dialog)

        logger.info(f"✓ Generation complete!")

    async def save_variation(self, index: int = 0, name: str = None):
        """Save a generated variation to the asset library"""
        logger.info(f"💾 Saving variation {index}")

        # Find all variation cards
        variations = await self.page.query_selector_all('.variation-card, .variation-item')

        if index >= len(variations):
            logger.error(f"Variation index {index} out of range (found {len(variations)} variations)")
            return

        # Click on the variation to select it
        await variations[index].click()

        # Wait for variation to be selected
        await self.page.wait_for_timeout(500)

        # Click Save button (based on GeneratePanel.tsx)
        await self.page.click('button:has-text("Save"), .save-btn')

        # If there's a name input dialog, fill it
        if name:
            try:
                await self.page.fill('input[placeholder*="name" i]', name, timeout=2000)
                await self.page.click('button:has-text("Confirm"), button:has-text("Save")')
            except:
                logger.info("No name input found, using default name")

        # Wait for save to complete
        await self.page.wait_for_timeout(1000)
        logger.info(f"✓ Variation saved")


async def main():
    parser = argparse.ArgumentParser(description="Automate Stickrbook UI for testing")
    parser.add_argument("--headless", action="store_true", help="Run browser in headless mode")
    parser.add_argument("--fast", action="store_true", help="Run at full speed (no slow-mo)")
    parser.add_argument("--project", default="Test Storybook", help="Project name")
    parser.add_argument("--book", default="My First Story", help="Book title")
    args = parser.parse_args()

    slow_mo = 0 if args.fast else 500

    async with StickrbookUIAutomation(headless=args.headless, slow_mo=slow_mo) as automation:
        try:
            # Navigate to app
            await automation.navigate_to_app()

            # Create a test project
            await automation.create_project(
                name=args.project,
                description="Automated test project for UI testing"
            )

            # Create a book
            await automation.create_book(title=args.book)

            # Generate a scene
            await automation.generate_asset(
                asset_type="scene",
                prompt="A magical forest clearing with sunlight filtering through trees",
                batch_name="Forest Scenes",
                count=4
            )

            # Save the first variation
            await automation.save_variation(index=0, name="Forest Clearing")

            # Generate a character
            await automation.generate_asset(
                asset_type="character",
                prompt="A friendly fox wearing a green vest and brown boots",
                batch_name="Main Characters",
                count=4
            )

            # Save the first character variation
            await automation.save_variation(index=0, name="Friendly Fox")

            # Generate an object
            await automation.generate_asset(
                asset_type="object",
                prompt="A magical glowing acorn with sparkles",
                batch_name="Magic Items",
                count=4
            )

            # Save the first object variation
            await automation.save_variation(index=0, name="Magic Acorn")

            logger.info("🎉 Automation complete! Check the UI to see your generated assets.")

        except Exception as e:
            logger.error(f"❌ Automation failed: {e}")
            # Take a screenshot for debugging
            try:
                await automation.page.screenshot(path="automation_error.png", full_page=True)
                logger.info("Screenshot saved to automation_error.png")

                # Also save the HTML for debugging
                html = await automation.page.content()
                with open("automation_error.html", "w", encoding="utf-8") as f:
                    f.write(html)
                logger.info("HTML saved to automation_error.html")
            except:
                pass
            raise


if __name__ == "__main__":
    asyncio.run(main())

