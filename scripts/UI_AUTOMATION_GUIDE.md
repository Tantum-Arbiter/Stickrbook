# UI Automation Guide - Stickrbook Testing

Automate the Stickrbook frontend UI using Playwright to test real user workflows.

## 🎯 Purpose

This automation simulates a real user interacting with the UI to:
- **Test the full workflow** from project creation to asset generation
- **Generate test data** through the actual interface
- **Catch UI bugs** that API testing might miss
- **Demonstrate the app** in action
- **Regression testing** after UI changes

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
# Install Playwright
pip install -r scripts/requirements-ui-automation.txt

# Install browser drivers (only needed once)
playwright install chromium
```

### Step 2: Start Services

**IMPORTANT:** Make sure all services are running before starting automation!

```bash
# 1. Start ComfyUI on your host machine
# Open a terminal and navigate to your ComfyUI directory, then:
python main.py

# 2. Start Docker containers (in a separate terminal)
cd /Users/lco47/Workspace/Stickrbook
docker-compose up -d

# 3. Verify services are running
docker-compose ps  # Should show backend and frontend as "Up"
curl http://localhost:5173  # Should return HTML
curl http://localhost:8000/v1/health  # Should return {"status":"healthy"}
```

### Step 3: Run Automation

```bash
# Run with visible browser (watch it work!) - RECOMMENDED for first time
python scripts/ui_automation.py

# Run in headless mode (no browser window)
python scripts/ui_automation.py --headless

# Run at full speed (no slow-mo)
python scripts/ui_automation.py --fast

# Custom project and book names
python scripts/ui_automation.py --project "My Storybook" --book "Chapter 1"
```

## 📋 What It Does

The automation script will:

1. ✅ Open browser to `http://localhost:5173`
2. ✅ Create a new project ("Test Storybook")
3. ✅ Create a new book ("My First Story")
4. ✅ Generate a **scene** (forest clearing) with 4 variations
5. ✅ Save the first variation as "Forest Clearing"
6. ✅ Generate a **character** (friendly fox) with 4 variations
7. ✅ Save the first variation as "Friendly Fox"
8. ✅ Generate an **object** (magic acorn) with 4 variations
9. ✅ Save the first variation as "Magic Acorn"

**Total time:** ~5-10 minutes (depending on ComfyUI generation speed)

You can watch the browser automate all these steps in real-time!

## 🎨 Customizing the Automation

Edit `scripts/ui_automation.py` to customize what gets generated:

```python
# Generate a character instead of a scene
await automation.generate_asset(
    asset_type="character",
    prompt="A friendly fox wearing a green vest",
    count=4
)

# Generate an object
await automation.generate_asset(
    asset_type="object",
    prompt="A magical glowing acorn",
    count=4
)

# Generate multiple assets in sequence
for prompt in ["Forest clearing", "Mountain path", "Ocean beach"]:
    await automation.generate_asset(
        asset_type="scene",
        prompt=prompt,
        count=4
    )
    await automation.save_variation(index=0)
```

## 🔧 Advanced Usage

### Run Multiple Test Scenarios

Create different test scenarios:

```python
# Test watercolour style
await automation.create_book("Watercolour Book", preset="watercolour")
await automation.generate_asset("scene", "Forest scene")

# Test oil painting style
await automation.create_book("Oil Painting Book", preset="oil-painting")
await automation.generate_asset("character", "Friendly dragon")
```

### Test Error Handling

```python
# Test with empty prompt
await automation.generate_asset("scene", "")

# Test with very long prompt
await automation.generate_asset("scene", "A" * 1000)
```

### Screenshot on Failure

```python
try:
    await automation.generate_asset("scene", "Test scene")
except Exception as e:
    await automation.page.screenshot(path="error.png")
    raise
```

## 📊 Comparison: UI Automation vs API Automation

| Feature | UI Automation | API Automation |
|---------|---------------|----------------|
| **Speed** | Slower (waits for UI) | Faster (direct API calls) |
| **Testing Coverage** | Tests full UI workflow | Tests backend only |
| **Visibility** | Watch it work in browser | No visual feedback |
| **Reliability** | Can break if UI changes | More stable |
| **Use Case** | E2E testing, demos | Bulk generation, CI/CD |

## 🎬 Example: Full Storybook Generation

```python
async def generate_full_storybook():
    async with StickrbookUIAutomation(headless=False, slow_mo=300) as automation:
        await automation.navigate_to_app()
        
        # Create project
        await automation.create_project("The Gruffalo Style Book")
        
        # Create book
        await automation.create_book("Chapter 1", preset="donaldson")
        
        # Generate 3 scenes
        scenes = [
            "A deep dark forest with tall trees",
            "A cozy mouse house in a tree trunk",
            "A clearing with a log and mushrooms"
        ]
        for i, scene in enumerate(scenes):
            await automation.generate_asset("scene", scene)
            await automation.save_variation(0, f"Scene {i+1}")
        
        # Generate 2 characters
        characters = [
            "A small brown mouse with big eyes",
            "A friendly fox with orange fur"
        ]
        for i, char in enumerate(characters):
            await automation.generate_asset("character", char)
            await automation.save_variation(0, f"Character {i+1}")
        
        logger.info("✅ Full storybook generated!")
```

## 🐛 Troubleshooting

**Browser doesn't open:**
```bash
# Reinstall browser drivers
playwright install chromium --force
```

**Timeout errors:**
```python
# Increase timeout for slow generations
TIMEOUT = 120000  # 2 minutes
```

**Element not found:**
```python
# Add debug screenshots
await automation.page.screenshot(path="debug.png")

# Print page content
print(await automation.page.content())
```

**Frontend not responding:**
```bash
# Check if frontend is running
docker-compose logs frontend

# Restart services
docker-compose restart frontend
```

## 📝 Best Practices

1. **Start with visible browser** (`--headless` off) to debug
2. **Use slow-mo** to watch what's happening
3. **Add waits** for dynamic content
4. **Take screenshots** at key steps
5. **Handle errors gracefully** with try/catch
6. **Clean up test data** after runs

## 🎯 Next Steps

- Add more test scenarios
- Integrate with pytest for automated testing
- Add assertions to verify results
- Create CI/CD pipeline with headless mode
- Generate test reports

Happy testing! 🚀

