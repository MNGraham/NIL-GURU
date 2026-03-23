import type { Athlete, ContentTone, Platform, ContentType } from '@/types'

export function buildContentPrompt(
  athlete: Athlete,
  platform: Platform,
  contentType: ContentType,
  tone: ContentTone,
  context?: string
): string {
  const statsStr = JSON.stringify(athlete.stats, null, 2)

  return `You are a sports marketing expert creating NIL (Name, Image, Likeness) social content for a college athlete.

Athlete:
- Sport: ${athlete.sport}
- Position: ${athlete.position ?? 'N/A'}
- School: ${athlete.school ?? 'N/A'}
- Stats: ${statsStr}
${context ? `- Context/recent event: ${context}` : ''}

Task: Write a ${contentType} for ${platform} in a ${tone} tone.

Rules:
- Platform: ${platform} (respect character limits and style norms)
- Be authentic, not generic
- Include 3–5 relevant hashtags
- If instagram/tiktok, include an emoji-friendly CTA
- Return JSON: { "body": "...", "hashtags": ["..."] }`
}

export function buildNilProfilePrompt(athlete: Athlete): string {
  const statsStr = JSON.stringify(athlete.stats, null, 2)

  return `You are a sports marketing agent creating a brand-facing NIL media profile.

Athlete:
- Sport: ${athlete.sport}
- Position: ${athlete.position ?? 'N/A'}
- School: ${athlete.school ?? 'N/A'}
- Stats: ${statsStr}

Create:
1. A punchy one-line headline (max 15 words)
2. A professional bio paragraph (3–4 sentences) suitable for brand outreach
3. 3–5 content category tags (e.g. "fitness", "lifestyle", "gaming")

Return JSON: { "headline": "...", "bio": "...", "categories": ["..."] }`
}

export function buildBrandMatchPrompt(
  athlete: Athlete,
  brands: Array<{ id: string; name: string; industry: string; categories: string[]; target_sports: string[]; description: string | null }>
): string {
  const statsStr = JSON.stringify(athlete.stats, null, 2)

  return `You are a NIL deal consultant matching athletes to brands.

Athlete:
- Sport: ${athlete.sport}
- School: ${athlete.school ?? 'N/A'}
- Stats: ${statsStr}

Brands to evaluate:
${JSON.stringify(brands, null, 2)}

For each brand, output a match score (0–100) and 2–3 specific reasons why the athlete is a good fit.

Return JSON array: [{ "brand_id": "...", "score": 85, "reasons": ["...", "..."] }]
Sort by score descending.`
}
