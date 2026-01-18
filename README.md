# 🏂 Snowboard Game (Phaser + Next.js)

A 2D infinite-slope snowboarding prototype built with **Phaser 3** and **Next.js (TypeScript)**. The game includes carving, airtime, trick spins, obstacles, scoring, and a crash overlay UI with restart/menu buttons.

---

## 🎯 Project Highlights

- Built a **2D snowboarding game prototype** using `Phaser 3` and `TypeScript`
- Implemented **carving movement** with smooth acceleration + tilt feedback
- Added **jump pads** that launch the player into airtime and boost forward speed
- Implemented **air tricks**
  - Spin while airborne (`A` / `D`)
  - Trick scoring based on rotation degrees
  - Crash detection for bad landings (too much rotation on landing)
- Added **random obstacle spawning** (collision → crash)
- Created a scoring system tracking:
  - Score
  - Distance traveled
  - Airtime
  - Trick points
- Crash overlay UI:
  - Game pauses on crash
  - Displays final score and distance
  - Restart + Main Menu buttons
  - Hover animations + click sound feedback (no audio files needed)

---

## 🎮 Controls

| Key | Action |
|---|---|
| ← / → | Carve left / right |
| ↑ | Hop (only while grounded) |
| A / D | Spin while airborne |
| Restart Button | Restart after crash |
| Main Menu Button | Return to homepage |

---

## 🏗️ Tech Stack

- Next.js (App Router)
- TypeScript
- Phaser 3
- Vercel (deployment/hosting)

---

## 📁 Project Structure

src/
  app/
    page.tsx              # homepage
    game/
      page.tsx            # game page + Phaser canvas
  game/
    game.ts               # Phaser config + bootstrapping
    scenes/
      BootScene.ts
      GameScene.ts
    objects/
      Player.ts
    systems/
      ScoreSystem.ts
public/
  assets/

## Setup & Installation

Requirements:
- Node.js 18+
- npm

1. Clone the repo
git clone <your-repo-url>
cd snowboard-game

2) Install dependencies
npm install

## Run the Server (Local Development)

Start the development server:

npm run dev


## Open in browser:

http://localhost:3000

## Current Features

- Infinite slope scrolling
- Carving movement
- Jump pads + airtime scoring
- Trick spins + trick scoring
- Obstacles + crash detection
- Crash overlay pause screen
- Restart + Main Menu buttons
- Hover animations + click sound effects

## Next Steps (Ideas)

- Rails + grinding mechanics

- Combo multiplier system

- More realistic terrain/slope generation

- Touch controls for mobile

- Leaderboard system (Vercel API routes + DB)

- Art sprites, animations, sound effects

## Acknowledgements

Built using:

Phaser 3

Next.js

TypeScript