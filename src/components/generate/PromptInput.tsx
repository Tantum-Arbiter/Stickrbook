/**
 * PromptInput Component
 *
 * Text input area with prompt, negative prompt, workflow type, presets, poses, and character selector.
 * Uses extracted CSS from legacy storyboard.
 */

import { useState, useEffect, type ReactNode } from 'react';
import { useGenerationStore, useProjectsStore } from '../../store';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import type { GenerationMode, WorkflowType } from '../../store/types';
import {
  Clapperboard, User, Package, PencilLine, Palette, TreePine, Bed, Umbrella, Castle,
  Fish, Star, Flower2, Snowflake, Rabbit, Cat, Bird, Sparkles, Drama, Mouse, Baby, Bot,
  Gem, Wand2, Armchair, Cherry, Cake, Train, BookOpen, CircleDot,
  PersonStanding, Sofa, Footprints, Zap, Hand, Move, Moon, Pointer, Music, Brain, PartyPopper,
  ArrowUp, ArrowRight, ArrowDown, ArrowUpRight, UserRound, ArrowDownRight, Ruler, Eye,
  Camera, ChevronUp, ChevronDown, Frame, Maximize2, Search, Mountain, BirdIcon, Sliders,
  Sun, Sunrise, Sunset, CloudSun, CloudMoon, Cloud, CloudRain, CloudSnow, CloudFog, CloudLightning,
  Smile, Heart, Compass, Home, Theater, Rocket
} from 'lucide-react';

// Icon component type for rendering
type IconComponent = typeof Clapperboard;

// Generation mode options
const GENERATION_MODES: Array<{ value: GenerationMode; label: string; Icon: IconComponent }> = [
  { value: 'scene', label: 'Scene', Icon: Clapperboard },
  { value: 'character', label: 'Character', Icon: User },
  { value: 'object', label: 'Object', Icon: Package },
  { value: 'sketch', label: 'Sketch', Icon: PencilLine },
];

// Workflow type options (matches vanilla version)
const WORKFLOW_TYPES: Array<{ value: WorkflowType; label: string }> = [
  { value: 'full_page', label: 'Full Page (Single Pass)' },
  { value: 'ipadapter', label: 'IP-Adapter (Character Conditioned)' },
  { value: 'character_ref', label: 'Character Reference Sheet' },
  { value: 'background', label: 'Background Only' },
];

// Child-safe negative prompt to avoid inappropriate content and IP infringement
const DEFAULT_NEGATIVE_PROMPT = 'violence, weapons, scary, frightening, horror, gore, blood, injury, death, sad, crying, distressed, angry faces, dark themes, nightmare, monster, demon, evil, inappropriate, adult content, suggestive, revealing, copyrighted characters, trademarked, brand logos, Disney, Marvel, DC Comics, Pokemon, specific movie characters, celebrity likenesses, photorealistic people, realistic human faces, uncanny valley, distorted anatomy, extra limbs, deformed, ugly, low quality, blurry, watermark, text, signature';

// Storybook theme presets with appropriate negative prompts
interface StoryThemePreset {
  label: string;
  description: string;
  artStyle: string;
  negativePrompt: string;
  mood: string;
  colorPalette: string;
}

const STORYBOOK_THEMES: Record<string, StoryThemePreset> = {
  fairy_tale: {
    label: '🧚 Classic Fairy Tale',
    description: 'Whimsical watercolor style with soft colors and magical elements',
    artStyle: 'children\'s book illustration, watercolor painting, soft pastel colors, whimsical, storybook art',
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
    mood: 'magical and enchanting',
    colorPalette: 'soft pastels, gentle purples, pinks, and blues',
  },
  adventure: {
    label: '🗺️ Adventure Story',
    description: 'Vibrant and dynamic with bold colors and exciting scenes',
    artStyle: 'children\'s adventure book, vibrant colors, dynamic composition, playful illustration style',
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
    mood: 'exciting and adventurous',
    colorPalette: 'bright primary colors, bold contrasts',
  },
  educational: {
    label: '📚 Educational',
    description: 'Clear, friendly illustrations perfect for learning',
    artStyle: 'educational children\'s book, clear simple shapes, friendly illustration, bright cheerful colors',
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
    mood: 'friendly and encouraging',
    colorPalette: 'bright cheerful colors, high contrast for clarity',
  },
  bedtime: {
    label: '🌙 Bedtime Story',
    description: 'Soft, calming illustrations with gentle colors',
    artStyle: 'bedtime storybook, soft gentle illustration, dreamy atmosphere, calming colors, peaceful',
    negativePrompt: DEFAULT_NEGATIVE_PROMPT + ', bright colors, high contrast, energetic, exciting',
    mood: 'calm and peaceful',
    colorPalette: 'soft blues, gentle purples, warm creams',
  },
  nature: {
    label: '🌿 Nature & Animals',
    description: 'Natural, organic style celebrating the outdoors',
    artStyle: 'nature children\'s book, organic illustration style, natural colors, botanical art influence',
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
    mood: 'peaceful and wonder-filled',
    colorPalette: 'natural greens, earth tones, sky blues',
  },
  fantasy: {
    label: '✨ Fantasy & Magic',
    description: 'Enchanting style with sparkles and magical elements',
    artStyle: 'fantasy children\'s book, magical illustration, sparkles and glitter effects, enchanted atmosphere',
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
    mood: 'magical and wondrous',
    colorPalette: 'jewel tones, magical purples, shimmering golds',
  },
  friendship: {
    label: '💕 Friendship & Kindness',
    description: 'Warm, heartfelt illustrations emphasizing connection',
    artStyle: 'heartwarming children\'s book, warm friendly illustration, gentle expressions, cozy atmosphere',
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
    mood: 'warm and loving',
    colorPalette: 'warm oranges, soft pinks, gentle yellows',
  },
  silly_fun: {
    label: '🎉 Silly & Fun',
    description: 'Playful, energetic style with humor and movement',
    artStyle: 'playful children\'s book, energetic illustration, fun cartoonish style, dynamic movement',
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
    mood: 'playful and joyful',
    colorPalette: 'bright rainbow colors, high energy palette',
  },
};

