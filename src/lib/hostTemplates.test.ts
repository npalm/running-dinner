import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  applyHostTemplate,
  loadHostTemplate,
  saveHostTemplate,
  DEFAULT_HOST_TEMPLATE,
  DEFAULT_GUEST_TEMPLATE,
} from './hostTemplates'

describe('applyHostTemplate', () => {
  const run = (template: string, overrides?: Partial<Parameters<typeof applyHostTemplate>>) =>
    applyHostTemplate(
      template,
      overrides?.[1] ?? 'Alice',
      overrides?.[2] ?? 'Hoofdgerecht',
      overrides?.[3] ?? '🍲',
      overrides?.[4] ?? 4,
      overrides?.[5] ?? [],
      overrides?.[6] ?? false,
    )

  it('replaces [namen] placeholder', () => {
    expect(run('[namen]!')).toBe('Alice!')
  })

  it('replaces [gang] placeholder with lowercase course', () => {
    const result = applyHostTemplate('[gang]', 'X', 'Hoofdgerecht', '🍲', 2, [], false)
    expect(result).toBe('hoofdgerecht')
  })

  it('replaces [emoji] placeholder', () => {
    const result = applyHostTemplate('[emoji]', 'X', 'H', '🍲', 2, [], false)
    expect(result).toBe('🍲')
  })

  it('replaces [aantal] with guest count', () => {
    const result = applyHostTemplate('[aantal]', 'X', 'H', '🍲', 3, [], false)
    expect(result).toBe('3')
  })

  it('uses "gast" for count 1 and "gasten" for count > 1', () => {
    const single = applyHostTemplate('[gasten]', 'X', 'H', '🍲', 1, [], false)
    expect(single).toBe('gast')
    const multi = applyHostTemplate('[gasten]', 'X', 'H', '🍲', 2, [], false)
    expect(multi).toBe('gasten')
  })

  it('includes dietary wishes block when wishes present', () => {
    const result = applyHostTemplate('[dieetwensen]', 'X', 'H', '🍲', 2, ['vegan', 'gluten-vrij'], false)
    expect(result).toContain('vegan')
    expect(result).toContain('gluten-vrij')
    expect(result).toContain('•')
  })

  it('shows empty string when no dietary wishes', () => {
    const result = applyHostTemplate('[dieetwensen]', 'X', 'H', '🍲', 2, [], false)
    expect(result).toBe('')
  })

  it('[dagzelf] is empty for starter host', () => {
    const result = applyHostTemplate('[dagzelf]', 'X', 'H', '🍲', 2, [], true)
    expect(result).toBe('')
  })

  it('[dagzelf] contains day-of note for non-starter hosts', () => {
    const result = applyHostTemplate('[dagzelf]', 'X', 'H', '🍲', 2, [], false)
    expect(result).toContain('dag zelf')
  })

  it('collapses triple newlines to double', () => {
    const result = applyHostTemplate('a\n\n\n\nb', 'X', 'H', '🍲', 2, [], false)
    expect(result).not.toContain('\n\n\n')
  })

  it('trims leading/trailing whitespace', () => {
    const result = applyHostTemplate('  hello  ', 'X', 'H', '🍲', 2, [], false)
    expect(result).toBe('hello')
  })

  it('handles case-insensitive placeholders', () => {
    expect(applyHostTemplate('[NAMEN]', 'Bob', 'H', '🍲', 2, [], false)).toBe('Bob')
    expect(applyHostTemplate('[GANG]',  'X', 'Nagerecht', '🍮', 2, [], false)).toBe('nagerecht')
  })

  it('does not mangle names with JS replace special chars', () => {
    const result = applyHostTemplate('[namen]', "O$'Brien", 'H', '🍲', 2, [], false)
    expect(result).toBe("O$'Brien")
  })

  it('works on the DEFAULT_HOST_TEMPLATE without leaving placeholders', () => {
    const result = applyHostTemplate(DEFAULT_HOST_TEMPLATE, 'Alice', 'Voorgerecht', '🥗', 4, [], true)
    expect(result).not.toMatch(/\[namen\]/i)
    expect(result).not.toMatch(/\[gang\]/i)
    expect(result).not.toMatch(/\[emoji\]/i)
    expect(result).not.toMatch(/\[aantal\]/i)
    expect(result).not.toMatch(/\[gasten\]/i)
    expect(result).not.toMatch(/\[dieetwensen\]/i)
    expect(result).not.toMatch(/\[dagzelf\]/i)
  })

  it('DEFAULT_GUEST_TEMPLATE can be used without error', () => {
    // Guest template uses only [namen] and [dagzelf]
    expect(() => applyHostTemplate(DEFAULT_GUEST_TEMPLATE, 'Eve', '', '', 0, [], false)).not.toThrow()
  })
})

describe('loadHostTemplate / saveHostTemplate', () => {
  beforeEach(() => {
    const store: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value },
      removeItem: (key: string) => { delete store[key] },
      clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
    } satisfies Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'clear'>)
  })

  it('loadHostTemplate returns DEFAULT_HOST_TEMPLATE when nothing stored', () => {
    expect(loadHostTemplate()).toBe(DEFAULT_HOST_TEMPLATE)
  })

  it('saveHostTemplate persists and loadHostTemplate retrieves it', () => {
    saveHostTemplate('my custom template')
    expect(loadHostTemplate()).toBe('my custom template')
  })

  it('loadHostTemplate returns default when localStorage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem() { throw new Error('no storage') },
      setItem() {},
    })
    expect(loadHostTemplate()).toBe(DEFAULT_HOST_TEMPLATE)
  })
})
