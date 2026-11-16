import { exactSpoilerSearchPlatform } from "../lib/searchWarning";

const ENABLED_KEY = "spoilerBlockerEnabled";
let geistFontLoad: Promise<void> | undefined;

function ensureGeistFont(): Promise<void> {
  geistFontLoad ??= (async () => {
    const response = await fetch(
      browser.runtime.getURL("/geist/Geist-Variable.woff2"),
    );
    if (!response.ok) throw new Error("Could not load Geist font");
    const font = new FontFace("GTA6 Geist", await response.arrayBuffer(), {
      weight: "100 900",
    });
    await font.load();
    document.fonts.add(font);
  })().catch(() => {
    geistFontLoad = undefined;
  });
  return geistFontLoad;
}

export default defineContentScript({
  matches: ["http://*/*", "https://*/*"],
  runAt: "document_start",
  main(ctx) {
    if (window !== window.top) return;
    let enabled = false;
    let host: HTMLElement | undefined;
    let dismissedUrl: string | undefined;

    function close(): void {
      host?.remove();
      host = undefined;
    }

    function show(): void {
      if (host && !host.isConnected) host = undefined;
      if (!document.documentElement || host) return;
      const platform = exactSpoilerSearchPlatform(new URL(location.href));
      if (!platform) return;
      host = document.createElement("div");
      host.setAttribute("data-gta6-placeholder", "");
      const shadow = host.attachShadow({ mode: "closed" });
      void ensureGeistFont();
      shadow.innerHTML = `
        <style>
          :host { all: initial; position: fixed !important; inset: 0 !important; z-index: 2147483647 !important; display: block !important; font-family: "GTA6 Geist", Arial, sans-serif; }
          * { box-sizing: border-box; }
          .screen { width: 100%; height: 100%; min-height: 100vh; display: grid; grid-template-rows: minmax(0, 1fr) auto; overflow: auto; color: #f5f1ec; background: #17171d; font-family: "GTA6 Geist", Arial, sans-serif !important; }
          .scene { display: grid; grid-template-columns: 1fr 1fr; min-height: 700px; }
          .person { position: relative; display: flex; flex-direction: column; justify-content: space-between; min-width: 0; padding: clamp(28px, 5vw, 72px); }
          .past { background: #202027; }
          .present { color: #f5f1ec; background: #202027; }
          .meme { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; object-position: 35% center; }
          .present .caption, .present-copy { position: relative; z-index: 1; }
          .present .caption { align-self: flex-start; color: #f5f1ec; background: #202027; }
          .present-copy { padding: 24px; margin: -24px; border-radius: 12px; background: rgba(32, 32, 39, .82); }
          .brand { display: flex; align-items: center; gap: 9px; color: #d9d3d8; font-size: 12px; font-weight: 750; }
          .brand-mark { display: block; width: 34px; height: 34px; object-fit: contain; }
          .caption { display: inline-flex; padding: 7px 11px; border: 1px solid currentColor; border-radius: 100px; font-size: 12px; font-weight: 800; }
          .figure-logo { display: block; width: clamp(108px, 9vw, 150px); height: clamp(108px, 9vw, 150px); margin: 18px 0 0; object-fit: contain; }
          h1, h2 { max-width: 690px; margin: 18px 0 0; font-size: clamp(48px, 5vw, 76px); font-weight: 850; line-height: .98; letter-spacing: -.06em; }
          .present h2 { color: #f5f1ec; }
          .detail { max-width: 520px; margin: 20px 0 0; font-size: 16px; line-height: 1.5; }
          .past .detail { color: #bbb6bd; }
          .present .detail { color: #bbb6bd; font-weight: 650; }
          .vs { position: absolute; top: 50%; left: 0; z-index: 2; display: grid; place-items: center; width: 76px; height: 76px; border: 6px solid #17171d; border-radius: 50%; transform: translate(-50%, -50%) rotate(-12deg); color: #fff; background: #ef4f92; font-size: 18px; font-weight: 900; }
          .footer { display: flex; align-items: center; justify-content: space-between; gap: 28px; padding: 23px clamp(28px, 5vw, 72px); background: #17171d; }
          .footer-copy { margin: 0; color: #c7c1c7; font-size: 13px; line-height: 1.4; }
          .footer-copy strong { display: block; color: #f5f1ec; font-size: 17px; line-height: 1.2; }
          .actions { display: flex; flex-wrap: wrap; gap: 10px; }
          button { min-height: 49px; padding: 0 19px; border: 1px solid #77717b; border-radius: 8px; color: #f5f1ec; background: #24242c; font: 750 13px/1 "GTA6 Geist", Arial, sans-serif; cursor: pointer; }
          button.primary { border-color: #f5f1ec; color: #17171d; background: #f5f1ec; }
          button:hover { border-color: #f5f1ec; }
          button:focus-visible { outline: 3px solid #ef4f92; outline-offset: 3px; }
          @media (max-width: 760px) { .scene { grid-template-columns: 1fr; } .person { padding: 26px; } .past { min-height: 480px; } .present { min-height: 570px; } .figure-logo { width: 96px; height: 96px; } h1, h2 { font-size: clamp(42px, 8vw, 58px); } .vs { top: 0; left: 50%; transform: translate(-50%, -50%) rotate(-12deg); } .footer { align-items: stretch; flex-direction: column; padding: 25px 26px; } }
          @media (max-width: 480px) { .past { min-height: 410px; } .present { min-height: 510px; } h1, h2 { font-size: 42px; } .actions { display: grid; } button { width: 100%; } }
        </style>
        <div class="screen" role="dialog" aria-modal="true" aria-labelledby="warning-title" aria-describedby="warning-description">
          <div class="scene">
            <section class="person past">
              <div class="brand"><img class="brand-mark" alt="" /><span>GTA VI Anti-Spoiler</span></div>
              <div>
                <span class="caption">Past you</span>
                <img class="figure-logo" alt="" />
                <h1 id="warning-title">“Please, no spoilers.”</h1>
                <p class="detail">A sensible plan. We were doing so well.</p>
              </div>
            </section>
            <section class="person present">
              <img class="meme" alt="" />
              <span class="vs" aria-hidden="true">VS</span>
              <span class="caption">Present you</span>
              <div class="present-copy">
                <h2>Searches “GTA 6” on <span id="platform-name"></span>.</h2>
                <p class="detail" id="warning-description"></p>
              </div>
            </section>
          </div>
          <div class="footer">
            <p class="footer-copy"><strong>Which you wins?</strong>Spoiler blocking stays on.</p>
            <div class="actions">
              <button class="primary" id="go-back" type="button">Go back to safety</button>
              <button id="show-results" type="button">Show the page anyway</button>
            </div>
          </div>
        </div>`;
      const logoUrl = browser.runtime.getURL("/icon/128.png");
      shadow.querySelector<HTMLImageElement>(".brand-mark")!.src = logoUrl;
      shadow.querySelector<HTMLImageElement>(".figure-logo")!.src = logoUrl;
      shadow.querySelector<HTMLImageElement>(".meme")!.src =
        browser.runtime.getURL("/chris-tucker-facepalm.gif");
      const quips: Record<string, string[]> = {
        YouTube: [
          "Surely those thumbnails will be subtle.",
          "One autoplay away from instant regret.",
          "The thumbnail wall has entered the chat.",
        ],
        TikTok: [
          "The algorithm just sat up in its chair.",
          "Your For You page heard that.",
          "One search. A thousand very confident videos.",
        ],
        Reddit: [
          "The thread titles are already warming up.",
          "Spoiler tags are feeling optimistic today.",
          "One comment can undo a whole campaign.",
        ],
        Twitch: [
          "Live chat promises to be discreet. Probably.",
          "The chat scrolls faster than your defenses.",
          "Spoiler dodgeball, now with live commentary.",
        ],
        X: [
          "The timeline has never whispered in its life.",
          "Trending topics are not known for restraint.",
          "One post is all it takes.",
        ],
        Pinterest: [
          "The image grid is ready to overshare.",
          "A spoiler, but make it a mood board.",
          "The thumbnails have no concept of suspense.",
        ],
      };
      const defaultQuips = [
        "Search results are famously great at keeping secrets.",
        "Curiosity just hit the big red button.",
        "This is a very creative way to test a spoiler blocker.",
      ];
      const options = quips[platform] ?? defaultQuips;
      shadow.querySelector<HTMLElement>("#platform-name")!.textContent =
        platform;
      shadow.querySelector<HTMLElement>("#warning-description")!.textContent =
        options[Math.floor(Math.random() * options.length)] ?? "";
      const back = shadow.querySelector<HTMLButtonElement>("#go-back")!;
      const continueButton =
        shadow.querySelector<HTMLButtonElement>("#show-results")!;
      back.addEventListener("click", () => {
        dismissedUrl = location.href;
        close();
        if (history.length > 1) history.back();
        else location.assign(location.origin);
      });
      continueButton.addEventListener("click", () => {
        dismissedUrl = location.href;
        close();
      });
      shadow.addEventListener("keydown", (event) => {
        if (!(event instanceof KeyboardEvent)) return;
        if (event.key === "Escape") {
          dismissedUrl = location.href;
          close();
        } else if (event.key === "Tab") {
          if (event.shiftKey && shadow.activeElement === back) {
            event.preventDefault();
            continueButton.focus();
          } else if (
            !event.shiftKey &&
            shadow.activeElement === continueButton
          ) {
            event.preventDefault();
            back.focus();
          }
        }
      });
      document.documentElement.append(host);
      back.focus();
    }

    function sync(): void {
      const match =
        enabled && exactSpoilerSearchPlatform(new URL(location.href));
      if (!match) {
        dismissedUrl = undefined;
        close();
      } else if (dismissedUrl !== location.href) {
        show();
      }
    }

    browser.storage.local.get(ENABLED_KEY).then((result) => {
      enabled = result[ENABLED_KEY] !== false;
      sync();
      if (!document.documentElement)
        document.addEventListener("readystatechange", sync, { once: true });
    });
    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || !changes[ENABLED_KEY]) return;
      enabled = changes[ENABLED_KEY].newValue !== false;
      sync();
    });
    ctx.addEventListener(window, "wxt:locationchange", sync);
    window.addEventListener("pageshow", sync);
  },
});
