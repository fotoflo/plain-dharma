import type { Locale } from "./index";

export type GlossaryEntry = {
  term: string;
  pali?: string;
  definition: string;
};

// Entries are kept in the same order across locales so the EN and ZH lists
// stay parallel — useful for diffs and for readers cross-referencing terms.
export const GLOSSARY: Record<Locale, GlossaryEntry[]> = {
  en: [
    {
      term: "Anattā",
      pali: "Pali; Sanskrit: anātman.",
      definition:
        '"Not-self." The teaching that no permanent, separate self can be found in any aspect of experience.',
    },
    {
      term: "Anicca",
      pali: "Pali; Sanskrit: anitya.",
      definition:
        '"Impermanence." The teaching that all conditioned things change.',
    },
    {
      term: "Bodhi",
      definition:
        'Awakening; the seeing the Buddha had under the tree. "Buddha" means "awakened one."',
    },
    {
      term: "Dharma",
      pali: "Sanskrit; Pali: dhamma.",
      definition:
        'The Buddha’s teaching, and also "the way things are." The English spelling is used throughout this site.',
    },
    {
      term: "Dukkha",
      pali: "Pali; Sanskrit: duḥkha.",
      definition:
        'Often translated "suffering," but more like "unease," "unsatisfactoriness," the inherent friction of conditioned existence.',
    },
    {
      term: "The Eightfold Path",
      definition:
        "The Buddha’s prescription for ending suffering: Right View, Right Intention, Right Speech, Right Action, Right Livelihood, Right Effort, Right Mindfulness, Right Concentration.",
    },
    {
      term: "The Five Aggregates",
      pali: "Pali: pañcakkhandha.",
      definition:
        'Body, feeling, perception, mental formations, consciousness. The five things you take to be "you," none of which is actually a self.',
    },
    {
      term: "The Four Noble Truths",
      definition:
        "Suffering exists; suffering has a cause (craving); suffering can end; there is a path to ending it.",
    },
    {
      term: "Karma",
      pali: "Sanskrit; Pali: kamma.",
      definition:
        'Literally "action." The teaching that intentional actions have natural consequences.',
    },
    {
      term: "Mahāyāna",
      definition:
        '"The great vehicle." A later branch of Buddhism dominant in East Asia and Tibet. The teachings on this site predate the Mahāyāna / Theravāda split.',
    },
    {
      term: "Mettā",
      pali: "Pali.",
      definition:
        "Loving-kindness, goodwill, friendliness. The subject of the fourth teaching on this site.",
    },
    {
      term: "Nirvana",
      pali: "Sanskrit; Pali: nibbāna.",
      definition:
        'Literally "blowing out" — the extinction of craving, and the freedom from suffering it brings. Not a place; not annihilation.',
    },
    {
      term: "Pali",
      definition:
        "The language in which the earliest Buddhist texts were preserved, closely related to what the Buddha himself likely spoke.",
    },
    {
      term: "Sangha",
      pali: "Pali / Sanskrit.",
      definition: "The community of practitioners.",
    },
    {
      term: "Satipaṭṭhāna",
      pali: "Pali.",
      definition:
        '"Foundations of mindfulness." The practice of mindful attention in four domains: body, feelings, mind, mental contents.',
    },
    {
      term: "Sutra",
      pali: "Sanskrit; Pali: sutta.",
      definition:
        "A discourse or talk attributed to the Buddha. The six teachings on this site are all sutras.",
    },
    {
      term: "Tathāgata",
      pali: "Pali / Sanskrit.",
      definition:
        'Literally "one who has thus gone" or "thus come." The Buddha’s term for himself.',
    },
    {
      term: "Theravāda",
      pali: "Pali.",
      definition:
        '"The way of the elders." The school of Buddhism that preserved the Pali Canon, dominant in Sri Lanka and Southeast Asia.',
    },
  ],
  zh: [
    {
      term: "无我",
      pali: "Anattā · 巴利文；梵文 anātman。",
      definition:
        "「无我」。在经验的任何一面里，都找不到一个恒常、独立的「我」。",
    },
    {
      term: "无常",
      pali: "Anicca · 巴利文；梵文 anitya。",
      definition: "「无常」。一切由因缘而起的事物都在变。",
    },
    {
      term: "菩提",
      pali: "Bodhi。",
      definition:
        "觉悟；佛陀在菩提树下亲见的那一刻。「佛」就是「觉者」的意思。",
    },
    {
      term: "法",
      pali: "Dharma · 梵文；巴利文 dhamma。",
      definition:
        "佛陀的教法，也指「事物本来的样子」。本站统一用「法」这个字。",
    },
    {
      term: "苦",
      pali: "Dukkha · 巴利文；梵文 duḥkha。",
      definition:
        "常被译作「苦」，更贴切的是「不安」、「不圆满」——一切有为法本身带着的那种摩擦感。",
    },
    {
      term: "八正道",
      pali: "The Eightfold Path。",
      definition:
        "佛陀给出的灭苦之道：正见、正思维、正语、正业、正命、正精进、正念、正定。",
    },
    {
      term: "五蕴",
      pali: "The Five Aggregates · 巴利文 pañcakkhandha。",
      definition:
        "色、受、想、行、识。你以为是「自己」的这五样，没有一样真的是「我」。",
    },
    {
      term: "四圣谛",
      pali: "The Four Noble Truths。",
      definition:
        "有苦；苦有起因（贪爱）；苦可以止息；有一条通往止息的路。",
    },
    {
      term: "业",
      pali: "Karma · 梵文；巴利文 kamma。",
      definition: "字面就是「行动」。有意的行动会带来自然的后果。",
    },
    {
      term: "大乘",
      pali: "Mahāyāna。",
      definition:
        "「大的车乘」。后来兴起的一支佛教，主要流行于东亚和西藏。本站这几篇开示，比大乘和上座部的分化更早。",
    },
    {
      term: "慈",
      pali: "Mettā · 巴利文。",
      definition: "慈爱、善意、友善。本站第四篇开示讲的就是它。",
    },
    {
      term: "涅槃",
      pali: "Nirvana · 梵文；巴利文 nibbāna。",
      definition:
        "字面是「吹熄」——熄灭贪爱，由此从苦中解脱。不是一个地方，也不是断灭。",
    },
    {
      term: "巴利文",
      pali: "Pali。",
      definition:
        "最早一批佛教经文所用的语言，和佛陀本人很可能说的话非常接近。",
    },
    {
      term: "僧伽",
      pali: "Sangha · 巴利文 / 梵文。",
      definition: "修行者的共同体。",
    },
    {
      term: "念处",
      pali: "Satipaṭṭhāna · 巴利文。",
      definition:
        "「念安住的所在」。把觉知安住在四个方面：身、受、心、法。",
    },
    {
      term: "经",
      pali: "Sutta · 巴利文；梵文 sūtra。",
      definition:
        "归于佛陀亲口所说的一段开示。本站这六篇都属于经。",
    },
    {
      term: "如来",
      pali: "Tathāgata · 巴利文 / 梵文。",
      definition:
        "字面是「如此而去」或「如此而来」。佛陀对自己的称呼。",
    },
    {
      term: "上座部",
      pali: "Theravāda · 巴利文。",
      definition:
        "「长老们的传承」。保存了巴利圣典的一派，主要流行于斯里兰卡和东南亚。",
    },
  ],
};
