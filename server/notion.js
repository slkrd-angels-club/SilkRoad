import { del, get, head } from '@vercel/blob'
import { createFounderFollowUpSection } from './founder-replies/notion.js'
import {
  bullet,
  divider,
  heading,
  labeledParagraph,
  notionText,
  paragraph,
  richText,
  textChunks as chunks,
  title,
  toggle,
  textChunks,
} from './integrations/notion-blocks.js'
import { NotionError, notionRequest, uploadFileToNotion } from './integrations/notion.js'

const MAX_DECK_BYTES = 15 * 1024 * 1024
const DECK_PREFIX = 'applications/decks/'
const DECK_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
])
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const VERDICTS = new Set(['strong', 'promising', 'early', 'weak'])
const VERDICT_LABEL = { strong: 'Strong', promising: 'Promising', early: 'Early', weak: 'Weak' }

export class SubmissionError extends Error {
  constructor(message, statusCode = 500, code = 'SUBMISSION_FAILED') {
    super(message)
    this.name = 'SubmissionError'
    this.statusCode = statusCode
    this.code = code
  }
}

const clean = (value, max) => String(value ?? '').trim().slice(0, max)

function required(value, label, max) {
  const result = clean(value, max)
  if (!result) throw new SubmissionError(`${label} is required.`, 400, 'VALIDATION_ERROR')
  return result
}

function optionalHttpUrl(value, label) {
  const result = clean(value, 2_000)
  if (!result) return ''
  try {
    const url = new URL(result)
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('protocol')
    return url.toString()
  } catch {
    throw new SubmissionError(`${label} must be a valid URL.`, 400, 'VALIDATION_ERROR')
  }
}

function normalizeStage(value) {
  const stage = required(value, 'Stage', 80)
  return stage === 'Идея / прототип' ? 'Idea / prototype' : stage
}

function normalizeScreening(value) {
  if (!value || typeof value !== 'object') return null
  const score = Math.max(0, Math.min(100, Number(value.score) || 0))
  const verdict = VERDICTS.has(value.verdict) ? value.verdict : null
  if (!verdict) return null
  const list = (items, maxItems) =>
    (Array.isArray(items) ? items : []).map((item) => clean(item, 500)).filter(Boolean).slice(0, maxItems)
  const missingItems = list(value.missingItems, 5)
  return {
    score,
    verdict,
    summary: clean(value.summary, 1_500),
    stage: clean(value.stage, 80),
    sectors: list(value.sectors, 3),
    strengths: list(value.strengths, 3),
    flags: list(value.flags, 3),
    matchedTheses: list(value.matchedTheses, 4),
    missingItems,
    needsFollowUp: Boolean(value.needsFollowUp && missingItems.length),
  }
}

export function normalizeSubmission(body) {
  const type = body?.tab === 'founder' ? 'founder' : body?.tab === 'investor' ? 'investor' : null
  if (!type) throw new SubmissionError('Application type is invalid.', 400, 'VALIDATION_ERROR')

  const values = body.values && typeof body.values === 'object' ? body.values : {}
  const email = required(values.email, 'Email', 320).toLowerCase()
  if (!EMAIL.test(email)) throw new SubmissionError('Email is invalid.', 400, 'VALIDATION_ERROR')

  const common = {
    type,
    lang: body.lang === 'ru' ? 'ru' : 'en',
    name: required(values.name, 'Name', 200),
    email,
    phone: required(values.phone, 'Phone', 80),
    submittedAt: new Date().toISOString(),
  }

  if (type === 'investor') {
    return {
      ...common,
      ticket: required(values.ticket, 'Cheque size', 80),
      message: clean(values.message, 5_000),
    }
  }

  return {
    ...common,
    company: required(values.company, 'Company', 200),
    stage: normalizeStage(values.stage),
    description: required(values.description, 'Description', 20_000),
    deckUrl: optionalHttpUrl(values.deck, 'Deck URL'),
    deckText: clean(body.deckText, 12_000),
    screening: normalizeScreening(body.screening),
    deckBlob: body.deckBlob && typeof body.deckBlob === 'object' ? body.deckBlob : null,
  }
}

function safeFilename(value, contentType) {
  const fallback = contentType === 'application/pdf' ? 'pitch-deck.pdf' : 'pitch-deck.pptx'
  const name = String(value || fallback)
    .split(/[\\/]/)
    .pop()
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[^\p{L}\p{N}._ ()-]+/gu, '-')
    .slice(0, 180)
  return name || fallback
}

function validateBlobUrl(value) {
  try {
    const url = new URL(String(value || ''))
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.private.blob.vercel-storage.com')) throw new Error('host')
    if (!url.pathname.slice(1).startsWith(DECK_PREFIX)) throw new Error('path')
    return url.toString()
  } catch {
    throw new SubmissionError('Deck upload reference is invalid.', 400, 'VALIDATION_ERROR')
  }
}

