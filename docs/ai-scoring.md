# 🔮 Overstay — AI Scoring Heuristics

## Overview

The AI scoring engine combines computer vision detection with weighted heuristics to produce entertaining, shareable predictions. Accuracy isn't the goal — **relatability** is.

---

## Detection Pipeline

```
Image Input
    │
    ▼
┌─────────────────────────┐
│  Vision API Provider    │
│  (Pluggable)            │
│                         │
│  Supported:             │
│  • OpenAI (GPT-4o)      │
│  • NVIDIA (NEVA/VLM)    │
│  • Llama (LLaVA)        │
│  • Google (Gemini)      │
│  • Any OpenAI-compat.   │
│                         │
│  Structured prompt:     │
│  "Analyze this nightlife│
│   photo and return..."  │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Parse Detection JSON   │
│  - Face count           │
│  - Drink count/type     │
│  - Lighting analysis    │
│  - Venue type           │
│  - Emotional state      │
│  - Objects detected     │
│  - Crowd density        │
│  - Activity level       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Apply Scoring Engine   │
│  - Base exit time       │
│  - Signal modifiers     │
│  - Randomization band   │
│  - Generate predictions │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Select Roast Copy      │
│  - Match tone to score  │
│  - Template + variables │
│  - Ensure variety       │
└─────────────────────────┘
```

---

## Vision API Prompt

```text
Analyze this nightlife/social photo and return a JSON object with:

{
  "setting": "bar" | "club" | "restaurant" | "outdoor" | "house_party" | "other",
  "face_count": number,
  "estimated_group_size": number,
  "drinks_visible": {
    "count": number,
    "types": ["beer", "cocktail", "shot", "wine", "water", "other"],
    "empty_glasses": number
  },
  "lighting": {
    "brightness": "dark" | "dim" | "moderate" | "bright",
    "neon_present": boolean,
    "strobe_likely": boolean,
    "color_dominant": string
  },
  "crowd_density": "empty" | "sparse" | "moderate" | "packed",
  "emotional_vibe": "calm" | "happy" | "excited" | "wild" | "emotional" | "tired",
  "objects_detected": ["dj_booth", "dance_floor", "food", "menu", "coat", "phone_out", "selfie_stick"],
  "activity_level": 1-10,
  "chaos_indicators": ["someone_on_table", "group_cheering", "spilled_drink", "costume", "birthday_decoration"],
  "food_visible": boolean,
  "water_visible": boolean,
  "time_cues": "early_evening" | "night" | "late_night" | "unknown"
}
```

---

## Scoring Engine

### Base Exit Time Calculation

```javascript
function calculateExitTime(currentHour, signals) {
  // Base: 2 hours from now
  let overstayMinutes = 120;

  // === GROUP DYNAMICS ===
  if (signals.estimated_group_size >= 8)      overstayMinutes += 90;
  else if (signals.estimated_group_size >= 4) overstayMinutes += 40;
  else if (signals.estimated_group_size >= 2) overstayMinutes += 15;
  // Solo = no modifier

  // === DRINKS ===
  const drinks = signals.drinks_visible;
  if (drinks.types.includes("shot"))           overstayMinutes += 60;
  if (drinks.types.includes("cocktail"))       overstayMinutes += 30;
  if (drinks.types.includes("beer"))           overstayMinutes += 15;
  if (drinks.count > 5)                        overstayMinutes += 45;
  if (drinks.empty_glasses > 3)                overstayMinutes += 45;

  // === ENVIRONMENT ===
  if (signals.lighting.neon_present)           overstayMinutes += 90;
  if (signals.lighting.strobe_likely)          overstayMinutes += 120;
  if (signals.lighting.brightness === "dark")  overstayMinutes += 60;
  if (signals.crowd_density === "packed")      overstayMinutes += 60;
  if (signals.crowd_density === "moderate")    overstayMinutes += 30;

  // === VENUE TYPE ===
  if (signals.setting === "club")              overstayMinutes += 120;
  if (signals.setting === "house_party")       overstayMinutes += 90;
  if (signals.setting === "bar")               overstayMinutes += 30;

  // === VIBE ===
  if (signals.emotional_vibe === "wild")       overstayMinutes += 90;
  if (signals.emotional_vibe === "excited")    overstayMinutes += 45;
  if (signals.emotional_vibe === "emotional")  overstayMinutes -= 30;
  if (signals.emotional_vibe === "tired")      overstayMinutes -= 60;

  // === OBJECTS ===
  if (signals.objects_detected.includes("dj_booth"))    overstayMinutes += 180;
  if (signals.objects_detected.includes("dance_floor")) overstayMinutes += 120;

  // === RESPONSIBILITY SIGNALS ===
  if (signals.food_visible)                    overstayMinutes -= 30;
  if (signals.water_visible)                   overstayMinutes -= 45;
  if (signals.objects_detected.includes("coat")) overstayMinutes -= 15;

  // === CHAOS INDICATORS ===
  overstayMinutes += signals.chaos_indicators.length * 30;

  // === ACTIVITY ===
  overstayMinutes += (signals.activity_level - 5) * 10;

  // === TIME OF NIGHT ===
  if (signals.time_cues === "late_night")      overstayMinutes += 60;
  if (signals.time_cues === "early_evening")   overstayMinutes -= 30;

  // === RANDOMIZATION (±15 min) ===
  overstayMinutes += Math.floor(Math.random() * 31) - 15;

  // Clamp to reasonable range
  overstayMinutes = Math.max(30, Math.min(overstayMinutes, 600));

  return overstayMinutes;
}
```

