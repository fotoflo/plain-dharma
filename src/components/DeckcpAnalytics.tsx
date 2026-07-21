import Script from "next/script";

/** Cross-site analytics for the DeckCP loop: PostHog (the SAME project as
 *  deckcp.com, so one person carries one distinct_id across every property)
 *  plus the DeckCP site tag, which ties visits here to deck-view sessions in
 *  the `zeph` workspace (contact timelines in DeckCP's leads CRM).
 *
 *  The key is a public client token — it ships in every visitor's bundle by
 *  design. The runtime hostname guard keeps localhost and *.vercel.app
 *  previews (which are production builds) out of both datasets. */
const POSTHOG_KEY = "phc_nxVxr5PLbBvJfF7729GsrVqN9pjJRUsOpzFZUmSJvds";
const POSTHOG_HOST = "https://us.i.posthog.com";
const DECKCP_ORG = "zeph";

export default function DeckcpAnalytics() {
  if (process.env.NODE_ENV !== "production") return null;

  return (
    <Script id="deckcp-analytics" strategy="afterInteractive">
      {`(function () {
          var h = location.hostname;
          if (h === 'localhost' || h === '127.0.0.1' || h.endsWith('.vercel.app')) return;
          !function(t,e){var o,n,p,r;e.__SV||(window.posthog && window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="Fi Di init Ji Xi Tr Ki tn Zi capture calculateEventProperties ln register register_once register_for_session unregister unregister_for_session dn getFeatureFlag getFeatureFlagPayload getFeatureFlagResult getAllFeatureFlags isFeatureEnabled reloadFeatureFlags updateFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey cancelPendingSurvey canRenderSurvey canRenderSurveyAsync cn identify setPersonProperties unsetPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset shutdown setIdentity clearIdentity get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException addExceptionStep captureLog startExceptionAutocapture stopExceptionAutocapture loadToolbar get_property getSessionProperty un sn createPersonProfile setInternalOrTestUser hn Wi pn opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing rn debug Er it getPageViewId captureTraceFeedback captureTraceMetric Ui".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
          posthog.init('${POSTHOG_KEY}', { api_host: '${POSTHOG_HOST}', defaults: '2026-05-30', person_profiles: 'always' });
          var t = document.createElement('script');
          t.async = true;
          t.src = 'https://deckcp.com/t.js';
          t.setAttribute('data-org', '${DECKCP_ORG}');
          document.head.appendChild(t);
        })();`}
    </Script>
  );
}
