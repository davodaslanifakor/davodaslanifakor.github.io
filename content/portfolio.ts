export type Locale = 'en' | 'fa'
export type I18nText = Record<Locale, string>

/** Persian copy is kept in the data but not offered yet; add 'fa' to show the language switch. */
export const enabledLocales: Locale[] = ['en']

export interface Role {
  id: string
  company: string
  title: I18nText
  period: string
  receipt: I18nText
  summary: I18nText
}

export interface Skill {
  id: string
  name: string
  usedFor: I18nText
  group: 'core' | 'fullstack' | 'quality' | 'ai'
}

export interface CaseStudy {
  id: string
  title: I18nText
  problem: I18nText
  action: I18nText
  result: I18nText
  links?: { label: string; href: string }[]
}

export interface MusicTrack {
  id: string
  title: string
  artist: string
  spotifyUrl: string
  note: I18nText
}

export interface SceneObject {
  id: string
  mesh: string
  camera: string
  label: I18nText
  action: 'modal' | 'zoom-editor' | 'tooltip' | 'toggle-sound' | 'play-game'
  contentRef?: string
}

const text = (en: string): I18nText => ({
  en,
  fa: `TODO(translate): ${en}`,
})

/** Copy David supplied in both languages. */
const both = (en: string, fa: string): I18nText => ({ en, fa })

export interface StoryChapter {
  id: string
  marker: I18nText
  title: I18nText
  body: I18nText
}

export interface Article {
  id: string
  title: string
  summary: I18nText
  published: string
  href: string
}

export interface Keepsake {
  id: string
  title: I18nText
  body: I18nText
}

export const profile = {
  name: 'Davoud Fakour',
  alternateNames: ['Davod Fakor', 'Davoud Aslani Fakour'],
  role: text('Senior Frontend Engineer & Technical Lead'),
  location: text('Istanbul, Türkiye'),
  specialties: 'Vue.js / Nuxt / TypeScript',
  header: text('Davoud Fakour — Senior Frontend Engineer & Technical Lead · Vue.js / TypeScript · Istanbul'),
  summary: text('10+ years building production SaaS, fintech, payments, and education products — from client-side architecture through testing, release, and performance. AI-assisted development and AI SDKs ship with human review before production.'),
  tagline: text('Most frontend engineers build interfaces. I build the systems people use to create, collaborate, and keep a product coherent as it grows.'),
  cta: text('Open to senior Vue / frontend leadership roles in AI SaaS — available for remote work from Türkiye.'),
  email: 'davodaslanifakor@gmail.com',
  linkedin: 'https://www.linkedin.com/in/davoud-fakour',
  github: 'https://github.com/davodaslanifakor',
  medium: 'https://medium.com/@DavoudAslaniFakour',
  calendly: 'https://calendly.com/davodaslanifakor/request-call',
  // TODO(David): add the public CV PDF to /public and set its path here.
  cvPath: 'TODO(David)',
  education: text('Associate’s Degree, Computer Software Engineering — Azad University (2013–2015)'),
  languages: text('English — professional working proficiency · Persian — native'),
}

