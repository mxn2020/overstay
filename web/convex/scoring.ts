// JustOneLastDrink — AI Scoring Engine
// Implements heuristics from docs/ai-scoring.md

interface VisionSignals {
    setting: string;
    face_count: number;
    estimated_group_size: number;
    drinks_visible: {
        count: number;
        types: string[];
        empty_glasses: number;
    };
    lighting: {
        brightness: string;
        neon_present: boolean;
        strobe_likely: boolean;
        color_dominant: string;
    };
    crowd_density: string;
    emotional_vibe: string;
    objects_detected: string[];
    activity_level: number;
    chaos_indicators: string[];
    food_visible: boolean;
    water_visible: boolean;
    time_cues: string;
}

// --- Exit Time ---

export function calculateExitTime(currentHour: number, signals: VisionSignals): number {
    void currentHour; // reserved for future time-of-day modifiers
    let justOneLastDrinkMinutes = 120;

    // Group dynamics
    if (signals.estimated_group_size >= 8) justOneLastDrinkMinutes += 90;
    else if (signals.estimated_group_size >= 4) justOneLastDrinkMinutes += 40;
    else if (signals.estimated_group_size >= 2) justOneLastDrinkMinutes += 15;

    // Drinks
    const drinks = signals.drinks_visible;
    if (drinks.types.includes("shot")) justOneLastDrinkMinutes += 60;
    if (drinks.types.includes("cocktail")) justOneLastDrinkMinutes += 30;
    if (drinks.types.includes("beer")) justOneLastDrinkMinutes += 15;
    if (drinks.count > 5) justOneLastDrinkMinutes += 45;
    if (drinks.empty_glasses > 3) justOneLastDrinkMinutes += 45;

    // Environment
    if (signals.lighting.neon_present) justOneLastDrinkMinutes += 90;
    if (signals.lighting.strobe_likely) justOneLastDrinkMinutes += 120;
    if (signals.lighting.brightness === "dark") justOneLastDrinkMinutes += 60;
    if (signals.crowd_density === "packed") justOneLastDrinkMinutes += 60;
    if (signals.crowd_density === "moderate") justOneLastDrinkMinutes += 30;

    // Venue type
    if (signals.setting === "club") justOneLastDrinkMinutes += 120;
    if (signals.setting === "house_party") justOneLastDrinkMinutes += 90;
    if (signals.setting === "bar") justOneLastDrinkMinutes += 30;

    // Vibe
    if (signals.emotional_vibe === "wild") justOneLastDrinkMinutes += 90;
    if (signals.emotional_vibe === "excited") justOneLastDrinkMinutes += 45;
    if (signals.emotional_vibe === "emotional") justOneLastDrinkMinutes -= 30;
    if (signals.emotional_vibe === "tired") justOneLastDrinkMinutes -= 60;

    // Objects
    if (signals.objects_detected.includes("dj_booth")) justOneLastDrinkMinutes += 180;
    if (signals.objects_detected.includes("dance_floor")) justOneLastDrinkMinutes += 120;

    // Responsibility signals
    if (signals.food_visible) justOneLastDrinkMinutes -= 30;
    if (signals.water_visible) justOneLastDrinkMinutes -= 45;
    if (signals.objects_detected.includes("coat")) justOneLastDrinkMinutes -= 15;

    // Chaos indicators
    justOneLastDrinkMinutes += signals.chaos_indicators.length * 30;

    // Activity
    justOneLastDrinkMinutes += (signals.activity_level - 5) * 10;

    // Time cues
    if (signals.time_cues === "late_night") justOneLastDrinkMinutes += 60;
    if (signals.time_cues === "early_evening") justOneLastDrinkMinutes -= 30;

    // Randomization (±15 min)
    justOneLastDrinkMinutes += Math.floor(Math.random() * 31) - 15;

    // Clamp
    return Math.max(30, Math.min(justOneLastDrinkMinutes, 600));
}

// --- Chaos Rating ---

export function calculateChaosRating(signals: VisionSignals, justOneLastDrinkMinutes: number): number {
    let score = 0;

    // Time-based (0-3)
    score += Math.min(3, justOneLastDrinkMinutes / 120);

    // Group-based (0-2)
    score += Math.min(2, signals.estimated_group_size / 4);

    // Drink-based (0-2)
    score += Math.min(2, signals.drinks_visible.count / 3);

    // Environment (0-2)
    if (signals.lighting.neon_present) score += 0.5;
    if (signals.lighting.strobe_likely) score += 0.5;
    if (signals.crowd_density === "packed") score += 1;

    // Chaos indicators (0-1)
    score += Math.min(1, signals.chaos_indicators.length * 0.3);

    return Math.round(Math.min(10, Math.max(0, score)) * 10) / 10;
}

// --- Secondary Predictions ---

export function calculateSecondaryPredictions(signals: VisionSignals, chaosRating: number) {
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
                chaosRating >= 5 ? "MEDIUM" : "LOW",
    };
}

// --- Roast Line Selection ---

const ROAST_LINES = {
    high: [
        "You said \"last one\" at 9:15 PM. That was a lie.",
        "Your bed misses you. It'll keep waiting.",
        "At this rate, your alarm clock is just a suggestion.",
        "You'll check your bank account tomorrow and feel things.",
        "Clear tomorrow's calendar. Trust us.",
    ],
    medium: [
        "Things could go either way. History says they won't.",
        "Your Uber home will cost more than your dinner.",
        "Someone in this photo is waking up at 2 PM tomorrow.",
        "You googled 'bars near me' and it's barely midnight.",
        "The night is young. Your willpower isn't.",
    ],
    low: [
        "Chill vibes. You might actually leave on time.",
        "Library energy. Are you even out?",
        "Dinner phase. The chaos hasn't started yet.",
        "Your phone is safe tonight. Probably.",
        "Emotionally stable. For now.",
    ],
};

export function selectRoastLine(chaosRating: number, _signals: VisionSignals): string {
    const tier = chaosRating >= 7 ? "high" : chaosRating >= 4 ? "medium" : "low";
    const lines = ROAST_LINES[tier];
    return lines[Math.floor(Math.random() * lines.length)];
}

// --- Format Exit Time ---

export function formatExitTime(now: Date, justOneLastDrinkMinutes: number): string {
    const exit = new Date(now.getTime() + justOneLastDrinkMinutes * 60 * 1000);
    const hours = exit.getHours();
    const minutes = exit.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const h = hours % 12 || 12;
    const m = minutes.toString().padStart(2, "0");
    return `${h}:${m} ${ampm}`;
}
