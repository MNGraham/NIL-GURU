import type { Athlete, ContentTone, Platform, ContentType, StatRow } from '@/types'

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

export function buildSocialPackPrompt(
  athlete: Athlete,
  stats: StatRow[],
  notes?: string
): string {
  const statsLines = stats.length
    ? stats.map(s => `- ${s.label}: ${s.value}${s.unit ? ' ' + s.unit : ''}`).join('\n')
    : '- No stats provided'

  return `You are a sports marketing expert creating NIL (Name, Image, Likeness) social content for a college athlete.

Athlete:
- Sport: ${athlete.sport}
- Position: ${athlete.position ?? 'N/A'}
- School: ${athlete.school ?? 'N/A'}

Performance Data:
${statsLines}${notes ? `\n\nCoach/Athlete Notes: ${notes}` : ''}

Generate three distinct pieces of social content based on this performance:

1. Instagram Caption — engaging, emoji-friendly, 150–300 characters, celebration tone
2. TikTok Script — structured as: hook (first 3 sec to stop the scroll), body (20–30 sec of storytelling), cta (call-to-action); conversational and energetic
3. Story Caption — punchy 1–2 sentences, max 80 characters, ideal for IG/TikTok story text overlay

Rules:
- Reference the actual stats — no generic sports clichés
- Each piece must feel native to its platform
- Include 3–5 relevant hashtags per piece
- Keep NIL context: this athlete is building their personal brand

Return JSON exactly:
{
  "instagram_caption": { "body": "...", "hashtags": ["..."] },
  "tiktok_script": { "hook": "...", "body": "...", "cta": "...", "hashtags": ["..."] },
  "story_caption": { "body": "...", "hashtags": ["..."] }
}`
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
