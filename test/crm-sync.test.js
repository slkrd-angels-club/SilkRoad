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

test('a deck uploaded to Google Drive becomes the Deck link on the card', () => {
  const p = dealflowProperties({ ...founder, deckUrl: null, deckFileUrl: 'https://drive.google.com/file/d/abc/view' })
  assert.equal(p.Deck.url, 'https://drive.google.com/file/d/abc/view')
})

test('deck is sent to the n8n Drive webhook with the shared secret', async () => {
  const { sendDeckToDrive } = await import('../server/integrations/drive-deck.js')
  const realFetch = globalThis.fetch
  let seen = null
  globalThis.fetch = async (url, init) => {
    seen = { url: String(url), secret: init.headers['x-sra-secret'], file: init.body.get('deck') }
    return new Response(JSON.stringify({ ok: true, url: 'https://drive.google.com/file/d/xyz/view' }), { status: 200 })
  }
  try {
    const env = { N8N_DECK_WEBHOOK_URL: 'https://n8n.example/webhook/sra-deck-upload', N8N_DECK_WEBHOOK_SECRET: 's3cret' }
    const url = await sendDeckToDrive({ bytes: new Uint8Array([1]), filename: 'deck.pdf', contentType: 'application/pdf', company: 'Acme' }, env)
    assert.equal(url, 'https://drive.google.com/file/d/xyz/view')
    assert.equal(seen.secret, 's3cret')
    assert.equal(seen.file.name, 'deck.pdf')
  } finally {
    globalThis.fetch = realFetch
  }
})
