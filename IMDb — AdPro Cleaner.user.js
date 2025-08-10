// ==UserScript==
// @name         IMDb — Ad/Pro Cleaner
// @namespace    blackspirits.github.io/
// @version      1.0
// @description  Blocks the IMDb ad pipeline and removes sponsored blocks and any IMDbPro UI.
// @author       BlackSpirits
// @license      MIT
// @homepageURL  https://github.com/BlackSpirits/UserScripts
// @supportURL   https://github.com/BlackSpirits/UserScripts/issues
// @downloadURL  https://raw.githubusercontent.com/BlackSpirits/UserScripts/main/imdb-adpro-cleaner.user.js
// @updateURL    https://raw.githubusercontent.com/BlackSpirits/UserScripts/main/imdb-adpro-cleaner.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=imdb.com
// @match        *://www.imdb.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==


(function () {
  'use strict';

  // ---------- 1) Disable IMDb ad functions as early as possible ----------
  const disableAds = () => {
    const w = window;
    const noop = function(){};
    try { Object.defineProperty(w, 'doWithAds', { configurable: true, writable: true, value: noop }); } catch {}
    w.ad_utils = w.ad_utils || {};
    for (const k of [
      'makeAdSlotsCall','set_slots_on_page','ads_header','apsAuctionManager',
      'update_ad_details','set_partner','expand_overlay','collapse_overlay',
      'set_aax_instrumentation_pixel_url','set_aax_impression_pixel_url',
      'set_paets_loaded_pixel_url','inject_serverside_ad'
    ]) {
      const v = (k === 'ads_header') ? { done: noop }
              : (k === 'apsAuctionManager') ? { block3PForMediaviewerBanner: noop }
              : noop;
      try { w.ad_utils[k] = w.ad_utils[k] || v; } catch {}
    }
  };
  disableAds();
  addEventListener('DOMContentLoaded', disableAds, { once: true });

  // ---------- 2) Helpers ----------
  const rm = (n) => { try { n.remove(); } catch {} };

  const removeByText = (selector, regex) => {
    document.querySelectorAll(selector).forEach(el => {
      const txt = (el.innerText || el.textContent || '').trim();
      if (regex.test(txt)) rm(el);
    });
  };

  const removeBlockContainer = (el) => {
    let cur = el;
    for (let i = 0; i < 6 && cur; i++) {
      if (cur.matches?.('.ipc-page-section, .ipc-list-card, .ipc-poster-card, .ipc-metadata-list, section, article, li, div')) {
        rm(cur);
        return true;
      }
      cur = cur.parentElement;
    }
    return false;
  };

  // ---------- 3) Remove Ads / Sponsored / IMDbPro ----------
  const stripAdsAndPro = () => {
    const adSelectors = [
      'iframe[id^="ape_inline"]',
      'iframe[data-arid]',
      '.text/x-dacx-safeframe',
      '.rendered_ad_tweening',
      '.ad_fadein',
      '.sponsored_label',
      '#sis_pixel_r2',
      '[id^="inline20"]','[id^="inline40"]','[id^="inline50"]','[id^="inline60"]','[id^="inline80"]','[id^="inlinebottom"]',
      '[id^="provider_promotion"]','[id^="promoted_watch_bar"]',
      '.inline20-page-background',
      '[data-testid*="sponsored"]',
      '[data-testid*="adv"]',
      '[class*="sponsor"]',
      '[aria-label*="Sponsored"]',
      '[aria-label*="Patrocinado"]'
    ];
    document.querySelectorAll(adSelectors.join(',')).forEach(n => rm(n));

    const proSelectors = [
      'a[href*="pro.imdb.com"]',
      'a[href*="/pro/"]',
      'a[href*="imdbpro"]',
      '[data-testid*="pro"]',
      '[class*="ProBadge"]',
      '[class*="imdbpro"]',
      'img[alt*="IMDbPro"]',
      '[aria-label*="IMDbPro"]'
    ];
    document.querySelectorAll(proSelectors.join(',')).forEach(n => {
      if (!removeBlockContainer(n)) rm(n);
    });

    removeByText('a, button, span, div', /\bIMDbPro\b/i);

    document.querySelectorAll('div, section, article, li').forEach(el => {
      const t = (el.innerText || '').trim();
      if (!t) return;
      if (/\bSponsored\b/i.test(t) || /\bPatrocinado\b/i.test(t)) {
        if (!removeBlockContainer(el)) rm(el);
      }
    });

    document.querySelectorAll('.fixed-wrap').forEach(n => n.classList.remove('fixed-wrap'));
  };

  // ---------- 4) Hard CSS to hide stubborn leftovers ----------
  const addHardCSS = () => {
    if (document.querySelector('style[data-imdb-cleaner]')) return;
    const css = `
      [data-testid*="sponsored"],
      [class*="sponsor"],
      [aria-label*="Sponsored"],
      [aria-label*="Patrocinado"] { display: none !important; }

      a[href*="pro.imdb.com"],
      a[href*="/pro/"],
      a[href*="imdbpro"],
      [data-testid*="pro"],
      [class*="imdbpro"],
      [class*="ProBadge"],
      img[alt*="IMDbPro"],
      [aria-label*="IMDbPro"] { display: none !important; }
    `;
    const style = document.createElement('style');
    style.setAttribute('data-imdb-cleaner', 'true');
    style.textContent = css;
    document.documentElement.appendChild(style);
  };

  // ---------- 5) Initialize (SPA friendly) ----------
  addHardCSS();
  const mo = new MutationObserver(() => {
    stripAdsAndPro();
    addHardCSS();
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  stripAdsAndPro();
})();
