import type { PutBlobResult } from '@vercel/blob'
import type { Screening } from './screening'

type ApplicationTab = 'investor' | 'founder'
type Values = Record<string, string>

type SubmitApplicationInput = {
  tab: ApplicationTab
  lang: 'ru' | 'en'
  values: Values
  screening: Screening | null
  deckText: string
  deckFile: File | null
}

const PDF = 'application/pdf'
const PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'

function safePathname(filename: string) {
  const safe = filename
    .normalize('NFKC')
    .replace(/[\\/]/g, '-')
    .replace(/[^\p{L}\p{N}._ ()-]+/gu, '-')
    .slice(-180)
  const unique = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
  return `applications/decks/${unique}-${safe || 'pitch-deck.pdf'}`
}

function deckContentType(file: File) {
  if (file.type === PDF || file.name.toLowerCase().endsWith('.pdf')) return PDF
  return PPTX
}

async function uploadDeck(file: File) {
  const { upload } = await import('@vercel/blob/client')
  return upload(safePathname(file.name), file, {
    access: 'private',
    handleUploadUrl: '/api/deck-upload',
    contentType: deckContentType(file),
    multipart: file.size > 5 * 1024 * 1024,
  })
}

async function cleanup(blob: PutBlobResult | null) {
  if (!blob) return
  await fetch('/api/blob-cleanup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: blob.url }),
    keepalive: true,
  }).catch(() => undefined)
}

export async function submitApplication(input: SubmitApplicationInput) {
  let blob: PutBlobResult | null = null
  try {
    if (input.tab === 'founder' && input.deckFile) {
      try {
        blob = await uploadDeck(input.deckFile)
      } catch (error) {
        // Never lose an application because file storage is down or not configured:
        // submit without the file (the extracted deck text still goes along).
        console.warn('Deck upload failed, submitting without the file:', error)
      }
    }

    const response = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tab: input.tab,
        lang: input.lang,
        values: input.values,
        screening: input.screening,
        deckText: input.deckText || undefined,
        contactWebsite: input.values.contactWebsite || '',
        deckBlob: blob
          ? { url: blob.url, pathname: blob.pathname, filename: input.deckFile?.name || blob.pathname }
          : undefined,
      }),
    })
    const body = await response.json().catch(() => null)
    if (!response.ok || !body?.ok) throw new Error(body?.code || 'SUBMISSION_FAILED')
    return body
  } catch (error) {
    await cleanup(blob)
    throw error
  }
}
