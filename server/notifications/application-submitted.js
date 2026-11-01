import { sendTelegramMessage } from './telegram.js'

const SUMMARY_LIMIT = 1_200

const compact = (value) => String(value ?? '').replace(/\s+/g, ' ').trim()

function excerpt(value) {
  const text = compact(value)
  return text.length <= SUMMARY_LIMIT ? text : `${text.slice(0, SUMMARY_LIMIT - 1).trimEnd()}…`
}

function titleCase(value) {
  const text = compact(value)
  return text ? `${text[0].toUpperCase()}${text.slice(1)}` : ''
}

function founderMessage(application) {
  const screening = application.screening
  const lines = [
    '🚀 New founder application',
    '',
    `${application.name} · ${application.company}`,
    `Stage: ${application.stage}`,
  ]

  if (screening) lines.push(`AI assessment: ${titleCase(screening.verdict)} · ${screening.score}/100`)
  lines.push('', excerpt(screening?.summary || application.description))
  return lines.join('\n')
}

function investorMessage(application) {
  const lines = [
    '💼 New investor application',
    '',
    application.name,
    `Cheque size: ${application.ticket}`,
  ]

  const message = excerpt(application.message)
  if (message) lines.push('', message)
  return lines.join('\n')
}

const MESSAGE_FORMATTERS = { founder: founderMessage, investor: investorMessage }
const CRM_LABELS = { founder: 'Open in Dealflow CRM', investor: 'Open in Investor CRM' }

export function createApplicationSubmittedNotification(application, notionPageUrl, crmPageUrl) {
  const format = MESSAGE_FORMATTERS[application.type]
  if (!format) throw new TypeError(`Unsupported application type: ${application.type}`)
  return {
    text: format(application),
    action: crmPageUrl
      ? { label: CRM_LABELS[application.type], url: crmPageUrl }
      : { label: 'Open in Notion', url: notionPageUrl },
  }
}

export async function notifyApplicationSubmitted(application, notionPageUrl, crmPageUrl) {
  try {
    return await sendTelegramMessage(createApplicationSubmittedNotification(application, notionPageUrl, crmPageUrl))
  } catch (error) {
    console.warn('Could not send Telegram application notification:', error?.message || error)
    return false
  }
}
