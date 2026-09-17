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
 * Placeholders are filled per EDITION from printshop-spec.json, which the build
 * writes: `{size}` `{trim}` `{pages}` `{sheets}` `{up}` `{perSheet}` `{gutter}`,
 * plus `{cut}` from the CUT table below. The page offers two trims, so anything
 * that differs between them has to arrive through a placeholder rather than be
 * written into the sentence — otherwise the A6 spec sheet quietly tells the shop
 * to cut A5.
 */

import type { Locale } from "@/content";
import type { EditionKey } from "@/content/printshop";

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

/**
 * The cutting instruction, per language and trim — `{cut}` in the interior row.
 *
 * It's a whole clause rather than just "in half" / "into quarters" because the
 * verb doesn't sit in the same place in all three languages, and a shop reading
 * a half-assembled sentence is exactly the failure this page exists to avoid.
 */
export const CUT: Record<PrintLang, Record<EditionKey, string>> = {
  en: {
    a5: "cut each sheet in half",
    a6: "cut each sheet into quarters",
    b6: "trim each down to 125 × 176 mm",
  },
  th: {
    a5: "ตัดครึ่งแผ่น",
    a6: "ตัดแผ่นละสี่ส่วน",
    b6: "ตัดแต่ละหน้าให้เหลือ 125 × 176 มม.",
  },
  zh: {
    a5: "从中间裁开",
    a6: "裁成四份",
    b6: "将每页裁切为 125 × 176 毫米",
  },
};

/**
 * The second sentence of "Finished size": whether the trim tiles A4.
 *
 * A5 and A6 are exact fractions of A4, which is the whole reason the shop never
 * measures anything. B6 is not an A size and does not tile it, so the sentence
 * that is reassuring for the other two would be a lie here — and a shop that
 * reads "fits exactly" and halves the sheet produces the wrong booklet. Kept in
 * a table for the same reason {cut} is: written into the sentence, the B6 spec
 * sheet would quietly tell the shop it can fold A4 and be done.
 */
export const FIT: Record<PrintLang, Record<EditionKey, string>> = {
  en: {
    a5: "Two fit an A4 sheet exactly, so there is nothing to measure.",
    a6: "Four fit an A4 sheet exactly, so there is nothing to measure.",
    b6:
      "B6 is not an A size and does not tile A4: two fit on a sheet with a " +
      "margin left over that has to be trimmed off. If you offer B6 as a " +
      "finished size, print it that way instead.",
  },
  th: {
    a5: "สองหน้าพอดีกับกระดาษ A4 หนึ่งแผ่น ไม่ต้องวัด",
    a6: "สี่หน้าพอดีกับกระดาษ A4 หนึ่งแผ่น ไม่ต้องวัด",
    b6:
      "B6 ไม่ใช่ขนาดตระกูล A จึงไม่พอดีกับ A4 วางได้สองหน้าต่อแผ่น " +
      "แต่จะเหลือขอบที่ต้องตัดทิ้ง หากร้านมีขนาดสำเร็จ B6 อยู่แล้ว ใช้แบบนั้นได้เลย",
  },
  zh: {
    a5: "两页正好拼满一张 A4，无需测量。",
    a6: "四页正好拼满一张 A4，无需测量。",
    b6:
      "B6 不属于 A 系列，无法正好拼满 A4：一张纸可放两页，" +
      "但会留下需要裁掉的边。如果贵店有 B6 成品尺寸，请直接按 B6 印制。",
  },
};

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
        body: "{size} — {trim}. {fit}",
      },
      {
        label: "Interior",
        body:
          "{pages} pages, **black & white**, on your standard paper. Print " +
          "**{up}-up on A4, double-sided**, then {cut}. That’s " +
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
          "{gutter}mm, so nothing is lost in the gutter.",
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
          "own booklet or {up}-up setting to arrange them — it knows which way " +
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
        body: "{size} — {trim} {fit}",
      },
      {
        label: "เนื้อใน",
        body:
          "{pages} หน้า **ขาวดำ** ใช้กระดาษปกติของร้านได้ พิมพ์ " +
          "**{up} หน้าต่อแผ่น A4 แบบสองหน้า (หน้า–หลัง)** แล้ว{cut} " +
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
          "ไสกาว หรือเย็บแม็กด้านสัน ขอบด้านในเผื่อไว้ {gutter} มม. " +
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
          "ให้ใช้ฟังก์ชัน booklet หรือ {up} หน้าต่อแผ่นของเครื่องพิมพ์ร้านจัดเอง " +
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
        body: "{size} — {trim}。{fit}",
      },
      {
        label: "内页",
        body:
          "{pages} 页，**黑白**，用店里的普通纸即可。请**在 A4 上拼 {up} 页、双面打印**，" +
          "打完{cut}。每本 {sheets} 张 A4。",
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
          "胶装，或沿订口装订。内边距留了 {gutter} 毫米，文字不会被订进去。",
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
          "内页按阅读顺序排列，**未做拼版**。请用打印机自带的小册子或 {up} 页拼版功能 — " +
          "它知道自己的翻页方向。",
      },
    ],
  },
};

