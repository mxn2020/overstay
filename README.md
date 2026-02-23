# 🕐 Overstay

> **"We know you're not leaving."**

Overstay is a nightlife prediction app that uses AI to analyze your night-out photos and predict how long you'll *actually* stay — exposing the universal lie: **"One last drink."**

Upload a photo → Get a savage, funny, and eerily accurate prediction about your night.

---

## 🎯 What It Does

1. **Upload a photo** — bar selfie, table of drinks, group shot, dim neon lighting
2. **AI analyzes the vibe** — lighting, crowd, drinks, chaos signals
3. **Get your prediction** — exit time, chaos rating, regret probability, and more

### Example Output

```
┌─────────────────────────────────┐
│         🕐 2:47 AM              │
│                                 │
│  You said "last one" at 9:15 PM │
│  That was a lie.                │
│                                 │
│  Chaos Rating: 8.6/10           │
│  Text Regret Risk: 74%          │
│  Bar-Hop Probability: 61%       │
│  Sunrise Risk: 🔴 HIGH          │
└─────────────────────────────────┘
```

---

## 🧱 Tech Stack

| Layer          | Technology                                |
|----------------|-------------------------------------------|
| **Web App**    | Vite (React), TypeScript                  |
| **Styling**    | Vanilla CSS + CSS Variables               |
| **Backend**    | Convex (serverless)                       |
| **AI/Vision**  | Flexible — OpenAI, NVIDIA, Llama, etc.    |
| **Auth**       | Better Auth / Convex Auth                 |
| **Storage**    | Convex File Storage                       |
| **Mobile**     | React Native (Expo) — Phase 2             |
| **Analytics**  | PostHog                                   |

---

## 📂 Project Structure

```
overstay/
├── README.md                 # This file
├── FEATURES.md               # Detailed feature specifications
├── ROADMAP.md                # Development roadmap & milestones
├── ARCHITECTURE.md           # System architecture & data flow
├── BRANDING.md               # Brand guidelines, tone, naming
├── CONTENT.md                # AI prediction copy & roast templates
├── MONETIZATION.md           # Business model & revenue strategy
├── VIRAL-STRATEGY.md         # Growth loops & launch plan
├── docs/
│   ├── api-design.md         # API endpoints & contracts
│   ├── ai-scoring.md         # AI scoring heuristics
│   └── safety-guidelines.md  # Content safety & responsible messaging
└── web/                      # Web app (created during implementation)
```

---

## 🚀 Quick Start

_Coming soon — web app implementation in Phase 1._

---

## 📜 License

Proprietary — All rights reserved.
