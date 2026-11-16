import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "GTA 6 Anti-Spoiler",
    description:
      "Extension that removes GTA 6 mentions before they spoil the game.",
    version: "0.0.2",
    icons: {
      16: "icon/16.png",
      32: "icon/32.png",
      48: "icon/48.png",
      96: "icon/96.png",
      128: "icon/128.png",
    },
    permissions: ["storage"],
    host_permissions: ["https://*/*"],
    web_accessible_resources: [
      {
        resources: ["youtube-feedback-main.js"],
        matches: ["*://www.youtube.com/*"],
      },
      {
        resources: [
          "icon/128.png",
          "chris-tucker-facepalm.gif",
          "geist/Geist-Variable.woff2",
        ],
        matches: ["http://*/*", "https://*/*"],
      },
    ],
  },
});
