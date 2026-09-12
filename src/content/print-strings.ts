/**
 * Copy for the /print (copy-shop) page.
 *
 * Web-only, so it lives here rather than in the shared `strings.ts` — and it
 * carries a THIRD language that isn't a site locale. /th/print is a URL sent
 * directly to Thai copy shops, so Thai gets the whole page, not just the spec
 * card; it stops at this page, though. The rest of the site is still en/zh, so
 * a Thai visitor gets English nav and footer around a Thai page. Making Thai a
 * real locale would mean translating six suttas, which is a different project.
 *
 * `**bold**` is the only markup — see `format()` in PrintSpecSheet.tsx.
 * Placeholders `{pages}`, `{sheets}` and `{trim}` are filled from
 * printshop-spec.json, which the build writes.
 */

import type { Locale } from "@/content";

/** This page's languages: the site's two, plus Thai. */
export type PrintLang = Locale | "th";

/** Label + route for each, used by both the spec toggle and the page switcher. */
export const PRINT_LANGS: { code: PrintLang; label: string; href: string }[] = [
  { code: "en", label: "English", href: "/print" },
  { code: "th", label: "ไทย", href: "/th/print" },
  { code: "zh", label: "中文", href: "/zh/print" },
];

/**
 * Class that applies the system Thai face — defined in globals.css, because an
 * inherited font-family loses to the Tailwind font-serif/font-sans utilities
 * sitting on each element. Put it on any element whose subtree is Thai.
 */
export const THAI_CLASS = "lang-th";

export type SpecRow = { label: string; body: string };

export type SpecCopy = {
  heading: string;
  lede: string;
  rows: SpecRow[];
};

