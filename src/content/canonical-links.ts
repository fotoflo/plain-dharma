import type { Locale, SuttaSlug } from "./index";

type CanonicalLink = { label: string; url: string };

type Entry = {
  paliName: string;
  paliReference: string;
  linksByLocale: Record<Locale, CanonicalLink[]>;
};

export const CANONICAL_LINKS: Record<SuttaSlug, Entry> = {
  "first-talk": {
    paliName: "Dhammacakkappavattana Sutra",
    paliReference: "SN 56.11",
    linksByLocale: {
      en: [
        {
          label: "Thanissaro Bhikkhu (Access to Insight)",
          url: "https://www.accesstoinsight.org/tipitaka/sn/sn56/sn56.011.than.html",
        },
        { label: "SuttaCentral", url: "https://suttacentral.net/sn56.11" },
      ],
      zh: [
        {
          label: "雜阿含經 379 · 轉法輪經 (SuttaCentral)",
          url: "https://suttacentral.net/sa379",
        },
        {
          label: "雜阿含經 卷十五 (CBETA)",
          url: "https://cbetaonline.dila.edu.tw/zh/T0099_015",
        },
        { label: "SuttaCentral", url: "https://suttacentral.net/sn56.11" },
      ],
    },
  },
  "not-self": {
    paliName: "Anattalakkhana Sutra",
    paliReference: "SN 22.59",
    linksByLocale: {
      en: [
        {
          label: "Thanissaro Bhikkhu (Access to Insight)",
          url: "https://www.accesstoinsight.org/tipitaka/sn/sn22/sn22.059.than.html",
        },
        { label: "SuttaCentral", url: "https://suttacentral.net/sn22.59" },
      ],
      zh: [
        {
          label: "雜阿含經 34 · 五比丘經 (SuttaCentral)",
          url: "https://suttacentral.net/sa34",
        },
        {
          label: "雜阿含經 卷一 (CBETA)",
          url: "https://cbetaonline.dila.edu.tw/zh/T0099_001",
        },
        { label: "SuttaCentral", url: "https://suttacentral.net/sn22.59" },
      ],
    },
  },
  "fire-sermon": {
    paliName: "Ādittapariyāya Sutra",
    paliReference: "SN 35.28",
    linksByLocale: {
      en: [
        {
          label: "Thanissaro Bhikkhu (Access to Insight)",
          url: "https://www.accesstoinsight.org/tipitaka/sn/sn35/sn35.028.than.html",
        },
        { label: "SuttaCentral", url: "https://suttacentral.net/sn35.28" },
      ],
      zh: [
        {
          label: "雜阿含經 197 · 燒燃經 (SuttaCentral)",
          url: "https://suttacentral.net/sa197",
        },
        {
          label: "雜阿含經 卷八 (CBETA)",
          url: "https://cbetaonline.dila.edu.tw/zh/T0099_008",
        },
        { label: "SuttaCentral", url: "https://suttacentral.net/sn35.28" },
      ],
    },
  },
  "loving-kindness": {
    paliName: "Karaṇīya Mettā Sutra",
    paliReference: "Snp 1.8",
    linksByLocale: {
      en: [
        {
          label: "Thanissaro Bhikkhu (Access to Insight)",
          url: "https://www.accesstoinsight.org/tipitaka/kn/snp/snp.1.08.than.html",
        },
        { label: "SuttaCentral", url: "https://suttacentral.net/snp1.8" },
      ],
      zh: [
        {
          label: "慈經 · Snp 1.8 (SuttaCentral)",
          url: "https://suttacentral.net/snp1.8",
        },
        {
          label: "法句經 · 慈仁品 (CBETA)",
          url: "https://cbetaonline.dila.edu.tw/zh/T0210_002",
        },
      ],
    },
  },
  mindfulness: {
    paliName: "Satipaṭṭhāna Sutra",
    paliReference: "MN 10",
    linksByLocale: {
      en: [
        {
          label: "Soma Thera (Access to Insight)",
          url: "https://www.accesstoinsight.org/tipitaka/mn/mn.010.soma.html",
        },
        { label: "SuttaCentral", url: "https://suttacentral.net/mn10" },
      ],
      zh: [
        {
          label: "中阿含經 98 · 念處經 (SuttaCentral)",
          url: "https://suttacentral.net/ma98",
        },
        {
          label: "中阿含經 卷二十四 (CBETA)",
          url: "https://cbetaonline.dila.edu.tw/zh/T0026_024",
        },
        { label: "SuttaCentral", url: "https://suttacentral.net/mn10" },
      ],
    },
  },
  "how-to-decide": {
    paliName: "Kālāma Sutra",
    paliReference: "AN 3.65",
    linksByLocale: {
      en: [
        {
          label: "Thanissaro Bhikkhu (Access to Insight)",
          url: "https://www.accesstoinsight.org/tipitaka/an/an03/an03.065.than.html",
        },
        { label: "SuttaCentral", url: "https://suttacentral.net/an3.65" },
      ],
      zh: [
        {
          label: "中阿含經 16 · 伽藍經 (SuttaCentral)",
          url: "https://suttacentral.net/ma16",
        },
        {
          label: "中阿含經 卷三 (CBETA)",
          url: "https://cbetaonline.dila.edu.tw/zh/T0026_003",
        },
        { label: "SuttaCentral", url: "https://suttacentral.net/an3.65" },
      ],
    },
  },
};