/** Per-trim copy on the chooser: what this size is FOR, in one line plus one paragraph. */
export type EditionCopy = { tagline: string; blurb: string };

/** Page copy outside the spec sheet. */
export type PageCopy = {
  metadataTitle: string;
  metadataDescription: string;
  eyebrow: string;
  title: string;
  intro: string;
  editionsHeading: string;
  editionsIntro: string;
  /** The size-comparison picture. The image itself carries no words — the trim
   *  names and millimetres read the same in every language — so only the alt
   *  text, the caption and the link to the printable sheet live here. */
  sizesAlt: string;
  sizesCaption: string;
  sizesSheetLink: string;
  /** Keyed by trim. The name ("A5") comes from the spec — a paper size is a
   *  paper size in every language — so only the human copy lives here. */
  editions: Record<EditionKey, EditionCopy>;
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
      "Print-ready files and a spec sheet — in English, Thai and Chinese — for printing your own copies of Plain Dharma. A5, pocket-paperback B6, or pocket-sized A6, black-and-white interior, colour covers. Public domain, so print as many as you like.",
    eyebrow: "Print",
    title: "Print it at a copy shop",
    intro:
      "These teachings are public domain. Pick a size, take its two files to any copy shop, and print as many copies as you like — for a temple, a retreat, a reading group, a friend. No permission needed, and nothing owed.",
    editionsHeading: "Three sizes",
    editionsIntro:
      "The same book, set in the same 12pt type, on three different pages. Each size is two files: a black-and-white interior and a colour cover sheet.",
    sizesAlt:
      "The opening page of chapter one at all three trims, side by side and to scale: A5, B6 and A6.",
    sizesCaption: "The same page at all three sizes, to scale.",
    sizesSheetLink: "Printable size guide (A4, at 100%)",
    editions: {
      a5: {
        tagline: "The reading size",
        blurb:
          "Half an A4 sheet. It sits open on a table and reads like an ordinary paperback. Take this one unless you have a reason not to.",
      },
      b6: {
        tagline: "Pocket paperback",
        blurb:
          "The size a pocket paperback usually is. Longer lines than the A6, so " +
          "it reads closer to the A5, and it still travels. The catch: B6 isn’t " +
          "an A size, so it doesn’t tile A4, and a copy takes more paper than " +
          "either of the others. Worth asking whether your shop offers B6 as a " +
          "finished size.",
      },
      a6: {
        tagline: "Pocket size",
        blurb:
          "Half an A5 again — small enough for a shirt pocket. The type doesn’t shrink with the page, so the book runs longer; but four pages fit on a side instead of two, so a copy takes fewer sheets of paper, not more.",
      },
    },
    interiorLabel: "Interior",
    interiorMeta: "{pages} pages · {size} · black & white",
    interiorNote: "The book itself. Prints {up}-up on A4, double-sided.",
    coversLabel: "Covers",
    coversMeta: "2 pages · A4 · colour",
    coversNote: "Front and back, in colour, with crop marks. Print on card.",
    notesHeading: "A few notes",
    noteCountLead: "Each page count is a whole number of sheets.",
    noteCountBody:
      "An A4 sheet printed both sides holds four A5 pages, or eight A6 ones, so each interior is padded out to fill its last sheet exactly. If you edit the book, keep that true or the final sheet comes out part empty.",
    noteCoversLead: "The covers are a separate file on purpose.",
    noteCoversBody:
      "Shops run colour and black-and-white as different jobs on different paper. Handed one mixed PDF, they’ll usually print the whole interior in colour — which is the expensive way to find out.",
    noteSizeLead: "Why these three?",
    noteSizeBody:
      "A5 and A6 are standard everywhere outside North America, and both tile an A4 sheet with nothing left over — two up for A5, four for A6. B6 doesn’t: it’s the classic pocket-paperback size, and it buys longer lines than the A6 on a page that still travels, but printed two-up it leaves a margin on every A4 sheet to throw away. The type is set at 12pt on all three, larger than most paperbacks, because these are often read aloud and passed around. That’s why the pocket edition is longer rather than more finely set: the page gets smaller, the words don’t.",
    homeHeading: "Printing at home instead",
    homeBody:
      "The same book is on the {link} as a plain PDF — better suited to a desktop printer, where you’d rather have one page per sheet than cut anything up.",
    homeLink: "download page",
    remixHeading: "Changing it",
    remixBody:
      "Everything is CC0 — translate it, re-typeset it, put your own temple’s name on it. The source text and the build scripts are on {link}, and the illustrations and fonts come with it.",
    remixLink: "the remix page",
  },

  th: {
    metadataTitle: "พิมพ์หนังสือเล่มนี้ที่ร้านพิมพ์",
    metadataDescription:
      "ไฟล์พร้อมพิมพ์และใบสเปกสำหรับร้านพิมพ์ เลือกได้ระหว่างขนาด A5 ขนาด B6 และขนาดพกพา A6 เนื้อในขาวดำ ปกสี หนังสือเป็นสาธารณสมบัติ พิมพ์กี่เล่มก็ได้ ไม่ต้องขออนุญาต",
    eyebrow: "พิมพ์",
    title: "พิมพ์หนังสือเล่มนี้ที่ร้านพิมพ์",
    intro:
      "คำสอนเหล่านี้เป็นสาธารณสมบัติ เลือกขนาดที่ต้องการ แล้วนำไฟล์สองไฟล์ของขนาดนั้นไปที่ร้านพิมพ์ที่ไหนก็ได้ พิมพ์กี่เล่มก็ได้ตามต้องการ — สำหรับวัด สำหรับคอร์สปฏิบัติธรรม สำหรับกลุ่มอ่านหนังสือ หรือสำหรับเพื่อน ไม่ต้องขออนุญาต และไม่มีค่าใช้จ่ายใด ๆ กับเรา",
    editionsHeading: "สามขนาด",
    editionsIntro:
      "หนังสือเล่มเดียวกัน ใช้ตัวอักษรขนาด 12 พอยต์เท่ากัน ต่างกันแค่ขนาดหน้า แต่ละขนาดมีสองไฟล์ คือเนื้อในขาวดำ กับปกสี",
    sizesAlt: "หน้าแรกของบทที่หนึ่งในทั้งสามขนาด เรียงข้างกันตามสัดส่วนจริง: A5 B6 และ A6",
    sizesCaption: "หน้าเดียวกันในทั้งสามขนาด ตามสัดส่วนจริง",
    sizesSheetLink: "ใบเทียบขนาดสำหรับพิมพ์ (A4 พิมพ์ที่ 100%)",
    editions: {
      a5: {
        tagline: "ขนาดสำหรับอ่าน",
        blurb:
          "ครึ่งหนึ่งของกระดาษ A4 กางวางอ่านบนโต๊ะได้สบาย อ่านเหมือนหนังสือปกอ่อนทั่วไป ถ้าไม่มีเหตุผลอื่น แนะนำขนาดนี้",
      },
      b6: {
        tagline: "ขนาดปกอ่อนพกพา",
        blurb:
          "ขนาดเดียวกับหนังสือปกอ่อนพกพาทั่วไป บรรทัดยาวกว่า A6 จึงอ่านได้ใกล้เคียง A5 " +
          "และยังพกพาสะดวก ข้อเสียคือ B6 ไม่ใช่ขนาดตระกูล A จึงไม่พอดีกับ A4 " +
          "ใช้กระดาษต่อเล่มมากกว่าอีกสองขนาด ลองถามร้านว่ามีขนาดสำเร็จ B6 หรือไม่",
      },
      a6: {
        tagline: "ขนาดพกพา",
        blurb:
          "เล็กลงอีกครึ่งหนึ่งจาก A5 ใส่กระเป๋าเสื้อได้ ตัวหนังสือไม่ได้เล็กลงตามหน้า เล่มจึงหนาขึ้น แต่พิมพ์ได้ 4 หน้าต่อด้านแทนที่จะเป็น 2 หน้า จึงใช้กระดาษต่อเล่มน้อยลง ไม่ใช่มากขึ้น",
      },
    },
    interiorLabel: "เนื้อใน",
    interiorMeta: "{pages} หน้า · {size} · ขาวดำ",
    interiorNote: "ตัวเล่มหนังสือ พิมพ์ {up} หน้าต่อแผ่น A4 แบบสองหน้า",
    coversLabel: "ปก",
    coversMeta: "2 หน้า · A4 · สี",
    coversNote: "ปกหน้าและปกหลัง พิมพ์สี มีรอยมาร์กตัด พิมพ์บนกระดาษการ์ด",
    notesHeading: "ข้อควรรู้",
    noteCountLead: "จำนวนหน้าลงตัวพอดีกับจำนวนแผ่น",
    noteCountBody:
      "กระดาษ A4 หนึ่งแผ่นพิมพ์สองหน้าจะได้ 4 หน้า A5 หรือ 8 หน้า A6 เนื้อในแต่ละขนาดจึงเติมหน้าให้เต็มแผ่นสุดท้ายพอดี ไม่มีแผ่นไหนเหลือทิ้ง ถ้าแก้ไขหนังสือ ควรรักษาจำนวนหน้าให้ลงตัวไว้ ไม่อย่างนั้นแผ่นสุดท้ายจะว่างไปบางส่วน",
    noteCoversLead: "ปกแยกเป็นอีกไฟล์โดยตั้งใจ",
    noteCoversBody:
      "ร้านพิมพ์แยกงานสีกับงานขาวดำเป็นคนละงานและใช้กระดาษคนละแบบ ถ้าให้ไฟล์ PDF ที่รวมทุกอย่างไว้ด้วยกัน ร้านมักจะพิมพ์เนื้อในทั้งเล่มเป็นสี ซึ่งเป็นวิธีที่แพงที่สุดในการค้นพบเรื่องนี้",
    noteSizeLead: "ทำไมต้องเป็นสามขนาดนี้",
    noteSizeBody:
      "A5 และ A6 เป็นขนาดมาตรฐานทั่วไปนอกอเมริกาเหนือ และทั้งคู่พอดีกับกระดาษ A4 โดยไม่เหลือเศษ — A5 พิมพ์ 2 หน้าต่อด้าน A6 พิมพ์ 4 หน้าต่อด้าน ส่วน B6 ไม่พอดี เป็นขนาดปกอ่อนพกพาแบบคลาสสิก บรรทัดยาวกว่า A6 บนหน้าที่ยังพกพาได้ แต่เมื่อพิมพ์ 2 หน้าต่อแผ่น จะเหลือขอบบนกระดาษ A4 ที่ต้องตัดทิ้ง ตัวหนังสือใช้ขนาด 12 พอยต์ทั้งสามขนาด ใหญ่กว่าหนังสือปกอ่อนทั่วไป เพราะหนังสือแบบนี้มักถูกอ่านออกเสียงและส่งต่อกันไปเรื่อย ๆ ด้วยเหตุนี้ ฉบับพกพาจึงหนาขึ้นแทนที่จะใช้ตัวอักษรเล็กลง หน้าเล็กลงก็จริง แต่ตัวหนังสือเท่าเดิม",
    homeHeading: "พิมพ์เองที่บ้าน",
    homeBody:
      "หนังสือเล่มเดียวกันนี้มีเป็นไฟล์ PDF ธรรมดาอยู่ที่{link} (ภาษาอังกฤษ) ซึ่งเหมาะกับเครื่องพิมพ์ที่บ้านมากกว่า เพราะพิมพ์หน้าเดียวต่อแผ่น ไม่ต้องตัด",
    homeLink: "หน้าดาวน์โหลด",
    remixHeading: "แก้ไขดัดแปลง",
    remixBody:
      "ทุกอย่างเป็น CC0 — แปลได้ จัดหน้าใหม่ได้ ใส่ชื่อวัดของคุณเองได้ ต้นฉบับและสคริปต์สำหรับสร้างไฟล์อยู่ที่{link} (ภาษาอังกฤษ) พร้อมภาพประกอบและฟอนต์ทั้งหมด",
    remixLink: "หน้าแก้ไขดัดแปลง",
  },

  zh: {
    metadataTitle: "到打印店印这本书",
    metadataDescription:
      "可直接送印的文件，加一份中英泰三语规格单，让你在任何打印店印出自己的《朴素佛法》。A5 开本、B6 口袋平装本，或口袋大小的 A6，黑白内页，彩色封面。公共领域，想印多少都行。",
    eyebrow: "打印",
    title: "到打印店印这本书",
    intro:
      "这些教法属于公共领域。选一个开本，把它的两个文件拿到任何一家打印店，想印多少本都可以 —— 给寺院、给禅修营、给读书会、给朋友。不需要许可，也不欠谁什么。",
    editionsHeading: "三种开本",
    editionsIntro:
      "同一本书，同样的 12 磅正文，只是落在不同大小的页面上。每个开本都是两个文件：黑白内页和彩色封面。",
    sizesAlt: "第一章首页在三种开本下的并排对比，按真实比例：A5、B6 和 A6。",
    sizesCaption: "同一页，三种开本，按真实比例。",
    sizesSheetLink: "可打印的尺寸对照表（A4，请按 100% 打印）",
    editions: {
      a5: {
        tagline: "适合阅读",
        blurb:
          "一张 A4 的一半。摊开放在桌上刚好，读起来就像普通平装书。没有特别理由的话，选这个。",
      },
      b6: {
        tagline: "口袋平装本",
        blurb:
          "一般口袋平装书的开本。每行比 A6 长，读起来更接近 A5，同时仍便于携带。" +
          "代价是 B6 不属于 A 系列，无法正好拼满 A4，每本比另外两种更费纸。" +
          "可以先问问店家是否有 B6 成品尺寸。",
      },
      a6: {
        tagline: "口袋大小",
        blurb:
          "再对折一次的 A5，小到能放进衬衫口袋。正文不会随页面缩小，所以书更厚；但一面能拼四页而不是两页，一本反而更省纸，不是更费纸。",
      },
    },
    interiorLabel: "内页",
    interiorMeta: "{pages} 页 · {size} · 黑白",
    interiorNote: "书的正文。在 A4 上拼 {up} 页、双面打印。",
    coversLabel: "封面",
    coversMeta: "2 页 · A4 · 彩色",
    coversNote: "封面封底，彩色，带裁切标记。请印在卡纸上。",
    notesHeading: "几点说明",
    noteCountLead: "页数正好凑满整张纸。",
    noteCountBody:
      "一张 A4 双面能放四页 A5，或八页 A6，所以每个开本的内页都补到正好填满最后一张。如果你改动这本书，请保持这一点，否则最后一张会空掉一部分。",
    noteCoversLead: "封面单独一个文件，是故意的。",
    noteCoversBody:
      "打印店把彩色和黑白当成两个不同的活、用不同的纸。给他们一个混在一起的 PDF，他们通常会把整本内页都印成彩色 —— 那是最贵的一种试错方式。",
    noteSizeLead: "为什么用这三种开本？",
    noteSizeBody:
      "在北美以外，A5 和 A6 都是到处可见的标准尺寸，而且都能拼满一张 A4，一点不浪费 —— A5 一面两页，A6 一面四页。B6 不行：它是经典的口袋平装开本，每行比 A6 长，页面又仍便于携带，但一面拼两页会在 A4 上留下要裁掉的边。三个开本的正文都用 12 磅，比多数平装书都大，因为这些文字常常被人念出声、传来传去。所以口袋版是变厚，而不是把字排得更小：页面变小了，字没有。",
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