// Scene presets (from legacy storyboard.html) - now with theme integration
const SCENE_PRESETS: Record<string, { label: string; background: string; camera: string; time: string; weather: string; space: string; mood: string; details: string; theme?: string }> = {
  forest_adventure: { label: 'Forest Adventure', background: 'enchanted forest with tall trees and dappled sunlight, winding path through ancient woods', camera: 'eye_level', time: 'golden_hour', weather: 'magical', space: 'center_open', mood: 'magical', details: 'glowing mushrooms, fireflies, mossy stones, wildflowers', theme: 'fairy_tale' },
  cozy_bedroom: { label: 'Cozy Bedroom', background: 'warm cozy bedroom with soft blankets, window seat, and soft lamplight', camera: 'medium_shot', time: 'dusk', weather: 'clear', space: 'center_open', mood: 'cozy', details: 'stuffed animals on bed, picture books, twinkling fairy lights, soft rug', theme: 'bedtime' },
  sunny_beach: { label: 'Sunny Beach', background: 'sparkling sandy beach with gentle turquoise waves and distant horizon', camera: 'wide_shot', time: 'day', weather: 'sunny', space: 'foreground_open', mood: 'happy', details: 'seashells, beach umbrella, sandcastle, palm trees', theme: 'adventure' },
  magical_castle: { label: 'Magical Castle', background: 'majestic fairy tale castle on a hill with towers and gardens', camera: 'establishing', time: 'sunset', weather: 'magical', space: 'center_open', mood: 'magical', details: 'fluttering banners, rose garden, stone bridge, stained glass windows', theme: 'fantasy' },
  underwater_world: { label: 'Underwater World', background: 'vibrant coral reef underwater kingdom with colorful coral formations', camera: 'medium_shot', time: 'day', weather: 'clear', space: 'multiple_spaces', mood: 'magical', details: 'coral formations, sea plants, bubbles, sunbeams through water', theme: 'nature' },
  starry_night: { label: 'Starry Night Sky', background: 'peaceful hilltop meadow under vast starry sky with milky way', camera: 'wide_shot', time: 'night', weather: 'clear', space: 'foreground_open', mood: 'peaceful', details: 'wildflowers, fireflies, distant mountains, shooting stars', theme: 'bedtime' },
  garden_party: { label: 'Garden Party', background: 'beautiful flower garden with white gazebo and stone pathways', camera: 'eye_level', time: 'golden_hour', weather: 'sunny', space: 'multiple_spaces', mood: 'happy', details: 'tea table setup, flower garlands, butterflies, hanging lanterns', theme: 'friendship' },
  snowy_mountain: { label: 'Snowy Mountain', background: 'snow-covered mountain meadow with frosted pine trees', camera: 'wide_shot', time: 'dawn', weather: 'snowy', space: 'center_open', mood: 'peaceful', details: 'snowflakes, icicles, frozen stream, cozy cabin in distance', theme: 'nature' },
};