export const ui = {
  bookCall: both('Book a call', 'رزرو تماس'),
  bookingTitle: both('Let’s talk', 'بیایید صحبت کنیم'),
  bookingFrame: both('Schedule a call with Davoud on Calendly', 'رزرو تماس با داوود در Calendly'),
  bookingLoading: both('Opening the calendar…', 'در حال باز کردن تقویم…'),
  bookingSlow: both('Calendar taking a while? Try again or open Calendly directly.', 'تقویم دیر باز می‌شود؟ دوباره تلاش کنید یا Calendly را مستقیم باز کنید.'),
  bookingRetry: both('Try again', 'تلاش دوباره'),
  bookingExternal: both('Open Calendly', 'باز کردن Calendly'),
  bookingBack: both('Back to the room', 'بازگشت به اتاق'),
  roomTitle: text('Behind the Build'),
  portfolioLabel: text('Portfolio / 2026'),
  portfolioControls: text('Portfolio controls'),
  screenStylePreview: both('Screen styles', 'سبک نمایشگرها'),
  screenTheme: both('Screen theme', 'تم نمایشگرها'),
  screenThemes: {
    slate: both('Slate', 'سنگی'),
    forest: both('Forest', 'جنگلی'),
    amber: both('Amber', 'کهربایی'),
    mono: both('Mono', 'تک‌رنگ'),
  },
  cvNavigation: text('CV navigation'),
  home: text('Davoud Fakour home'),
  skipToCv: text('Skip to CV'),
  exploreHint: text('Choose an object to open a real project story.'),
  objectNav: text('Explore the room'),
  loadingRoom: text('Setting the desk…'),
  roomUnavailable: { en: 'The room couldn’t finish loading.', fa: 'بارگذاری اتاق کامل نشد.' },
  roomRecoveryHint: { en: 'Try loading it again, or explore the CV while the room is unavailable.', fa: 'دوباره تلاش کنید، یا در این فاصله رزومه را ببینید.' },
  reloadRoom: { en: 'Reload room', fa: 'بارگذاری دوباره اتاق' },
  roomNavigationHint: text('Drag to look around · Use +/− to move closer · Choose an object below'),
  roomZoomControls: text('Room zoom controls'),
  roomZoomIn: text('Zoom into the room'),
  roomZoomOut: text('Zoom out of the room'),
  enterRoom: { en: 'Step inside', fa: 'وارد شوید' },
  viewMyCv: { en: 'View my CV', fa: 'مشاهده رزومه من' },
  roomEntryLabel: { en: 'Choose your way in', fa: 'مسیر خود را انتخاب کنید' },
  roomEntryTitle: { en: 'Take a look around.', fa: 'کمی گشت بزنید.' },
  roomEntryDescription: { en: 'Explore my work, discover the details, and play a little.', fa: 'کارهایم را ببینید، جزئیات را کشف کنید و کمی بازی کنید.' },
  replayRoomLights: text('Replay room lights'),
  roomColorControls: { en: 'Room lighting controls', fa: 'کنترل نور اتاق' },
  roomColorWarm: { en: 'Warm', fa: 'گرم' },
  roomColorRgb: { en: 'RGB', fa: 'رنگی' },
  pauseRoomColors: { en: 'Pause colors', fa: 'توقف رنگ‌ها' },
  resumeRoomColors: { en: 'Resume colors', fa: 'ادامهٔ رنگ‌ها' },
  resetView: text('Reset view'),
  mobilePreviewTitle: text('On your phone'),
  mobilePreviewIntro: text('The same portfolio, built mobile-first. Scroll the CV inside this phone, or open it on your own device.'),
  mobilePreviewOnPhone: text('You are already on a phone — the CV is one tap away.'),
  mobilePreviewFrame: text('Mobile preview of the CV page'),
  openCv: text('Open the CV'),
  worldClocksTitle: text('Around the world'),
  contactLink: text('Contact'),
  close: text('Close'),
  back: text('Back to the room'),
  sound: text('Ambient sound'),
  musicRadio: both('Desk radio', 'رادیوی میز'),
  musicLibrary: both('The listening shelf', 'قفسهٔ شنیدنی‌ها'),
  musicSampleLabel: both('Playlist', 'فهرست پخش'),
  musicLibraryHint: both('Open Light, then choose a song inside Spotify. Keep listening as you explore the room.', 'Light را باز کنید و در اسپاتیفای آهنگی انتخاب کنید. هنگام گشتن در اتاق به شنیدن ادامه دهید.'),
  musicReload: both('Reload preview', 'بارگذاری مجدد'),
  musicPreview: both('Spotify preview', 'پیش‌نمایش اسپاتیفای'),
  musicChoose: both('Pick something for the room.', 'برای اتاق آهنگی انتخاب کنید.'),
  musicConsentShort: both('Choose the playlist on the left to load Spotify. Spotify may use cookies.', 'فهرست پخش سمت چپ را انتخاب کنید تا اسپاتیفای بارگذاری شود. اسپاتیفای ممکن است از کوکی استفاده کند.'),
  musicReturnHint: both('Music stays with you when you return to the room.', 'با بازگشت به اتاق، موسیقی همراه شما می‌ماند.'),
  musicTitle: both('Music shelf', 'قفسهٔ موسیقی'),
  musicSample: both('Light — my Spotify playlist.', 'Light — فهرست پخش اسپاتیفای من.'),
  musicConsent: both('Choose a track to load Spotify. Spotify may use cookies. Playback availability depends on your account and region.', 'برای بارگذاری اسپاتیفای آهنگی انتخاب کنید. اسپاتیفای ممکن است از کوکی استفاده کند. امکان پخش به حساب و منطقهٔ شما بستگی دارد.'),
  musicLoad: both('Load player', 'بارگذاری پخش‌کننده'),
  musicClear: both('Stop and clear', 'توقف و پاک‌کردن'),
  musicOpen: both('Open in Spotify', 'بازکردن در اسپاتیفای'),
  musicSelectionHint: both('The room animation follows your selection. Press play in Spotify to listen. Return to the room to keep listening; Stop and clear ends playback.', 'انیمیشن اتاق با انتخاب شما هماهنگ است. برای شنیدن، دکمهٔ پخش اسپاتیفای را بزنید. برای ادامهٔ شنیدن به اتاق برگردید؛ توقف و پاک‌کردن پخش را متوقف می‌کند.'),
  musicNowPlaying: both('Now playing', 'در حال پخش'),
  on: text('on'),
  off: text('off'),
  roomContext: text('Behind the Build'),
  language: text('Language'),
  viewWork: text('View selected work'),
  aboutMe: text('About me'),
  experience: text('Experience'),
  skills: text('Skills'),
  selectedWork: text('Selected work'),
  contact: text('Contact'),
  downloadCv: text('Download CV'),
  emailLabel: text('Email'),
  linkedinLabel: text('LinkedIn'),
  lifeStory: both('Life story', 'داستان زندگی'),
  lessons: both('What the years taught me', 'چیزی که این سال‌ها یادم داد'),
  keepsakes: both('The things on my desk', 'اشیای روی میز من'),
  githubLabel: text('GitHub'),
  mediumLabel: text('Medium'),
  writing: text('Writing'),
  allArticles: text('All articles on Medium'),
  education: text('Education'),
  languages: text('Languages'),
  periodPending: text('Dates to be confirmed'),
  problem: text('Problem'),
  action: text('Action'),
  result: text('Result'),
  certificate: text('Certification'),
  certifiedVue: text('Certified Vue.js Developer — Vue School'),
  architecture: text('Architecture approach'),
  architectureNote: text('Client-side architecture built to keep long-lived products coherent: shared component libraries used across products, type-safe API contracts between frontend and backend, clear ownership, and steady refactoring of long-lived codebases.'),
  editorIntro: text('A small, original demo of the interaction model behind a much larger production editor.'),
  reset: text('Reset'),
  exportPng: text('Export PNG'),
  brandColor: text('Brand color'),
  editorTitle: text('Live visual editor'),
  editorTechnology: text('DOM / Vue 3'),
  editorInstructions: text('Drag the name. Use the square and rotate handles. Change the brand color.'),
  editorObjectLabel: text('Name and title block'),
  editorKeyboardHint: text('Keyboard: arrow keys move, Ctrl/⌘ + arrows resize, [ and ] rotate.'),
  resizeText: text('Resize text'),
  rotateText: text('Rotate text'),
  errorTitle: text('This room ends here.'),
  errorBody: text('The page may have moved, but the work is still in the next room.'),
  returnHome: text('Return to the room'),
  unavailable: text('Contact details and the final CV will be added before publication.'),
  locationValue: text('Istanbul, Türkiye'),
  experienceValue: text('10+ years'),
}

export const roles: Role[] = [
  {
    id: 'zoviz',
    company: 'Zoviz',
    title: text('Senior Frontend Engineer → Frontend Team Lead → Frontend Technical Lead'),
    period: 'Sep 2024 – Present',
    receipt: text('Led a shared component library across multiple internal products, cutting feature build time and improving visual consistency.'),
    summary: text('Promoted to Frontend Team Lead in January 2025 and Frontend Technical Lead in March 2026. Owns the frontend platform behind brand identity, content creation, shared workspaces, and creative tools: component libraries, advanced editors, frontend infrastructure, performance, and AI-powered product capabilities.'),
  },
  {
    id: 'smile-it-solutions',
    company: 'Smile IT Solutions (Remote, UK)',
    title: text('Frontend Engineer → Full-Stack Engineer'),
    period: 'Sep 2023 – Sep 2024',
    receipt: text('Playwright E2E across admin panels: 30% faster development; shipped Next.js, PostgreSQL, Docker, and AI SDKs in production.'),
    summary: text('Started on React, Next.js, and TypeScript product work, then owned end-to-end delivery across frontend, backend, and AWS cloud infrastructure.'),
  },
  {
    id: 'sarmayex',
    company: 'Sarmayex',
    title: text('Frontend Lead'),
    period: 'Sep 2022 – Oct 2023',
    receipt: text('Recovered a stalled crypto-trading platform and shipped a full redesign in three months.'),
    summary: text('Led a frontend team of four: owned architecture and delivery, built B2B and P2P trading flows for trust-sensitive financial workflows, and raised team productivity by 20% through clearer ownership, agile practices, and automation.'),
  },
  {
    id: 'ostadbank',
    company: 'OstadBank',
    title: text('Frontend Developer → Senior Frontend Developer → Frontend Team Lead'),
    period: 'Apr 2017 – Sep 2022',
    receipt: text('Kanban-based planning and automated CI/CD pipelines: 50% faster development.'),
    summary: text('Five and a half years in EdTech growing from developer to team lead: large-scale Vue.js and Nuxt applications for students and teachers, a Yarn Workspaces and Lerna monorepo migration, performance work through code splitting and lazy hydration, and mentoring through code review and pairing.'),
  },
  {
    id: 'pay-ir',
    company: 'Pay.ir',
    title: text('Frontend Developer'),
    period: 'Dec 2015 – Feb 2017',
    receipt: text('Mobile-first, accessible dashboard redesign: 30% fewer support tickets, 35% faster page loads.'),
    summary: text('Led the client-dashboard redesign for a payments product and streamlined multi-step KYC verification with WebSocket-based real-time updates.'),
  },
]

