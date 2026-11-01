import assert from 'node:assert/strict'
import test from 'node:test'
import {
  crmConfig,
  dealflowProperties,
  investorProperties,
  syncApplicationToCrm,
} from '../server/crm-sync.js'

const founder = {
  type: 'founder',
  name: 'Aida K.',
  email: 'aida@example.com',
  phone: '+7 700 000 0000',
  company: 'Acme AI',
  stage: 'Seed',
  description: 'x'.repeat(500),
  deckUrl: 'https://example.com/deck.pdf',
  screening: null,
  submittedAt: '2026-11-01T10:00:00.000Z',
}

const investor = {
  type: 'investor',
  name: 'Timur B.',
  email: 'timur@example.com',
  phone: '+998 90 000 0000',
  ticket: '$10K–$25K',
  message: 'Interested in AI deals',
  submittedAt: '2026-11-01T10:00:00.000Z',
}

test('founder lands in Deck In as a new inbound card the screening agent will pick up', () => {
  const p = dealflowProperties(founder)
  assert.equal(p.Stage.select.name, '📥 Deck In')
  assert.equal(p['Screening Status'].select.name, 'Новая')
  assert.equal(p.Source.select.name, 'Inbound')
  assert.equal(p['Round Stage'].select.name, 'Seed')
  assert.equal(p.Deck.url, founder.deckUrl)
  assert.ok(p.Notes.rich_text[0].text.content.length <= 300)
  assert.equal(p['Date Added'].date.start, '2026-11-01')
})

test('idea-stage founders get no Round Stage and no deck link when none given', () => {
  const p = dealflowProperties({ ...founder, stage: 'Idea / prototype', deckUrl: null })
  assert.equal(p['Round Stage'], undefined)
  assert.equal(p.Deck, undefined)
})

test('investor becomes an Angel lead with a follow-up step', () => {
  const p = investorProperties(investor)
  assert.equal(p.Стадия.select.name, 'Lead')
  assert.equal(p.Тип.select.name, 'Angel')
  assert.equal(p.Email.email, investor.email)
  assert.match(p.Заметки.rich_text[0].text.content, /\$10K–\$25K/)
})

test('config honours overrides and kill switch', () => {
  assert.equal(crmConfig({ NOTION_DEALFLOW_DATA_SOURCE_ID: 'abc' }).dealflow, 'abc')
  assert.equal(crmConfig({ CRM_SYNC: 'off' }).disabled, true)
})

test('sync never throws when Notion is unavailable', async () => {
  const saved = process.env.NOTION_TOKEN
  delete process.env.NOTION_TOKEN
  try {
    const result = await syncApplicationToCrm(investor, 'https://notion.so/x', {})
    assert.equal(result.action, 'failed')
  } finally {
    if (saved !== undefined) process.env.NOTION_TOKEN = saved
  }
})

test('existing investor is updated instead of duplicated', async () => {
  const calls = []
  const realFetch = globalThis.fetch
  process.env.NOTION_TOKEN = 'test'
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), method: init.method })
    const body = String(url).endsWith('/query') ? { results: [{ id: 'page-1' }] } : { id: 'page-1' }
    return new Response(JSON.stringify(body), { status: 200 })
  }
  try {
    const result = await syncApplicationToCrm(investor, 'https://notion.so/x', {})
    assert.equal(result.action, 'updated')
    assert.equal(calls.some((c) => c.url.endsWith('/pages') && c.method === 'POST'), false)
  } finally {
    globalThis.fetch = realFetch
    delete process.env.NOTION_TOKEN
  }
})

test('Telegram button opens the CRM card when one exists, else the application', async () => {
  const { createApplicationSubmittedNotification } = await import('../server/notifications/application-submitted.js')
  const withCrm = createApplicationSubmittedNotification(founder, 'https://notion.so/app', 'https://notion.so/crm')
  assert.deepEqual(withCrm.action, { label: 'Open in Dealflow CRM', url: 'https://notion.so/crm' })
  const fallback = createApplicationSubmittedNotification(investor, 'https://notion.so/app', undefined)
  assert.equal(fallback.action.url, 'https://notion.so/app')
})

test('uploaded PDF is attached to the new Dealflow card', async () => {
  const realFetch = globalThis.fetch
  process.env.NOTION_TOKEN = 'test'
  let createdBody = null
  globalThis.fetch = async (url, init) => {
    const u = String(url)
    let body = {}
    if (u.endsWith('/query')) body = { results: [] }
    else if (u.endsWith('/file_uploads')) body = { id: 'fu-1' }
    else if (u.endsWith('/send')) body = { id: 'fu-1', status: 'uploaded' }
    else if (u.endsWith('/pages')) { createdBody = JSON.parse(init.body); body = { id: 'card', url: 'https://notion.so/card' } }
    return new Response(JSON.stringify(body), { status: 200 })
  }
  try {
    const deckFile = { bytes: new Uint8Array([37, 80, 68, 70]), filename: 'deck.pdf', contentType: 'application/pdf' }
    const result = await syncApplicationToCrm({ ...founder, deckFile }, 'https://notion.so/app', {})
    assert.equal(result.action, 'created')
    assert.equal(createdBody.children[0].type, 'file')
    assert.equal(createdBody.children[0].file.file_upload.id, 'fu-1')
  } finally {
    globalThis.fetch = realFetch
    delete process.env.NOTION_TOKEN
  }
})