async function uploadDeckToNotion(deckBlob) {
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.VERCEL_OIDC_TOKEN) {
    throw new SubmissionError('Deck storage is not configured.', 503, 'CONFIGURATION_ERROR')
  }

  const url = validateBlobUrl(deckBlob?.url)
  let metadata
  try {
    metadata = await head(url)
  } catch {
    throw new SubmissionError('The uploaded deck could not be found.', 400, 'DECK_UPLOAD_FAILED')
  }

  if (!metadata.pathname.startsWith(DECK_PREFIX) || metadata.size > MAX_DECK_BYTES || !DECK_TYPES.has(metadata.contentType)) {
    throw new SubmissionError('The uploaded deck is invalid.', 400, 'DECK_UPLOAD_FAILED')
  }

  const file = await get(url, { access: 'private', useCache: false })
  if (!file || file.statusCode !== 200) {
    throw new SubmissionError('The uploaded deck could not be read.', 400, 'DECK_UPLOAD_FAILED')
  }

  const bytes = await new Response(file.stream).arrayBuffer()
  const filename = safeFilename(deckBlob.filename || metadata.pathname, metadata.contentType)
  try {
    const completed = await uploadFileToNotion({
      bytes,
      filename,
      contentType: metadata.contentType,
    })
    return { id: completed.id, filename, blobUrl: url, bytes, contentType: metadata.contentType }
  } catch (error) {
    if (error instanceof NotionError) {
      throw new SubmissionError(error.message, error.statusCode, 'DECK_UPLOAD_FAILED')
    }
    throw error
  }
}

export function deckTextToggle(text) {
  return toggle('📄 Pitch deck text (extracted)', textChunks(text).map(paragraph).slice(0, 90))
}

function founderBlocks(application) {
  const blocks = [
    heading('Application'),
    labeledParagraph('Founder', application.name),
    labeledParagraph('Submitted stage', application.stage),
    heading('Description', 3),
    ...chunks(application.description).map(paragraph),
  ]

  if (application.deckUrl) {
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          ...notionText('Pitch deck URL: ', { bold: true, italic: false, strikethrough: false, underline: false, code: false, color: 'default' }),
          ...notionText(application.deckUrl, undefined, application.deckUrl),
        ],
      },
    })
  }

  if (application.deckText) blocks.push(deckTextToggle(application.deckText))

  const report = application.screening
  if (!report) {
    blocks.push(divider(), {
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: notionText('No website pre-screen. The screening agent scores this deal in Dealflow CRM.'),
        icon: { type: 'emoji', emoji: 'ℹ️' },
        color: 'gray_background',
      },
    })
    return blocks
  }
  blocks.push(divider(), heading('AI Screening Report'))

  if (report.summary) {
    blocks.push({
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: notionText(report.summary),
        icon: { type: 'emoji', emoji: '🤖' },
        color: 'blue_background',
      },
    })
  }
  if (report.stage) blocks.push(labeledParagraph('AI-estimated stage', report.stage))
  if (report.sectors.length) blocks.push(labeledParagraph('Sectors', report.sectors.join(', ')))
  if (report.strengths.length) blocks.push(heading('Strengths', 3), ...report.strengths.map(bullet))
  if (report.flags.length) blocks.push(heading('Risks and improvements', 3), ...report.flags.map(bullet))
  if (report.matchedTheses.length) {
    blocks.push(heading('Thesis matches', 3), ...report.matchedTheses.map(bullet))
  }
  blocks.push(paragraph('Automated pre-screen only. A partner should review every application.'))
  if (report.needsFollowUp) {
    blocks.push(...createFounderFollowUpSection(report.missingItems, application.lang))
  }
  return blocks
}

export async function saveApplication(application) {
  if (application.type === 'investor') {
    const dataSourceId = process.env.NOTION_INVESTORS_DATA_SOURCE_ID
    if (!dataSourceId) throw new SubmissionError('Investor database is not configured.', 503, 'CONFIGURATION_ERROR')
    const page = await notionRequest('/pages', {
      method: 'POST',
      body: {
        parent: { type: 'data_source_id', data_source_id: dataSourceId },
        properties: {
          Name: title(application.name),
          Email: { email: application.email },
          Phone: { phone_number: application.phone },
          'Cheque Size': { select: { name: application.ticket } },
          Message: richText(application.message),
          Language: { select: { name: application.lang.toUpperCase() } },
          Status: { select: { name: 'New' } },
          'Submitted At': { date: { start: application.submittedAt } },
        },
      },
    })
    return { page, deckBlobUrl: null }
  }

  const dataSourceId = process.env.NOTION_FOUNDERS_DATA_SOURCE_ID
  if (!dataSourceId) throw new SubmissionError('Founder database is not configured.', 503, 'CONFIGURATION_ERROR')

  let deckUpload = null
  if (application.deckBlob) deckUpload = await uploadDeckToNotion(application.deckBlob)

  const properties = {
    Company: title(application.company),
    'Founder Name': richText(application.name),
    Email: { email: application.email },
    Phone: { phone_number: application.phone },
    Stage: { select: { name: application.stage } },
    'Deck URL': { url: application.deckUrl || null },
    'Deck File': {
      files: deckUpload
        ? [{ type: 'file_upload', file_upload: { id: deckUpload.id }, name: deckUpload.filename }]
        : [],
    },
    Language: { select: { name: application.lang.toUpperCase() } },
    Status: { select: { name: 'New' } },
    'Submitted At': { date: { start: application.submittedAt } },
  }
  if (application.screening) {
    properties['AI Score'] = { number: application.screening.score }
    properties['AI Verdict'] = { select: { name: VERDICT_LABEL[application.screening.verdict] } }
  }

  const page = await notionRequest('/pages', {
    method: 'POST',
    body: {
      parent: { type: 'data_source_id', data_source_id: dataSourceId },
      properties,
      children: founderBlocks(application),
    },
  })
  return {
    page,
    deckBlobUrl: deckUpload?.blobUrl || null,
    deck: deckUpload
      ? { bytes: deckUpload.bytes, filename: deckUpload.filename, contentType: deckUpload.contentType }
      : null,
  }
}

export async function cleanupDeckBlob(value) {
  if (!value) return
  const url = validateBlobUrl(value)
  await del(url)
}