export const skills: Skill[] = [
  ['vue-3', 'Vue 3', 'Complex reactive product interfaces and component systems.', 'core'],
  ['nuxt', 'Nuxt', 'SSR applications, routing, performance, and delivery.', 'core'],
  ['typescript', 'TypeScript', 'Reliable contracts across large frontend codebases.', 'core'],
  ['pinia', 'Pinia', 'Predictable application and editor state.', 'core'],
  ['architecture', 'Frontend architecture', 'Systems that remain coherent as products and teams grow.', 'core'],
  ['components', 'Component libraries', 'Reusable foundations for consistent product delivery.', 'core'],
  ['performance', 'Performance optimization', 'Lazy hydration on high-traffic pages and targeted optimisation that cut page loads by 35%.', 'core'],
  ['type-safe-api', 'Type-safe API contracts', 'Fewer runtime errors and clearer frontend–backend collaboration.', 'core'],
  ['accessibility', 'Accessible, mobile-first UI', 'Dashboard and verification flows that work for every user.', 'core'],
  ['react', 'React', 'Cross-stack product development.', 'fullstack'],
  ['next', 'Next.js', 'Production full-stack web applications.', 'fullstack'],
  ['postgresql', 'PostgreSQL', 'Durable product data and full-stack features.', 'fullstack'],
  ['docker', 'Docker', 'Repeatable development and production environments.', 'fullstack'],
  ['websockets', 'WebSockets', 'Real-time updates in multi-step KYC verification.', 'fullstack'],
  ['payments', 'Payments & financial flows', 'Trust-sensitive payment, KYC, and B2B/P2P trading interfaces.', 'fullstack'],
  ['playwright', 'Playwright', 'End-to-end coverage that sped up delivery by 30%.', 'quality'],
  ['vitest', 'Vitest & Cypress', 'Unit, component, and visual-regression testing (with Percy).', 'quality'],
  ['sentry', 'Sentry', 'Production diagnostics grounded in real user failures.', 'quality'],
  ['cicd', 'CI/CD', 'Automated deployments behind a 50% faster development cycle.', 'quality'],
  ['mentoring', 'Mentoring & code review', 'Pairing and structured guidance that grow engineers.', 'quality'],
  ['agents', 'AI coding agents', 'AI-assisted development with human verification before production.', 'ai'],
  ['ai-sdk', 'AI SDK integration', 'Shipping AI capabilities inside production products.', 'ai'],
  ['prompt-ux', 'Prompt UX', 'Making model interactions understandable and useful.', 'ai'],
].map(([id, name, usedFor, group]) => ({
  id: id as string,
  name: name as string,
  usedFor: text(usedFor as string),
  group: group as Skill['group'],
}))

export const caseStudies: CaseStudy[] = [
  {
    id: 'paratrooper',
    title: text('Parachuting into a stalled platform'),
    problem: text('A crypto platform had stalled and needed both stability and a clear route to delivery.'),
    action: text('Led the frontend recovery: stabilised the architecture, rebuilt B2B and P2P trading flows for trust-sensitive workflows, and directed a full redesign.'),
    result: text('The full website redesign shipped in three months, and clearer ownership plus automation raised team productivity by 20%.'),
  },
  {
    id: 'bugjar',
    title: text('Android handed us a file the browser could not read'),
    problem: text('Android users attaching a logo hit FileReader NotReadableError on files that passed every metadata check. Every failing file came from Google Photos or Google Drive.'),
    action: text('Caught it in Sentry, reproduced it on a real phone with Chrome remote debugging, and traced it to provider-backed URIs: the browser receives a valid-looking File whose bytes are gated outside the page.'),
    result: text('With no reliable browser-side fix across providers, the app now catches the error, clears the broken selection, and tells users exactly what to do — a working path in three steps instead of a dead end.'),
    links: [{ label: 'Read the full incident on Medium', href: 'https://medium.com/@DavoudAslaniFakour/android-handed-us-a-file-the-browser-could-not-read-32181455e7a6' }],
  },
  {
    id: 'robot',
    title: text('Designing a codebase for AI collaborators'),
    problem: text('On a 68,000-line Vue editor, an AI agent gave average answers: it did not know the architecture it was changing.'),
    action: text('Had the agent generate DESIGN.md from the real code — components, tokens, usage patterns — split large modules into smaller ones, and added a product-context file of what was built, why, and what was rejected. The same approach shipped a guided Prompt Optimization Wizard for text-to-image, built with Claude Design and Claude Code.'),
    result: text('The same agent gave much better answers, and new-feature work sped up because the model stopped starting from zero.'),
    links: [{ label: 'Read the Prompt Optimization Wizard write-up on Medium', href: 'https://medium.com/built-in-practice/stop-guessing-your-ai-image-prompts-testing-a-guided-optimization-wizard-177b0d065178' }],
  },
  {
    id: 'cards',
    title: text('One brand profile, every business asset'),
    problem: text('Business cards, letterheads, and email signatures drift when each is edited separately: an old tagline here, a nearly-right colour there.'),
    action: text('In a design experiment on a mock business, treated the brand profile and logo as one source of truth and generated all three asset types from it through a single flow.'),
    result: text('The same identity in every format with no rebuilds; a change is made once, in one place.'),
    links: [{ label: 'Read the write-up on Medium', href: 'https://medium.com/built-in-practice/stop-building-logos-start-building-operating-systems-263ab3fc3122' }],
  },
  {
    id: 'monitor',
    title: text('A visual editor built in the DOM'),
    problem: text('Users needed a rich, embeddable editor for multi-page brand documents without a canvas-only rendering model.'),
    action: text('Built a Vue 3 HTML-rendering editor with drag, resize, rotate, cropping, AI image tools, and HTML, PNG, and PDF export.'),
    result: text('Version 6 represents about 19 months and 1,300 commits, with about 84% authored by David.'),
  },
]

/**
 * Technical articles to feature once they are published.
 * TODO(David): add posts here after deploy; the Writing section stays hidden while this list is empty.
 */