// Character presets (from legacy storyboard.html)
const CHARACTER_PRESETS: Record<string, { label: string; description: string; name: string; type: string; expression: string; pose: string }> = {
  friendly_bunny: { label: 'Friendly Bunny', description: 'a soft fluffy white rabbit with long floppy ears, pink nose, and big curious eyes', name: 'Whiskers', type: 'animal', expression: 'friendly and curious', pose: 'front' },
  brave_fox: { label: 'Brave Fox', description: 'a clever orange fox with a bushy tail and bright amber eyes, wearing a small green cape', name: 'Felix', type: 'animal', expression: 'confident and adventurous', pose: 'threequarter' },
  wise_owl: { label: 'Wise Owl', description: 'a round fluffy owl with big spectacles, soft brown and cream feathers', name: 'Professor Hoot', type: 'animal', expression: 'wise and kind', pose: 'front' },
  playful_kitten: { label: 'Playful Kitten', description: 'an adorable tabby kitten with a bell collar, striped fur, and playful green eyes', name: 'Mittens', type: 'animal', expression: 'playful and mischievous', pose: 'action' },
  tiny_dragon: { label: 'Tiny Dragon', description: 'a small friendly dragon with iridescent scales, tiny wings, and a curled tail', name: 'Spark', type: 'fantasy', expression: 'excited and happy', pose: 'threequarter' },
  curious_mouse: { label: 'Curious Mouse', description: 'a tiny brown mouse with round ears, wearing a red polka-dot dress', name: 'Pip', type: 'animal', expression: 'curious and shy', pose: 'front' },
  little_explorer: { label: 'Little Explorer', description: 'a cheerful child with curly hair, freckles, wearing overalls and a backpack', name: 'Luna', type: 'human', expression: 'adventurous and determined', pose: 'threequarter' },
  friendly_robot: { label: 'Friendly Robot', description: 'a cute rounded robot with glowing blue eyes, antenna, and small wheels', name: 'Beep', type: 'robot', expression: 'helpful and cheerful', pose: 'front' },
};

// Object presets (from legacy storyboard.html)
const OBJECT_PRESETS: Record<string, { label: string; description: string; category: string; angle: string }> = {
  treasure_chest: { label: 'Treasure Chest', description: 'an ornate wooden treasure chest with golden hinges, ruby-encrusted lock, overflowing with gold coins and jewels', category: 'magical', angle: 'threequarter' },
  magic_wand: { label: 'Magic Wand', description: 'an elegant fairy wand with a star tip, trailing sparkles and magical dust', category: 'magical', angle: 'front' },
  cozy_armchair: { label: 'Cozy Armchair', description: 'a plush velvet armchair in deep purple, with tasseled cushions and carved wooden feet', category: 'furniture', angle: 'threequarter' },
  flowering_tree: { label: 'Flowering Tree', description: 'a whimsical cherry blossom tree with pink petals floating in the breeze', category: 'nature', angle: 'front' },
  birthday_cake: { label: 'Birthday Cake', description: 'a three-tier birthday cake with rainbow frosting, sprinkles, and glowing candles', category: 'food', angle: 'threequarter' },
  toy_train: { label: 'Toy Train', description: 'a colorful wooden toy train with red engine, blue carriages, and spinning wheels', category: 'toy', angle: 'side' },
  enchanted_book: { label: 'Enchanted Book', description: 'an ancient leather-bound spellbook with glowing runes, floating pages, and magical sparkles', category: 'magical', angle: 'threequarter' },
  crystal_ball: { label: 'Crystal Ball', description: 'a mystical crystal ball on an ornate bronze stand, swirling with purple mist inside', category: 'magical', angle: 'front' },
};

// Character poses (what the character is DOING)
const CHARACTER_POSES: Array<{ value: string; Icon: IconComponent; label: string }> = [
  { value: 'standing', Icon: PersonStanding, label: 'Standing' },
  { value: 'sitting', Icon: Sofa, label: 'Sitting' },
  { value: 'walking', Icon: Footprints, label: 'Walking' },
  { value: 'running', Icon: Zap, label: 'Running' },
  { value: 'waving', Icon: Hand, label: 'Waving' },
  { value: 'jumping', Icon: Move, label: 'Jumping' },
  { value: 'sleeping', Icon: Moon, label: 'Sleeping' },
  { value: 'reading', Icon: BookOpen, label: 'Reading' },
  { value: 'pointing', Icon: Pointer, label: 'Pointing' },
  { value: 'dancing', Icon: Music, label: 'Dancing' },
  { value: 'thinking', Icon: Brain, label: 'Thinking' },
  { value: 'cheering', Icon: PartyPopper, label: 'Cheering' },
];

// Character/Object view angles (orientation - how we SEE them)
const VIEW_ANGLES: Array<{ value: string; Icon: IconComponent; label: string }> = [
  { value: 'front', Icon: ArrowUp, label: 'Front View' },
  { value: 'side', Icon: ArrowRight, label: 'Side View' },
  { value: 'back', Icon: ArrowDown, label: 'Back View' },
  { value: 'threequarter', Icon: ArrowUpRight, label: '3/4 View' },
  { value: 'profile', Icon: UserRound, label: 'Profile' },
];

// Object-specific angles (includes more technical views)
const OBJECT_ANGLES: Array<{ value: string; Icon: IconComponent; label: string }> = [
  { value: 'front', Icon: ArrowUp, label: 'Front View' },
  { value: 'side', Icon: ArrowRight, label: 'Side View' },
  { value: 'back', Icon: ArrowDown, label: 'Back View' },
  { value: 'threequarter', Icon: ArrowDownRight, label: '3/4 View' },
  { value: 'topdown', Icon: ChevronDown, label: 'Top Down' },
  { value: 'isometric', Icon: Ruler, label: 'Isometric' },
  { value: 'worms_eye', Icon: Eye, label: 'Worm\'s Eye' },
];

