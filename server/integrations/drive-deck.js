// Saves an uploaded pitch deck to the website-decks folder in Google Drive through a small
// Google Apps Script web app (see scripts/drive-deck-upload.gs), which answers with the Drive link.
const TIMEOUT_MS = 60_000

export function driveDeckConfigured(env = process.env) {
  return Boolean(env.DRIVE_DECK_UPLOAD_URL)
}

export async function sendDeckToDrive({ bytes, filename, contentType, company }, env = process.env) {
  if (!driveDeckConfigured(env)) throw new Error('Google Drive deck upload is not configured.')
  const response = await fetch(env.DRIVE_DECK_UPLOAD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      company: company || '',
      filename,
      contentType,
      data: Buffer.from(bytes).toString('base64'),
    }),
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.ok || !/^https:\/\/drive\.google\.com\//.test(data.url || '')) {
    throw new Error(`Drive upload failed (${response.status}${data?.error ? `: ${data.error}` : ''})`)
  }
  return data.url
}
