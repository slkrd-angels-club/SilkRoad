/**
 * All user-facing copy for the Silkroad Angels Club site, in both languages.
 * CONTENT.ru and CONTENT.en share the exact same shape (Dict), so any section
 * can read `t.<key>` and get the active language.
 *
 * Shared, language-neutral data (contact details, portfolio companies) is
 * exported separately below.
 */

/** Contact points — single source of truth, imported by footer/chat/knowledge. */
export const CONTACT = {
  email: 'Invest@slkrd.club',
  phone: '+7 706 747 74 23',
  phoneRaw: '77067477423',
  /** Silkroad Innovation Hub — the club's parent organisation. */
  hub: 'https://silkroadinnovationhub.com/',
  linkedin: 'https://www.linkedin.com/company/silkroad-innovation-hub/',
  /** Both messengers resolve to the same number, so they never drift apart. */
  get telegram() {
    return `https://t.me/+${this.phoneRaw}`
  },
  get whatsapp() {
    return `https://wa.me/${this.phoneRaw}`
  },
}

/**
 * Portfolio companies (from the Silkroad Innovation Hub deck). `slug` maps to
 * /portfolio/<slug>.png. The first four are featured; the rest sit behind
 * "show more". `url` is set where the official site is known; otherwise the
 * card falls back to a web search for the name.
 */
/** `logo` overrides the default /portfolio/<slug>.png — set it where the
 *  company publishes a vector mark we can use instead of a raster one. */
export type Company = { slug: string; name: string; tag: string; url?: string; logo?: string }

export const PORTFOLIO: Company[] = [
  // featured
  { slug: 'higgsfield', name: 'Higgsfield', tag: 'Generative AI video for creators', url: 'https://higgsfield.ai' },
  { slug: 'alma', name: 'Alma', tag: 'AI-powered immigration law firm', url: 'https://www.tryalma.ai' },
  { slug: 'deepinfra', name: 'DeepInfra', tag: 'Infrastructure for ML models', url: 'https://deepinfra.com' },
  { slug: 'kodif', name: 'Kodif', tag: 'Gen-AI customer support automation', url: 'https://kodif.ai' },
  // the rest
  { slug: 'perceptis', name: 'Perceptis', tag: 'AI-generated business proposals' },
  { slug: 'datatruck', name: 'DataTruck', tag: 'AI logistics automation for freight', url: 'https://www.datatruck.io', logo: '/portfolio/datatruck.svg' },
  { slug: 'surfaice', name: 'Surfaice', tag: 'Autonomous construction automation' },
  { slug: 'numeo', name: 'Numeo', tag: 'AI freight matching for carriers', url: 'https://numeo.ai', logo: '/portfolio/numeo.svg' },
  { slug: 'atarino', name: 'Atarino', tag: 'Gamified AI assistant for drivers' },
  { slug: 'fleetmule', name: 'FleetMule', tag: 'Fleet management & logistics' },
  { slug: 'radar', name: 'Radar Therapeutics', tag: 'Programmable precision therapeutics' },
  { slug: 'topmd', name: 'TopMD Health', tag: 'AI medical concierge', url: 'https://www.topmdhealth.com' },
  { slug: 'chatfuel', name: 'Chatfuel', tag: 'AI OS for healthcare & wellness', url: 'https://chatfuel.com' },
  { slug: 'renotag', name: 'Renotag', tag: 'AI platform for home renovations' },
  { slug: 'tangible', name: 'Tangible', tag: 'Carbon tracking for construction' },
  { slug: 'edbridge', name: 'EdBridge', tag: 'Student advocacy for colleges' },
  { slug: 'freyt', name: 'Freyt', tag: 'Logistics platform for freight' },
  { slug: 'makonai', name: 'Makon AI', tag: 'AI mentors for online education' },
  { slug: 'aleem', name: 'Aleem', tag: 'AI English-learning app' },
  { slug: 'growyai', name: 'Growy AI', tag: 'AI coaching for employee wellbeing' },
  { slug: 'algebras', name: 'Algebras', tag: 'AI localization, 300+ languages' },
  { slug: 'ucode', name: 'uCode', tag: 'AI backend-as-a-service' },
  { slug: 'virtualstory', name: 'Virtual Story', tag: 'Interactive storytelling for schools' },
  { slug: 'emma', name: 'Emma', tag: 'Real-time AI data for airports' },
  { slug: 'handymaty', name: 'HandyMaty', tag: 'On-demand property maintenance' },
  { slug: 'openspot', name: 'OpenSpot', tag: 'Smart parking & EV charging' },
  { slug: 'interactiverange', name: 'Interactive Range', tag: 'Gamified AI cybersecurity for K-12' },
  { slug: 'tilmoch', name: 'Tilmoch', tag: 'AI translation for regional languages' },
  { slug: 'rette', name: 'Rette', tag: 'AI medical-billing co-pilot' },
  { slug: 'findecor', name: 'Findecor', tag: 'Furniture marketplace with AI' },
  { slug: 'aidmi', name: 'aidmi', tag: 'AI clinical assistant, behavioral health' },
  { slug: 'cayu', name: 'CAYU', tag: 'Build web & mobile apps with AI' },
  { slug: 'omicsone', name: 'Omics One', tag: 'Immune research & testing' },
  { slug: 'quickshipper', name: 'QuickShipper', tag: 'Multi-carrier delivery orchestration' },
  { slug: 'investbanq', name: 'investbanq', tag: 'AI-driven wealth management', url: 'https://investbanq.com' },
  { slug: 'miraitech', name: 'Mirai Tech', tag: 'AI health monitoring for rehab' },
  { slug: 'baseprompt', name: 'baseprompt', tag: 'Build & deploy LLM apps' },
  { slug: 'ctwin', name: 'C-TWIN', tag: 'AI digital twins for industry' },
  { slug: 'rfxai', name: 'RF{x}AI', tag: 'Automated RFPs & tenders' },
]