// Scene camera angles (cinematic framing for full scenes)
const CAMERA_ANGLES: Array<{ value: string; Icon: IconComponent; label: string }> = [
  { value: 'eye_level', Icon: Eye, label: 'Eye Level (Child\'s View)' },
  { value: 'low_angle', Icon: ChevronUp, label: 'Low Angle (Looking Up)' },
  { value: 'high_angle', Icon: ChevronDown, label: 'High Angle (Looking Down)' },
  { value: 'wide_shot', Icon: Frame, label: 'Wide Shot (Full Scene)' },
  { value: 'medium_shot', Icon: Sliders, label: 'Medium Shot (Balanced)' },
  { value: 'close_up', Icon: Search, label: 'Close Up (Detail Focus)' },
  { value: 'establishing', Icon: Mountain, label: 'Establishing Shot (Big Picture)' },
  { value: 'birds_eye', Icon: BirdIcon, label: 'Bird\'s Eye View' },
  { value: 'dutch_angle', Icon: Camera, label: 'Dutch Angle (Tilted)' },
];

// Time of day options
const TIME_OF_DAY: Array<{ value: string; Icon: IconComponent; label: string }> = [
  { value: 'day', Icon: Sun, label: 'Daytime' },
  { value: 'golden_hour', Icon: Sunrise, label: 'Golden Hour' },
  { value: 'sunset', Icon: Sunset, label: 'Sunset' },
  { value: 'dusk', Icon: CloudSun, label: 'Dusk/Twilight' },
  { value: 'night', Icon: Moon, label: 'Night' },
  { value: 'dawn', Icon: Sunrise, label: 'Dawn' },
  { value: 'overcast', Icon: Cloud, label: 'Overcast/Cloudy' },
];

// Weather options
const WEATHER_OPTIONS: Array<{ value: string; Icon: IconComponent; label: string }> = [
  { value: 'clear', Icon: Sparkles, label: 'Clear & Bright' },
  { value: 'sunny', Icon: Sun, label: 'Sunny' },
  { value: 'cloudy', Icon: CloudSun, label: 'Partly Cloudy' },
  { value: 'rainy', Icon: CloudRain, label: 'Rainy' },
  { value: 'snowy', Icon: CloudSnow, label: 'Snowy' },
  { value: 'foggy', Icon: CloudFog, label: 'Misty/Foggy' },
  { value: 'magical', Icon: Sparkles, label: 'Magical Sparkles' },
  { value: 'stormy', Icon: CloudLightning, label: 'Stormy' },
];

// Mood options
const MOOD_OPTIONS: Array<{ value: string; Icon: IconComponent; label: string }> = [
  { value: 'happy', Icon: Smile, label: 'Happy & Cheerful' },
  { value: 'peaceful', Icon: Heart, label: 'Peaceful & Calm' },
  { value: 'magical', Icon: Sparkles, label: 'Magical & Wonderous' },
  { value: 'adventurous', Icon: Compass, label: 'Adventurous & Exciting' },
  { value: 'cozy', Icon: Home, label: 'Cozy & Warm' },
  { value: 'mysterious', Icon: Star, label: 'Mysterious' },
  { value: 'playful', Icon: PartyPopper, label: 'Playful & Fun' },
  { value: 'dramatic', Icon: Theater, label: 'Dramatic' },
];

export interface PromptInputProps {
  className?: string;
}

