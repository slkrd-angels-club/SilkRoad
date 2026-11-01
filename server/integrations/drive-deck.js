// Sends an uploaded pitch deck to the n8n workflow "SRA 4 — Дек с сайта → Google Drive",
// which saves it in the website-decks folder and answers with the Drive link.
const TIMEOUT_MS = 60_000

export function driveDeckConfigured(env = process.env) {
  return Boolean(env.N8N_DECK_WEBHOOK_URL && env.N8N_DECK_WEBHOOK_SECRET)
}

export async function sendDeckToDrive({ bytes, filename, contentType, company }, env = process.env) {
  if (!driveDeckConfigured(env)) throw new Error('Google Drive deck upload is not configured.')
  const form = new FormData()
  form.append('company', company || '')
  form.append('filename', filename)
  form.append('deck', new Blob([bytes], { type: contentType }), filename)

  const response = await fetch(env.N8N_DECK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'x-sra-secret': env.N8N_DECK_WEBHOOK_SECRET },
    body: form,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.url || !/^https:\/\/drive\.google\.com\//.test(data.url)) {
    throw new Error(`Drive upload failed (${response.status})`)
  }
  return data.url
}