export const writing = {
  intro: text('Notes from production frontend work: architecture, debugging, performance, and working with AI tools.'),
  articles: [] as Article[],
}

export const lifeStory = {
  intro: both(
    'How a technical-school student became the person behind this desk.',
    'چطور یک هنرجوی فنی‌وحرفه‌ای به آدمی رسید که پشت این میز نشسته.',
  ),
  chapters: [
    {
      id: 'start',
      marker: both('Before the code', 'قبل از کد'),
      title: both('Technical school, then service', 'هنرستان، بعد سربازی'),
      body: both(
        'I finished high school in a technical computer track and went straight into my military service, so I could start working as soon as it was over.',
        'دبیرستان را در رشتهٔ کامپیوتر فنی‌وحرفه‌ای تمام کردم و بلافاصله برای خدمت سربازی اقدام کردم تا بعد از آن، بدون وقفه وارد کار شوم.',
      ),
    },
    {
      id: 'first-company',
      marker: both('First steps', 'قدم‌های اول'),
      title: both('A classmate, and a first company', 'یک هم‌کلاسی و اولین شرکت'),
      body: both(
        'After service, a high-school classmate helped me learn web design more deeply. After a few months of effort I joined my first software company. There I learned teamwork and lived the whole path of building a website, from the first idea to launch. That is where my programming career really began.',
        'بعد از سربازی، با کمک یکی از هم‌کلاسی‌های دبیرستان، طراحی وب‌سایت را عمیق‌تر یاد گرفتم و بعد از چند ماه تلاش وارد اولین شرکت برنامه‌نویسی شدم. آنجا کار تیمی و مسیر توسعهٔ یک وب‌سایت را از ابتدا تا انتها، عملی و کاربردی تجربه کردم؛ نقطهٔ شروع من در برنامه‌نویسی نرم‌افزار.',
      ),
    },
    {
      id: 'vue',
      marker: both('A choice', 'یک انتخاب'),
      title: both('Why Vue', 'چرا Vue'),
      body: both(
        'My company asked to upgrade its website into a single-page application. I was the only frontend developer there, and from the options on the table I chose Vue. If you asked whether I would choose it again, I would say yes: companies were looking for exactly that skill, and my hunger to learn kept pushing me forward.',
        'در شرکت درخواست ارتقای وب‌سایت به SPA مطرح شد و من، به‌عنوان تنها نیروی فرانت‌اند آن شرکت، از بین پیشنهادهای روی میز Vue را انتخاب کردم. اگر بپرسید دوباره انتخابش می‌کنم یا نه، می‌گویم بله؛ چون همان موقع شرکت‌های مشخصی دنبال این مهارت بودند و اشتیاق به یادگیری من را رو به جلو هل داد.',
      ),
    },
    {
      id: 'domains',
      marker: both('2015 – 2023', '۲۰۱۵ تا ۲۰۲۳'),
      title: both('Many domains, one craft', 'حوزه‌های مختلف، یک مهارت'),
      body: both(
        'My experience grew across very different products: medical software, B2B and P2P crypto trading, payments at Pay.ir, and education at OstadBank. Along the way I learned React, opened my path toward full-stack work, and went deep on TypeScript.',
        'تجربه‌ام کم‌کم در شرکت‌ها و حوزه‌های مختلف بیشتر شد: پزشکی، رمزارز B2B و P2P، پرداخت در Pay.ir و آموزش در استادبانک. در این مسیر React را هم یاد گرفتم، راهم را به سمت فول‌استک باز کردم و تایپ‌اسکریپت را عمیق یاد گرفتم.',
      ),
    },
    {
      id: 'international',
      marker: both('2023 – today', '۲۰۲۳ تا امروز'),
      title: both('Working across borders', 'همکاری فراتر از مرزها'),
      body: both(
        'Those years prepared me to work with companies outside Iran: first Smile IT Solutions in the UK, where I used TypeScript with React and Next.js, and then Zoviz, where I lead the frontend today from Istanbul.',
        'همین تجربه‌ها باعث شد بتوانم با شرکت‌های خارج از ایران همکاری کنم: اول اسمایل آی‌تی سولوشنز در بریتانیا، جایی که تایپ‌اسکریپت را در React و Next به کار بردم، و بعد Zoviz که امروز از استانبول فرانت‌اندش را هدایت می‌کنم.',
      ),
    },
  ] satisfies StoryChapter[],
  lessons: [
    both(
      'In this field we are always students, committed to learning for the long run.',
      'در این حوزه ما همیشه شاگردیم و محکوم به یادگیری طولانی‌مدت.',
    ),
    both(
      'A love of solving software problems is the one thing that keeps forcing your mind to learn — whether it is the era of React, Vue, and Angular, or the era of AI, where staying competitive means studying and using ever more modern tools.',
      'علاقه به حل مسئلهٔ نرم‌افزاری تنها چیزی است که ذهن را وادار به یادگیری چیزهای جدید می‌کند؛ چه در عصر React و Vue و Angular، چه در عصر هوش مصنوعی که رقابت را منوط به مطالعه و استفاده از ابزارهای مدرن‌تر کرده است.',
    ),
    both(
      'Frameworks change; JavaScript fundamentals stay. TypeScript is how I make them last.',
      'فریم‌ورک‌ها عوض می‌شوند، اصول جاوااسکریپت می‌مانند. تایپ‌اسکریپت راه من برای ماندگار کردنشان است.',
    ),
  ],
  keepsakes: [
    {
      id: 'minions',
      title: both('The minions', 'مینیون‌ها'),
      body: both('A birthday gift from my sister.', 'هدیهٔ تولدی از طرف خواهرم.'),
    },
    {
      id: 'elephant',
      title: both('The elephant', 'فیل بامزه'),
      body: both(
        'My wife brought it home from an industrial laser-machine company, as a small piece that shows how precise good work can be.',
        'خانمم آن را از یک شرکت دستگاه‌های لیزر صنعتی آورد؛ نمونه‌ای کوچک که ظرافت کار را نشان می‌دهد.',
      ),
    },
    {
      id: 'clock',
      title: both('The little clock', 'ساعت کوچک'),
      body: both(
        'It is set to Iran time, so when I am far from my family I always know what time it is for them.',
        'روی ساعت ایران تنظیم شده تا وقتی از خانواده دورم، یادم بیاورد آنجا الان چه ساعتی است.',
      ),
    },
  ] satisfies Keepsake[],
}

/** David's supplied playlist; title verified with Spotify oEmbed. */
export const favouriteMusic: MusicTrack[] = [
  { id: 'light-playlist', title: 'Light', artist: 'Spotify', spotifyUrl: 'https://open.spotify.com/playlist/6RgbkiGSEMtH5lYyGfrggE', note: both('My listening shelf.', 'قفسهٔ شنیدنی‌های من.') },
]