export function PromptInput({ className = '' }: PromptInputProps) {
  const {
    mode,
    workflowType,
    prompt,
    negativePrompt,
    characterId,
    ipadapterWeight,
    isGenerating,
    variationCount,
    activeJobs,
    setMode,
    setWorkflowType,
    setPrompt,
    setNegativePrompt,
    setCharacter,
    setVariationCount,
    generateVariations,
    generateMultiView,
    resetGeneratingState,
  } = useGenerationStore();

  // Fix reactivity: depend on currentBookId, not the getter function
  const currentBookId = useProjectsStore((s) => s.currentBookId);
  const currentBook = useProjectsStore((s) => {
    const project = s.currentProject();
    return project?.books.find((b) => b.id === currentBookId);
  });

  // Auto-reset isGenerating if it gets stuck (safety mechanism)
  useEffect(() => {
    if (isGenerating) {
      const timeout = setTimeout(() => {
        console.warn('isGenerating stuck for >5s, auto-resetting');
        resetGeneratingState();
      }, 5000); // 5 second timeout
      return () => clearTimeout(timeout);
    }
  }, [isGenerating, resetGeneratingState]);
  const characters = currentBook?.characters || [];

  // Local state for presets and selections
  const [selectedPoses, setSelectedPoses] = useState<string[]>(['standing']);
  const [selectedViewAngles, setSelectedViewAngles] = useState<string[]>(['front']);
  const [selectedObjectAngles, setSelectedObjectAngles] = useState<string[]>(['front']);
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [batchName, setBatchName] = useState<string>(''); // Name for the generation batch
  const [sceneSettings, setSceneSettings] = useState({
    background: '',
    camera: 'eye_level',
    time: 'day',
    weather: 'clear',
    mood: 'happy',
    details: '',
  });

  // Initialize with default negative prompt if empty
  useState(() => {
    if (!negativePrompt) {
      setNegativePrompt(DEFAULT_NEGATIVE_PROMPT);
    }
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt to generate images.');
      return;
    }

    if (!currentBook) {
      alert('Please create or select a book first before generating images.');
      return;
    }

    // Ask for a batch name to organize generations
    let finalBatchName = batchName.trim();
    if (!finalBatchName) {
      const promptText = mode === 'scene'
        ? 'Enter a name for this scene generation batch (for organization):'
        : mode === 'character'
        ? 'Enter a name for this character batch (e.g., "Hero Poses", "Villain Angles"):'
        : mode === 'object'
        ? 'Enter a name for this object batch (e.g., "Magic Items", "Weapons"):'
        : 'Enter a name for this generation batch:';

      finalBatchName = window.prompt(promptText) || '';
    }

    try {
      // For characters and objects, use multi-view generation if multiple poses/angles are selected
      if (mode === 'character' && (selectedPoses.length > 1 || selectedViewAngles.length > 1)) {
        // Generate all combinations of poses and view angles
        const viewConfigs = [];
        for (const pose of selectedPoses) {
          for (const viewAngle of selectedViewAngles) {
            const poseData = CHARACTER_POSES.find(p => p.value === pose);
            const angleData = VIEW_ANGLES.find(a => a.value === viewAngle);
            viewConfigs.push({
              pose,
              viewAngle,
              poseLabel: poseData?.label || pose,
              viewAngleLabel: angleData?.label || viewAngle,
            });
          }
        }
        await generateMultiView(viewConfigs, finalBatchName);
      } else if (mode === 'object' && selectedObjectAngles.length > 1) {
        // Generate for each object angle
        const viewConfigs = selectedObjectAngles.map(angle => {
          const angleData = OBJECT_ANGLES.find(a => a.value === angle);
          return {
            viewAngle: angle,
            viewAngleLabel: angleData?.label || angle,
          };
        });
        await generateMultiView(viewConfigs, finalBatchName);
      } else {
        // Standard single-batch generation for scenes or single pose/angle
        await generateVariations(finalBatchName);
      }

      // Clear batch name after successful generation
      setBatchName('');
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate images. Please check that the backend server is running and try again.');
    }
  };

  const handleThemeChange = (themeKey: string) => {
    if (!themeKey) {
      setSelectedTheme('');
      return;
    }
    const theme = STORYBOOK_THEMES[themeKey];
    if (!theme) return;

    setSelectedTheme(themeKey);
    // Apply theme's negative prompt
    setNegativePrompt(theme.negativePrompt);
  };

  const handleScenePresetChange = (presetKey: string) => {
    if (!presetKey) return;
    const preset = SCENE_PRESETS[presetKey];
    if (!preset) return;
    setSceneSettings({
      background: preset.background,
      camera: preset.camera,
      time: preset.time,
      weather: preset.weather,
      mood: preset.mood,
      details: preset.details,
    });

    // Apply theme if preset has one
    if (preset.theme) {
      const theme = STORYBOOK_THEMES[preset.theme];
      if (theme) {
        setSelectedTheme(preset.theme);
        // Build prompt with theme art style
        const newPrompt = `${theme.artStyle}, ${preset.background}, ${preset.details}`;
        setPrompt(newPrompt);
        setNegativePrompt(theme.negativePrompt);
        return;
      }
    }

    // Build prompt from preset without theme
    const newPrompt = `${preset.background}, ${preset.details}`;
    setPrompt(newPrompt);
    // Ensure negative prompt is set
    if (!negativePrompt) {
      setNegativePrompt(DEFAULT_NEGATIVE_PROMPT);
    }
  };

  const handleCharacterPresetChange = (presetKey: string) => {
    if (!presetKey) return;
    const preset = CHARACTER_PRESETS[presetKey];
    if (!preset) return;

    // Apply current theme's art style if selected
    const theme = selectedTheme ? STORYBOOK_THEMES[selectedTheme] : null;
    const artStylePrefix = theme ? `${theme.artStyle}, ` : '';
    const newPrompt = `${artStylePrefix}${preset.description}, ${preset.expression}, isolated on transparent background`;
    setPrompt(newPrompt);

    // Ensure negative prompt is set
    if (!negativePrompt) {
      setNegativePrompt(DEFAULT_NEGATIVE_PROMPT);
    }
  };

  const handleObjectPresetChange = (presetKey: string) => {
    if (!presetKey) return;
    const preset = OBJECT_PRESETS[presetKey];
    if (!preset) return;

    // Apply current theme's art style if selected
    const theme = selectedTheme ? STORYBOOK_THEMES[selectedTheme] : null;
    const artStylePrefix = theme ? `${theme.artStyle}, ` : '';
    const newPrompt = `${artStylePrefix}${preset.description}, isolated on transparent background`;
    setPrompt(newPrompt);

    // Ensure negative prompt is set
    if (!negativePrompt) {
      setNegativePrompt(DEFAULT_NEGATIVE_PROMPT);
    }
  };

  const togglePose = (pose: string) => {
    setSelectedPoses((prev) =>
      prev.includes(pose) ? prev.filter((p) => p !== pose) : [...prev, pose]
    );
  };

  const toggleViewAngle = (angle: string) => {
    setSelectedViewAngles((prev) =>
      prev.includes(angle) ? prev.filter((a) => a !== angle) : [...prev, angle]
    );
  };

  const toggleObjectAngle = (angle: string) => {
    setSelectedObjectAngles((prev) =>
      prev.includes(angle) ? prev.filter((a) => a !== angle) : [...prev, angle]
    );
  };

  return (
    <div className={`prompt-input ${className}`}>
      {/* Current Book Indicator */}
      {currentBook ? (
        <div className="current-book-indicator">
          <BookOpen size={14} />
          <span className="book-title">{currentBook.title}</span>
          <span className="book-badge">Active</span>
        </div>
      ) : (
        <div className="current-book-indicator no-book">
          <BookOpen size={14} />
          <span className="book-title">No book selected</span>
          <span className="book-hint">Select a book from the sidebar to start generating</span>
        </div>
      )}

      {/* Generation Mode Selector */}
      <div className="generation-modes">
        {GENERATION_MODES.map((m) => (
          <button
            key={m.value}
            className={`generation-mode ${mode === m.value ? 'active' : ''}`}
            onClick={() => setMode(m.value)}
            disabled={isGenerating}
          >
            <m.Icon size={16} />
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Storybook Theme Selector */}
      <Select
        label="📖 Storybook Theme (Art Style)"
        value={selectedTheme}
        onChange={(e) => handleThemeChange(e.target.value)}
        disabled={isGenerating}
      >
        <option value="">— Choose a theme —</option>
        {Object.entries(STORYBOOK_THEMES).map(([key, theme]) => (
          <option key={key} value={key}>{theme.label}</option>
        ))}
      </Select>

      {selectedTheme && (
        <div className="theme-info" style={{
          padding: '8px 12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem',
          marginBottom: '12px',
          color: 'var(--text)'
        }}>
          <strong style={{ color: 'var(--accent)' }}>{STORYBOOK_THEMES[selectedTheme].label}</strong>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>
            {STORYBOOK_THEMES[selectedTheme].description}
          </p>
        </div>
      )}

      {/* Workflow Type Dropdown */}
      <Select
        label="Workflow Type"
        value={workflowType}
        onChange={(e) => setWorkflowType(e.target.value as WorkflowType)}
        disabled={isGenerating}
      >
        {WORKFLOW_TYPES.map((wf) => (
          <option key={wf.value} value={wf.value}>
            {wf.label}
          </option>
        ))}
      </Select>

      {/* Variation Count Selector */}
      <div className="form-group">
        <label htmlFor="variation-count">
          {mode === 'character' || mode === 'object'
            ? 'Variations per Angle/Pose'
            : 'Number of Variations'}
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            id="variation-count"
            type="range"
            min="1"
            max="12"
            value={variationCount}
            onChange={(e) => setVariationCount(parseInt(e.target.value))}
            disabled={isGenerating}
            style={{ flex: 1 }}
          />
          <input
            type="number"
            min="1"
            max="12"
            value={variationCount}
            onChange={(e) => setVariationCount(parseInt(e.target.value) || 1)}
            disabled={isGenerating}
            style={{ width: '60px' }}
            className="input"
          />
        </div>
        <span className="input-helper">
          {mode === 'character' || mode === 'object' ? (
            <>
              Generate {variationCount} variation{variationCount !== 1 ? 's' : ''} for each selected {mode === 'character' ? 'pose/angle' : 'angle'}
              {' '}({(mode === 'character' ? selectedPoses.length * selectedViewAngles.length : selectedObjectAngles.length) * variationCount} total images)
            </>
          ) : (
            <>Generate {variationCount} variation{variationCount !== 1 ? 's' : ''} (jobs will run sequentially)</>
          )}
        </span>
      </div>

      {/* Template Guidance (mode-specific) */}
      <div className="template-guidance">
        <h4>{getGuidanceTitle(mode)}</h4>
        <p>{getGuidanceText(mode)}</p>
      </div>

      {/* === SCENE MODE === */}
      {mode === 'scene' && (
        <div className="mode-content scene-mode">
          <div className="preset-row">
            <Select
              label="Scene Preset"
              onChange={(e) => handleScenePresetChange(e.target.value)}
              disabled={isGenerating}
            >
              <option value="">— Choose a preset —</option>
              {Object.entries(SCENE_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>{preset.label}</option>
              ))}
            </Select>
            <Button
              variant="secondary"
              size="small"
              onClick={() => {
                const keys = Object.keys(SCENE_PRESETS);
                const randomKey = keys[Math.floor(Math.random() * keys.length)];
                handleScenePresetChange(randomKey);
              }}
              disabled={isGenerating}
            >
              <Sparkles size={12} /> Surprise Me
            </Button>
          </div>
          <div className="template-fields">
            <Select
              label="Camera Angle"
              value={sceneSettings.camera}
              onChange={(e) => setSceneSettings((s) => ({ ...s, camera: e.target.value }))}
              disabled={isGenerating}
            >
              {CAMERA_ANGLES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            <Select
              label="Time of Day"
              value={sceneSettings.time}
              onChange={(e) => setSceneSettings((s) => ({ ...s, time: e.target.value }))}
              disabled={isGenerating}
            >
              {TIME_OF_DAY.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            <Select
              label="Weather"
              value={sceneSettings.weather}
              onChange={(e) => setSceneSettings((s) => ({ ...s, weather: e.target.value }))}
              disabled={isGenerating}
            >
              {WEATHER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            <Select
              label="Mood"
              value={sceneSettings.mood}
              onChange={(e) => setSceneSettings((s) => ({ ...s, mood: e.target.value }))}
              disabled={isGenerating}
            >
              {MOOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {/* === CHARACTER MODE === */}
      {mode === 'character' && (
        <div className="mode-content character-mode">
          <div className="preset-row">
            <Select
              label="Character Preset"
              onChange={(e) => handleCharacterPresetChange(e.target.value)}
              disabled={isGenerating}
            >
              <option value="">— Choose a preset —</option>
              {Object.entries(CHARACTER_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>{preset.label}</option>
              ))}
            </Select>
            <Button
              variant="secondary"
              size="small"
              onClick={() => {
                const keys = Object.keys(CHARACTER_PRESETS);
                const randomKey = keys[Math.floor(Math.random() * keys.length)];
                handleCharacterPresetChange(randomKey);
              }}
              disabled={isGenerating}
            >
              <Sparkles size={12} /> Surprise Me
            </Button>
          </div>

          {/* Pose & Angle Selection - Grouped for clarity */}
          <div style={{
            border: '2px solid var(--border-color)',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: 'var(--bg-tertiary)',
            marginTop: '12px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Pose & Angle Combinations
              </h4>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--accent-color)',
                backgroundColor: 'var(--accent-bg)',
                padding: '4px 8px',
                borderRadius: '4px'
              }}>
                {selectedPoses.length} × {selectedViewAngles.length} = {selectedPoses.length * selectedViewAngles.length} rows
              </span>
            </div>

            {/* Pose Selection Grid - What the character is DOING */}
            <div className="pose-selection-section">
              <label className="pose-grid-label">Select Poses (What they're doing)</label>
              <div className="pose-grid">
                {CHARACTER_POSES.map((pose) => (
                  <div
                    key={pose.value}
                    className={`pose-option ${selectedPoses.includes(pose.value) ? 'selected' : ''}`}
                    onClick={() => togglePose(pose.value)}
                  >
                    <div className="pose-icon"><pose.Icon size={16} /></div>
                    <span>{pose.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* View Angle Selection Grid - How we SEE the character */}
            <div className="angle-selection-section" style={{ marginTop: '12px' }}>
              <label className="pose-grid-label">Select View Angles (How we see them)</label>
              <div className="pose-grid">
                {VIEW_ANGLES.map((angle) => (
                  <div
                    key={angle.value}
                    className={`pose-option ${selectedViewAngles.includes(angle.value) ? 'selected' : ''}`}
                    onClick={() => toggleViewAngle(angle.value)}
                  >
                    <div className="pose-icon"><angle.Icon size={16} /></div>
                    <span>{angle.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="pose-hint" style={{ marginTop: '12px', marginBottom: 0 }}>
              Each pose + angle combination creates a separate row with {variationCount} variation{variationCount !== 1 ? 's' : ''} each.
              Total: <strong>{selectedPoses.length * selectedViewAngles.length * variationCount} images</strong>
            </p>
          </div>
        </div>
      )}

      {/* === OBJECT MODE === */}
      {mode === 'object' && (
        <div className="mode-content object-mode">
          <div className="preset-row">
            <Select
              label="Object Preset"
              onChange={(e) => handleObjectPresetChange(e.target.value)}
              disabled={isGenerating}
            >
              <option value="">— Choose a preset —</option>
              {Object.entries(OBJECT_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>{preset.label}</option>
              ))}
            </Select>
            <Button
              variant="secondary"
              size="small"
              onClick={() => {
                const keys = Object.keys(OBJECT_PRESETS);
                const randomKey = keys[Math.floor(Math.random() * keys.length)];
                handleObjectPresetChange(randomKey);
              }}
              disabled={isGenerating}
            >
              <Sparkles size={12} /> Surprise Me
            </Button>
          </div>

          {/* Object Angle Selection - Grouped for clarity */}
          <div style={{
            border: '2px solid var(--border-color)',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: 'var(--bg-tertiary)',
            marginTop: '12px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Object View Angles
              </h4>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--accent-color)',
                backgroundColor: 'var(--accent-bg)',
                padding: '4px 8px',
                borderRadius: '4px'
              }}>
                {selectedObjectAngles.length} angle{selectedObjectAngles.length !== 1 ? 's' : ''} selected
              </span>
            </div>

            <div className="angle-selection-section">
              <label className="pose-grid-label">Select View Angles</label>
              <div className="pose-grid">
                {OBJECT_ANGLES.map((angle) => (
                  <div
                    key={angle.value}
                    className={`pose-option ${selectedObjectAngles.includes(angle.value) ? 'selected' : ''}`}
                    onClick={() => toggleObjectAngle(angle.value)}
                  >
                    <div className="pose-icon"><angle.Icon size={16} /></div>
                    <span>{angle.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="pose-hint" style={{ marginTop: '12px', marginBottom: 0 }}>
              Each angle creates a separate row with {variationCount} variation{variationCount !== 1 ? 's' : ''} each.
              Total: <strong>{selectedObjectAngles.length * variationCount} images</strong>
            </p>
          </div>
        </div>
      )}

      {/* Prompt Input */}
      <Textarea
        label="Prompt"
        placeholder="Describe the scene you want to generate..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
        disabled={isGenerating}
      />

      {/* Negative Prompt */}
      <Textarea
        label="Negative Prompt"
        placeholder="Elements to avoid..."
        value={negativePrompt}
        onChange={(e) => setNegativePrompt(e.target.value)}
        rows={2}
        disabled={isGenerating}
      />

      {/* Character Reference Section (shown for IP-Adapter workflow or scene/character modes) */}
      {(workflowType === 'ipadapter' || ((mode === 'scene' || mode === 'character') && characters.length > 0)) && (
        <div className="character-reference">
          <h4 className="char-ref-title"><Drama size={14} /> Character Reference</h4>

          {characters.length > 0 && (
            <Select
              label="Select Character"
              value={characterId || ''}
              onChange={(e) => setCharacter(e.target.value || null)}
              disabled={isGenerating}
            >
              <option value="">None (or upload below)</option>
              {characters.map((char) => (
                <option key={char.id} value={char.id}>
                  {char.name}
                </option>
              ))}
            </Select>
          )}

          {/* IP-Adapter Weight (always show when workflow is ipadapter or when character is selected) */}
          {(workflowType === 'ipadapter' || characterId) && (
            <div className="ipadapter-weight">
              <label>IP-Adapter Weight</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ipadapterWeight}
                onChange={(e) => setCharacter(characterId, parseFloat(e.target.value))}
                disabled={isGenerating}
              />
              <span>{ipadapterWeight.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* Batch Name Input (for scenes) */}
      {mode === 'scene' && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: 'calc(var(--font-size-sm) * 1.05)',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            marginBottom: '8px'
          }}>
            Batch Name (optional - helps organize multiple scene generations)
          </label>
          <input
            type="text"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            placeholder="e.g., 'Forest Adventure', 'Beach Scenes', 'Castle Interior'"
            disabled={isGenerating}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 'calc(var(--font-size-md) * 0.95)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      )}

      {/* Generate Button */}
      <Button
        variant="primary"
        size="large"
        className={`auto-gen-btn ${isGenerating ? 'loading' : ''}`}
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        loading={isGenerating}
      >
        {isGenerating ? (
          'Submitting...'
        ) : activeJobs.length > 0 ? (
          <><Rocket size={14} /> Generate More ({activeJobs.length} in queue)</>
        ) : (
          <><Rocket size={14} /> Generate Variations</>
        )}
      </Button>
    </div>
  );
}

// Helper functions for mode-specific guidance
function getGuidanceTitle(mode: GenerationMode): string {
  switch (mode) {
    case 'scene': return 'Scene Generation';
    case 'character': return 'Character Generation';
    case 'object': return 'Object Generation';
    case 'sketch': return 'Sketch Mode';
    default: return 'Generation';
  }
}

function getGuidanceText(mode: GenerationMode): string {
  switch (mode) {
    case 'scene':
      return 'Generate full scenes with backgrounds and characters. Use character references for consistency.';
    case 'character':
      return 'Generate isolated characters on transparent backgrounds. Perfect for creating reusable assets.';
    case 'object':
      return 'Generate objects and props on transparent backgrounds. Useful for scene composition.';
    case 'sketch':
      return 'Generate sketch-style illustrations. Great for storyboard planning and rough layouts.';
    default:
      return 'Enter a prompt and generate variations.';
  }
}

