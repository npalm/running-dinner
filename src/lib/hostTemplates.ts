const STORAGE_KEY = 'running-dinner-host-template'

export const DEFAULT_HOST_TEMPLATE = `Hallo [namen],

Wat leuk dat jullie meedoen aan het Running Dinner op [datum].
Jullie gaan het [gang] maken en krijgen [aantal] [gasten] op bezoek.

[dieetwensen]

[schema]

[dagzelf]
Veel succes en plezier met de voorbereiding van jullie gerecht!`

export const DEFAULT_GUEST_TEMPLATE = `Hallo [namen],

Wat leuk dat jullie meedoen aan het Running Dinner op [datum].
Jullie hoeven deze editie niet te koken — geniet ervan!

[schema]

[dagzelf]
Veel plezier en tot snel!`

const DAG_ZELF_NOTE =
  'Op de dag zelf kunnen jullie post verwachten met het adres van jullie voorgerecht.'

const EVENT_DATE = 'zaterdag 23 mei'

const EVENT_SCHEMA = `Het schema voor de avond:\n
🕕 18:00 Voorgerecht
🔀 19:00 Wisselen van adres
🕖 19:15 Hoofdgerecht
🔀 20:45 Wisselen van adres
🕘 21:00 Nagerecht
☕ 22:00 Koffie/thee en likeur in de Blokhut, met alle deelnemers`

/** Placeholders:
 * [namen]       → host/guest name(s)
 * [gang]        → course name (lowercase)
 * [emoji]       → course emoji
 * [aantal]      → guest count
 * [gasten]      → "gast" or "gasten"
 * [dieetwensen] → dietary wishes block (auto-formatted)
 * [dagzelf]     → day-of note (empty for starter hosts)
 * [datum]       → event date
 * [gangwens]    → note when course preference couldn't be honored
 * [schema]      → evening schedule
 */
export function applyHostTemplate(
  template: string,
  hostName: string,
  courseLabel: string,
  emoji: string,
  guestCount: number,
  dietaryWishes: string[],
  isStarterHost: boolean,
  preferenceHonored = true,
): string {
  const guestWord = guestCount === 1 ? 'gast' : 'gasten'
  const dietBlock =
    dietaryWishes.length > 0
      ? `Let op de volgende dieetwensen van jullie gasten:\n\n${dietaryWishes.map((w) => `• ${w}`).join('\n')}`
      : ''
  const prefNote = preferenceHonored
    ? ''
    : 'Helaas was het niet mogelijk om rekening te houden met alle wensen voor gangen. We hopen dat jullie er toch een mooi gerecht van maken!'

  return template
    .replace(/\[namen\]/gi, () => hostName)
    .replace(/\[gang\]/gi, () => courseLabel.toLowerCase())
    .replace(/\[emoji\]/gi, () => emoji)
    .replace(/\[aantal\]/gi, () => String(guestCount))
    .replace(/\[gasten\]/gi, () => guestWord)
    .replace(/\[dieetwensen\]/gi, () => dietBlock)
    .replace(/\[dagzelf\]/gi, () => isStarterHost ? '' : DAG_ZELF_NOTE)
    .replace(/\[datum\]/gi, () => EVENT_DATE)
    .replace(/\[gangwens\]/gi, () => prefNote)
    .replace(/\[schema\]/gi, () => EVENT_SCHEMA)
    .replace(/\n{3,}/g, '\n\n')
    .trim()
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
