# 🗺️ JustOneLastDrink — Development Roadmap

## Overview

The roadmap is structured in 3 phases, prioritizing the web app MVP and viral mechanics first, then expanding to mobile and partnerships.

---

## Phase 1 — Web App MVP (Weeks 1–4)

> **Goal:** Launchable web app with core prediction flow + sharing.

### Week 1: Foundation
- [ ] Initialize Vite + React project with TypeScript
- [ ] Set up Convex backend (schema, functions)
- [ ] Design system: CSS variables, typography, dark theme
- [ ] Landing page with hero + CTA
- [ ] Basic responsive layout (mobile-first)

### Week 2: Core Flow
- [ ] Photo upload component (drag & drop + mobile camera)
- [ ] Client-side image compression (browser-image-compression)
- [ ] Convex file storage integration
- [ ] Vision API integration with provider abstraction (OpenAI, NVIDIA, Llama, etc.)
- [ ] AI scoring heuristics engine
- [ ] Loading screen with witty copy rotation

### Week 3: Prediction Output
- [ ] Prediction card component (screenshot-optimized)
- [ ] Card export as image (html2canvas / dom-to-image)
- [ ] Social sharing (Web Share API + fallback links)
- [ ] Result animations (number counting, reveal effects)
- [ ] SEO meta tags + Open Graph for shared links

### Week 4: Auth & Polish
- [ ] Authentication (Better Auth / Convex Auth)
- [ ] User profile & prediction history
- [ ] "Beat the AI" — self-report actual leave time
- [ ] Badge system
- [ ] Error handling, edge cases, loading states
- [ ] Analytics integration (PostHog)
- [ ] Rate limiting & abuse prevention

### Phase 1 Deliverables
- ✅ Working web app at justOneLastDrink.app
- ✅ Photo → AI prediction → shareable card
- ✅ User accounts with history
- ✅ Beat the AI gamification
- ✅ Analytics tracking

---

## Phase 2 — Growth & Features (Weeks 5–8)

> **Goal:** Viral features, social mechanics, content engine.

### Week 5: Viral Mechanics
- [ ] Morning-after comparison cards (prediction vs. reality)
- [ ] "Challenge a Friend" flow (shareable link with prediction)
- [ ] Friend leaderboards
- [ ] Streak tracking for Beat the AI

### Week 6: Advanced AI
- [ ] Improve detection with fine-tuned prompts
- [ ] Add more prediction categories
- [ ] Personalized predictions based on history
- [ ] A/B test different roast tones
- [ ] Feedback loop: "Was this accurate?" → improve model

### Week 7: Content & Engagement
- [ ] Daily/weekly chaos digest emails
- [ ] Push notifications ("Your night is predicted to get wild")
- [ ] Seasonal themes (NYE, Halloween, St. Patrick's)
- [ ] Custom roast packs (unlock via engagement)

### Week 8: Venue Features
- [ ] Location tagging (opt-in)
- [ ] Venue pages with aggregate stats
- [ ] "Tonight's Chaos Forecast" for known venues
- [ ] Venue leaderboards

### Phase 2 Deliverables
- ✅ Viral sharing loops active
- ✅ Morning-after comparison feature
- ✅ Friend challenges & leaderboards
- ✅ Improved AI accuracy
- ✅ Venue integration started

---

## Phase 3 — Mobile & Monetization (Weeks 9–16)

> **Goal:** Native mobile apps + sustainable revenue.

### Weeks 9–12: Mobile Apps
- [ ] React Native (Expo) project setup
- [ ] Shared business logic from web app
- [ ] Native camera integration
- [ ] Push notifications (native)
- [ ] App Store submission (iOS)
- [ ] Play Store submission (Android)
- [ ] Deep linking (web ↔ mobile)

### Weeks 13–14: Monetization
- [ ] Freemium model implementation
- [ ] Premium features (see MONETIZATION.md)
- [ ] Stripe / RevenueCat integration
- [ ] Ad placement (non-intrusive)

### Weeks 15–16: Scale & Partnerships
- [ ] Venue partnership portal
- [ ] Branded prediction cards for venues
- [ ] Influencer toolkit (custom cards, affiliate links)
- [ ] API for third-party integrations
- [ ] Performance optimization for scale

### Phase 3 Deliverables
- ✅ iOS and Android apps live
- ✅ Revenue streams active
- ✅ Venue partnerships initiated
- ✅ Scalable infrastructure

---

## Success Metrics

| Metric                   | Phase 1 Target | Phase 2 Target | Phase 3 Target |
|--------------------------|----------------|----------------|----------------|
| Monthly Active Users     | 1,000          | 10,000         | 100,000        |
| Predictions per day      | 50             | 500            | 5,000          |
| Share rate               | 30%            | 40%            | 50%            |
| DAU/MAU ratio            | 10%            | 15%            | 20%            |
| Beat the AI participation| 20%            | 35%            | 50%            |

---

## Risk Mitigation

| Risk                          | Mitigation                                      |
|-------------------------------|--------------------------------------------------|
| AI API costs too high         | Cache aggressively, batch requests, set limits   |
| Low viral adoption            | A/B test card designs, roast copy, CTA placement |
| Alcohol sensitivity backlash  | Playful tone, no encouragement, safety resources |
| App store rejection           | Responsible messaging, no alcohol promotion       |
| Data privacy concerns         | Minimal data, auto-delete images, GDPR compliance|