export const SPEC: Record<PrintLang, SpecCopy> = {
  en: {
    heading: "Show this to the shop",
    lede: "Everything they need, in the order they’ll ask for it.",
    rows: [
      {
        label: "Finished size",
        body: "A5 — {trim}. Two A5 pages fit one A4 sheet exactly.",
      },
      {
        label: "Interior",
        body:
          "{pages} pages, **black & white**, on your standard paper. Print " +
          "**2-up on A4, double-sided**, then cut each sheet in half. That’s " +
          "{sheets} A4 sheets per copy.",
      },
      {
        label: "Covers",
        body:
          "2 pages, **full colour**, one per A4 sheet, on card (around 250gsm). " +
          "Trim to the crop marks — {trim}.",
      },
      {
        label: "Binding",
        body:
          "Perfect bind, or staple along the binding edge. The inside margin is " +
          "20mm, so nothing is lost in the gutter.",
      },
      {
        label: "Scaling",
        body:
          "**Print at 100%.** No “fit to page” and no shrink-to-fit — the pages " +
          "are already the right size, and scaling them throws off the cut.",
      },
      {
        label: "Imposition",
        body:
          "The interior pages are in reading order, **not imposed**. Use your " +
          "own booklet or 2-up setting to arrange them — it knows which way " +
          "your printer flips.",
      },
    ],
  },

  th: {
    heading: "แสดงหน้านี้ให้ร้านพิมพ์",
    lede: "ข้อมูลทั้งหมดที่ร้านต้องใช้",
    rows: [
      {
        label: "ขนาดสำเร็จ",
        body: "A5 — {trim} สองหน้า A5 พอดีกับกระดาษ A4 หนึ่งแผ่น",
      },
      {
        label: "เนื้อใน",
        body:
          "{pages} หน้า **ขาวดำ** ใช้กระดาษปกติของร้านได้ พิมพ์ " +
          "**2 หน้าต่อแผ่น A4 แบบสองหน้า (หน้า–หลัง)** แล้วตัดครึ่งแผ่น " +
          "รวม {sheets} แผ่น A4 ต่อหนึ่งเล่ม",
      },
      {
        label: "ปก",
        body:
          "2 หน้า **พิมพ์สี** แผ่นละ 1 หน้าบนกระดาษ A4 ใช้กระดาษการ์ดประมาณ 250 แกรม " +
          "ตัดตามรอยมาร์กมุม — {trim}",
      },
      {
        label: "เข้าเล่ม",
        body:
          "ไสกาว หรือเย็บแม็กด้านสัน ขอบด้านในเผื่อไว้ 20 มม. " +
          "ตัวหนังสือจึงไม่หายเข้าไปในสัน",
      },
      {
        label: "การย่อ–ขยาย",
        body:
          "**พิมพ์ขนาดจริง 100%** ห้ามใช้ “fit to page” หรือย่อให้พอดีหน้า " +
          "ไฟล์เป็นขนาดที่ถูกต้องอยู่แล้ว ถ้าย่อหรือขยายจะตัดไม่ตรง",
      },
      {
        label: "การจัดหน้า",
        body:
          "หน้าในไฟล์เรียงตามลำดับการอ่าน **ยังไม่ได้จัดหน้าพิมพ์** " +
          "ให้ใช้ฟังก์ชัน booklet หรือ 2-up ของเครื่องพิมพ์ร้านจัดเอง " +
          "เพราะเครื่องรู้ว่าพลิกกระดาษด้านไหน",
      },
    ],
  },

  zh: {
    heading: "把这一页给打印店看",
    lede: "店家需要的全部规格。",
    rows: [
      {
        label: "成品尺寸",
        body: "A5 — {trim}。两页 A5 正好拼满一张 A4。",
      },
      {
        label: "内页",
        body:
          "{pages} 页，**黑白**，用店里的普通纸即可。请**在 A4 上拼两页、双面打印**，" +
          "打完从中间裁开。每本 {sheets} 张 A4。",
      },
      {
        label: "封面",
        body:
          "2 页，**彩色**，每张 A4 印一页，用卡纸（约 250 克）。" +
          "按四角的裁切标记裁切 — {trim}。",
      },
      {
        label: "装订",
        body:
          "胶装，或沿订口装订。内边距留了 20 毫米，文字不会被订进去。",
      },
      {
        label: "缩放",
        body:
          "**请按 100% 原尺寸打印。**不要用「适合页面」或缩放打印 — " +
          "文件已经是正确尺寸，缩放会让裁切对不齐。",
      },
      {
        label: "拼版",
        body:
          "内页按阅读顺序排列，**未做拼版**。请用打印机自带的小册子或双页拼版功能 — " +
          "它知道自己的翻页方向。",
      },
    ],
  },
};

/** Page copy outside the spec sheet. */
export type PageCopy = {
  metadataTitle: string;
  metadataDescription: string;
  eyebrow: string;
  title: string;
  intro: string;
  interiorLabel: string;
  interiorMeta: string;
  interiorNote: string;
  coversLabel: string;
  coversMeta: string;
  coversNote: string;
  notesHeading: string;
  noteCountLead: string;
  noteCountBody: string;
  noteCoversLead: string;
  noteCoversBody: string;
  noteSizeLead: string;
  noteSizeBody: string;
  homeHeading: string;
  homeBody: string;
  homeLink: string;
  remixHeading: string;
  remixBody: string;
  remixLink: string;
};

