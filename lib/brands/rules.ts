import type {
  BrandRecommendationEngine,
  BrandRecommendationResult,
  BrandCategoryRecommendation,
} from '@/types'

// ---------------------------------------------------------------------------
// Rule tables — each map returns { category, explanation } pairs.
// Tables are intentionally flat so they're easy to edit or load from a DB later.
// ---------------------------------------------------------------------------

interface CategoryHit {
  category: string
  explanation: string
}

// ---- Sport → brand categories ----

const SPORT_RULES: Record<string, CategoryHit[]> = {
  football: [
    { category: 'sports_apparel',   explanation: 'Football athletes drive high engagement for sportswear brands targeting competitive team-sport fans.' },
    { category: 'nutrition',        explanation: 'High-calorie training demands make football players credible nutrition and supplement ambassadors.' },
    { category: 'sports_equipment', explanation: 'Cleats, gloves, and training gear brands align naturally with football visibility.' },
    { category: 'gaming',           explanation: 'Madden and gaming culture overlaps heavily with football fanbases.' },
    { category: 'fitness_tech',     explanation: 'Wearable tech and recovery tools resonate with performance-driven football audiences.' },
  ],
  basketball: [
    { category: 'sneakers',         explanation: 'Basketball and sneaker culture are inseparable — footwear brands seek athlete endorsements at every level.' },
    { category: 'sports_apparel',   explanation: 'On-court and streetwear crossover makes basketball players natural apparel partners.' },
    { category: 'sports_drinks',    explanation: 'Hydration and energy drink brands target the fast-paced, high-visibility basketball audience.' },
    { category: 'lifestyle',        explanation: 'Basketball's cultural influence extends into music, fashion, and lifestyle brands.' },
    { category: 'gaming',           explanation: 'NBA 2K and basketball content creation are booming — gaming brands seek authentic athlete voices.' },
  ],
  baseball: [
    { category: 'sports_equipment', explanation: 'Bat, glove, and gear brands rely on player endorsements to reach loyal baseball audiences.' },
    { category: 'sports_apparel',   explanation: 'Baseball's tradition and regional fanbases make apparel partnerships effective.' },
    { category: 'nutrition',        explanation: 'Season-long endurance makes baseball players relatable for supplement and meal-prep brands.' },
    { category: 'sunglasses',       explanation: 'Outdoor play and style-conscious fans make eyewear a natural fit.' },
    { category: 'regional_food',    explanation: 'Baseball's deep regional ties create opportunities with local food and beverage brands.' },
  ],
  soccer: [
    { category: 'sports_apparel',   explanation: 'Global soccer culture drives massive demand for jerseys, boots, and training wear.' },
    { category: 'sports_drinks',    explanation: 'Endurance demands make soccer players authentic hydration-brand partners.' },
    { category: 'travel',           explanation: 'Soccer's international reach aligns with travel and lifestyle brands.' },
    { category: 'fitness_tech',     explanation: 'GPS trackers and performance wearables are standard in modern soccer training.' },
    { category: 'nutrition',        explanation: 'Lean-body requirements make soccer athletes credible voices for health-food brands.' },
  ],
  track: [
    { category: 'sneakers',         explanation: 'Running footwear is the most direct brand alignment for track athletes.' },
    { category: 'fitness_tech',     explanation: 'Wearables, timing tech, and recovery tools resonate with speed/endurance audiences.' },
    { category: 'nutrition',        explanation: 'Track athletes' strict diets make them ideal ambassadors for clean-eating brands.' },
    { category: 'sports_apparel',   explanation: 'Lightweight performance wear brands target the competitive running community.' },
    { category: 'wellness',         explanation: 'Recovery, sleep, and mental-health brands connect with distance and sprint athletes.' },
  ],
}

const DEFAULT_SPORT_RULES: CategoryHit[] = [
  { category: 'sports_apparel',   explanation: 'Apparel brands partner across all sports for authentic athlete representation.' },
  { category: 'nutrition',        explanation: 'Performance nutrition is universal — every athlete has a diet story to tell.' },
  { category: 'fitness_tech',     explanation: 'Wearable tech and training apps target competitive athletes regardless of sport.' },
  { category: 'lifestyle',        explanation: 'Athlete lifestyle content crosses sport boundaries into broader consumer brands.' },
  { category: 'local_business',   explanation: 'Community-rooted athletes resonate with local businesses looking for ambassadors.' },
]

// ---- Location → bonus categories ----

const LOCATION_RULES: Record<string, CategoryHit> = {
  // US regions (lowercase, partial match)
  'south':     { category: 'outdoor_lifestyle', explanation: 'Southern markets value outdoor, hunting, and fishing lifestyle brands alongside sports.' },
  'southeast': { category: 'outdoor_lifestyle', explanation: 'The Southeast blends sports fandom with outdoor recreation brands.' },
  'texas':     { category: 'western_lifestyle', explanation: 'Texas athletes tap into rodeo, ranch, and western wear brand ecosystems.' },
  'midwest':   { category: 'agriculture',       explanation: 'Midwest athletes connect with ag-tech, farm equipment, and heartland brands.' },
  'northeast': { category: 'finance',           explanation: 'Northeastern markets open doors to fintech and financial services sponsors.' },
  'west':      { category: 'tech',              explanation: 'West Coast athletes align with tech startups and innovation-driven brands.' },
  'california': { category: 'tech',             explanation: 'California's tech and entertainment ecosystem offers premium NIL opportunities.' },
  'florida':   { category: 'tourism',           explanation: 'Florida's tourism economy creates partnerships with travel and hospitality brands.' },
  'new york':  { category: 'fashion',           explanation: 'New York athletes gain access to fashion, media, and luxury brand deals.' },
}

// ---- Performance type → bonus categories ----

const PERFORMANCE_TYPE_RULES: Record<string, CategoryHit> = {
  'speed':      { category: 'automotive',    explanation: 'Speed-focused performances create natural parallels with automotive and racing brands.' },
  'strength':   { category: 'supplements',   explanation: 'Strength records make athletes credible faces for protein and creatine brands.' },
  'endurance':  { category: 'wellness',      explanation: 'Endurance feats resonate with recovery, sleep-tech, and mental toughness brands.' },
  'agility':    { category: 'fitness_tech',  explanation: 'Agility highlights attract wearable tech and training app partnerships.' },
  'scoring':    { category: 'gaming',        explanation: 'High-scoring athletes translate well to competitive gaming and fantasy-sports brands.' },
  'defensive':  { category: 'insurance',     explanation: 'Defensive dominance metaphors align well with protection and insurance brands.' },
  'leadership': { category: 'finance',       explanation: 'Leadership narratives attract banking, investing, and professional-services sponsors.' },
  'clutch':     { category: 'luxury',        explanation: 'Clutch performers embody pressure and precision — attractive to luxury and watch brands.' },
  'all-around': { category: 'lifestyle',     explanation: 'Versatile athletes appeal broadly to lifestyle and consumer-goods brands.' },
}

// ---------------------------------------------------------------------------
// Outreach message builder
// ---------------------------------------------------------------------------

function buildOutreach(
  category: string,
  sport: string,
  location: string,
  performanceType: string
): string {
  return (
    `Hi! I'm a college ${sport} athlete based in ${location} ` +
    `with recent ${performanceType} performances that are turning heads. ` +
    `I'm building my personal brand and believe there's a strong alignment ` +
    `with ${category.replace(/_/g, ' ')} companies. I'd love to explore a ` +
    `partnership — whether that's product features, sponsored content, or ` +
    `event appearances. Can we set up a quick call?`
  )
}

// ---------------------------------------------------------------------------
// Rule-based engine
// ---------------------------------------------------------------------------

export class RuleBasedEngine implements BrandRecommendationEngine {
  recommend(input: {
    sport: string
    location: string
    performance_type: string
  }): BrandRecommendationResult {
    const sport = input.sport.toLowerCase().trim()
    const location = input.location.toLowerCase().trim()
    const perfType = input.performance_type.toLowerCase().trim()

    // 1. Start with sport-specific categories (or defaults)
    const sportHits = SPORT_RULES[sport] ?? DEFAULT_SPORT_RULES
    const seen = new Set<string>()
    const pool: CategoryHit[] = []

    for (const hit of sportHits) {
      if (!seen.has(hit.category)) {
        seen.add(hit.category)
        pool.push(hit)
      }
    }

    // 2. Layer in location bonus (if matched)
    for (const [key, hit] of Object.entries(LOCATION_RULES)) {
      if (location.includes(key) && !seen.has(hit.category)) {
        seen.add(hit.category)
        pool.push(hit)
      }
    }

    // 3. Layer in performance-type bonus (if matched)
    const perfHit = PERFORMANCE_TYPE_RULES[perfType]
    if (perfHit && !seen.has(perfHit.category)) {
      pool.push(perfHit)
    }

    // 4. Pick 3–5 best: prioritize sport hits, then add bonuses
    const selected = pool.slice(0, 5)

    // Ensure at least 3 entries by padding with defaults if needed
    if (selected.length < 3) {
      for (const fallback of DEFAULT_SPORT_RULES) {
        if (selected.length >= 3) break
        if (!seen.has(fallback.category)) {
          seen.add(fallback.category)
          selected.push(fallback)
        }
      }
    }

    const recommendations: BrandCategoryRecommendation[] = selected.map(
      (hit) => ({
        category: hit.category,
        explanation: hit.explanation,
        outreach_message: buildOutreach(
          hit.category,
          input.sport,
          input.location,
          input.performance_type
        ),
      })
    )

    return {
      recommendations,
      engine: 'rules',
      generated_at: new Date().toISOString(),
    }
  }
}
