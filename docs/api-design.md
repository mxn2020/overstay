# 🌐 JustOneLastDrink — API Design

## Overview

All backend logic is implemented as Convex functions (queries, mutations, actions). No separate REST API needed — the client communicates directly with Convex.

---

## Authentication

Authentication managed via Better Auth or Convex Auth. All mutations/queries that require a user will use the Convex `ctx.auth` context.

---

## Convex Functions

### Queries (Real-Time, Cached)

#### `predictions.getById`
```typescript
// Get a single prediction by ID
query({
  args: { id: v.id("predictions") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});
```

#### `predictions.getByUser`
```typescript
// Get user's prediction history, paginated
query({
  args: {
    limit: v.optional(v.number()),  // default 20
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    return await ctx.db
      .query("predictions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(args);
  },
});
```

#### `predictions.getPublicRecent`
```typescript
// Get recent public predictions (anonymized)
query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    return await ctx.db
      .query("predictions")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
  },
});
```

#### `users.getProfile`
```typescript
// Get user profile with stats
query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const user = await ctx.db.get(userId);
    const badges = await ctx.db
      .query("badges")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return { ...user, badges };
  },
});
```

#### `badges.getByUser`
```typescript
// Get all badges for a user
query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("badges")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});
```

---

### Mutations (Transactional Writes)

#### `predictions.save`
```typescript
// Save a completed prediction
mutation({
  args: {
    imageStorageId: v.id("_storage"),
    exitTime: v.string(),
    justOneLastDrinkMinutes: v.number(),
    chaosRating: v.number(),
    textRegret: v.number(),
    barHop: v.number(),
    cryRisk: v.number(),
    sunriseRisk: v.string(),
    roastLine: v.string(),
    aiRawResponse: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx); // nullable for anon
    return await ctx.db.insert("predictions", {
      ...args,
      userId: userId ?? undefined,
      createdAt: Date.now(),
    });
  },
});
```

#### `predictions.reportActual`
```typescript
// Beat the AI: report actual leave time
mutation({
  args: {
    predictionId: v.id("predictions"),
    actualLeaveTime: v.string(),
  },
  handler: async (ctx, { predictionId, actualLeaveTime }) => {
    const userId = await requireAuthUserId(ctx);
    const prediction = await ctx.db.get(predictionId);
    // Verify ownership
    if (prediction?.userId !== userId) throw new Error("Not your prediction");

    await ctx.db.patch(predictionId, { actualLeaveTime });

    // Calculate if user beat the AI
    const predicted = parseTime(prediction.exitTime);
    const actual = parseTime(actualLeaveTime);
    const userWon = actual < predicted;

    if (userWon) {
      // Award badge, update streak
      await awardBadge(ctx, userId, "early_escape");
      await updateStreak(ctx, userId, true);
    } else {
      await updateStreak(ctx, userId, false);
    }

    return { userWon, predicted, actual };
  },
});
```

#### `predictions.markAccuracy`
```typescript
// User feedback: was prediction accurate?
mutation({
  args: {
    predictionId: v.id("predictions"),
    wasAccurate: v.boolean(),
  },
  handler: async (ctx, { predictionId, wasAccurate }) => {
    await ctx.db.patch(predictionId, { wasAccurate });
  },
});
```

---

### Actions (External API Calls)

#### `ai.analyzeImage`
```typescript
// Core AI analysis — calls configured Vision API provider
// Supports: OpenAI, NVIDIA, Llama, Google Gemini, any OpenAI-compatible
action({
  args: {
    storageId: v.id("_storage"),
    provider: v.optional(v.string()), // "openai" | "nvidia" | "llama" | "gemini"
  },
  handler: async (ctx, { storageId, provider = "openai" }) => {
    // 1. Get image URL from Convex storage
    const imageUrl = await ctx.storage.getUrl(storageId);

    // 2. Call Vision API via provider abstraction
    const visionClient = getVisionProvider(provider);
    const response = await visionClient.analyzeImage({
      imageUrl,
      prompt: ANALYSIS_PROMPT,
      responseFormat: "json",
    });

    // 3. Parse response (normalized across providers)
    const signals = response.parsed;

    // 4. Calculate predictions
    const justOneLastDrinkMinutes = calculateExitTime(new Date().getHours(), signals);
    const exitTime = formatExitTime(new Date(), justOneLastDrinkMinutes);
    const chaosRating = calculateChaosRating(signals, justOneLastDrinkMinutes);
    const secondary = calculateSecondaryPredictions(signals, chaosRating);
    const roastLine = selectRoastLine(chaosRating, signals);

    // 5. Save prediction via mutation
    const predictionId = await ctx.runMutation(
      internal.predictions.save,
      {
        imageStorageId: storageId,
        exitTime,
        justOneLastDrinkMinutes,
        chaosRating,
        ...secondary,
        roastLine,
        aiRawResponse: JSON.stringify(signals),
      }
    );

    return { predictionId, exitTime, chaosRating, ...secondary, roastLine };
  },
});
```

#### `sharing.generateUrl`
```typescript
// Generate a shareable URL with OG metadata
action({
  args: { predictionId: v.id("predictions") },
  handler: async (ctx, { predictionId }) => {
    const prediction = await ctx.runQuery(
      internal.predictions.getById,
      { id: predictionId }
    );
    // Generate OG image server-side if needed
    const shareUrl = `https://justOneLastDrink.app/p/${predictionId}`;
    await ctx.runMutation(internal.predictions.setShareUrl, {
      id: predictionId,
      shareUrl,
    });
    return shareUrl;
  },
});
```

---

## Rate Limiting

| Endpoint          | Limit                   | Window |
|-------------------|-------------------------|--------|
| `ai.analyzeImage` | 10 per IP / 20 per user | 1 hour |
| `predictions.save`| 20 per user             | 1 hour |
| Image upload      | 15 per IP               | 1 hour |

---

## Database Indexes

```typescript
// schema.ts
predictions: defineTable({
  // ... fields
})
  .index("by_userId", ["userId"])
  .index("by_createdAt", ["createdAt"])
  .index("by_shareUrl", ["shareUrl"]),

badges: defineTable({
  // ... fields
})
  .index("by_userId", ["userId"]),

users: defineTable({
  // ... fields
})
  .index("by_email", ["email"]),
```