### Chaos Rating Calculation

```javascript
function calculateChaosRating(signals, overstayMinutes) {
  let score = 0;

  // Time-based (0-3 points)
  score += Math.min(3, overstayMinutes / 120);

  // Group-based (0-2 points)
  score += Math.min(2, signals.estimated_group_size / 4);

  // Drink-based (0-2 points)
  score += Math.min(2, signals.drinks_visible.count / 3);

  // Environment (0-2 points)
  if (signals.lighting.neon_present) score += 0.5;
  if (signals.lighting.strobe_likely) score += 0.5;
  if (signals.crowd_density === "packed") score += 1;

  // Chaos indicators (0-1 point)
  score += Math.min(1, signals.chaos_indicators.length * 0.3);

  // Clamp and round to 1 decimal
  return Math.round(Math.min(10, Math.max(0, score)) * 10) / 10;
}
```

### Secondary Predictions

```javascript
function calculateSecondaryPredictions(signals, chaosRating) {
  return {
    textRegret: Math.min(100, Math.round(
      chaosRating * 8 +
      (signals.emotional_vibe === "emotional" ? 25 : 0) +
      (signals.drinks_visible.types.includes("shot") ? 15 : 0) +
      Math.random() * 10
    )),

    barHop: Math.min(100, Math.round(
      (signals.crowd_density === "sparse" ? 30 : 0) +
      (signals.estimated_group_size >= 4 ? 20 : 0) +
      chaosRating * 5 +
      Math.random() * 15
    )),

    cryRisk: Math.min(100, Math.round(
      (signals.emotional_vibe === "emotional" ? 40 : 0) +
      (signals.drinks_visible.types.includes("wine") ? 15 : 0) +
      chaosRating * 3 +
      Math.random() * 10
    )),

    sunriseRisk: chaosRating >= 9 ? "CERTAIN" :
                 chaosRating >= 7 ? "HIGH" :
                 chaosRating >= 5 ? "MEDIUM" : "LOW"
  };
}
```

---

## Edge Cases

| Scenario                     | Handling                                     |
|------------------------------|----------------------------------------------|
| No faces detected            | "Solo mission. Bold. Unpredictable."         |
| Daytime photo                | "It's still light out? Come back later."     |
| Food only (no drinks)        | "Dinner phase. The chaos hasn't started yet."|
| Non-nightlife photo          | "Nice photo. Not seeing any chaos though."   |
| NSFW content                 | Reject with humor: "Whoa. Keep it PG-13."   |
| Extremely dark photo         | Use what's available, lean into mystery      |
| Celebrity/known person       | No special treatment, same algorithm         |

---

## Future Improvements

1. **User feedback loop** — "Was this accurate?" improves weighting
2. **Time-of-week modifier** — Friday predictions differ from Tuesday
3. **Repeat user calibration** — Adjust based on user's history
4. **Regional tuning** — Different cities have different nightlife cultures
5. **Weather integration** — Rain = people stay longer
