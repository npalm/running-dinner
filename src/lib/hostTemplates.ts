const STORAGE_KEY = 'running-dinner-host-template'

export const DEFAULT_HOST_TEMPLATE = `Hoi [namen]!

Super fijn dat je meedoet met het Running Dinner! 🎉

Jij gaat deze editie het [gang] [emoji] maken. Je krijgt [aantal] [gasten] over de vloer. Veel plezier met de voorbereidingen!

[dieetwensen]

Veel kookplezier en tot snel!`

/** Placeholders:
 * [namen]      → host name(s)
 * [gang]       → course name (lowercase)
 * [emoji]      → course emoji
 * [aantal]     → guest count
 * [gasten]     → "gast" or "gasten"
 * [dieetwensen] → dietary wishes block (auto-formatted)
 */
export function applyHostTemplate(
  template: string,
  hostName: string,
  courseLabel: string,
  emoji: string,
  guestCount: number,
  dietaryWishes: string[],
): string {
  const guestWord = guestCount === 1 ? 'gast' : 'gasten'
  const dietBlock =
    dietaryWishes.length > 0
      ? `Let op de volgende dieetwensen van je gasten:\n${dietaryWishes.map((w) => `• ${w}`).join('\n')}`
      : 'Je gasten hebben geen bijzondere dieetwensen — kook lekker los! 🍳'

  return template
    .replace(/\[namen\]/gi, hostName)
    .replace(/\[gang\]/gi, courseLabel.toLowerCase())
    .replace(/\[emoji\]/gi, emoji)
    .replace(/\[aantal\]/gi, String(guestCount))
    .replace(/\[gasten\]/gi, guestWord)
    .replace(/\[dieetwensen\]/gi, dietBlock)
}

export function loadHostTemplate(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_HOST_TEMPLATE
  } catch {
    return DEFAULT_HOST_TEMPLATE
  }
}

export function saveHostTemplate(template: string): void {
  localStorage.setItem(STORAGE_KEY, template)
}
