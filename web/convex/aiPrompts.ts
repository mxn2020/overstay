// AI Prompts for JustOneLastDrink
// Structured prompts for image analysis and prediction generation

// ============================================
// VISION ANALYSIS PROMPT (Kimi K2.5)
// ============================================
export const VISION_SYSTEM_PROMPT = `You are a nightlife scene analyzer for the app "JustOneLastDrink". 
You analyze photos from nights out and extract structured data about the scene.
You MUST respond ONLY with valid JSON — no markdown, no explanation, no commentary.`

export const VISION_USER_PROMPT = `Analyze this nightlife/social photo and extract the following signals as JSON.
Be specific and accurate based on what you can see. If you can't determine something, use reasonable defaults.

Return this exact JSON structure:
{
  "setting": "bar" | "club" | "restaurant" | "house_party" | "rooftop" | "outdoor" | "unknown",
  "face_count": <number of visible faces>,
  "estimated_group_size": <estimated total group size>,
  "drinks_visible": {
    "count": <number of drinks visible>,
    "types": ["beer", "cocktail", "shot", "wine", "water", "soda"],
    "empty_glasses": <number of empty glasses>
  },
  "lighting": {
    "brightness": "dark" | "dim" | "moderate" | "bright",
    "neon_present": true | false,
    "strobe_likely": true | false,
    "color_dominant": "purple" | "blue" | "red" | "warm" | "green" | "white" | "mixed"
  },
  "crowd_density": "empty" | "sparse" | "moderate" | "packed",
  "emotional_vibe": "calm" | "happy" | "excited" | "wild" | "emotional" | "tired",
  "objects_detected": [<list of relevant objects like "dj_booth", "dance_floor", "phone_out", "coat", "birthday_decoration", "karaoke", "pool_table">],
  "activity_level": <1-10 energy level>,
  "chaos_indicators": [<list like "group_cheering", "someone_on_table", "spilled_drink", "birthday_decoration", "costumes">],
  "food_visible": true | false,
  "water_visible": true | false,
  "time_cues": "early_evening" | "night" | "late_night" | "unknown"
}

Only output valid JSON. No explanation.`


// ============================================
// PREDICTION PROMPT (Nemotron-3-Nano)
// ============================================
export const PREDICTION_SYSTEM_PROMPT = `You are the "JustOneLastDrink" prediction engine — a savage, funny, nightlife oracle.
You receive structured scene analysis data and generate predictions about when someone will ACTUALLY leave.
Your predictions should be brutally honest, funny, and feel eerily accurate.
You MUST respond ONLY with valid JSON.`

export function buildPredictionUserPrompt(visionSignals: string): string {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    return `Based on these scene analysis signals from a night-out photo, generate a prediction.
Current time: ${currentHour}:${currentMinute.toString().padStart(2, '0')}

Scene signals:
${visionSignals}

Generate this JSON:
{
  "exitTime": "<predicted time they'll actually leave, e.g. '2:47 AM'>",
  "overstayMinutes": <minutes from now until they leave>,
  "chaosRating": <0.0-10.0 chaos level>,
  "textRegret": <0-100 % chance they'll send a regrettable text>,
  "barHop": <0-100 % chance they'll hop to another bar>,
  "cryRisk": <0-100 % chance someone cries>,
  "sunriseRisk": "LOW" | "MEDIUM" | "HIGH" | "CERTAIN",
  "roastLine": "<one savage, funny line about their night. Be creative and specific to what you see in the data. Max 80 chars.>"
}

Rules for predictions:
- Clubs and house parties = longer stays
- More drinks, especially shots = way longer
- Groups > 4 people = they're not leaving
- Packed venues with neon/strobes = sunrise risk goes up
- If someone has a coat in sight, they might actually leave
- Food and water = responsible humans, maybe they DO leave on time
- "Just one last drink" is ALWAYS a lie
- Be savage but funny with the roast line

Only output valid JSON.`
}


// ============================================
// COMBINED PROMPT (Single-model option)
// ============================================
export const COMBINED_SYSTEM_PROMPT = `You are the "JustOneLastDrink" AI — a savage, funny nightlife oracle.
You analyze photos from nights out and predict when someone will ACTUALLY leave.
Your predictions are brutally honest, funny, and eerily accurate.
You MUST respond ONLY with valid JSON — no markdown, no explanation.`

export function buildCombinedUserPrompt(): string {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    return `Look at this night-out photo. Analyze the scene and predict when this person/group will ACTUALLY leave.
Current time: ${currentHour}:${currentMinute.toString().padStart(2, '0')}

Generate this JSON with your analysis AND prediction combined:
{
  "analysis": {
    "setting": "bar" | "club" | "restaurant" | "house_party" | "rooftop" | "outdoor" | "unknown",
    "face_count": <number>,
    "estimated_group_size": <number>,
    "drinks_count": <number>,
    "drink_types": ["beer", "cocktail", "shot", "wine"],
    "empty_glasses": <number>,
    "lighting": "dark" | "dim" | "moderate" | "bright",
    "neon_or_strobes": true | false,
    "crowd_density": "empty" | "sparse" | "moderate" | "packed",
    "vibe": "calm" | "happy" | "excited" | "wild" | "emotional" | "tired",
    "energy_level": <1-10>,
    "chaos_signs": [<list of chaos indicators>]
  },
  "prediction": {
    "exitTime": "<predicted time, e.g. '2:47 AM'>",
    "overstayMinutes": <minutes from now until they leave>,
    "chaosRating": <0.0-10.0>,
    "textRegret": <0-100>,
    "barHop": <0-100>,
    "cryRisk": <0-100>,
    "sunriseRisk": "LOW" | "MEDIUM" | "HIGH" | "CERTAIN",
    "roastLine": "<savage, funny one-liner about their night. Max 80 chars.>"
  }
}

Rules:
- "Just one last drink" is ALWAYS a lie
- More people + more drinks = they're definitely not leaving
- Clubs/house parties = add hours
- Shots visible = sunrise risk goes way up
- Be savage but funny with the roast line
- exitTime should be realistic based on the current time and scene

Only output valid JSON.`
}
