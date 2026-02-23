# 🏗️ Overstay — System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
├──────────────────────┬──────────────────────────────────────┤
│    Web App           │    Mobile App (Phase 3)              │
│    Vite + React      │    React Native (Expo)               │
│    TypeScript        │    Shared logic via packages         │
└──────────┬───────────┴──────────────┬───────────────────────┘
           │                          │
           ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      CONVEX BACKEND                         │
├─────────────────────────────────────────────────────────────┤
│  Queries     │  Mutations    │  Actions       │  Cron Jobs  │
│  - getPred.  │  - savePred.  │  - analyzeImg  │  - cleanup  │
│  - getUser   │  - createUser │  - shareCard   │  - digest   │
│  - history   │  - updateBadg │                │             │
├─────────────────────────────────────────────────────────────┤
│                    Convex Database                           │
│  Tables: users, predictions, badges, venues, challenges     │
├─────────────────────────────────────────────────────────────┤
│                    Convex File Storage                       │
│  Uploaded photos, generated prediction cards                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                         │
├──────────────────┬──────────────────┬───────────────────────┤
│  Vision API      │  PostHog         │  Stripe / RevenueCat  │
│  (OpenAI/NVIDIA/ │  Analytics       │  Payments (Phase 3)   │
│   Llama/etc.)    │                  │                       │
└──────────────────┴──────────────────┴───────────────────────┘
```

---

## Data Flow

### Prediction Flow

```
1. User uploads photo
   └→ Client compresses image (< 1MB)
      └→ Upload to Convex File Storage
         └→ Convex Action: analyzeImage()
            ├→ Fetch image from storage
            ├→ Send to OpenAI Vision API
            ├→ Parse detection results
            ├→ Apply scoring heuristics
            ├→ Generate prediction object
            └→ Store prediction in DB
               └→ Return prediction to client
                  └→ Render prediction card
```

### Share Flow

```
1. User taps "Share"
   └→ Client generates card image (html2canvas)
      └→ Upload card image to storage
         └→ Generate shareable URL with OG metadata
            └→ Web Share API / social deep links
```

---

## Database Schema (Convex)

### `users`
| Field           | Type     | Description                |
|-----------------|----------|----------------------------|
| `_id`           | Id       | Auto-generated             |
| `name`          | string   | Display name               |
| `email`         | string   | Email address              |
| `authProvider`  | string   | "email" / "google" / "apple" |
| `overstayScore` | number   | Lifetime chaos average     |
| `totalPredictions` | number | Count of predictions     |
| `beatTheAiWins` | number   | Times user beat AI         |
| `streak`        | number   | Current beat streak        |
| `createdAt`     | number   | Timestamp                  |

### `predictions`
| Field            | Type     | Description                 |
|------------------|----------|-----------------------------|
| `_id`            | Id       | Auto-generated              |
| `userId`         | Id?      | Optional (anonymous allowed)|
| `imageStorageId` | Id       | Ref to uploaded photo       |
| `cardStorageId`  | Id?      | Ref to generated card image |
| `exitTime`       | string   | Predicted exit time         |
| `overstayMinutes`| number   | Minutes past "last drink"   |
| `chaosRating`    | number   | 0–10                        |
| `textRegret`     | number   | 0–100%                      |
| `barHop`         | number   | 0–100%                      |
| `cryRisk`        | number   | 0–100%                      |
| `sunriseRisk`    | string   | "LOW"/"MEDIUM"/"HIGH"/"CERTAIN" |
| `roastLine`      | string   | The savage tagline           |
| `aiRawResponse`  | string   | Raw Vision API response      |
| `actualLeaveTime`| string?  | Self-reported (Beat the AI)  |
| `wasAccurate`    | boolean? | User feedback                |
| `shareUrl`       | string?  | Generated share link         |
| `createdAt`      | number   | Timestamp                    |

### `badges`
| Field       | Type     | Description             |
|-------------|----------|-------------------------|
| `_id`       | Id       | Auto-generated          |
| `userId`    | Id       | Badge owner             |
| `badgeType` | string   | Badge identifier        |
| `awardedAt` | number   | Timestamp               |

### `venues` (Phase 2)
| Field            | Type     | Description             |
|------------------|----------|-------------------------|
| `_id`            | Id       | Auto-generated          |
| `name`           | string   | Venue name              |
| `location`       | object   | { lat, lng }            |
| `avgChaosScore`  | number   | Aggregate chaos rating  |
| `totalPredictions`| number  | Predictions at venue    |
| `peakNight`      | string   | Busiest night of week   |

---

## API Design (Convex Functions)

### Queries
- `predictions.getById(id)` — Fetch single prediction
- `predictions.getByUser(userId)` — User's prediction history
- `predictions.getRecent(limit)` — Recent public predictions
- `users.getProfile(userId)` — User profile + stats
- `badges.getByUser(userId)` — User's badges

### Mutations
- `users.create(data)` — Create new user
- `predictions.save(data)` — Store prediction
- `predictions.reportActual(id, actualTime)` — Beat the AI report
- `badges.award(userId, type)` — Award badge

### Actions
- `ai.analyzeImage(storageId)` — Run Vision API + scoring
- `sharing.generateCard(predictionId)` — Create shareable card
- `sharing.generateUrl(predictionId)` — Create OG-optimized URL

---

## Security & Privacy

- **Image retention:** Auto-delete uploaded photos after 30 days
- **Anonymous usage:** Allow predictions without account
- **Rate limiting:** Max 10 predictions per hour per IP
- **No facial recognition storage:** Detect but never store face data
- **GDPR:** Full data export + deletion on request
- **Content moderation:** Reject non-nightlife images gracefully
