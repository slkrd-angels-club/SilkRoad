import { readJsonBody, sendJson } from '../server/http.js'
import { cleanupDeckBlob, normalizeSubmission, saveApplication, SubmissionError } from '../server/notion.js'
import { notifyApplicationSubmitted } from '../server/notifications/application-submitted.js'
import { notifyFounderFollowUp } from '../server/notifications/founder-follow-up.js'
import { syncApplicationToCrm } from '../server/crm-sync.js'

async function bestEffortCleanup(url) {
  try {
    await cleanupDeckBlob(url)
  } catch (error) {
    console.warn('Could not clean up temporary deck blob:', error?.message || error)
  }
}

export async function submissionsHandler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })

  let body
  try {
    body = await readJsonBody(req, 80_000)
  } catch (error) {
    return sendJson(res, error.statusCode || 400, { error: 'Bad request.', code: 'VALIDATION_ERROR' })
  }

  const blobUrl = body?.deckBlob?.url
  if (body?.contactWebsite) {
    await bestEffortCleanup(blobUrl)
    return sendJson(res, 201, { ok: true })
  }

  try {
    const application = normalizeSubmission(body)
    const saved = await saveApplication(application)
    // CRM card first, so the Telegram button can open it (falls back to the application page).
    const crm = await syncApplicationToCrm(application, saved.page.url)
    await Promise.all([
      bestEffortCleanup(saved.deckBlobUrl),
      notifyApplicationSubmitted(application, saved.page.url, crm?.page?.url),
      notifyFounderFollowUp(application, { pageId: saved.page.id }),
    ])
    return sendJson(res, 201, { ok: true, pageId: saved.page.id })
  } catch (error) {
    await bestEffortCleanup(blobUrl)
    console.error('Notion submission failed:', error?.message || error)
    const known = error instanceof SubmissionError
    return sendJson(res, known ? error.statusCode : 500, {
      error: known ? error.message : 'Application could not be saved.',
      code: known ? error.code : 'SUBMISSION_FAILED',
    })
  }
}

export default submissionsHandler