export const artworkViewerCopy = {
  controls: both('Image zoom controls', 'کنترل بزرگ‌نمایی تصویر'),
  zoomIn: both('Zoom in', 'بزرگ‌نمایی'),
  zoomOut: both('Zoom out', 'کوچک‌نمایی'),
  fit: both('Fit image', 'نمایش کامل'),
  original: both('Open original', 'باز کردن تصویر اصلی'),
  help: both('Scroll or pinch to zoom · Drag to explore · Keyboard: + / −, arrows, 0 to fit', 'اسکرول یا حرکت دو انگشت برای بزرگ‌نمایی · کشیدن برای جابه‌جایی · صفحه‌کلید: + / −، جهت‌ها، 0 برای نمایش کامل'),
}

export const libraryPortrait = {
  title: both('Framed portrait', 'قاب عکس'),
  image: '/images/library-portrait.jpeg',
  width: 512,
  height: 512,
  imageAlt: both('Pixel-art portrait of Davoud Fakour beside the sea.', 'پرترهٔ پیکسلی داوود فکور کنار دریا.'),
}

/** Artwork and credential details from David's original certificate PDF. */
export const vueCertificate = {
  title: both('Vue.js certification', 'گواهی Vue.js'),
  qualification: both('Vue.js Developer Level I', 'توسعه‌دهندهٔ Vue.js — سطح یک'),
  awardedTo: 'Davoud Aslani Fakour',
  date: both('11 January 2024', '۱۱ ژانویهٔ ۲۰۲۴'),
  number: 'CMVD-000351',
  image: '/images/vue-certificate.jpg',
  width: 2048,
  height: 1449,
  pdf: '/certificates/vue-developer-level-1.pdf',
  verifyUrl: 'https://certificates.dev/c/9b113c4b-9c21-4e60-a1cc-56ba5fb54122',
  verifyLabel: both('Verify certificate', 'بررسی اعتبار گواهی'),
  downloadLabel: both('Download certificate', 'دریافت گواهی'),
  imageAlt: both(
    'Vue.js Developer Level I certificate awarded to Davoud Aslani Fakour on 11 January 2024. Certificate number CMVD-000351.',
    'گواهی توسعه‌دهندهٔ Vue.js سطح یک، اعطاشده به داوود اصلانی فکور در ۱۱ ژانویهٔ ۲۰۲۴. شمارهٔ گواهی CMVD-000351.',
  ),
}

export const sceneObjects: SceneObject[] = [
  { id: 'library_about', mesh: 'int_library_about', camera: 'cam_library_about', label: text('About me'), action: 'modal', contentRef: 'about' },
  { id: 'library_story', mesh: 'int_library_story', camera: 'cam_library_story', label: both('Life story', 'داستان زندگی'), action: 'modal', contentRef: 'story' },
  { id: 'library_career', mesh: 'int_library_career', camera: 'cam_library_career', label: text('Career'), action: 'modal', contentRef: 'timeline' },
  { id: 'library_contact', mesh: 'int_library_contact', camera: 'cam_library_contact', label: text('Contact'), action: 'modal', contentRef: 'contact' },
  { id: 'monitor', mesh: 'int_monitor', camera: 'cam_monitor', label: text('Visual editor'), action: 'zoom-editor', contentRef: 'monitor' },
  { id: 'booking', mesh: 'int_monitor_screen', camera: 'cam_monitor', label: ui.bookCall, action: 'modal', contentRef: 'booking' },
  { id: 'screen_left', mesh: 'int_screen_left', camera: 'cam_screen_left', label: text('Selected work'), action: 'modal', contentRef: 'selected-work' },
  { id: 'screen_right', mesh: 'int_screen_right', camera: 'cam_screen_right', label: text('Skills and tools'), action: 'modal', contentRef: 'skills' },
  { id: 'clock', mesh: 'int_clock', camera: 'cam_clock', label: text('Career timeline'), action: 'modal', contentRef: 'timeline' },
  { id: 'elephant', mesh: 'int_elephant', camera: 'cam_elephant', label: text('Architecture approach'), action: 'modal', contentRef: 'architecture' },
  { id: 'bugjar', mesh: 'int_bugjar', camera: 'cam_bugjar', label: both('Joker’s adventure', 'ماجراجویی جوکر'), action: 'play-game', contentRef: 'joker-game' },
  { id: 'paratrooper', mesh: 'int_paratrooper', camera: 'cam_paratrooper', label: both('Hula Minion · Explore the desk', 'مینیون هولا · گشت‌وگذار روی میز'), action: 'play-game', contentRef: 'minion-game' },
  { id: 'robot', mesh: 'int_robot', camera: 'cam_robot', label: both('Coat Minion · Explore the desk', 'مینیون پالتویی · گشت‌وگذار روی میز'), action: 'play-game', contentRef: 'minion-game' },
  { id: 'cards', mesh: 'int_cards', camera: 'cam_cards', label: both('Peace Minion · Explore the desk', 'مینیون صلح · گشت‌وگذار روی میز'), action: 'play-game', contentRef: 'minion-game' },
  { id: 'speakers', mesh: 'int_speakers', camera: 'cam_speakers', label: both('Music shelf', 'قفسهٔ موسیقی'), action: 'modal', contentRef: 'music' },
  { id: 'world_clocks', mesh: 'int_world_clocks', camera: 'cam_world_clocks', label: text('World clocks'), action: 'modal', contentRef: 'world-clocks' },
  { id: 'phone', mesh: 'int_phone', camera: 'cam_phone', label: text('Mobile preview'), action: 'modal', contentRef: 'mobile-preview' },
  { id: 'certificate', mesh: 'int_certificate', camera: 'cam_certificate', label: vueCertificate.title, action: 'modal', contentRef: 'certificate' },
  { id: 'library_portrait', mesh: 'int_library_portrait', camera: 'cam_library_portrait', label: libraryPortrait.title, action: 'modal', contentRef: 'portrait' },
]

export interface ScreenCity {
  id: string
  label: string
  displayName: I18nText
  timeZone: string
}

/**
 * Text drawn onto the three screens.
 *
 * Screen artwork uses Latin labels for physical legibility; localized city
 * names live alongside them for the accessible modal and can be canvas-tested.
 */
