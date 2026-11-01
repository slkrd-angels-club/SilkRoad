import { notionRequest } from './integrations/notion.js'
import { labeledParagraph, notionText, paragraph, richText, title } from './integrations/notion-blocks.js'
import { deckTextToggle } from './notion.js'

// Silkroad workspace CRMs. IDs are not secrets; env vars let another workspace override them.
const DEFAULT_DEALFLOW_DATA_SOURCE_ID = 'cef7ef17-f8ee-4f49-ae52-57f96ea3c53b'
const DEFAULT_INVESTOR_CRM_DATA_SOURCE_ID = '4444f423-90a7-4b18-a659-10e756822c4e'

const ROUND_STAGES = new Set(['Pre-seed', 'Seed', 'Series A'])
const NOTES_LIMIT = 300

export function crmConfig(env = process.env) {
  const disabled = String(env.CRM_SYNC || '').toLowerCase() === 'off'
  return {
    disabled,
    dealflow: env.NOTION_DEALFLOW_DATA_SOURCE_ID || DEFAULT_DEALFLOW_DATA_SOURCE_ID,
    investors: env.NOTION_INVESTOR_CRM_DATA_SOURCE_ID || DEFAULT_INVESTOR_CRM_DATA_SOURCE_ID,
  }
}

function shorten(value, limit) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim()
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text
}

const day = (iso) => String(iso || new Date().toISOString()).slice(0, 10)

function linkParagraph(label, url) {
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [
        ...notionText(`${label}: `, { bold: true }),
        ...notionText(url ? 'open in Silkroad Applications' : '—', undefined, url || undefined),
      ],
    },
  }
}

// ---------- Founder → Dealflow CRM ----------

export function dealflowProperties(application) {
  const properties = {
    Startup: title(application.company),
    Stage: { select: { name: '📥 Deck In' } },
    'Screening Status': { select: { name: 'Новая' } },
    Source: { select: { name: 'Inbound' } },
    Founder: richText(application.name),
    Contact: richText([application.email, application.phone].filter(Boolean).join(' · ')),
    Notes: richText(shorten(application.description, NOTES_LIMIT)),
    'Date Added': { date: { start: day(application.submittedAt) } },
  }
  if (application.deckUrl) properties.Deck = { url: application.deckUrl }
  if (ROUND_STAGES.has(application.stage)) properties['Round Stage'] = { select: { name: application.stage } }
  return properties
}

export function dealflowBlocks(application, applicationUrl) {
  const blocks = [
    linkParagraph('Website application', applicationUrl),
    labeledParagraph('Submitted stage', application.stage),
  ]
  if (application.screening) {
    blocks.push(labeledParagraph('Website AI pre-score', `${application.screening.score}/100 — ${application.screening.verdict}`))
  }
  blocks.push(labeledParagraph('Description', shorten(application.description, 1_900)))
  if (application.deckText) blocks.push(deckTextToggle(application.deckText))
  return blocks
}

// ---------- Investor → Investor CRM ----------

export function investorNotes(application) {
  return [
    `Сайт ${day(application.submittedAt)}: чек ${application.ticket}`,
    application.phone ? `тел. ${application.phone}` : '',
    application.message ? `«${shorten(application.message, 180)}»` : '',
  ].filter(Boolean).join(' · ')
}

export function investorProperties(application) {
  return {
    Имя: title(application.name),
    Email: { email: application.email },
    Стадия: { select: { name: 'Lead' } },
    Тип: { select: { name: 'Angel' } },
    Заметки: richText(investorNotes(application)),
    'Следующий шаг': richText('Связаться по заявке с сайта'),
    'Дата следующего шага': { date: { start: day(application.submittedAt) } },
  }
}

export function investorBlocks(application, applicationUrl) {
  const blocks = [
    linkParagraph('Website application', applicationUrl),
    labeledParagraph('Cheque size', application.ticket),
    labeledParagraph('Phone', application.phone),
  ]
  if (application.message) blocks.push(labeledParagraph('Message', application.message))
  return blocks
}

// ---------- Notion I/O ----------

async function findOne(dataSourceId, filter) {
  const result = await notionRequest(`/data_sources/${dataSourceId}/query`, {
    method: 'POST',
    body: { filter, page_size: 1 },
  })
  return result?.results?.[0] || null
}

async function appendBlocks(pageId, children) {
  await notionRequest(`/blocks/${pageId}/children`, { method: 'PATCH', body: { children } })
}

async function createPage(dataSourceId, properties, children) {
  return notionRequest('/pages', {
    method: 'POST',
    body: { parent: { type: 'data_source_id', data_source_id: dataSourceId }, properties, children },
  })
}

async function syncFounder(application, applicationUrl, config) {
  const existing = await findOne(config.dealflow, { property: 'Startup', title: { equals: application.company } })
  if (existing) {
    await appendBlocks(existing.id, [
      paragraph(`🔁 New website application ${day(application.submittedAt)}`),
      ...dealflowBlocks(application, applicationUrl),
    ])
    return { action: 'updated', page: existing }
  }
  const page = await createPage(config.dealflow, dealflowProperties(application), dealflowBlocks(application, applicationUrl))
  return { action: 'created', page }
}

async function syncInvestor(application, applicationUrl, config) {
  const existing = await findOne(config.investors, { property: 'Email', email: { equals: application.email } })
  if (existing) {
    await notionRequest(`/pages/${existing.id}`, {
      method: 'PATCH',
      body: {
        properties: {
          'Следующий шаг': richText('Связаться по новой заявке с сайта'),
          'Дата следующего шага': { date: { start: day(application.submittedAt) } },
        },
      },
    })
    await appendBlocks(existing.id, [
      paragraph(`🔁 New website application ${day(application.submittedAt)}`),
      ...investorBlocks(application, applicationUrl),
    ])
    return { action: 'updated', page: existing }
  }
  const page = await createPage(config.investors, investorProperties(application), investorBlocks(application, applicationUrl))
  return { action: 'created', page }
}

/**
 * Mirrors a saved website application into the team CRM (Dealflow CRM for founders,
 * Investor CRM for investors). Best effort: never throws, so the applicant still
 * gets a success response if the CRM is unreachable or not shared with the integration.
 */
export async function syncApplicationToCrm(application, applicationUrl, env = process.env) {
  const config = crmConfig(env)
  if (config.disabled) return { action: 'skipped' }
  try {
    return application.type === 'founder'
      ? await syncFounder(application, applicationUrl, config)
      : await syncInvestor(application, applicationUrl, config)
  } catch (error) {
    console.warn('CRM sync failed:', error?.message || error)
    return { action: 'failed', error: error?.message || String(error) }
  }
}
