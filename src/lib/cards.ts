import type { Course, Participant, Schedule, Table } from '../types'

export type CardType = 'welcome' | 'starter-to-main' | 'main-to-dessert'

export interface CardData {
  type: CardType
  householdId: string
  householdName: string
  householdEmail?: string
  nextAddress: string
  deliveryAddress: string
  organizerLabel: string
}

export interface CardTemplates {
  welcome: string
  starterToMain: string
  mainToDessert: string
}

export const DEFAULT_TEMPLATES_NL: CardTemplates = {
  welcome:
    'Hallo [namen],\n\n🎉 De avond staat op het punt te beginnen. Jullie worden om 18:00 verwacht voor het voorgerecht op:',
  starterToMain:
    'Hallo [namen],\n\nWe hopen dat jullie hebben genoten van het voorgerecht. Tijd voor het hoofdgerecht! Jullie worden om 19:15 verwacht op:',
  mainToDessert:
    'Hallo [namen],\n\nWe hopen dat jullie hebben genoten van het hoofdgerecht. Tijd voor het nagerecht! Jullie worden om 21:00 verwacht op:',
}

export const DEFAULT_TEMPLATES_EN: CardTemplates = {
  welcome:
    'Hi [namen]!\n\n🎉 The evening is about to begin. Your first address for the starter is:',
  starterToMain:
    'Hi [namen]!\n\nWe hope you enjoyed the starter. Time for the main course! Your next address is:',
  mainToDessert:
    'Hi [namen]!\n\nWe hope you enjoyed the main course. Time for dessert! Your next address is:',
}

function tableForParticipant(
  participantId: string,
  course: Course,
  tables: Table[],
): Table | undefined {
  return tables.find(
    (t) => t.course === course && (t.hostId === participantId || t.guestIds.includes(participantId)),
  )
}

export function buildCards(schedule: Schedule, participants: Participant[]): CardData[] {
  const pMap = new Map(participants.map((p) => [p.id, p]))
  const cards: CardData[] = []

  for (const participant of participants) {
    const starterTable = tableForParticipant(participant.id, 'starter', schedule.tables)
    const mainTable = tableForParticipant(participant.id, 'main', schedule.tables)
    const dessertTable = tableForParticipant(participant.id, 'dessert', schedule.tables)

    const isStarterHost = starterTable?.hostId === participant.id
    const isMainHost = mainTable?.hostId === participant.id
    const isDessertHost = dessertTable?.hostId === participant.id

    const starterHost = starterTable ? pMap.get(starterTable.hostId) : undefined
    const mainHost = mainTable ? pMap.get(mainTable.hostId) : undefined
    const dessertHost = dessertTable ? pMap.get(dessertTable.hostId) : undefined

    // Welcome card: non-starter-hosts need to know where to go for starter
    if (!isStarterHost && starterHost) {
      cards.push({
        type: 'welcome',
        householdId: participant.id,
        householdName: participant.name,
        householdEmail: participant.email,
        nextAddress: starterHost.address,
        deliveryAddress: participant.address,
        organizerLabel: `Welkomst → Voorgerecht · Bezorgen: ${participant.address}`,
      })
    }

    // Starter → Main card: non-main-hosts need to know where to go for main
    if (!isMainHost && mainHost && starterHost) {
      const deliveryAddress = isStarterHost ? participant.address : starterHost.address
      cards.push({
        type: 'starter-to-main',
        householdId: participant.id,
        householdName: participant.name,
        householdEmail: participant.email,
        nextAddress: mainHost.address,
        deliveryAddress,
        organizerLabel: `Voorgerecht → Hoofdgerecht · Bezorgen: ${deliveryAddress}`,
      })
    }

    // Main → Dessert card: non-dessert-hosts need to know where to go for dessert
    if (!isDessertHost && dessertHost && mainHost) {
      const deliveryAddress = isMainHost ? participant.address : mainHost.address
      cards.push({
        type: 'main-to-dessert',
        householdId: participant.id,
        householdName: participant.name,
        householdEmail: participant.email,
        nextAddress: dessertHost.address,
        deliveryAddress,
        organizerLabel: `Hoofdgerecht → Nagerecht · Bezorgen: ${deliveryAddress}`,
      })
    }
  }

  return cards
}

export interface HostCardData {
  hostId: string
  hostName: string
  hostEmail?: string
  hostAddress: string
  course: Course | null
  guestCount: number
  dietaryWishes: string[]
  isStarterHost: boolean
  preferenceHonored: boolean
}

const COURSE_NL: Record<Course, string> = {
  starter: 'Voorgerecht',
  main: 'Hoofdgerecht',
  dessert: 'Nagerecht',
}

export function buildHostCards(schedule: Schedule, participants: Participant[]): HostCardData[] {
  const pMap = new Map(participants.map((p) => [p.id, p]))
  const hostIds = new Set(schedule.tables.map((t) => t.hostId))
  const starterHostIds = new Set(
    schedule.tables.filter((t) => t.course === 'starter').map((t) => t.hostId),
  )

  // One card per cooking table
  const hostCards: HostCardData[] = schedule.tables.map((table) => {
    const host = pMap.get(table.hostId)
    const guests = table.guestIds.flatMap((id) => {
      const p = pMap.get(id)
      return p ? [p] : []
    })
    const dietaryWishes = guests.filter((g) => g.dietaryWishes).map((g) => g.dietaryWishes!)
    const pref = host?.preference
    const preferenceHonored = !pref || pref === 'prefer-not' || pref === table.course

    return {
      hostId: table.hostId,
      hostName: host?.name ?? '?',
      hostEmail: host?.email,
      hostAddress: host?.address ?? '?',
      course: table.course,
      guestCount: guests.reduce((sum, g) => sum + g.count, 0),
      dietaryWishes,
      isStarterHost: starterHostIds.has(table.hostId),
      preferenceHonored,
    }
  })

  // Cards for participants who don't host any course
  const guestCards: HostCardData[] = participants
    .filter((p) => !hostIds.has(p.id))
    .map((p) => ({
      hostId: p.id,
      hostName: p.name,
      hostEmail: p.email,
      hostAddress: p.address,
      course: null,
      guestCount: 0,
      dietaryWishes: [],
      isStarterHost: false,
      preferenceHonored: true,
    }))

  return [...hostCards, ...guestCards]
}

export { COURSE_NL }

export function applyTemplate(template: string, householdName: string): string {
  return template.replace(/\[namen\]/gi, () => householdName)
}
