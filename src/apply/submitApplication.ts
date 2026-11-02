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

function deckContentType(file: File) {
  if (file.type === PDF || file.name.toLowerCase().endsWith('.pdf')) return PDF
  return PPTX
}

// Decks go straight from the browser to the Silkroad Google Drive folder through a Google Apps
// Script web app (scripts/drive-deck-upload.gs). The site only stores the returned Drive link.
const DRIVE_DECK_UPLOAD_URL =
  import.meta.env.VITE_DRIVE_DECK_UPLOAD_URL ||
  'https://script.google.com/macros/s/AKfycbz1sGb0GD6C7Fy67RLU-19U5PN50iHv0Pn7ZXv5z5-K-H-ZjLSPhmeGJv04scSRdHxsBg/exec'

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function uploadDeckToDrive(file: File, company: string): Promise<string> {
  const response = await fetch(DRIVE_DECK_UPLOAD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ company, filename: file.name, contentType: deckContentType(file), data: await toBase64(file) }),
  })
  const body = await response.json().catch(() => null)
  if (!body?.ok || !/^https:\/\/drive\.google\.com\//.test(body.url || '')) throw new Error('DRIVE_UPLOAD_FAILED')
  return body.url
}

export async function submitApplication(input: SubmitApplicationInput) {
  let deckFileUrl: string | null = null
  let deckUploadFailed = false
  if (input.tab === 'founder' && input.deckFile) {
    try {
      deckFileUrl = await uploadDeckToDrive(input.deckFile, input.values.company || '')
    } catch (error) {
      // Never lose an application because the upload failed: submit without the file.
      console.warn('Deck upload failed, submitting without the file:', error)
      deckUploadFailed = true
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
      deckFileUrl: deckFileUrl || undefined,
      deckUploadFailed: deckUploadFailed || undefined,
    }),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok || !body?.ok) throw new Error(body?.code || 'SUBMISSION_FAILED')
  return body
}
