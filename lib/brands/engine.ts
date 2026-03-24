import type { BrandRecommendationEngine } from '@/types'
import { RuleBasedEngine } from './rules'

// ---------------------------------------------------------------------------
// Engine factory — swap the default here when an AI engine is ready.
//
//   import { AiEngine } from './ai-engine'
//   return new AiEngine()
//
// Every engine implements BrandRecommendationEngine, so callers never change.
// ---------------------------------------------------------------------------

export function createRecommendationEngine(): BrandRecommendationEngine {
  return new RuleBasedEngine()
}
