import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface WelcomeScreenProps {
  onStartManual: () => void
  onStartTestData: () => void
}

const steps = [
  { emoji: '👥', key: '1' },
  { emoji: '📋', key: '2' },
  { emoji: '🎯', key: '3' },
  { emoji: '🗺️', key: '4' },
] as const

const floatingFood = ['🍝', '🥗', '🍰', '🍷', '🥘', '🧁']

export function WelcomeScreen({ onStartManual, onStartTestData }: WelcomeScreenProps) {
  const { t } = useTranslation()
  const [activeStep, setActiveStep] = useState(0)

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-gradient-to-br from-orange-50 via-white to-rose-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Animated header */}
      <div className="relative flex flex-col items-center overflow-hidden bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-12 text-white">
        {/* Floating food emojis */}
        {floatingFood.map((emoji, i) => (
          <span
            key={i}
            className="pointer-events-none absolute select-none text-2xl opacity-40"
            style={{
              left: `${10 + i * 16}%`,
              top: '-10px',
              animation: `floatDown ${3 + i * 0.5}s ease-in-out ${i * 0.4}s infinite`,
            }}
          >
            {emoji}
          </span>
        ))}

        <div className="relative flex items-center gap-3">
          <span className="text-5xl" style={{ animation: 'bounce 1s ease-in-out infinite' }}>
            🍽️
          </span>
          <div>
            <h1 className="text-3xl font-bold drop-shadow-sm md:text-4xl">{t('welcome.title')}</h1>
            <p className="mt-1 text-lg text-white/80">{t('welcome.subtitle')}</p>
          </div>
        </div>

        {/* Running person */}
        <div
          className="absolute bottom-2 right-6 text-3xl opacity-60"
          style={{ animation: 'runnerBob 0.5s ease-in-out infinite alternate' }}
        >
          🏃
        </div>
      </div>

      {/* Step guide */}
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        {/* Step navigation dots */}
        <div className="mb-8 flex justify-center gap-2">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              aria-label={`Step ${i + 1}`}
              className={[
                'h-2.5 rounded-full transition-all duration-300',
                i === activeStep
                  ? 'w-8 bg-orange-500'
                  : 'w-2.5 bg-gray-300 hover:bg-orange-300 dark:bg-gray-600',
              ].join(' ')}
            />
          ))}
        </div>

        {/* Step cards grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {steps.map((step, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={[
                'group rounded-2xl border-2 p-6 text-left transition-all duration-200',
                i === activeStep
                  ? 'border-orange-400 bg-white shadow-lg dark:border-orange-500 dark:bg-gray-800'
                  : 'border-transparent bg-white/60 hover:border-orange-200 hover:bg-white dark:bg-gray-800/40 dark:hover:border-orange-700 dark:hover:bg-gray-800',
              ].join(' ')}
            >
              <div className="mb-3 flex items-center gap-3">
                <span
                  className={[
                    'flex h-10 w-10 items-center justify-center rounded-full text-xl transition-transform duration-200',
                    i === activeStep ? 'scale-110 bg-orange-100 dark:bg-orange-900/40' : 'bg-gray-100 dark:bg-gray-700',
                  ].join(' ')}
                >
                  {step.emoji}
                </span>
                <span
                  className={[
                    'text-xs font-bold uppercase tracking-widest',
                    i === activeStep ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500',
                  ].join(' ')}
                >
                  {t('common.step', 'Stap')} {i + 1}
                </span>
              </div>
              <h2 className="mb-2 text-base font-bold text-gray-900 dark:text-gray-100">
                {t(`welcome.step${step.key}Title`)}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t(`welcome.step${step.key}Desc`)}
              </p>
            </button>
          ))}
        </div>

        {/* CTA section */}
        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onStartTestData}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-8 py-3.5 font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
            >
              <span>🚀</span>
              {t('welcome.ctaTestData')}
            </button>
            <button
              onClick={onStartManual}
              className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-8 py-3.5 font-semibold text-gray-700 transition-all duration-200 hover:border-orange-300 hover:bg-orange-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-orange-600 dark:hover:bg-gray-750"
            >
              <span>✏️</span>
              {t('welcome.ctaManual')}
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            {t('welcome.testDataNote')}
          </p>
          <button
            onClick={onStartManual}
            className="mt-1 text-xs text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline dark:text-gray-600 dark:hover:text-gray-400"
          >
            {t('welcome.skip')}
          </button>
        </div>
      </div>

      {/* CSS animations injected via style tag */}
      <style>{`
        @keyframes floatDown {
          0%   { transform: translateY(-20px) rotate(-10deg); opacity: 0.1; }
          50%  { opacity: 0.5; }
          100% { transform: translateY(120px) rotate(10deg); opacity: 0.1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes runnerBob {
          from { transform: translateY(0) scaleX(1); }
          to   { transform: translateY(-4px) scaleX(1); }
        }
      `}</style>
    </div>
  )
}
