# 🧩 JustOneLastDrink — Feature Specifications

## Core Features

### 1. Photo Upload & Analysis

**Description:** Users upload a photo from their night out. The AI analyzes it and generates a prediction.

**User Flow:**
1. Tap "Predict My Night" → camera/gallery picker opens
2. Select or take a photo
3. Loading screen with witty "analyzing your poor decisions…" copy
4. Prediction card appears with results

**Technical Requirements:**
- Accept JPEG, PNG, HEIC up to 10MB
- Client-side image compression before upload
- Store original in Convex File Storage
- Send compressed version to Vision API
- Cache results per image hash (avoid duplicate charges)

---

### 2. AI Prediction Engine

**Description:** The core prediction system that analyzes images and generates chaos scores.

**Detection Signals:**
| Signal             | Detection Method           | Weight     |
|--------------------|----------------------------|------------|
| Lighting level     | Average brightness + color temp | Medium |
| Face count         | Face detection API         | High       |
| Alcohol visible    | Object detection           | High       |
| Crowd density      | Person count + proximity   | Medium     |
| Neon/club lighting | Color histogram analysis   | Medium     |
| Emotional state    | Facial expression analysis | Medium     |
| DJ booth/stage     | Object detection           | Low        |
| Time cues          | EXIF data + darkness level | High       |
| Empty glasses      | Object detection           | Medium     |

**Output Predictions:**
- **Exit Time** — predicted departure time (e.g., "2:47 AM")
- **JustOneLastDrink Duration** — hours past "one last drink" (e.g., "3h 18m")
- **Chaos Rating** — 0–10 scale with decimal (e.g., "8.6/10")
- **Text Regret Probability** — % chance of sending a regrettable text
- **Bar-Hop Probability** — % chance of venue change
- **"We're going somewhere else" Likelihood** — separate from bar-hop
- **Cry-in-Bathroom Risk** — humorous emotional breakdown predictor
- **Sunrise Risk** — LOW / MEDIUM / HIGH / CERTAIN

**Scoring Heuristics (MVP):**

```
Base exit time: current_time + 2 hours

Modifiers:
  Group size > 4         → +40 min
  Group size > 8         → +90 min
  Shots visible          → +60 min
  Cocktails visible      → +30 min
  Neon lighting          → +90 min
  Club darkness          → +60 min
  Someone screaming      → +120 min
  DJ booth detected      → +180 min
  Empty glasses > 3      → +45 min
  Everyone smiling       → +30 min
  Someone crying         → -60 min (they're leaving)
  Selfie (close-up)      → +20 min
  Food visible           → -30 min (still responsible)
  Water bottles          → -45 min (hydrating = might leave)
```

---

### 3. Prediction Card (Screenshot-Ready)

**Description:** The output is a beautifully designed, share-ready card.

**Design Requirements:**
- Dark background with gradient (deep purple → black)
- Bold, oversized exit time typography
- Minimal but impactful layout
- Brand watermark "justOneLastDrink.app" subtle bottom corner
- Dimensions optimized for Instagram Stories (1080×1920) and feed (1080×1080)
- One-tap share to Instagram, TikTok, Twitter/X, Snapchat
- Download as image option

**Card Layout:**
```
┌──────────────────────────────────┐
│                                  │
│  [small uploaded photo, blurred  │
│   background with overlay]       │
│                                  │
│         🕐                       │
│       2:47 AM                    │
│                                  │
│  You said "last one" at 9:15 PM  │
│  That was a lie.                 │
│                                  │
│  ─────────────────────────────   │
│                                  │
│  Chaos Rating      8.6/10       │
│  Text Regret       74%          │
│  Bar-Hop           61%          │
│  Sunrise Risk      🔴 HIGH      │
│                                  │
│  ─────────────────────────────   │
│                                  │
│           justOneLastDrink.app           │
└──────────────────────────────────┘
```

---

### 4. User Accounts & History

**Description:** Optional accounts to track prediction history and enable "Beat the AI" mode.

**Features:**
- Sign up with email, Google, or Apple
- View past predictions
- Track accuracy over time
- Profile with "JustOneLastDrink Score" (lifetime chaos average)
- Achievement badges
- Delete account & data (GDPR)

---

### 5. "Beat the AI" Mode

**Description:** Gamification layer — challenge users to leave before the predicted time.

**Flow:**
1. User gets prediction: "You're leaving at 2:47 AM"
2. Next day, user reports actual leave time
3. If they left earlier → Badge + roast ("Wow, you have self-control. Boring.")
4. If they stayed longer → AI roast ("Called it. You're predictable.")
5. Streak tracking for consecutive "beats"

**Badges:**
| Badge               | Condition                         |
|----------------------|-----------------------------------|
| 🏃 Early Escape     | Left 1+ hour before prediction    |
| ⏰ On the Dot       | Left within 15 min of prediction  |
| 🌅 Sunrise Survivor | Stayed past sunrise               |
| 🔮 AI's Pet         | AI was right 5x in a row          |
| 💪 Unbeatable       | Beat the AI 10x in a row          |
| 👻 Ghost            | Left within 30 min of arriving    |

---

### 6. Social & Sharing

**Description:** Viral mechanics built into the core experience.

**Features:**
- One-tap share prediction card to social platforms
- "Challenge a friend" — send a prediction link
- Group predictions — upload group photo, each person gets a prediction
- Leaderboard — who justOneLastDrinks the most in your friend group
- Morning-after comparison: prediction vs. reality side-by-side card

---

### 7. Venue Recognition (Phase 2)

**Description:** Recognize bars/clubs and provide venue-specific predictions.

**Features:**
- Location tagging (opt-in)
- Venue chaos scores based on aggregate data
- "This venue has a 94% justOneLastDrink rate on Saturdays"
- Venue leaderboards
- Bar/club partnership opportunities

---

## Feature Priority Matrix

| Feature                  | Phase | Priority | Effort |
|--------------------------|-------|----------|--------|
| Photo Upload             | 1     | P0       | Medium |
| AI Prediction Engine     | 1     | P0       | High   |
| Prediction Card          | 1     | P0       | Medium |
| Social Sharing           | 1     | P0       | Low    |
| User Accounts            | 1     | P1       | Medium |
| Beat the AI              | 1     | P1       | Medium |
| Morning-After Compare    | 2     | P1       | Low    |
| Group Predictions        | 2     | P2       | High   |
| Venue Recognition        | 2     | P2       | High   |
| Leaderboards             | 2     | P2       | Medium |
| Mobile App (iOS)         | 3     | P1       | High   |
| Mobile App (Android)     | 3     | P1       | High   |
| Venue Partnerships       | 3     | P2       | Medium |