export type Dict = {
  nav: {
    radar: string
    calendar: string
    blog: string
    contacts: string
    faq: string
    apply: string
    forInvestors: string
  }
  radar: {
    index: string
    label: string
    title: string
    subtitle: string
    asOf: string
    kpis: string[]
    kpiNotes: string[]
    countriesTitle: string
    shareOf: string
    noData: string
    feedTitle: string
    feedNote: string
    eventsTitle: string
    sourcesTitle: string
    note: string
    countries: Record<string, string>
    sectors: Record<string, string>
    cities: Record<string, string>
    months: string[]
  }
  hero: {
    badge: string
    title: string
    subtitle: string
    cta: string
    scroll: string
  }
  value: {
    items: { title: string; body: string }[]
    hubTitle: string
    hubBody: string
  }
  advantages: {
    title: string
    subtitle: string
    items: { title: string; body: string }[]
  }
  track: {
    title: string
    subtitle: string
    stats: { n: string; label: string }[]
    note: string
  }
  club: {
    kicker: string
    title: string
    body1: string
    body2: string
    cta: string
    benefits: { title: string; body: string }[]
  }
  ecosystem: {
    title: string
    subtitle: string
    items: { name: string; body: string }[]
    cta: string
  }
  team: {
    title: string
    subtitle: string
    members: { photo: string; name: string; role: string; linkedin: string }[]
  }
  portfolio: {
    title: string
    subtitle: string
    visit: string
    readMore: string
    showLess: string
  }
  jobs: {
    title: string
    subtitle: string
    openRoles: string
    viewRoles: string
    featured: string
    note: string
  }
  apply: {
    title: string
    subtitle: string
    tabInvestor: string
    tabFounder: string
    name: string
    email: string
    phone: string
    company: string
    stage: string
    ticket: string
    deck: string
    deckUpload: string
    deckHint: string
    deckReading: string
    deckRemove: string
    deckErrUnsupported: string
    deckErrBig: string
    deckErrEmpty: string
    description: string
    descriptionHint: string
    message: string
    optional: string
    select: string
    ticketOptions: string[]
    stageOptions: string[]
    submit: string
    analyzing: string
    successTitle: string
    successBody: string
    again: string
    required: string
    badEmail: string
  }
  faq: {
    title: string
    items: { q: string; a: string }[]
  }
  footer: {
    ctaTitle: string
    ctaInvest: string
    ctaRaise: string
    tagline: string
    contactsLabel: string
    copyright: string
    privacy: string
  }
}

