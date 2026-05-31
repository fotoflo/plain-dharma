import { type Locale, type SuttaSlug } from "@plain-dharma/content";
import type { AudioManifest } from "@plain-dharma/content/audio";

// Per-sutta audio manifests, bundled into the JS so they ship in the OTA update
// (Metro inlines JSON imports at build time). The mp3 files themselves still
// stream from / are downloaded off the deployed site, but the manifest — the
// thing the Listen panel needs to render its track list — is local. That kills
// the first-open network round-trip that made opening the player look like it
// was "downloading" before it could show anything.
//
// Source of truth is `public/audio/<locale>/<slug>/manifest.json`. These imports
// use the same relative-path convention as src/content/markdown.ts (the package
// `exports` map doesn't cover the web app's public/ tree). Re-run the audio
// pipeline → re-publish → the next OTA picks up regenerated manifests.
import enFirstTalk from "../../../../public/audio/en/first-talk/manifest.json";
import enNotSelf from "../../../../public/audio/en/not-self/manifest.json";
import enFireSermon from "../../../../public/audio/en/fire-sermon/manifest.json";
import enLovingKindness from "../../../../public/audio/en/loving-kindness/manifest.json";
import enMindfulness from "../../../../public/audio/en/mindfulness/manifest.json";
import enHowToDecide from "../../../../public/audio/en/how-to-decide/manifest.json";
import zhFirstTalk from "../../../../public/audio/zh/first-talk/manifest.json";
import zhNotSelf from "../../../../public/audio/zh/not-self/manifest.json";
import zhFireSermon from "../../../../public/audio/zh/fire-sermon/manifest.json";
import zhLovingKindness from "../../../../public/audio/zh/loving-kindness/manifest.json";
import zhMindfulness from "../../../../public/audio/zh/mindfulness/manifest.json";
import zhHowToDecide from "../../../../public/audio/zh/how-to-decide/manifest.json";

const MANIFESTS: Record<Locale, Record<SuttaSlug, AudioManifest>> = {
  en: {
    "first-talk": enFirstTalk as AudioManifest,
    "not-self": enNotSelf as AudioManifest,
    "fire-sermon": enFireSermon as AudioManifest,
    "loving-kindness": enLovingKindness as AudioManifest,
    mindfulness: enMindfulness as AudioManifest,
    "how-to-decide": enHowToDecide as AudioManifest,
  },
  zh: {
    "first-talk": zhFirstTalk as AudioManifest,
    "not-self": zhNotSelf as AudioManifest,
    "fire-sermon": zhFireSermon as AudioManifest,
    "loving-kindness": zhLovingKindness as AudioManifest,
    mindfulness: zhMindfulness as AudioManifest,
    "how-to-decide": zhHowToDecide as AudioManifest,
  },
};

/** The bundled manifest for a sutta, or null if none was bundled for it. */
export function bundledManifest(
  locale: Locale,
  slug: SuttaSlug
): AudioManifest | null {
  return MANIFESTS[locale]?.[slug] ?? null;
}
