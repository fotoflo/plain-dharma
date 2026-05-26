import type { SuttaSlug } from "./index";

type CanonicalLink = { label: string; url: string };

type Entry = {
  paliName: string;
  paliReference: string;
  links: CanonicalLink[];
};

export const CANONICAL_LINKS: Record<SuttaSlug, Entry> = {
  "first-talk": {
    paliName: "Dhammacakkappavattana Sutta",
    paliReference: "SN 56.11",
    links: [
      {
        label: "Thanissaro Bhikkhu (Access to Insight)",
        url: "https://www.accesstoinsight.org/tipitaka/sn/sn56/sn56.011.than.html",
      },
      { label: "SuttaCentral", url: "https://suttacentral.net/sn56.11" },
    ],
  },
  "not-self": {
    paliName: "Anattalakkhana Sutta",
    paliReference: "SN 22.59",
    links: [
      {
        label: "Thanissaro Bhikkhu (Access to Insight)",
        url: "https://www.accesstoinsight.org/tipitaka/sn/sn22/sn22.059.than.html",
      },
      { label: "SuttaCentral", url: "https://suttacentral.net/sn22.59" },
    ],
  },
  "fire-sermon": {
    paliName: "Ādittapariyāya Sutta",
    paliReference: "SN 35.28",
    links: [
      {
        label: "Thanissaro Bhikkhu (Access to Insight)",
        url: "https://www.accesstoinsight.org/tipitaka/sn/sn35/sn35.028.than.html",
      },
      { label: "SuttaCentral", url: "https://suttacentral.net/sn35.28" },
    ],
  },
  "loving-kindness": {
    paliName: "Karaṇīya Mettā Sutta",
    paliReference: "Snp 1.8",
    links: [
      {
        label: "Thanissaro Bhikkhu (Access to Insight)",
        url: "https://www.accesstoinsight.org/tipitaka/kn/snp/snp.1.08.than.html",
      },
      { label: "SuttaCentral", url: "https://suttacentral.net/snp1.8" },
    ],
  },
  mindfulness: {
    paliName: "Satipaṭṭhāna Sutta",
    paliReference: "MN 10",
    links: [
      {
        label: "Soma Thera (Access to Insight)",
        url: "https://www.accesstoinsight.org/tipitaka/mn/mn.010.soma.html",
      },
      { label: "SuttaCentral", url: "https://suttacentral.net/mn10" },
    ],
  },
  "how-to-decide": {
    paliName: "Kālāma Sutta",
    paliReference: "AN 3.65",
    links: [
      {
        label: "Thanissaro Bhikkhu (Access to Insight)",
        url: "https://www.accesstoinsight.org/tipitaka/an/an03/an03.065.than.html",
      },
      { label: "SuttaCentral", url: "https://suttacentral.net/an3.65" },
    ],
  },
};