/** Team photos in public/, mapped to the people in the deck's "Our team" slide. */
const PHOTO = { asset: '/hub-2.jpg', abay: '/hub-1.jpg', rysty: '/hub-3.jpg' }

/** Public LinkedIn profiles — the portrait cards link straight through. */
const LINKEDIN = {
  asset: 'https://www.linkedin.com/in/abdualiyev/',
  abay: 'https://www.linkedin.com/in/abay-absamet/',
  rysty: 'https://www.linkedin.com/in/rystyissagulova/',
}

export const CONTENT: Record<'ru' | 'en', Dict> = {
  ru: {
    nav: {
      radar: 'Радар',
      calendar: 'Календарь',
      blog: 'Блог',
      contacts: 'Контакты',
      faq: 'FAQ',
      apply: 'Отправить заявку',
      forInvestors: 'Для инвесторов',
    },
    radar: {
      index: '05',
      label: 'Радар экосистемы',
      title: 'Пульс стартапов Центральной Азии',
      subtitle:
        'Финансирование, сделки и события по региону — по публичным отраслевым отчётам и сообщениям в СМИ. Каждая цифра со ссылкой на источник.',
      asOf: 'Данные за 2025 год · последняя сверка — июль 2026',
      kpis: [
        'Венчурный объём региона, 2025',
        'Казахстан, 2025',
        'Узбекистан, 2025',
        'Доля двух мегасделок',
      ],
      kpiNotes: [
        'Рекорд, RISE Research',
        'Рост почти в 3 раза год к году',
        'Рост в 11,3 раза с 2022 года',
        'Higgsfield и Uzum от объёма рынка',
      ],
      countriesTitle: 'Финансирование по странам',
      shareOf: 'от регионального объёма',
      noData: 'Публичных данных нет',
      feedTitle: 'Крупнейшие раскрытые раунды',
      feedNote: 'Раунды, официально объявленные компаниями или подтверждённые СМИ.',
      eventsTitle: 'Ключевые события экосистемы',
      sourcesTitle: 'Источники',
      note: 'Все показатели взяты из публичных источников, перечисленных выше. Это не инвестиционная рекомендация; данные обновляются вручную по мере выхода новых отчётов.',
      countries: {
        KZ: 'Казахстан',
        UZ: 'Узбекистан',
        KG: 'Кыргызстан',
        TJ: 'Таджикистан',
        TM: 'Туркменистан',
      },
      sectors: {
        fintech: 'Финтех',
        ai: 'ИИ',
        health: 'Здоровье',
        logistics: 'Логистика',
        agri: 'Агротех',
        ecommerce: 'E-commerce',
        deeptech: 'Deep tech',
        edtech: 'EdTech',
      },
      cities: {
        astana: 'Астана',
        tashkent: 'Ташкент',
        almaty: 'Алматы',
        bishkek: 'Бишкек',
        paloalto: 'Пало-Альто',
        sanfrancisco: 'Сан-Франциско',
      },
      months: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
    },
    hero: {
      badge: 'При поддержке Silkroad Innovation Hub',
      title: 'Инвестируйте в истории\nзавтрашнего дня уже сегодня',
      subtitle: 'Откройте доступ к перспективным стартапам Кремниевой долины',
      cta: 'Отправить заявку',
      scroll: 'Листайте вниз',
    },
    value: {
      items: [
        {
          title: 'Минимальный размер инвестиций',
          body: 'Со-инвестируйте вместе с клубом инвесторов от $10,000, тем самым минимизируя риски.',
        },
        {
          title: 'Эксклюзивные сделки из Кремниевой долины',
          body: 'Откройте доступ к перспективным сделкам на ранних стадиях с потенциалом экспоненциального роста.',
        },
        {
          title: 'Обучение и нетворкинг',
          body: 'Повышайте знания в сфере венчурного капитала через регулярные воркшопы и лекции, а также расширяйте сеть контактов с резидентами клуба со всего мира.',
        },
      ],
      hubTitle: 'Silkroad Innovation Hub',
      hubBody:
        'Создано основателем ведущего инновационного центра в Кремниевой долине.',
    },
    advantages: {
      title: 'Преимущества ангельского инвестирования',
      subtitle:
        'Ангельские инвестиции — это уникальная возможность получить кратную прибыль при небольших вложениях.',
      items: [
        {
          title: 'High Return Potential',
          body: 'Вложения в стартапы ранних стадий с высоким потенциалом роста могут приумножить ваш капитал в 10–100 раз.',
        },
        {
          title: 'Portfolio Diversification',
          body: 'Данный класс активов позволяет обеспечить независимость от волатильности фондового рынка.',
        },
        {
          title: 'Early Access',
          body: 'Станьте ранним инвестором в передовые инновационные компании на самом старте.',
        },
        {
          title: 'Innovation Impact',
          body: 'Участвуйте в развитии прорывных технологий, меняющих мир к лучшему.',
        },
      ],
    },
    club: {
      kicker: 'Клуб',
      title: 'Silkroad Angels Club',
      body1:
        'Уникальное сообщество ангел-инвесторов, стремящихся расширить свои знания в сфере венчурного капитала и инноваций, а также открыть доступ к эксклюзивным сделкам Кремниевой долины.',
      body2:
        'Помимо доступа к сделкам, мы предоставляем всю необходимую поддержку для того, чтобы вы достигли успеха в ангельском инвестировании.',
      cta: 'Отправить заявку',
      benefits: [
        { title: 'Эксклюзивный доступ к сделкам', body: 'Прямой доступ к избранным стартапам Кремниевой долины.' },
        { title: 'Гибкое участие', body: 'Годовое членство с возможностью продления на вашем пути инвестора.' },
        { title: 'Экспертное обучение', body: 'Развивайте навыки через практические семинары и мастер-классы.' },
        { title: 'Личное наставничество', body: 'Индивидуальные консультации с опытными лидерами клуба.' },
        { title: 'Доступ к ресурсам', body: 'Участвуйте в закрытых мероприятиях Silkroad Innovation Hub.' },
        { title: 'Саммит в Долине', body: 'Встречи с единомышленниками на ежегодном саммите в Кремниевой долине.' },
        { title: 'Без комиссий', body: 'Инвестируйте без дополнительных сборов за управление.' },
        { title: 'Свобода выбора', body: 'Принимайте инвестиционные решения без обязательств и ограничений.' },
        { title: 'Экосистема Кремниевой долины', body: 'Доступ к эксклюзивным сделкам через нашу обширную сеть основателей и инвесторов.' },
      ],
    },
    ecosystem: {
      title: 'Экосистема Silkroad',
      subtitle:
        'Мы инвестируем в стартапы, запускаем образовательные программы и развиваем сообщество в самом сердце Кремниевой долины.',
      items: [
        {
          name: 'Инвестиции в стартапы',
          body: 'Со-инвестируем в перспективные стартапы Кремниевой долины на ранних стадиях.',
        },
        {
          name: 'Образовательные программы',
          body: 'Готовим основателей к запуску в Долине; наши инвесторы первыми знакомятся с лучшими выпускниками и становятся их ранними партнёрами.',
        },
        {
          name: 'Silkroad Innovation Hub',
          body: 'Пространство в сердце Кремниевой долины, где основатели создают технологии будущего.',
        },
      ],
      cta: 'Отправить заявку',
    },
    track: {
      title: 'Цифры',
      subtitle:
        'Реальные результаты портфеля Silkroad Innovation Hub — от первого чека до Долины.',
      stats: [
        { n: '40', label: 'инвестиций' },
        { n: '1', label: 'единорог в портфеле' },
        { n: '3', label: 'компании с оценкой $100M+' },
        { n: '2–12x', label: 'рост оценки по избранным сделкам' },
        { n: '$300M', label: 'привлечено портфельными компаниями' },
        { n: '$1.23M', label: 'проинвестировано через Angel Club' },
      ],
      note: 'Platinum-партнёр TechCrunch Disrupt 2023–2026 · организатор Central Eurasia @ Silicon Valley — 1300+ участников, 157 венчурных фондов.',
    },
    team: {
      title: 'Наша команда',
      subtitle: 'Люди, которые стоят за хабом и клубом.',
      members: [
        { photo: PHOTO.asset, name: 'Асет Абдуалиев', role: 'Основатель', linkedin: LINKEDIN.asset },
        { photo: PHOTO.abay, name: 'Абай Абсамет', role: 'Сооснователь', linkedin: LINKEDIN.abay },
        { photo: PHOTO.rysty, name: 'Рысты Исагулова', role: 'Венчурный аналитик', linkedin: LINKEDIN.rysty },
      ],
    },
    portfolio: {
      title: 'Инвестиционный портфель',
      subtitle:
        'Наши портфельные компании меняют целые индустрии на американском рынке с помощью прорывных технологий. Резиденты клуба могут перейти на сайт каждой компании.',
      visit: 'На сайт',
      readMore: 'Показать все компании',
      showLess: 'Свернуть',
    },
    jobs: {
      title: 'Вакансии в портфельных компаниях',
      subtitle:
        'Компании из нашего портфеля нанимают. Позиции и счётчики подтягиваются напрямую с их карьерных площадок — мы ничего не редактируем вручную.',
      openRoles: 'открытых вакансий',
      viewRoles: 'Смотреть вакансии',
      featured: 'Свежие позиции',
      note: 'Цифры загружаются в реальном времени там, где карьерная площадка компании отдаёт публичные данные; у остальных мы даём прямую ссылку без счётчика, чтобы не показывать устаревшее число. Отклик и весь наём — на стороне компании.',
    },
    apply: {
      title: 'Подать заявку',
      subtitle: 'Несколько базовых вопросов. Ответим в течение 3 рабочих дней.',
      tabInvestor: 'Я инвестор',
      tabFounder: 'Я основатель',
      name: 'Имя и фамилия',
      email: 'Email',
      phone: 'Телефон',
      company: 'Компания',
      stage: 'Стадия',
      ticket: 'Размер чека',
      deck: 'Ссылка на питч-дек',
      deckUpload: 'или загрузите файл',
      deckHint: 'PDF или PPTX, до 15 МБ — ИИ прочитает дек',
      deckReading: 'Читаем дек…',
      deckRemove: 'Убрать',
      deckErrUnsupported: 'Поддерживаются только PDF и PPTX',
      deckErrBig: 'Файл больше 15 МБ',
      deckErrEmpty: 'Не удалось извлечь текст из файла',
      description: 'Что вы строите?',
      descriptionHint: 'Продукт, тяга, почему сейчас — пару предложений. Заявку сразу оценит ИИ.',
      message: 'Коротко о себе',
      optional: 'необязательно',
      select: 'Выберите',
      ticketOptions: ['$10k – $25k', '$25k – $50k', '$50k – $100k', '$100k+'],
      stageOptions: ['Идея / прототип', 'Pre-seed', 'Seed', 'Series A'],
      submit: 'Отправить заявку',
      analyzing: 'ИИ анализирует вашу заявку…',
      successTitle: 'Заявка отправлена',
      successBody:
        'Спасибо! Мы свяжемся с вами по указанным контактам в течение 3 рабочих дней.',
      again: 'Отправить ещё одну',
      required: 'Заполните это поле',
      badEmail: 'Проверьте адрес почты',
    },
    faq: {
      title: 'Частые вопросы',
      items: [
        {
          q: 'Что такое Silkroad Angels Club?',
          a: 'Закрытый клуб ангел-инвесторов, открывающий доступ к эксклюзивным сделкам из Кремниевой долины на ранней стадии. Члены клуба получают регулярное обучение в сфере венчурного капитала, возможность нетворкинга с другими инвесторами, а также участие в ежегодном Саммите в Кремниевой долине.',
        },
        {
          q: 'Какой минимальный порог для инвестиций?',
          a: 'Минимальная инвестиция в одну сделку начинается от $10,000. У клуба нет требований по минимальному количеству сделок в год, но мы рекомендуем участвовать в 10 сделках и более для формирования сбалансированного портфеля.',
        },
        {
          q: 'Как устроен инвестиционный процесс?',
          a: 'Каждый месяц вы получаете доступ к сделкам с полным инвестиционным анализом. Инвестиции совершаются через защищённую американскую платформу Sydecar.',
        },
        {
          q: 'Как формируется доход клуба?',
          a: 'Ежегодный взнос покрывает все привилегии клуба. При инвестициях мы разделяем успех с вами — наш доход зависит только от прибыльности ваших вложений.',
        },
        {
          q: 'Какая поддержка оказывается членам клуба?',
          a: 'Мы всегда рядом: обучаем, консультируем, делимся опытом и помогаем с техническими вопросами на каждом этапе вашего пути.',
        },
      ],
    },
    footer: {
      ctaTitle: 'Готовы сделать первый шаг?',
      ctaInvest: 'Хочу инвестировать',
      ctaRaise: 'Хочу привлечь инвестиции',
      tagline:
        'Закрытый клуб ангел-инвесторов при Silkroad Innovation Hub — эксклюзивные сделки Кремниевой долины, обучение и сообщество.',
      contactsLabel: 'Контакты',
      copyright: '© 2025 Slkrd. Все права защищены.',
      privacy: 'Политика конфиденциальности',
    },
  },

  en: {
    nav: {
      radar: 'Radar',
      calendar: 'Calendar',
      blog: 'Blog',
      contacts: 'Contacts',
      faq: 'FAQ',
      apply: 'Apply now',
      forInvestors: 'For investors',
    },
    radar: {
      index: '05',
      label: 'Ecosystem radar',
      title: 'The Central Asia startup pulse',
      subtitle:
        'Funding, deals and events across the region — drawn from published industry reports and press coverage. Every figure is sourced.',
      asOf: 'Full-year 2025 data · last checked July 2026',
      kpis: [
        'Regional VC volume, 2025',
        'Kazakhstan, 2025',
        'Uzbekistan, 2025',
        'Share from two mega-deals',
      ],
      kpiNotes: [
        'All-time high, RISE Research',
        'Nearly 3x year on year',
        '11.3x growth since 2022',
        'Higgsfield and Uzum, of market volume',
      ],
      countriesTitle: 'Funding by country',
      shareOf: 'of regional volume',
      noData: 'No public data',
      feedTitle: 'Largest disclosed rounds',
      feedNote: 'Rounds announced by the companies or confirmed in the press.',
      eventsTitle: 'Key ecosystem events',
      sourcesTitle: 'Sources',
      note: 'All figures come from the public sources listed above. This is not investment advice; the data is updated manually as new reports are published.',
      countries: {
        KZ: 'Kazakhstan',
        UZ: 'Uzbekistan',
        KG: 'Kyrgyzstan',
        TJ: 'Tajikistan',
        TM: 'Turkmenistan',
      },
      sectors: {
        fintech: 'Fintech',
        ai: 'AI',
        health: 'HealthTech',
        logistics: 'Logistics',
        agri: 'AgriTech',
        ecommerce: 'E-commerce',
        deeptech: 'Deep tech',
        edtech: 'EdTech',
      },
      cities: {
        astana: 'Astana',
        tashkent: 'Tashkent',
        almaty: 'Almaty',
        bishkek: 'Bishkek',
        paloalto: 'Palo Alto',
        sanfrancisco: 'San Francisco',
      },
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    },
    hero: {
      badge: 'Supported by Silkroad Innovation Hub',
      title: 'Invest in Tomorrow’s\nStories Today',
      subtitle: 'Unlock access to high-potential Silicon Valley startups',
      cta: 'Apply now',
      scroll: 'Scroll',
    },
    value: {
      items: [
        { title: 'Low minimum investment', body: 'Co-invest alongside the club from $10,000, spreading your risk across deals.' },
        { title: 'Exclusive Silicon Valley deals', body: 'Access promising early-stage deals with the potential for exponential growth.' },
        { title: 'Education & networking', body: 'Sharpen your venture-capital knowledge through regular workshops and lectures, and grow your network with club members from around the world.' },
      ],
      hubTitle: 'Silkroad Innovation Hub',
      hubBody: 'Built by the founder of a leading Silicon Valley innovation hub.',
    },
    advantages: {
      title: 'The upside of angel investing',
      subtitle: 'Angel investing is a rare chance at outsized returns from modest cheques.',
      items: [
        { title: 'High Return Potential', body: 'Early-stage bets in high-growth startups can multiply your capital 10–100×.' },
        { title: 'Portfolio Diversification', body: 'An asset class that stays independent of public-market volatility.' },
        { title: 'Early Access', body: 'Become an early investor in frontier companies, right at the start.' },
        { title: 'Innovation Impact', body: 'Take part in building breakthrough technology that changes the world.' },
      ],
    },
    club: {
      kicker: 'The club',
      title: 'Silkroad Angels Club',
      body1:
        'A community of angel investors set on deepening their expertise in venture capital and innovation — and unlocking access to exclusive Silicon Valley deals.',
      body2:
        'Beyond deal access, we give you all the support you need to actually succeed at angel investing.',
      cta: 'Apply now',
      benefits: [
        { title: 'Exclusive deal access', body: 'Direct access to hand-picked Silicon Valley startups.' },
        { title: 'Flexible membership', body: 'Annual membership, renewable as your investing journey grows.' },
        { title: 'Expert education', body: 'Build your skills through hands-on workshops and masterclasses.' },
        { title: 'Personal mentorship', body: 'One-on-one guidance from seasoned club leaders.' },
        { title: 'Resource access', body: 'Join private events at the Silkroad Innovation Hub.' },
        { title: 'Valley Summit', body: 'Meet like-minded investors at the annual Silicon Valley summit.' },
        { title: 'No fees', body: 'Invest with no additional management fees.' },
        { title: 'Freedom of choice', body: 'Make investment decisions with no obligations or lock-ins.' },
        { title: 'Silicon Valley ecosystem', body: 'Exclusive deals through our deep network of founders and investors.' },
      ],
    },
    ecosystem: {
      title: 'The Silkroad ecosystem',
      subtitle:
        'We invest in startups, run education programs, and grow a community in the heart of Silicon Valley.',
      items: [
        { name: 'Startup investments', body: 'We co-invest in promising early-stage Silicon Valley startups.' },
        { name: 'Education programs', body: 'We prepare founders to launch in the Valley; our investors meet the best graduates first, as their earliest partners.' },
        { name: 'Silkroad Innovation Hub', body: 'A space in the heart of Silicon Valley where founders build the technology of the future.' },
      ],
      cta: 'Apply now',
    },
    track: {
      title: 'Numbers',
      subtitle:
        'Real results from the Silkroad Innovation Hub portfolio — from first cheque to the Valley.',
      stats: [
        { n: '40', label: 'investments' },
        { n: '1', label: 'unicorn in the portfolio' },
        { n: '3', label: 'companies valued $100M+' },
        { n: '2–12x', label: 'valuation growth on select deals' },
        { n: '$300M', label: 'raised by portfolio companies' },
        { n: '$1.23M', label: 'invested through the Angel Club' },
      ],
      note: 'Platinum Partner of TechCrunch Disrupt 2023–2026 · host of Central Eurasia @ Silicon Valley — 1300+ attendees, 157 VCs.',
    },
    team: {
      title: 'Our team',
      subtitle: 'The people behind the hub and the club.',
      members: [
        { photo: PHOTO.asset, name: 'Asset Abdualiyev', role: 'Founder', linkedin: LINKEDIN.asset },
        { photo: PHOTO.abay, name: 'Abay Absamet', role: 'Co-Founder', linkedin: LINKEDIN.abay },
        { photo: PHOTO.rysty, name: 'Rysty Issagulova', role: 'Venture Analyst', linkedin: LINKEDIN.rysty },
      ],
    },
    portfolio: {
      title: 'Investment portfolio',
      subtitle:
        'Our portfolio companies are reshaping entire industries in the US market with breakthrough technology. Members can visit each company directly.',
      visit: 'Visit',
      readMore: 'Show all companies',
      showLess: 'Show less',
    },
    jobs: {
      title: 'Jobs at portfolio companies',
      subtitle:
        'Companies from our portfolio are hiring. Roles and counts load straight from their own job boards — nothing here is hand-edited.',
      openRoles: 'open roles',
      viewRoles: 'View roles',
      featured: 'Latest roles',
      note: 'Counts load in real time where the company job board exposes public data; the rest get a direct link with no number, rather than a hand-counted figure that would go stale. Applications and hiring happen on the company side.',
    },
    apply: {
      title: 'Apply',
      subtitle: 'A few basic questions. We reply within 3 business days.',
      tabInvestor: 'I’m an investor',
      tabFounder: 'I’m a founder',
      name: 'Full name',
      email: 'Email',
      phone: 'Phone',
      company: 'Company',
      stage: 'Stage',
      ticket: 'Cheque size',
      deck: 'Pitch deck link',
      deckUpload: 'or upload a file',
      deckHint: 'PDF or PPTX, up to 15 MB — our AI reads the deck',
      deckReading: 'Reading the deck…',
      deckRemove: 'Remove',
      deckErrUnsupported: 'Only PDF and PPTX are supported',
      deckErrBig: 'File is larger than 15 MB',
      deckErrEmpty: 'Could not extract text from the file',
      description: 'What are you building?',
      descriptionHint: 'Product, traction, why now — a few sentences. Our AI reviews it instantly.',
      message: 'A little about you',
      optional: 'optional',
      select: 'Select',
      ticketOptions: ['$10k – $25k', '$25k – $50k', '$50k – $100k', '$100k+'],
      stageOptions: ['Idea / prototype', 'Pre-seed', 'Seed', 'Series A'],
      submit: 'Send application',
      analyzing: 'Our AI is reviewing your application…',
      successTitle: 'Application sent',
      successBody:
        'Thank you! We’ll get back to you at the contacts you provided within 3 business days.',
      again: 'Send another',
      required: 'This field is required',
      badEmail: 'Check the email address',
    },
    faq: {
      title: 'Frequently asked',
      items: [
        { q: 'What is the Silkroad Angels Club?', a: 'A private club of angel investors offering access to exclusive early-stage Silicon Valley deals. Members get regular venture-capital education, networking with other investors, and a place at the annual Silicon Valley Summit.' },
        { q: 'What is the minimum investment?', a: 'The minimum per deal starts at $10,000. There is no required number of deals per year, but we recommend participating in 10 or more to build a balanced portfolio.' },
        { q: 'How does the investment process work?', a: 'Each month you get access to deals with full investment analysis. Investments are made through the secure US platform Sydecar.' },
        { q: 'How does the club earn?', a: 'An annual membership fee covers all club benefits. On deals, we share in your success — our income depends only on the returns of your investments.' },
        { q: 'What support do members receive?', a: 'We are always there: teaching, advising, sharing experience and helping with the technical side at every step of your journey.' },
      ],
    },
    footer: {
      ctaTitle: 'Ready to take the first step?',
      ctaInvest: 'I want to invest',
      ctaRaise: 'I want to raise',
      tagline:
        'A private angel-investor club at the Silkroad Innovation Hub — exclusive Silicon Valley deals, education and community.',
      contactsLabel: 'Contacts',
      copyright: '© 2025 Slkrd. All rights reserved.',
      privacy: 'Privacy policy',
    },
  },
}
