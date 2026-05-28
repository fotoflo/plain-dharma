// UI strings for Plain Dharma, keyed by locale.
//
// This module covers chrome-level strings only: nav, headers/footers, page
// titles/metadata, CTAs, accessibility labels, and standing prose on the
// home/read/about pages. Sutta-level content (SUTTA_META titles, DROPS,
// PREFACE/CLOSING, MDX body text) is handled separately under the content
// layer.
//
// `Strings = typeof en` is the single source of truth for shape. Every
// non-English locale is typed as `Strings` so missing keys are compile-time
// errors. Prefer `getStrings(locale)` for ergonomics; `t()` is offered for
// one-off lookups.

import type { Locale } from "./index";

// NOTE on the absence of `as const`: keeping `en` as a plain object means
// every leaf value is typed as `string` rather than its literal value. That
// is exactly what we want — `Strings = typeof en` then describes the SHAPE
// of the dictionary (nested sections + which keys exist) without locking
// `zh` into having to repeat the English text verbatim.
const en = {
  nav: {
    read: "Read",
    about: "About",
    glossary: "Glossary",
    download: "Download",
    contribute: "Contribute",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  home: {
    kicker: "Plain Dharma",
    heroLine1: "Old Wisdom.",
    heroLine2: "Plain English.",
    heroSubtitle:
      "The Buddha's foundational teachings, in plain modern English.",
    ctaReadAll: "Read all six",
    ctaDownload: "Download",
    heroBlurb:
      "Six short sutras — the ones at the root of the whole tradition — rendered for a first-time reader who'd rather understand than wade through footnotes. Free to read, free to copy, free to print, free to listen.",
    sixTeachingsLabel: "The six teachings",
  },
  sutta: {
    previous: "Previous",
    next: "Next",
    readAllOnOnePage: "Read all six on one page →",
  },
  read: {
    metadataTitle: "Read all six teachings",
    metadataDescription:
      "The six foundational teachings of the Buddha, in order, in plain modern English.",
    kicker: "All six teachings",
    h1: "The Buddha's foundational teachings",
    subtitle:
      "In order, in plain modern English. Roughly an hour to read all six.",
    onThisPage: "On this page",
    openOnOwnPage: "Open this teaching on its own page →",
  },
  about: {
    metadataTitle: "About this version",
    metadataDescription:
      "What Plain Dharma is, who it's for, and where the original teachings come from.",
    kicker: "About",
    h1: "About this version",
    p1: "These six teachings are rendered here in plain modern English — not as a scholarly translation, but as a plain reading of what the Buddha actually said. The goal is to make the foundational teachings accessible to a first-time reader without sacrificing the substance.",
    p2: "This is not a substitute for canonical translation. If you find a teaching here that moves you, the next step is to read the same passage as translated by Bhikkhu Bodhi, Thanissaro Bhikkhu, or the collaborative team at SuttaCentral — three rigorous sources, all freely available.",
    p3PreservedStripped:
      "What's preserved: the structure, the repetitions, the key images, and the moments where the original itself does something striking — like the cosmic ending of the first talk, or the mother-and-only-child image in the Mettā Sutra. What's stripped: archaic English (\"thus have I heard\"), unfamiliar terminology where a modern word does the same job, and the formal cadences that can put a contemporary reader to sleep.",
    h2WhySix: "Why six?",
    pWhySix1:
      "These six are the foundation. Every later teaching, every commentary, every Buddhist tradition — they all build on these. If you've read them, you've read what was there at the start.",
    pWhySix2:
      "The choice of six (and not ten or twenty) is deliberate: enough to understand the whole shape of the teaching without overwhelming someone new to it. The full site reads in about 45 minutes.",
    h2License: "License",
    pLicense1Prefix:
      "Everything on this site is dedicated to the public domain under ",
    pLicense1LinkText: "CC0",
    pLicense1Suffix:
      ". Copy it, print it, translate it, distribute it, modify it. No permission needed; no attribution required.",
    pLicense2:
      "This is in keeping with the Buddhist tradition of the dharma gift — the practice of freely sharing teachings without expectation of return.",
    h2GoingDeeper: "Going deeper",
    pGoingDeeperIntro:
      "For the original Pali texts and scholarly translations:",
    liSuttaCentralLink: "SuttaCentral",
    liSuttaCentralSuffix:
      " — modern collaborative translations and parallels across traditions, freely accessible.",
    liAccessToInsightLink: "Access to Insight",
    liAccessToInsightSuffix:
      " — Thanissaro Bhikkhu's free translations, with extensive notes and commentary.",
    liBodhiBooks:
      "In the Buddha's Words and the four Nikāya volumes by Bhikkhu Bodhi (Wisdom Publications) — the most highly regarded modern translations, available in print.",
    pGlossaryRefPrefix: "For terminology, see the ",
    pGlossaryRefLinkText: "Glossary",
    pGlossaryRefSuffix: ".",
    h2HowMade: "How this was made",
    pHowMade1:
      "The English was translated from the original Pali by Claude (Anthropic's AI), then edited line by line by Alex Miller. The Chinese was translated from the Pali by Claude too, and edited by Yan Zhang. The audio is an ElevenLabs voice; the art and logos are Gemini, edited by hand.",
    pHowMadeSoftware:
      "The site, the mobile app, and the scripts that build the ebooks and generated the narration were all written by Claude too.",
    pHowMade2:
      "We tell you plainly because you deserve to know what you're reading and hearing.",
    pHowMade3:
      "We don't take lightly what these tools mean for the people whose craft they touch. But we could never have made this ourselves — translating the suttas means reading Pali, and neither of us can. The tools made possible a free gift that was otherwise beyond us, offered in the spirit of the old dharma gift: freely given, asking nothing back.",
    pHowMade4: "What's here is a starting point, not a final word.",
    ctaStartReading: "Start reading →",
  },
  contribute: {
    metadataTitle: "Contribute",
    metadataDescription:
      "Plain Dharma is open and public domain. How copy editors, translators, and voice artists can help carry it further — and how to get in touch.",
    kicker: "Contribute",
    h1: "Help carry this further",
    pHelpIntro:
      "Plain Dharma is an open, public-domain project, and a work in progress — translated by AI and edited by hand. The clearest way to make it better is with human hands:",
    liCopyEditorsLabel: "Copy editors",
    liCopyEditorsBody:
      " — to sharpen the English, catch what reads stiffly, keep it plain.",
    liTranslatorsLabel: "Translators",
    liTranslatorsBody: " — to improve the Mandarin, or open a new language.",
    liVoiceArtistsLabel: "Voice artists",
    liVoiceArtistsBody:
      " — to lend a real human reading in place of the synthetic one. We know the irony of asking this on a page narrated by a machine; if you'd offer your voice as a gift, we'd be honored to let it replace ours.",
    pHelpClosing:
      "Nothing here is owned, and nothing you give will be. Your contribution is itself a dharma gift.",
  },
  contact: {
    heading: "Get in touch",
    lead: "Tell us how you'd like to help, or just say hello. We read everything.",
    nameLabel: "Your name",
    namePlaceholder: "Name",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    messageLabel: "Message",
    messagePlaceholder: "How would you like to help?",
    submit: "Send",
    submitting: "Sending…",
    successHeading: "Thank you.",
    successMessage: "Your message is on its way. We'll be in touch.",
    genericError: "Something went wrong.",
    networkError: "Network error.",
    validationError: "Please add your email and a short message.",
  },
  footer: {
    tagline: "The Buddha's foundational teachings in plain modern English.",
    licenseLinePrefix: "Released under ",
    licenseLinkText: "CC0 / public domain",
    licenseLineSuffix: ". Made for free distribution.",
    byLinePrefix: "by ",
    byLineLinkText: "Alex Miller",
    aboutLink: "About",
    glossaryLink: "Glossary",
    contributeLink: "Contribute",
    githubLink: "GitHub",
  },
  newsletter: {
    heading: "Stay in touch",
    lead: "We're slowly publishing more — new translations, printed editions, audio. Get an email when something new goes up. No more than a handful a year.",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    submit: "Subscribe",
    submitting: "Subscribing…",
    successNew: "Thanks — you'll hear from us when something new goes up.",
    successAlreadySubscribed:
      "You're already on the list. Thanks for checking back.",
    genericError: "Something went wrong.",
    networkError: "Network error.",
  },
  readingControls: {
    a11yTrigger: "Reading preferences",
    a11yPanel: "Reading preferences",
    sectionSize: "Size",
    sectionContrast: "Contrast",
    sectionFont: "Font",
    a11ySize: "Text size",
    a11yContrast: "Contrast level",
    a11yFont: "Font choice",
    sizeSmall: "Small",
    sizeMedium: "Medium",
    sizeLarge: "Large",
    sizeExtraLarge: "Extra large",
    contrastLow: "Low",
    contrastMed: "Med",
    contrastHigh: "High",
    fontSerif: "Serif",
    fontAccessible: "Accessible",
    // Suffixes used to compose aria-labels like "Small text size", "Low
    // contrast", "Serif font". Kept as separate keys so translations can
    // re-order if needed.
    a11ySizeSuffix: "text size",
    a11yContrastSuffix: "contrast",
    a11yFontSuffix: "font",
    a11ySelectedSuffix: "(selected)",
  },
  audio: {
    listen: "Listen",
    nowPlaying: "Now playing",
    pause: "Pause",
    play: "Play",
    prev: "Previous section",
    next: "Next section",
    back5: "Back 5 seconds",
    forward5: "Forward 5 seconds",
    closePlayer: "Close player and return to sections",
    openAudioPlayer: "Open audio player",
    closeAudioPlayer: "Close audio player",
    seek: "Seek",
    // Template — `{title}` is interpolated at render time.
    playSectionLabel: "Play section: {title}",
    // Template — `{n}` and `{time}` are interpolated at render time.
    sectionsTotalLine: "{n} sections · {time} total",
    pace: "Pace",
    slower: "Slower",
    faster: "Faster",
  },
  canonicalLinks: {
    paliSourcePrefix: "Pali source —",
    compareIntro: "Compare with canonical translations:",
  },
  glossary: {
    metadataDescription:
      "Key terms in plain English, with the Pali / Sanskrit where it matters.",
    subtitle:
      "Key terms in plain English, with the Pali / Sanskrit where it matters.",
  },
};

export type Strings = typeof en;

// Every non-English locale must be exhaustive — the `Strings` type alias
// causes TypeScript to flag missing or extra keys at compile time.
const zh: Strings = {
  nav: {
    read: "阅读",
    about: "关于",
    glossary: "词汇表",
    download: "下载",
    contribute: "参与",
    openMenu: "打开菜单",
    closeMenu: "关闭菜单",
  },
  home: {
    kicker: "Plain Dharma",
    heroLine1: "古老的智慧。",
    heroLine2: "平实的语言。",
    heroSubtitle: "佛陀最早的几篇开示，用平实的现代汉语呈现。",
    ctaReadAll: "六篇一起读",
    ctaDownload: "下载",
    heroBlurb:
      "六篇短短的开示——整个传承的根基——为第一次接触的读者而做，与其在脚注里钻来钻去，不如直接读懂。可以自由阅读、自由复制、自由打印、自由聆听。",
    sixTeachingsLabel: "这六篇开示",
  },
  sutta: {
    previous: "上一篇",
    next: "下一篇",
    readAllOnOnePage: "六篇一起在同一页读 →",
  },
  read: {
    metadataTitle: "六篇开示一起读",
    metadataDescription:
      "佛陀最根本的六篇开示，按顺序排好，用平实的现代汉语呈现。",
    kicker: "六篇开示",
    h1: "佛陀最早的几篇开示",
    subtitle: "按顺序排好，用平实的现代汉语呈现。六篇大约一小时读完。",
    onThisPage: "本页内容",
    openOnOwnPage: "单独打开这一篇 →",
  },
  about: {
    metadataTitle: "关于这个版本",
    metadataDescription:
      "Plain Dharma 是什么、为谁而做、这些教法的原文来自哪里。",
    kicker: "关于",
    h1: "关于这个版本",
    p1: "这六篇开示在这里用平实的现代汉语呈现——不是一份学术翻译，而是一次直白的呈现，让你读到佛陀真正说过的话。目标是让第一次接触的读者也能进入这些根基性的教法，同时不削弱原文的分量。",
    p2: "这不能替代正式的经文翻译。如果这里某一篇打动了你，下一步就去读同一段——Bhikkhu Bodhi 的译本、Thanissaro Bhikkhu 的译本，或者 SuttaCentral 的合作译本。这三个来源都很严谨，而且都可以自由取用。",
    p3PreservedStripped:
      "保留下来的是：结构、重复、关键的画面，以及原文本身就特别有力的那些时刻——比如第一次开示末尾那场宇宙震动，或者《慈经》里母亲守护独生子的画面。剥掉的是：古旧的英文措辞（「如是我闻」那一类）、那些用一个普通的现代词就能说清的术语，以及那些容易把当代读者读睡着的正式腔调。",
    h2WhySix: "为什么是六篇？",
    pWhySix1:
      "这六篇是根基。后来一切的教法、一切的注解、一切的佛教传统，都是在这些之上长出来的。读完这六篇，你就读到了最开头本来在那里的东西。",
    pWhySix2:
      "选六篇——而不是十篇或二十篇——是有意为之：足够看清整套教法的轮廓，又不至于把第一次接触的人压垮。整个网站大约 45 分钟读完。",
    h2License: "许可",
    pLicense1Prefix: "本站全部内容根据 ",
    pLicense1LinkText: "CC0",
    pLicense1Suffix:
      " 协议献给公有领域。可以复制、打印、翻译、传播、修改。不需要授权，也不要求署名。",
    pLicense2:
      "这也呼应了佛教里「法布施」的传统——把教法自由分享出去，不期待回报。",
    h2GoingDeeper: "想读得更深",
    pGoingDeeperIntro: "想找巴利原文和学术翻译，可以去：",
    liSuttaCentralLink: "SuttaCentral",
    liSuttaCentralSuffix:
      " —— 现代的合作翻译，跨传承的平行对照，全部可以自由查阅。",
    liAccessToInsightLink: "Access to Insight",
    liAccessToInsightSuffix:
      " —— Thanissaro Bhikkhu 的免费译本，附有大量注解和评注。",
    liBodhiBooks:
      "Bhikkhu Bodhi 的 In the Buddha's Words 和四部尼柯耶译本（Wisdom Publications）—— 当今最受推崇的现代英文译本，纸本可买到。",
    pGlossaryRefPrefix: "想查术语，请见 ",
    pGlossaryRefLinkText: "词汇表",
    pGlossaryRefSuffix: "。",
    h2HowMade: "这是怎么做出来的",
    pHowMade1:
      "英文由 Claude（Anthropic 的 AI）从巴利原文译出，再由 Alex Miller 一行一行地修订；中文同样由 Claude 从巴利原文译出，由 Yan Zhang 修订。音频是 ElevenLabs 的合成语音；画作与标志出自 Gemini，再手工修整。",
    pHowMadeSoftware:
      "网站、手机应用，连同那些用来生成电子书、制作朗读音频的脚本，也都是 Claude 写的。",
    pHowMade2:
      "我们把这些老老实实告诉你，因为你有权知道自己读到的、听到的，究竟是什么。",
    pHowMade3:
      "这些工具会触动一些人赖以为生的手艺，我们没有轻看这件事。但这件事，我们靠自己根本做不到——翻译这些经文，得读得懂巴利文，而我们两人都读不懂。是这些工具，让一份原本超出我们能力的免费馈赠成为可能；我们以「法布施」的古老心意把它献出：自由给出，不求回报。",
    pHowMade4: "这里的一切只是一个起点，不是定论。",
    ctaStartReading: "开始阅读 →",
  },
  contribute: {
    metadataTitle: "参与",
    metadataDescription:
      "Plain Dharma 是开放的、属于公有领域的项目。文字编辑、译者、配音者可以怎样一起把它做得更好——以及怎样与我们联系。",
    kicker: "参与",
    h1: "一起把它做得更好",
    pHelpIntro:
      "Plain Dharma 是一个开放的、属于公有领域的项目，也仍在不断打磨——由 AI 翻译，再经人手编辑。把它做得更好，最直接的办法是靠人的双手：",
    liCopyEditorsLabel: "文字编辑",
    liCopyEditorsBody: "——把英文打磨得更利落，挑出读起来生硬的地方，保持平实。",
    liTranslatorsLabel: "译者",
    liTranslatorsBody: "——把中文改得更好，或者为一门新的语言打开门。",
    liVoiceArtistsLabel: "配音者",
    liVoiceArtistsBody:
      "——用真实的人声，来替下这把合成的声音。我们清楚，在一个用机器朗读的页面上提这个请求有多讽刺；如果你愿意把自己的声音作为礼物献出来，我们会很荣幸地让它取代我们现在这把。",
    pHelpClosing:
      "这里没有什么是被占有的，你给出的也不会被占有。你的贡献，本身就是一份法布施。",
  },
  contact: {
    heading: "联系我们",
    lead: "告诉我们你想怎样帮忙，或者只是来打个招呼。每一封我们都会读。",
    nameLabel: "你的名字",
    namePlaceholder: "名字",
    emailLabel: "邮箱地址",
    emailPlaceholder: "you@example.com",
    messageLabel: "留言",
    messagePlaceholder: "你想怎样帮忙？",
    submit: "发送",
    submitting: "发送中……",
    successHeading: "谢谢你。",
    successMessage: "你的留言已经在路上了。我们会与你联系。",
    genericError: "出了点问题。",
    networkError: "网络出错了。",
    validationError: "请填写你的邮箱和一句简短的留言。",
  },
  footer: {
    tagline: "佛陀最早的几篇开示，用平实的现代汉语呈现。",
    licenseLinePrefix: "根据 ",
    licenseLinkText: "CC0 / 公有领域",
    licenseLineSuffix: " 协议发布。为自由流通而做。",
    byLinePrefix: "作者 ",
    byLineLinkText: "Alex Miller",
    aboutLink: "关于",
    glossaryLink: "词汇表",
    contributeLink: "参与",
    githubLink: "GitHub",
  },
  newsletter: {
    heading: "保持联系",
    lead: "我们在慢慢出新东西——新的翻译、纸本、音频。有新的内容上线时给你发一封信。一年最多几封。",
    emailLabel: "邮箱地址",
    emailPlaceholder: "you@example.com",
    submit: "订阅",
    submitting: "订阅中……",
    successNew: "谢谢——有新内容上线时我们会写信给你。",
    successAlreadySubscribed: "你已经在名单上了。谢谢你回来看看。",
    genericError: "出了点问题。",
    networkError: "网络出错了。",
  },
  readingControls: {
    a11yTrigger: "阅读偏好",
    a11yPanel: "阅读偏好",
    sectionSize: "字号",
    sectionContrast: "对比度",
    sectionFont: "字体",
    a11ySize: "文字大小",
    a11yContrast: "对比度",
    a11yFont: "字体选择",
    sizeSmall: "小",
    sizeMedium: "中",
    sizeLarge: "大",
    sizeExtraLarge: "特大",
    contrastLow: "低",
    contrastMed: "中",
    contrastHigh: "高",
    fontSerif: "衬线",
    fontAccessible: "易读",
    // Suffixes used to compose aria-labels like "Small text size", "Low
    // contrast", "Serif font". Kept as separate keys so translations can
    // re-order if needed.
    a11ySizeSuffix: "文字大小",
    a11yContrastSuffix: "对比度",
    a11yFontSuffix: "字体",
    a11ySelectedSuffix: "（已选中）",
  },
  audio: {
    listen: "聆听",
    nowPlaying: "正在播放",
    pause: "暂停",
    play: "播放",
    prev: "上一段",
    next: "下一段",
    back5: "后退 5 秒",
    forward5: "前进 5 秒",
    closePlayer: "关闭播放器，返回章节列表",
    openAudioPlayer: "打开播放器",
    closeAudioPlayer: "关闭播放器",
    seek: "拖动定位",
    playSectionLabel: "播放章节：{title}",
    sectionsTotalLine: "共 {n} 段 · 总长 {time}",
    pace: "语速",
    slower: "较慢",
    faster: "较快",
  },
  canonicalLinks: {
    paliSourcePrefix: "巴利原典 ——",
    compareIntro: "可对照参考汉译经典：",
  },
  glossary: {
    metadataDescription:
      "几个关键术语，用平实的现代汉语解释，必要时附上对应的巴利文 / 梵文。",
    subtitle:
      "几个关键术语，用平实的现代汉语解释，必要时附上对应的巴利文 / 梵文。",
  },
};

const STRINGS: Record<Locale, Strings> = { en, zh };

/**
 * Get the full strings bundle for a locale. Preferred form — call once at
 * the top of a component and destructure:
 *
 *   const s = getStrings(locale);
 *   <h1>{s.home.heroLine1}</h1>
 */
export function getStrings(locale: Locale): Strings {
  return STRINGS[locale];
}

/**
 * Single-key lookup. Useful for one-off reads where pulling the full bundle
 * is overkill. Fully typed — `section` and `key` autocomplete.
 */
export function t<S extends keyof Strings, K extends keyof Strings[S]>(
  locale: Locale,
  section: S,
  key: K,
): Strings[S][K] {
  return STRINGS[locale][section][key];
}
