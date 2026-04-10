export type CookingPreference = 'starter' | 'main' | 'dessert' | 'prefer-not' | null

export interface LatLng {
  lat: number
  lng: number
}

export interface Participant {
  id: string
  name: string
  count: 1 | 2
  address: string
  coordinates: LatLng | null
  preference: CookingPreference
}

export type Course = 'starter' | 'main' | 'dessert'

export interface Table {
  id: string
  course: Course
  hostId: string
  guestIds: string[]
}

export interface Schedule {
  tables: Table[]
  generatedAt: string
}

export interface TestDataConfig {
  totalPersons: number
  singlesCount: number
  minRadiusM: number
  maxRadiusM: number
  baseAddress: string
  baseCoordinates: LatLng
}