export const screenContent = {
  homeCity: both('Istanbul', 'استانبول'),
  laptopMenu: ['File', 'Edit', 'Go', 'Window'],
  cities: [
    { id: 'istanbul', label: 'Turkey', displayName: text('Istanbul, Turkey'), timeZone: 'Europe/Istanbul' },
    { id: 'london', label: 'London', displayName: text('London'), timeZone: 'Europe/London' },
    { id: 'stockholm', label: 'Stockholm', displayName: text('Stockholm'), timeZone: 'Europe/Stockholm' },
    { id: 'atlantic', label: 'Atlantic', displayName: text('Atlantic · Reykjavík'), timeZone: 'Atlantic/Reykjavik' },
  ] satisfies ScreenCity[],
  /** David keeps the little desk clock on Iran time, near his family. */
  deskClockTimeZone: 'Asia/Tehran',
  left: {
    menu: ['File', 'Edit', 'View', 'Window'],
    title: '326K available',
    folder: 'Empty Folder',
    items: ['components', 'composables', 'content', 'stores'],
  },
  right: {
    menu: ['File', 'Edit', 'Run', 'Help'],
    title: 'Fast',
    rows: ['build', 'typecheck', 'test', 'e2e'],
  },
} as const

export const keyboardRows = [
  [
    { id: 'esc', legend: 'esc', width: 1.0 },
    ...['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].map((legend, i) => ({ id: `f${i + 1}`, legend, width: 0.9 })),
    { id: 'touch-id', legend: '◉', width: 1.15 },
  ],
  ['~', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'delete'].map((legend, i) => ({ id: `num-${i}`, legend, width: legend === 'delete' ? 1.55 : 1 })),
  [{ id: 'tab', legend: 'tab', width: 1.45 }, ...'QWERTYUIOP'.split('').map((legend, i) => ({ id: `q-${i}`, legend, width: 1 })), { id: 'bracket-l', legend: '[', width: 1 }, { id: 'bracket-r', legend: ']', width: 1 }, { id: 'slash', legend: '\\', width: 1.35 }],
  [{ id: 'caps', legend: 'caps lock', width: 1.72 }, ...'ASDFGHJKL'.split('').map((legend, i) => ({ id: `a-${i}`, legend, width: 1 })), { id: 'semi', legend: ';', width: 1 }, { id: 'quote', legend: "'", width: 1 }, { id: 'return', legend: 'return', width: 1.72 }],
  [{ id: 'shift-l', legend: 'shift', width: 2.2 }, ...'ZXCVBNM'.split('').map((legend, i) => ({ id: `z-${i}`, legend, width: 1 })), { id: 'comma', legend: ',', width: 1 }, { id: 'period', legend: '.', width: 1 }, { id: 'question', legend: '/', width: 1 }, { id: 'shift-r', legend: 'shift', width: 2.2 }],
  [
    { id: 'fn', legend: 'fn', width: 1 }, { id: 'control', legend: '⌃', width: 1 },
    { id: 'option-l', legend: '⌥', width: 1 }, { id: 'command-l', legend: '⌘', width: 1.25 },
    { id: 'space', legend: '', width: 5.2 }, { id: 'command-r', legend: '⌘', width: 1.25 },
    { id: 'option-r', legend: '⌥', width: 1 },
  ],
  [
    { id: 'left', legend: '←', width: 1, at: 0.81 },
    { id: 'down', legend: '↓', width: 1, at: 0.88 },
    { id: 'right', legend: '→', width: 1, at: 0.95 },
  ],
  [{ id: 'up', legend: '↑', width: 1, at: 0.88 }],
] as const

export const skillGroups: Record<Skill['group'], I18nText> = {
  core: text('Frontend systems'),
  fullstack: text('Full-stack range'),
  quality: text('Quality and delivery'),
  ai: text('AI product work'),
}

export function localize(value: I18nText, locale: Locale): string {
  return value[locale]
}


export const jokerGameCopy = {
  eyebrow: both('A little mischief', 'کمی شیطنت'),
  title: both('Find my card', 'کارت من را پیدا کن'),
  arriving: both('Joker is setting the table…', 'جوکر دارد میز را آماده می‌کند…'),
  intro: both('One star. Three cards. Think you can keep an eye on mine?', 'یک ستاره. سه کارت. می‌توانی کارت من را دنبال کنی؟'),
  memoryIntro: both('Remember where the star is. The cards stay still in memory mode.', 'جای ستاره را به خاطر بسپار. در حالت حافظه کارت‌ها جابه‌جا نمی‌شوند.'),
  remember: both('The star is on card {card}. Ready? Take your time.', 'ستاره روی کارت {card} است. آماده‌ای؟ عجله نکن.'),
  shuffling: both('Watch closely. Where will the star land?', 'خوب دقت کن. ستاره کجا می‌رود؟'),
  pick: both('Your move. Pick the card hiding the star.', 'نوبت توست. کارتی را که ستاره زیر آن است انتخاب کن.'),
  win: both('You caught me! The star was on card {card}. Another round?', 'مچم را گرفتی! ستاره روی کارت {card} بود. یک دور دیگر؟'),
  lose: both('A little sleight of hand. The star was on card {card}. Try again?', 'یک تردستی کوچک. ستاره روی کارت {card} بود. دوباره امتحان می‌کنی؟'),
  card: both('Card {card}', 'کارت {card}'),
  cards: both('Three cards, numbered left to right', 'سه کارت، شماره‌گذاری از چپ به راست'),
  start: both('Deal me in', 'کارت‌ها را پخش کن'),
  shuffle: both('Shuffle the cards', 'کارت‌ها را جابه‌جا کن'),
  hide: both('Hide the star', 'ستاره را پنهان کن'),
  replay: both('Play again', 'دوباره بازی کن'),
  memory: both('Memory mode · no shuffle', 'حالت حافظه · بدون جابه‌جایی'),
  keyboard: both('Pick a card above, or use keys 1, 2, 3.', 'یک کارت انتخاب کن یا کلیدهای ۱، ۲، ۳ را بزن.'),
} satisfies Record<string, I18nText>


export const deskMinionCopy = {
  title: both('A little desk mischief', 'کمی شیطنت روی میز'),
  arriving: both('Coming down to the front of the desk…', 'دارم می‌آیم جلوی میز…'),
  explore: both('Pick a spot on the desk. See what we can get up to.', 'یک نقطه روی میز انتخاب کن. ببینیم چه می‌شود کرد.'),
  walking: both('On my way. A little hop if I need one.', 'دارم می‌آیم. اگر لازم باشد یک پرش کوچک هم می‌کنم.'),
  unreachable: both('That spot is blocked. Try the desk beside it.', 'راه آنجا بسته است. کنار آن را روی میز امتحان کن.'),
  comeCloser: both('Get closer to the keyboard, mouse, power button or plug.', 'به صفحه‌کلید، ماوس، دکمه یا دوشاخه نزدیک‌تر شو.'),
  typing: both('Your keys, my tiny feet.', 'کلیدهای تو، پاهای کوچک من.'),
  bassTurning: both('Just a little turn…', 'فقط یک چرخش کوچک…'),
  bassPlaying: both('Whoa! That’s a lot of bass.', 'وای! چه بیسی!'),
  bassDone: both('Sound check complete. Act innocent.', 'تست صدا تمام شد. قیافهٔ بی‌گناه بگیر.'),
  keyReady: both('Type a letter. I’ll find its key.', 'یک حرف تایپ کن تا کلیدش را پیدا کنم.'),
  keyHopping: both('One little hop for every key.', 'برای هر کلید، یک پرش کوچک.'),
  keyUnsupported: both('Try letters, numbers, punctuation, Space, Enter or Backspace.', 'حرف، عدد، نشانه، فاصله، اینتر یا بک‌اسپیس را امتحان کن.'),
  keyQueueFull: both('Let me catch up with those keys…', 'صبر کن تا به آن کلیدها برسم…'),
  caught: both('Joker heard that. Act natural.', 'جوکر شنید. عادی رفتار کن.'),
  erasing: both('Let’s clean up the evidence…', 'بیا ردپا را پاک کنیم…'),
  erased: both('All tidy. Nothing happened here.', 'همه چیز مرتب شد. اتفاقی نیفتاده.'),
  pushing: both('A little push… almost there!', 'یک هل کوچک… تقریباً رسیدیم!'),
  riding: both('Tiny passenger. Very important journey.', 'مسافر کوچک، سفر خیلی مهم.'),
  parked: both('Parked. Walk or jump off whenever you like.', 'پارک شد. هر وقت خواستی پیاده شو یا بپر.'),
  climbing: both('Hands on the edge. Up we go.', 'دست‌ها روی لبه. برویم بالا.'),
  wakeLaptop: both('Wake the MacBook first, then try the keys.', 'اول مک‌بوک را روشن کن، بعد کلیدها را امتحان کن.'),
  pressing: both('One tiny finger. One power button.', 'یک انگشت کوچک، یک دکمهٔ روشن‌کردن.'),
  pulling: both('A firm grip… and pull!', 'محکم بگیر… و بکش!'),
  connecting: both('Let’s put that plug back.', 'بیا دوشاخه را دوباره وصل کنیم.'),
  laptopOff: both('MacBook asleep. Press it again to wake it.', 'مک‌بوک خوابید. دوباره فشار بده تا بیدار شود.'),
  laptopOn: both('MacBook awake. Innocent face.', 'مک‌بوک بیدار شد. قیافهٔ بی‌گناه بگیر.'),
  monitorOff: both('Unplugged. The big screen went dark.', 'قطع شد. صفحهٔ بزرگ خاموش شد.'),
  monitorOn: both('Plugged back in. Nobody saw a thing.', 'دوباره وصل شد. کسی چیزی ندید.'),
  macbook: both('MacBook', 'مک‌بوک'), monitor: both('Monitor', 'مانیتور'),
  on: both('On', 'روشن'), off: both('Off', 'خاموش'),
  turnLaptopOff: both('Walk to MacBook and turn it off', 'به مک‌بوک برو و خاموشش کن'),
  turnLaptopOn: both('Walk to MacBook and turn it on', 'به مک‌بوک برو و روشنش کن'),
  pressPower: both('Press power', 'دکمه را فشار بده'),
  unplug: both('Pull monitor plug', 'دوشاخهٔ مانیتور را بکش'),
  plug: both('Reconnect monitor', 'مانیتور را دوباره وصل کن'),
  movement: both('Move the Minion', 'حرکت مینیون'),
  left: both('Move left', 'حرکت به چپ'), right: both('Move right', 'حرکت به راست'),
  forward: both('Move toward the back of the desk', 'حرکت به عقب میز'), back: both('Move toward the front of the desk', 'حرکت به جلوی میز'),
  jump: both('Jump', 'پرش'),
  keyboard: both('WASD / arrows: walk · Space: jump · E: nearby action · Click the desk to walk', 'WASD / جهت‌ها: حرکت · فاصله: پرش · E: تعامل نزدیک · کلیک روی میز: حرکت'),
  sound: both('Sound', 'صدا'), muted: both('Muted', 'بی‌صدا'),
  soundOn: both('Sound effects: on', 'جلوه‌های صوتی: روشن'), soundOff: both('Sound effects: off', 'جلوه‌های صوتی: خاموش'),
  pause: both('Pause', 'توقف'), resume: both('Resume', 'ادامه'),
  paused: both('Paused. Ready when you are.', 'متوقف شد. هر وقت آماده بودی ادامه بده.'),
  reset: both('Reset', 'از نو'),
  audioUnavailable: both('Sound is unavailable here. You can keep exploring.', 'صدا اینجا در دسترس نیست. می‌توانی به گشتن ادامه بدهی.'),
} satisfies Record<string, I18nText>

export const deskMischiefCopy = {
  testBass: both('Test the bass', 'بیس را امتحان کن'),
  powerOffPrompt: both('Turn MacBook off', 'خاموش کردن مک‌بوک'),
  powerOnPrompt: both('Wake MacBook', 'روشن کردن مک‌بوک'),
  playKeyboard: both('Play the keyboard', 'بازی با صفحه‌کلید'),
  typeHere: both('Type to hop', 'تایپ کن تا بپرم'),
  typingHelp: both('Letters: hop to a key · Backspace: delete · Esc: walk again · Arrows: move away', 'حروف: پرش به کلید · بک‌اسپیس: حذف · Esc: بازگشت · جهت‌ها: حرکت'),
  keyboardShort: both('Keyboard', 'صفحه‌کلید'),
  mouseShort: both('Mouse ride', 'سواری ماوس'),
  eraseShort: both('Erase', 'پاک کن'),
  stopShort: both('Stop', 'بایست'),
  keyboardAction: both('Keyboard mischief', 'شیطنت روی صفحه‌کلید'),
  mouseAction: both('Push & ride mouse', 'هل دادن و سواری با ماوس'),
  undo: both('Erase the evidence', 'پاک کردن ردپا'),
  stop: both('Stop action', 'توقف حرکت'),
  typed: both('Typed: {count}', 'تایپ‌شده: {count}'),
  scratchpad: both('Untitled · desk notes', 'بی‌عنوان · یادداشت میز'),
  screenHeading: both('Someone has been here…', 'یک نفر اینجا بوده…'),
  screenFooter: both('Tiny feet. Very loud typing.', 'پاهای کوچک، تایپ خیلی پرسروصدا.'),
  letters: both('BANANA! ', 'موز! '),
} satisfies Record<string, I18nText>

export const jokerAdventureCopy = {
  title: both('Joker’s great escape', 'فرار بزرگ جوکر'),
  playground: both('Joker’s playground', 'زمین بازی جوکر'),
  freePlay: both('Free play', 'بازی آزاد'),
  keepPlaying: both('Keep exploring', 'به گشت‌وگذار ادامه بده'),
  run: both('Run · Shift', 'دویدن · Shift'),
  roamDriving: both('Drive and jump anywhere. Leave the desk and your umbrella opens for a safe landing.', 'همه‌جا رانندگی کن و بپر. از میز که پایین بروی، چتر برای فرود امن باز می‌شود.'),
  floorDriving: both('Explore the floor. Return to the garage to call the lift and ride back to the desk.', 'روی زمین گشت بزن. برای صدا زدن بالابر و بازگشت به میز، به گاراژ برگرد.'),
  gliding: both('Umbrella open. Steer with A / D, brake with B. It folds when you land.', 'چتر باز است. با A و D فرمان بده و با B سرعت را کم کن. چتر هنگام فرود بسته می‌شود.'),
  nitro: both('Nitro', 'نیترو'),
  glide: both('Gliding', 'فرود با چتر'),
  roamWalking: both('Run with Shift, jump onto low objects. The marker shows your parked car.', 'با Shift بدو و روی اشیای کوتاه بپر. نشانگر جای ماشینت را نشان می‌دهد.'),
  jumpRamp: both('Jump to the desk', 'به سمت میز بپر'),
  jumpShort: both('Jump', 'پرش'),
  brake: both('Brake · B', 'ترمز · B'),
  recover: both('Recover · R', 'بازگشت به مسیر · R'),
  park: both('Parked', 'توقف'),
  drive: both('Driving', 'در حرکت'),
  reverse: both('Reversing', 'دنده عقب'),
  airborne: both('Airborne', 'در هوا'),
  blocked: both('Blocked — reverse or jump clear.', 'مسیر بسته است؛ عقب برو یا بپر.'),
  chase: both('Chase view', 'نمای تعقیب'),
  cockpit: both('Cockpit view', 'نمای راننده'),
  inScene: both('Joker is on the move…', 'جوکر در حرکت است…'),
  objectives: {
    explore: both('Explore the tabletop', 'روی میز گشت بزن'),
    floor: both('The room is your playground', 'اتاق، زمین بازی توست'),
    parkedCar: both('Your parked car', 'ماشین پارک‌شده‌ات'),
    grapple: both('Reach the grapple point', 'به نقطه قلاب برس'),
    latch: both('Open the secret garage', 'گاراژ مخفی را باز کن'),
    car: both('Approach your getaway car', 'به ماشین فرار نزدیک شو'),
    lift: both('Park on the glowing lift', 'روی بالابر روشن توقف کن'),
    recall: both('Call the lift back down', 'بالابر را پایین بیاور'),
    ramp: both('Boost, then jump from the ramp', 'شتاب بگیر و از رمپ بپر'),
    phone: both('Line up a run at the phone', 'به سمت گوشی مسیر بگیر'),
    complete: both('Beautiful trouble.', 'چه خرابکاری قشنگی.'),
  },
  garageOpen: both('Follow the marker to the car. E gets you in.', 'نشانگر را تا ماشین دنبال کن. با E سوار شو.'),
  exitCar: both('Get out · E', 'پیاده شو · E'),
  start: both('Start adventure', 'شروع ماجراجویی'),
  loading: both('Opening the secret garage…', 'در حال آماده‌سازی گاراژ مخفی…'),
  error: both('The adventure could not load. Try again.', 'ماجراجویی بارگیری نشد. دوباره امتحان کن.'),
  retry: both('Try again', 'تلاش دوباره'),
  back: both('Back to the room', 'بازگشت به اتاق'),
  reset: both('Start over', 'شروع دوباره'),
  pause: both('Pause', 'مکث'), resume: both('Resume', 'ادامه'),
  camera: both('Change camera · C', 'تغییر دوربین · C'),
  jump: both('Jump · Space', 'پرش · Space'),
  sound: both('Sound effects', 'جلوه‌های صوتی'),
  unavailable: both('Sound unavailable', 'صدا در دسترس نیست'),
  forward: both('Forward', 'جلو'), backMove: both('Reverse / back', 'عقب'), left: both('Left', 'چپ'), right: both('Right', 'راست'), boost: both('Boost · Shift', 'شتاب · Shift'),
  controls: both('WASD / arrows to move · Shift to run · Space to jump · E near objects', 'حرکت با WASD یا جهت‌ها · دویدن با Shift · پرش با Space · تعامل نزدیک اشیا با E'),
  driveControls: both('W / S drive · A / D steer · B brake · Space jump · Shift boost', 'رانندگی W / S · فرمان A / D · شتاب Shift · پرش Space'),
  paused: both('Paused. Ready when you are.', 'متوقف شد. هر وقت آماده بودی ادامه بده.'),
  phases: {
    intro: both('A little trouble is leaving the speaker…', 'کمی شیطنت از روی بلندگو شروع می‌شود…'),
    walking: both('Head to the right edge of the desk, beside the big speaker.', 'به لبه راست میز، کنار بلندگوی بزرگ برو.'),
    grappling: both('Grapple out. Umbrella open. Next stop: the bookcase.', 'قلاب و چتر آماده! مقصد بعدی: کتابخانه.'),
    garage: both('Find the book latch. Then walk up to the car.', 'قفل کتابی را پیدا کن. بعد به ماشین نزدیک شو.'),
    opening: both('A secret worth keeping behind the books.', 'رازی پشت کتاب‌ها پنهان شده بود.'),
    entering: both('Get in. This desk needs a getaway driver.', 'سوار شو. این میز یک راننده فراری لازم دارد.'),
    driving: both('Follow the marker. Brake with B on the lift, then press E.', 'نشانگر را دنبال کن. روی بالابر با B ترمز کن و E را بزن.'),
    lifting: both('Going up. Get ready for the ramp.', 'به سمت بالا. برای رمپ آماده شو.'),
    lowering: both('Stand clear. Your lift is coming down.', 'کمی فاصله بگیر. بالابر در راه است.'),
    crashing: both('That phone was definitely in the way.', 'این گوشی واقعاً سر راه بود.'),
    finished: both('Screen cracked. Getaway complete. Keep exploring the desk or start again.', 'صفحه شکست و فرار کامل شد. روی میز به بازی ادامه بده یا از اول شروع کن.'),
  },
  desk: both('You made it. Explore the desk by car or on foot.', 'رسیدی! با ماشین یا پیاده روی میز گشت بزن.'),
  ramp: both('Face the desk. Hold W + Shift, then jump across the gap.', 'رو به میز برو. W و Shift را نگه دار و از شکاف بپر.'),
  actions: {
    grapple: both('Grapple to the bookcase', 'با قلاب به کتابخانه برو'),
    open: both('Pull the book latch', 'قفل کتابی را بکش'),
    enter: both('Get into the car', 'سوار ماشین شو'),
    lift: both('Raise the lift', 'بالابر را بالا ببر'),
    recall: both('Call lift', 'بالابر را صدا بزن'),
    exit: both('Get out of the car', 'از ماشین پیاده شو'),
  },
}
