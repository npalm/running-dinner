import type { CookingPreference, Participant, TestDataConfig } from '../types'
import { randomPointInRing } from './coordinates'
import { reverseGeocode } from './geocoding'

const FIRST_NAMES = [
  'Emma', 'Liam', 'Sophie', 'Noah', 'Julia', 'Lars', 'Anna', 'Daan',
  'Lisa', 'Finn', 'Nora', 'Sem', 'Eva', 'Luuk', 'Mila', 'Tom',
  'Sara', 'Ruben', 'Amy', 'Bram', 'Fleur', 'Jasper', 'Iris', 'Thijs',
]

const LAST_NAMES = [
  'de Vries', 'Jansen', 'de Boer', 'van den Berg', 'Bakker',
  'Visser', 'Smit', 'Meijer', 'de Groot', 'Mulder',
  'van Dijk', 'Peters', 'Hendriks', 'van Leeuwen', 'Dekker',
  'Brouwer', 'de Jong', 'Vermeulen', 'Kok', 'Jacobs',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickUnique<T>(arr: T[], used: Set<T>): T {
  const available = arr.filter((x) => !used.has(x))
  if (available.length === 0) return pick(arr)
  return pick(available)
}

function randomPreference(): CookingPreference {
  const r = Math.random()
  if (r < 0.30) return null
  if (r < 0.50) return 'starter'
  if (r < 0.70) return 'main'
  if (r < 0.90) return 'dessert'
  return 'prefer-not'
}

const DIETARY_OPTIONS = [
  'vegetarisch',
  'veganistisch',
  'glutenvrij',
  'lactosevrij',
  'notenallergie',
  'schaaldierenallergie',
  'halal',
  'geen varkensvlees',
  'ei-allergie',
  'soja-allergie',
  'diabetisch',
]

function randomDietaryWishes(): string | undefined {
  if (Math.random() > 0.40) return undefined
  const count = Math.random() < 0.3 ? 2 : 1
  const shuffled = [...DIETARY_OPTIONS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).join(', ')
}

function toEmail(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/&\s*/g, '.')
      .replace(/\s+/g, '.')
      .replace(/[^a-z0-9.]/g, '') + '@example.com'
  )
}

/**
 * Generates synthetic participants with real addresses via PDOK reverse geocoding.
 * Each participant's coordinates are random within the configured ring, and the
 * displayed address is the nearest real Dutch address to those coordinates.
 */
export async function generateTestData(config: TestDataConfig): Promise<Participant[]> {
  const { totalPersons, singlesCount, minRadiusM, maxRadiusM, baseCoordinates } = config

  const pairsCount = Math.floor((totalPersons - singlesCount) / 2)

  const usedFirstNames = new Set<string>()
  const usedLastNames = new Set<string>()

  type Draft = Omit<Participant, 'address'>
  const drafts: (Draft & { fallbackAddress: string })[] = []

  for (let i = 0; i < singlesCount; i++) {
    const firstName = pickUnique(FIRST_NAMES, usedFirstNames)
    usedFirstNames.add(firstName)
    const lastName = pick(LAST_NAMES)
    drafts.push({
      id: crypto.randomUUID(),
      name: `${firstName} ${lastName}`,
      count: 1,
      coordinates: randomPointInRing(baseCoordinates, minRadiusM, maxRadiusM),
      preference: randomPreference(),
      dietaryWishes: randomDietaryWishes(),
      email: toEmail(`${firstName} ${lastName}`),
      fallbackAddress: `${firstName} ${lastName}, Eindhoven`,
    })
  }

  for (let i = 0; i < pairsCount; i++) {
    const firstName1 = pickUnique(FIRST_NAMES, usedFirstNames)
    usedFirstNames.add(firstName1)
    const firstName2 = pickUnique(FIRST_NAMES, usedFirstNames)
    usedFirstNames.add(firstName2)
    const lastName = pickUnique(LAST_NAMES, usedLastNames)
    usedLastNames.add(lastName)
    drafts.push({
      id: crypto.randomUUID(),
      name: `${firstName1} & ${firstName2} ${lastName}`,
      count: 2,
      coordinates: randomPointInRing(baseCoordinates, minRadiusM, maxRadiusM),
      preference: randomPreference(),
      dietaryWishes: randomDietaryWishes(),
      email: toEmail(`${firstName1} ${firstName2} ${lastName}`),
      fallbackAddress: `${firstName1} & ${firstName2} ${lastName}, Eindhoven`,
    })
  }

  // Reverse geocode all coordinates in parallel to get real addresses
  const addresses = await Promise.all(
    drafts.map((d) =>
      d.coordinates
        ? reverseGeocode(d.coordinates).then((a) => a ?? d.fallbackAddress)
        : Promise.resolve(d.fallbackAddress),
    ),
  )

  return drafts.map((d, i) => ({
    id: d.id,
    name: d.name,
    count: d.count,
    address: addresses[i],
    coordinates: d.coordinates,
    preference: d.preference,
    dietaryWishes: d.dietaryWishes,
    email: d.email,
  }))
}
