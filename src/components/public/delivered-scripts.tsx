"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const DELIVERED_SCRIPT = "/legacy/assets/js/site-cms.js?v=20261009-menu-image-base";

/// The delivered script binds scroll/resize listeners on window and document.
/// Re-executing it on every soft navigation would stack a new generation of
/// them each time, so executions are bracketed with TRACK_ON / TRACK_OFF:
/// while "on", every window/document listener the script adds is recorded and
/// can be released before the next execution.
const TRACK_ON = `(function(w,d){var t=w.__kpdTrack;if(!t){t=w.__kpdTrack={on:false,list:[],release:function(){t.list.splice(0).forEach(function(l){l.t.removeEventListener(l.type,l.fn,l.opts)})}};[w,d].forEach(function(target){var add=target.addEventListener;target.addEventListener=function(type,fn,opts){if(t.on)t.list.push({t:target,type:type,fn:fn,opts:opts});return add.call(this,type,fn,opts)}})}t.on=true})(window,document);`;
const TRACK_OFF = `window.__kpdTrack.on=false;window.__kpdEarly=location.pathname;`;

type KpdWindow = Window & { __kpdTrack?: { on: boolean; release: () => void }; __kpdEarly?: string };

/// Runs the delivered interaction layer (site-cms.js) synchronously while the
/// server HTML is parsed — the same moment the delivered pages run site.js —
/// instead of after hydration. Without it the reveal / timeline choreography
/// only starts once React has hydrated (hundreds of ms to seconds later), so
/// the page paints un-animated first and then jumps. Render it as the last
/// child of the page, after the footer, so the DOM it queries already exists.
/// DeliveredScripts detects the early run and does not execute it twice.
export function DeliveredEarlyScripts() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: TRACK_ON }} />
      {/* Intentionally parse-blocking: it must run before first paint, like the delivered pages. */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script src={DELIVERED_SCRIPT} />
      <script dangerouslySetInnerHTML={{ __html: TRACK_OFF }} />
    </>
  );
}

/// Executes the delivered interaction layer (site-cms.js) and any page
/// extras (live news feed, ownership planner) for the current view. Every
/// soft navigation replaces the page tree, so the scripts re-execute against
/// fresh DOM — the same clean-binding model as a full page load, without the
/// reload. Body-level widgets (modals, floating contact) persist across
/// navigations and are found again by each execution.
export function DeliveredScripts({ sources = [], bodyClass }: { sources?: string[]; bodyClass?: string }) {
  const pathname = usePathname();
  const extraKey = sources.join("|");
  useEffect(() => {
    // A soft-navigated view must not inherit stale body state. Pages with a
    // delivered body class (e.g. "home-development-page kpd-page contact-page")
    // restore it exactly — several delivered CSS rules and site.js behaviours
    // (delayed-header reveal, .floating-contact visibility) key off <body>.
    if (bodyClass) document.body.className = bodyClass;
    else document.body.classList.remove("menu-open", "modal-open");
    const w = window as KpdWindow;
    // The first view of a full page load may already have run the delivered
    // script during parse (DeliveredEarlyScripts); only the extras remain.
    const ranEarly = w.__kpdEarly === location.pathname;
    delete w.__kpdEarly;
    if (!ranEarly) w.__kpdTrack?.release();
    const urls = ranEarly ? sources : [DELIVERED_SCRIPT, ...sources];
    const track = w.__kpdTrack;
    if (track && urls.length) track.on = true;
    const scripts = urls.map((src, index) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      // Scripts execute in order, so the last one's load ends the tracked window.
      if (track && index === urls.length - 1) script.addEventListener("load", () => { track.on = false; }, { once: true });
      document.body.appendChild(script);
      return script;
    });
    return () => {
      scripts.forEach((script) => script.remove());
      if (w.__kpdTrack) w.__kpdTrack.on = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, extraKey]);
  return null;
}
