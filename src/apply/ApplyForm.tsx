import { useRef, useState } from 'react'
import { AI_ENABLED } from '../lib/features'
import { motion } from 'framer-motion'
import { useI18n } from '../i18n'
import { ArrowUpRight } from '../components/ui'
import { ScreeningResult } from './ScreeningResult'
import type { Screening } from './screening'
import { submitApplication } from './submitApplication'

// Deck upload accepts PDF/PPTX. The extractor (pdf.js + jszip) is heavy, so it's
// dynamically imported in pickDeck — it never touches the initial bundle.
const DECK_ACCEPT =
  '.pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation'

export type Tab = 'investor' | 'founder'

const EASE = [0.16, 1, 0.3, 1] as const
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

type Values = Record<string, string>
type Phase = 'form' | 'screening' | 'sent'

/**
 * The intake. Two tabs — investor / founder — with only the basics.
 *
 * Founder submissions are AI-screened: on submit we POST to /api/screen, which
 * asks Claude to auto-tag sector + stage, score investability, surface
 * strengths/flags and match the club's theses. The founder sees the pre-screen
 * instantly; a partner still reviews every application.
 *
 * Investor submissions just confirm. No backend writes yet — wire `values` to
 * your CRM where marked.
 */
export function ApplyForm({ initialTab = 'investor' }: { initialTab?: Tab }) {
  const { t, lang } = useI18n()
  const a = t.apply
  const [tab, setTab] = useState<Tab>(initialTab)
  const [v, setV] = useState<Values>({})
  const [errors, setErrors] = useState<Values>({})
  const [phase, setPhase] = useState<Phase>('form')
  const [screen, setScreen] = useState<Screening | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deckText, setDeckText] = useState('')
  const [deckFile, setDeckFile] = useState<File | null>(null)
  const [deck, setDeck] = useState<{ name: string; status: 'reading' | 'ready' | 'error'; err?: string } | null>(null)
  const deckInput = useRef<HTMLInputElement>(null)

  const set = (k: string) => (val: string) => {
    setV((s) => ({ ...s, [k]: val }))
    setErrors((e) => (e[k] ? { ...e, [k]: '' } : e))
  }

  const pickDeck = async (file?: File) => {
    if (!file) return
    setDeckFile(file)
    setDeck({ name: file.name, status: 'reading' })
    setDeckText('')
    try {
      const { extractDeckText } = await import('../lib/deck')
      const text = await extractDeckText(file)
      setDeckText(text)
      setDeck({ name: file.name, status: 'ready' })
    } catch (e) {
      const code = e instanceof Error ? e.message : ''
      if (code === 'too-big' || code === 'unsupported') setDeckFile(null)
      const err =
        code === 'too-big' ? a.deckErrBig : code === 'unsupported' ? a.deckErrUnsupported : a.deckErrEmpty
      setDeck({ name: file.name, status: 'error', err })
    }
  }

  const clearDeck = () => {
    setDeckFile(null)
    setDeck(null)
    setDeckText('')
    if (deckInput.current) deckInput.current.value = ''
  }

  const switchTab = (next: Tab) => {
    setSubmitError('')
    setTab(next)
    setErrors({})
  }

  const required =
    tab === 'investor'
      ? ['name', 'email', 'phone', 'ticket']
      : ['name', 'email', 'phone', 'company', 'stage', 'description']

  const reset = () => {
    setSubmitError('')
    setSaving(false)
    setV({})
    setErrors({})
    setScreen(null)
    setPhase('form')
    clearDeck()
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    const errs: Values = {}
    for (const id of required) {
      if (!String(v[id] ?? '').trim()) errs[id] = a.required
    }
    if (v.email && !EMAIL.test(v.email)) errs.email = a.badEmail
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSubmitError('')

    // → send `{ tab, ...v }` to your CRM/endpoint here.

    if (tab === 'investor') {
      setSaving(true)
      try {
        await submitApplication({ tab, lang, values: v, screening: null, deckText: '', deckFile: null })
      } catch {
        setSubmitError(
          lang === 'ru'
            ? 'Не удалось отправить заявку. Ваши данные сохранены в форме — попробуйте ещё раз.'
            : 'We could not send your application. Your entries are still here — please try again.',
        )
        return
      } finally {
        setSaving(false)
      }
      setPhase('sent')
      return
    }

    // Founder: run the AI pre-screen (only when AI features are switched on).
    setScreen(null)
    let screeningResult: Screening | null = null
    if (AI_ENABLED) try {
      setPhase('screening')
      const res = await fetch('/api/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lang,
          submission: {
            company: v.company,
            description: v.description,
            stage: v.stage,
            deck: v.deck,
            deckText: deckText || undefined,
          },
        }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.result) setScreen(data.result as Screening)
      if (res.ok && data?.result) screeningResult = data.result as Screening
    } catch {
      /* screening is a bonus — a failure still accepts the application */
    }
    setSaving(true)
    try {
      await submitApplication({ tab, lang, values: v, screening: screeningResult, deckText, deckFile })
    } catch {
      setSubmitError(
        lang === 'ru'
          ? 'Не удалось отправить заявку. Ваши данные сохранены в форме — попробуйте ещё раз.'
          : 'We could not send your application. Your entries are still here — please try again.',
      )
      setPhase('form')
      return
    } finally {
      setSaving(false)
    }
    setPhase('sent')
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-rule bg-white">
      {/* tabs — hidden once submitted */}
      {phase === 'form' && (
        <div className="grid grid-cols-2 border-b border-rule" role="tablist">
          {(['investor', 'founder'] as Tab[]).map((k) => {
            const on = tab === k
            return (
              <button
                key={k}
                role="tab"
                aria-selected={on}
                onClick={() => switchTab(k)}
                className={`relative px-5 py-4 font-display text-[15px] font-semibold transition-colors duration-200 ${
                  on ? 'text-oxford' : 'text-ink-45 hover:text-oxford'
                }`}
              >
                {k === 'investor' ? a.tabInvestor : a.tabFounder}
                {on && (
                  <motion.span
                    layoutId="apply-tab"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-turquoise"
                    transition={{ duration: 0.35, ease: EASE }}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}

      {phase === 'screening' ? (
        <Analyzing label={a.analyzing} />
      ) : phase === 'sent' && screen ? (
        <ScreeningResult data={screen} onReset={reset} resetLabel={a.again} />
      ) : phase === 'sent' ? (
        <Sent a={a} onReset={reset} />
      ) : (
        <motion.form
          key={tab}
          onSubmit={submit}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8"
        >
          <input
            type="text"
            value={v.contactWebsite ?? ''}
            onChange={(e) => set('contactWebsite')(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <Field id="name" label={a.name} v={v} errors={errors} set={set} />
          <Field id="email" label={a.email} type="email" v={v} errors={errors} set={set} />
          <Field id="phone" label={a.phone} placeholder="+7 …" v={v} errors={errors} set={set} />

          {tab === 'investor' ? (
            <Select
              id="ticket"
              label={a.ticket}
              options={a.ticketOptions}
              placeholder={a.select}
              v={v}
              errors={errors}
              set={set}
            />
          ) : (
            <Field id="company" label={a.company} v={v} errors={errors} set={set} />
          )}

          {tab === 'founder' && (
            <>
              <Select
                id="stage"
                label={a.stage}
                options={a.stageOptions}
                placeholder={a.select}
                v={v}
                errors={errors}
                set={set}
              />
              <div>
                <Label text={a.deck} optional={a.optional} />
                <input
                  type="text"
                  value={v.deck ?? ''}
                  placeholder="https://…"
                  onChange={(e) => set('deck')(e.target.value)}
                  className={`${inputCls} border-rule`}
                />

                {/* …or attach the deck as a file; the AI reads it in-browser. */}
                <input
                  ref={deckInput}
                  type="file"
                  accept={DECK_ACCEPT}
                  className="hidden"
                  onChange={(e) => pickDeck(e.target.files?.[0])}
                />

                {!deck ? (
                  <button
                    type="button"
                    onClick={() => deckInput.current?.click()}
                    className="mt-2 inline-flex items-center gap-2 text-[13.5px] font-medium text-ink-45 transition-colors hover:text-oxford"
                  >
                    <UploadIcon />
                    {a.deckUpload}
                  </button>
                ) : (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-rule bg-snow px-3 py-2">
                    {deck.status === 'reading' ? (
                      <span className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-turquoise/25 border-t-turquoise" />
                    ) : (
                      <UploadIcon
                        className={deck.status === 'error' ? 'text-red-500' : 'text-turquoise'}
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink-70">
                      {deck.status === 'reading' ? a.deckReading : deck.name}
                    </span>
                    <button
                      type="button"
                      onClick={clearDeck}
                      className="shrink-0 text-[13px] font-medium text-ink-45 underline underline-offset-2 transition-colors hover:text-oxford"
                    >
                      {a.deckRemove}
                    </button>
                  </div>
                )}

                <p
                  className={`mt-1.5 text-[12.5px] ${
                    deck?.status === 'error' ? 'text-red-600' : 'text-ink-45'
                  }`}
                >
                  {deck?.status === 'error' ? deck.err : a.deckHint}
                </p>
              </div>
              <div className="sm:col-span-2">
                <Label text={a.description} />
                <p className="mb-2 text-[13px] text-ink-45">{AI_ENABLED ? a.descriptionHint : a.descriptionHintNoAi}</p>
                <textarea
                  rows={4}
                  value={v.description ?? ''}
                  onChange={(e) => set('description')(e.target.value)}
                  className={`w-full resize-y rounded-xl border bg-white px-4 py-3 text-[15px] text-ink outline-none transition-colors hover:border-ink-45/50 focus:border-turquoise ${
                    errors.description ? 'border-red-300' : 'border-rule'
                  }`}
                />
                {errors.description && (
                  <p className="mt-1.5 text-[13px] text-red-600">{errors.description}</p>
                )}
              </div>
            </>
          )}

          {tab === 'investor' && (
            <div className="sm:col-span-2">
              <Label text={a.message} optional={a.optional} />
              <textarea
                rows={3}
                value={v.message ?? ''}
                onChange={(e) => set('message')(e.target.value)}
                className="w-full resize-y rounded-xl border border-rule bg-white px-4 py-3 text-[15px] text-ink outline-none transition-colors hover:border-ink-45/50 focus:border-turquoise"
              />
            </div>
          )}

          {submitError && (
            <div
              role="alert"
              className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] leading-relaxed text-red-700"
            >
              {submitError}
            </div>
          )}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-oxford px-7 py-4 font-display text-[15.5px] font-semibold text-snow transition-colors duration-200 hover:bg-turquoise hover:text-oxford sm:w-auto"
            >
              {a.submit} <ArrowUpRight />
            </button>
          </div>
        </motion.form>
      )}
    </div>
  )
}

function Analyzing({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-5 px-6 py-16 text-center">
      <div className="relative grid size-12 place-items-center">
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-turquoise/25 border-t-turquoise"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
        />
        <span className="size-2 rounded-full bg-turquoise" />
      </div>
      <p className="font-display text-[15.5px] font-medium text-ink-70">{label}</p>
    </div>
  )
}

function Sent({ a, onReset }: { a: ReturnType<typeof useI18n>['t']['apply']; onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="px-6 py-14 text-center sm:px-10"
    >
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-turquoise/15">
        <svg viewBox="0 0 20 20" className="size-6 text-turquoise" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 10.5l4 4 8-8" />
        </svg>
      </span>
      <h3 className="mt-5 font-display text-h5 font-semibold">{a.successTitle}</h3>
      <p className="mx-auto mt-3 max-w-md text-[15.5px] leading-relaxed text-ink-70">{a.successBody}</p>
      <button
        onClick={onReset}
        className="mt-6 font-display text-[14.5px] font-medium text-ink-45 underline underline-offset-4 transition-colors hover:text-oxford"
      >
        {a.again}
      </button>
    </motion.div>
  )
}

function UploadIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`size-4 shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13V4M6.5 7.5 10 4l3.5 3.5M4 14v1.5A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5V14" />
    </svg>
  )
}

function Label({ text, optional }: { text: string; optional?: string }) {
  return (
    <label className="mb-1.5 flex items-baseline gap-2">
      <span className="font-display text-[14.5px] font-medium">{text}</span>
      {optional && <span className="text-[12px] text-ink-45">{optional}</span>}
    </label>
  )
}

type FieldProps = {
  id: string
  label: string
  type?: string
  placeholder?: string
  optional?: string
  v: Values
  errors: Values
  set: (k: string) => (val: string) => void
}

const inputCls =
  'w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-45/60 hover:border-ink-45/50 focus:border-turquoise'

function Field({ id, label, type = 'text', placeholder, optional, v, errors, set }: FieldProps) {
  const bad = !!errors[id]
  return (
    <div>
      <Label text={label} optional={optional} />
      <input
        type={type}
        value={v[id] ?? ''}
        placeholder={placeholder}
        onChange={(e) => set(id)(e.target.value)}
        className={`${inputCls} ${bad ? 'border-red-300' : 'border-rule'}`}
      />
      {bad && <p className="mt-1.5 text-[13px] text-red-600">{errors[id]}</p>}
    </div>
  )
}

function Select({
  id,
  label,
  options,
  placeholder,
  v,
  errors,
  set,
}: FieldProps & { options: string[] }) {
  const bad = !!errors[id]
  return (
    <div>
      <Label text={label} />
      <select
        value={v[id] ?? ''}
        onChange={(e) => set(id)(e.target.value)}
        className={`${inputCls} ${bad ? 'border-red-300' : 'border-rule'} ${
          v[id] ? 'text-ink' : 'text-ink-45/60'
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o} className="text-ink">
            {o}
          </option>
        ))}
      </select>
      {bad && <p className="mt-1.5 text-[13px] text-red-600">{errors[id]}</p>}
    </div>
  )
}
