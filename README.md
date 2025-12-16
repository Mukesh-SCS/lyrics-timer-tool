# Lyrics Capture Tool 🎵

The fastest, safest, keyboard-first lyrics timing tool on the web.

## What it does

- Load an MP3 or audio file from your device
- Play the song in the built-in player
- Type lyrics as they play
- Press **Enter** to capture timestamp
- Export JSON, LRC, or SRT for any platform

## Why this exists

Subtitle editors and DAW lyric tools are overkill. This tool is pure speed.

**A full song can be timed in one pass. No mouse required.**

## Features

**Keyboard-First Design**
- ⌨️ Type, press Enter, done
- No mouse needed (works on mobile too)
- Full keyboard navigation

**Blind Mode** 🎯
- Hide lyrics while capturing
- Focus only on timing
- Perfect for beat/karaoke timing

**Timing Confidence**
- Delta time shows: `(Δ +3.4s)` since last line
- Timestamp badge with micro-feedback
- Click timestamp to play/pause
- Click to edit or seek to any line

**Nudge Timing**
- `Alt+←` = -0.1s
- `Alt+→` = +0.1s
- Adjust timing without re-doing work

**Multi-Format Export**
- 📋 **JSON** - For apps and developers
- 🎤 **LRC** - Standard lyrics format
- 🎬 **SRT** - For video subtitles
- One-click copy, never lose work

**Smart Safeguards**
- ↶ Undo with `Ctrl+Z`
- Confirmation before clear
- No accidental data loss

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Capture lyric at current time |
| `Space` | Play/pause audio |
| `Ctrl+Z` | Undo last capture |
| `Alt+←` | Nudge time -0.1s (edit mode) |
| `Alt+→` | Nudge time +0.1s (edit mode) |
| Click lyric | Edit text or seek audio |
| Click time | Play/pause |

### Development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

### Build

```bash
npm run build
```

Creates optimized `dist/` folder for deployment.

## Usage

1. Load an audio file (MP3, WAV, etc.)
2. Click play
3. Type lyrics and press **Enter** after each line
4. Click **Copy JSON** to export
5. Paste into your project

## Output Format

```json
[
  {
    "time": 0.5,
    "text": "First line of lyrics"
  },
  {
    "time": 2.3,
    "text": "Second line of lyrics"
  }
]
```

## Project Structure

```
lyrics-capture-tool/
├─ src/
│   ├─ style.css
│   └─ script.js
├─ public/
├─ index.html
├─ package.json
├─ vite.config.js
└─ README.md
```

## License

MIT - See [LICENSE](LICENSE)
Author - @ Mukesh Mani 