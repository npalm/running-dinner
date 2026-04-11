import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { applyHostTemplate, DEFAULT_HOST_TEMPLATE, DEFAULT_GUEST_TEMPLATE } from './hostTemplates'
import { applyTemplate } from './cards'

const PLACEHOLDERS = ['[namen]', '[gang]', '[emoji]', '[aantal]', '[gasten]', '[dieetwensen]', '[dagzelf]']

describe('applyHostTemplate properties', () => {
  it('no placeholder tokens remain in output when called with defined values', () => {
    fc.assert(
      fc.property(
        fc.string(),           // template
        fc.string(),           // hostName
        fc.string(),           // courseLabel
        fc.string(),           // emoji
        fc.integer({ min: 0, max: 20 }), // guestCount
        fc.array(fc.string(), { maxLength: 5 }), // dietaryWishes
        fc.boolean(),          // isStarterHost
        (template, hostName, courseLabel, emoji, guestCount, dietaryWishes, isStarterHost) => {
          const result = applyHostTemplate(
            template,
            hostName,
            courseLabel,
            emoji,
            guestCount,
            dietaryWishes,
            isStarterHost,
          )
          for (const placeholder of PLACEHOLDERS) {
            expect(result.toLowerCase()).not.toContain(placeholder.toLowerCase())
          }
        },
      ),
    )
  })

  it('always returns a string', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        fc.string(),
        fc.string(),
        fc.integer({ min: 0, max: 50 }),
        fc.array(fc.string(), { maxLength: 10 }),
        fc.boolean(),
        (...args) => {
          const result = applyHostTemplate(...(args as Parameters<typeof applyHostTemplate>))
          expect(typeof result).toBe('string')
        },
      ),
    )
  })

  it('does not throw with any string input as template', () => {
    fc.assert(
      fc.property(fc.string(), (template) => {
        let threw = false
        try {
          applyHostTemplate(template, 'Test', 'voorgerecht', '🥗', 4, [], false)
        } catch {
          threw = true
        }
        expect(threw).toBe(false)
      }),
    )
  })

  it('default host template produces output with guest name', () => {
    const safeName = fc.stringMatching(/^[A-Za-z ]{1,30}$/)
    fc.assert(
      fc.property(safeName, (name) => {
        const result = applyHostTemplate(DEFAULT_HOST_TEMPLATE, name, 'voorgerecht', '🥗', 4, [], false)
        expect(result).toContain(name)
      }),
    )
  })

  it('default guest template produces output with guest name', () => {
    // Use names without JS replace() special patterns ($`, $', $&, $<n>)
    const safeName = fc.stringMatching(/^[A-Za-z ]{1,30}$/)
    fc.assert(
      fc.property(safeName, (name) => {
        const result = applyHostTemplate(DEFAULT_GUEST_TEMPLATE, name, '', '', 0, [], false)
        expect(result).toContain(name)
      }),
    )
  })
})

describe('applyTemplate (evening cards) properties', () => {
  it('no [namen] placeholder remains', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (template, name) => {
        const result = applyTemplate(template, name)
        expect(result.toLowerCase()).not.toContain('[namen]')
      }),
    )
  })

  it('always returns a string', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (template, name) => {
        expect(typeof applyTemplate(template, name)).toBe('string')
      }),
    )
  })
})