export const PAGE: Record<PrintLang, PageCopy> = {
  en: {
    metadataTitle: "Print it at a copy shop",
    metadataDescription:
      "Two files and a spec sheet — in English, Thai and Chinese — for printing your own copies of Plain Dharma. A5, black-and-white interior, colour covers. Public domain, so print as many as you like.",
    eyebrow: "Print",
    title: "Print it at a copy shop",
    intro:
      "These teachings are public domain. Take the two files below to any copy shop and print as many copies as you like — for a temple, a retreat, a reading group, a friend. No permission needed, and nothing owed.",
    interiorLabel: "Interior",
    interiorMeta: "{pages} pages · A5 · black & white",
    interiorNote: "The book itself. Prints two-up on A4, double-sided.",
    coversLabel: "Covers",
    coversMeta: "2 pages · A4 · colour",
    coversNote: "Front and back, in colour, with crop marks. Print on card.",
    notesHeading: "A few notes",
    noteCountLead: "The page count is a multiple of four.",
    noteCountBody:
      "Four A5 pages fit on one A4 sheet printed both sides, so {pages} pages comes out to exactly {sheets} sheets with nothing left over. If you edit the book, keep that true or the last sheet will be half empty.",
    noteCoversLead: "The covers are a separate file on purpose.",
    noteCoversBody:
      "Shops run colour and black-and-white as different jobs on different paper. Handed one mixed PDF, they’ll usually print all {pages} pages in colour — which is the expensive way to find out.",
    noteSizeLead: "Why A5?",
    noteSizeBody:
      "It’s a standard size everywhere outside North America, and two A5 pages tile an A4 sheet with nothing wasted. The type is set at 12pt, larger than most paperbacks, because these are often read aloud and passed around.",
    homeHeading: "Printing at home instead",
    homeBody:
      "The same book is on the {link} as a plain PDF — better suited to a desktop printer, where you’d rather have one page per sheet than cut anything in half.",
    homeLink: "download page",
    remixHeading: "Changing it",
    remixBody:
      "Everything is CC0 — translate it, re-typeset it, put your own temple’s name on it. The source text and the build scripts are on {link}, and the illustrations and fonts come with it.",
    remixLink: "the remix page",
  },

  th: {
    metadataTitle: "พิมพ์หนังสือเล่มนี้ที่ร้านพิมพ์",
    metadataDescription:
      "ไฟล์สองไฟล์พร้อมใบสเปกสำหรับร้านพิมพ์ ขนาด A5 เนื้อในขาวดำ ปกสี หนังสือเป็นสาธารณสมบัติ พิมพ์กี่เล่มก็ได้ ไม่ต้องขออนุญาต",
    eyebrow: "พิมพ์",
    title: "พิมพ์หนังสือเล่มนี้ที่ร้านพิมพ์",
    intro:
      "คำสอนเหล่านี้เป็นสาธารณสมบัติ นำไฟล์สองไฟล์ด้านล่างไปที่ร้านพิมพ์ที่ไหนก็ได้ แล้วพิมพ์กี่เล่มก็ได้ตามต้องการ — สำหรับวัด สำหรับคอร์สปฏิบัติธรรม สำหรับกลุ่มอ่านหนังสือ หรือสำหรับเพื่อน ไม่ต้องขออนุญาต และไม่มีค่าใช้จ่ายใด ๆ กับเรา",
    interiorLabel: "เนื้อใน",
    interiorMeta: "{pages} หน้า · A5 · ขาวดำ",
    interiorNote: "ตัวเล่มหนังสือ พิมพ์ 2 หน้าต่อแผ่น A4 แบบสองหน้า",
    coversLabel: "ปก",
    coversMeta: "2 หน้า · A4 · สี",
    coversNote: "ปกหน้าและปกหลัง พิมพ์สี มีรอยมาร์กตัด พิมพ์บนกระดาษการ์ด",
    notesHeading: "ข้อควรรู้",
    noteCountLead: "จำนวนหน้าหารด้วยสี่ลงตัว",
    noteCountBody:
      "กระดาษ A4 หนึ่งแผ่นพิมพ์สองหน้าจะได้ 4 หน้า A5 ดังนั้น {pages} หน้าจึงพอดีกับ {sheets} แผ่น ไม่มีแผ่นไหนเหลือทิ้ง ถ้าแก้ไขหนังสือ ควรรักษาจำนวนหน้าให้หารสี่ลงตัวไว้ ไม่อย่างนั้นแผ่นสุดท้ายจะว่างไปครึ่งแผ่น",
    noteCoversLead: "ปกแยกเป็นอีกไฟล์โดยตั้งใจ",
    noteCoversBody:
      "ร้านพิมพ์แยกงานสีกับงานขาวดำเป็นคนละงานและใช้กระดาษคนละแบบ ถ้าให้ไฟล์ PDF ที่รวมทุกอย่างไว้ด้วยกัน ร้านมักจะพิมพ์ทั้ง {pages} หน้าเป็นสีทั้งหมด ซึ่งเป็นวิธีที่แพงที่สุดในการค้นพบเรื่องนี้",
    noteSizeLead: "ทำไมต้องเป็น A5",
    noteSizeBody:
      "A5 เป็นขนาดมาตรฐานทั่วไปนอกอเมริกาเหนือ และสองหน้า A5 พอดีกับกระดาษ A4 หนึ่งแผ่นโดยไม่เหลือเศษ ตัวหนังสือใช้ขนาด 12 พอยต์ ใหญ่กว่าหนังสือปกอ่อนทั่วไป เพราะหนังสือแบบนี้มักถูกอ่านออกเสียงและส่งต่อกันไปเรื่อย ๆ",
    homeHeading: "พิมพ์เองที่บ้าน",
    homeBody:
      "หนังสือเล่มเดียวกันนี้มีเป็นไฟล์ PDF ธรรมดาอยู่ที่{link} (ภาษาอังกฤษ) ซึ่งเหมาะกับเครื่องพิมพ์ที่บ้านมากกว่า เพราะพิมพ์หน้าเดียวต่อแผ่น ไม่ต้องตัดครึ่ง",
    homeLink: "หน้าดาวน์โหลด",
    remixHeading: "แก้ไขดัดแปลง",
    remixBody:
      "ทุกอย่างเป็น CC0 — แปลได้ จัดหน้าใหม่ได้ ใส่ชื่อวัดของคุณเองได้ ต้นฉบับและสคริปต์สำหรับสร้างไฟล์อยู่ที่{link} (ภาษาอังกฤษ) พร้อมภาพประกอบและฟอนต์ทั้งหมด",
    remixLink: "หน้าแก้ไขดัดแปลง",
  },

  zh: {
    metadataTitle: "到打印店印这本书",
    metadataDescription:
      "两个文件，加一份中英泰三语规格单，让你在任何打印店印出自己的《朴素佛法》。A5 开本，黑白内页，彩色封面。公共领域，想印多少都行。",
    eyebrow: "打印",
    title: "到打印店印这本书",
    intro:
      "这些教法属于公共领域。把下面两个文件拿到任何一家打印店，想印多少本都可以 —— 给寺院、给禅修营、给读书会、给朋友。不需要许可，也不欠谁什么。",
    interiorLabel: "内页",
    interiorMeta: "{pages} 页 · A5 · 黑白",
    interiorNote: "书的正文。在 A4 上拼两页、双面打印。",
    coversLabel: "封面",
    coversMeta: "2 页 · A4 · 彩色",
    coversNote: "封面封底，彩色，带裁切标记。请印在卡纸上。",
    notesHeading: "几点说明",
    noteCountLead: "页数是四的倍数。",
    noteCountBody:
      "一张 A4 双面能放四页 A5，所以 {pages} 页正好是 {sheets} 张，没有半张浪费。如果你改动这本书，请保持这一点，否则最后一张会空掉一半。",
    noteCoversLead: "封面单独一个文件，是故意的。",
    noteCoversBody:
      "打印店把彩色和黑白当成两个不同的活、用不同的纸。给他们一个混在一起的 PDF，他们通常会把全部 {pages} 页都印成彩色 —— 那是最贵的一种试错方式。",
    noteSizeLead: "为什么用 A5？",
    noteSizeBody:
      "在北美以外，A5 到处都是标准尺寸，而且两页 A5 正好拼满一张 A4，一点不浪费。正文用 12 磅，比多数平装书都大，因为这些文字常常被人念出声、传来传去。",
    homeHeading: "在家里打印",
    homeBody:
      "同一本书在{link}上还有一个普通 PDF —— 更适合家用打印机，一张纸印一页，不用裁。",
    homeLink: "下载页",
    remixHeading: "改动它",
    remixBody:
      "一切都是 CC0 —— 翻译它、重新排版、换成你自己寺院的名字都可以。原文和构建脚本在{link}，插图和字体也一并附上。",
    remixLink: "二次创作页",
  },
};
