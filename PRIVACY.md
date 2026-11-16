# GTA 6 Anti-Spoiler Privacy Policy

Last updated: November 16, 2026

GTA 6 Anti-Spoiler hides web content that may reveal information about Grand Theft Auto VI. This policy describes how the extension handles data.

## Data the extension uses

- **Website content:** The extension examines visible page text, image descriptions, image URLs, and images to identify matching spoilers. It processes this content locally in your browser. For image pattern detection, it may request an image from its original HTTPS host without sending your cookies or a referrer, then analyze the image locally.
- **Current page URL:** The extension checks search URLs to show a warning for exact GTA VI searches. It does not save a list of visited pages or search queries.
- **YouTube authentication information:** If you explicitly enable “Improve Feed recommendations,” the extension reads a YouTube sign-in cookie in the YouTube page to authorize a “Not interested” request for matching recommendations. The request goes directly to YouTube. The extension does not store the cookie or send it to the extension developer. This feature is off until you enable it.
- **Local settings and counts:** The extension stores your on/off settings, feedback consent, and counts of hidden items and successful YouTube feedback in browser extension storage on your device.

## Sharing and retention

The extension does not send website content, browsing history, settings, counts, or authentication information to the developer. It does not sell data or use it for advertising. Optional recommendation feedback is sent only to YouTube using your signed-in session. Image requests go only to the image's original host. Local settings and counts remain on your device until you clear extension data or uninstall the extension.

## Your choices

You can pause spoiler blocking or turn off YouTube recommendation feedback in the extension popup. Turning off recommendation feedback stops new feedback requests. You can remove locally stored settings and counts by clearing the extension's storage or uninstalling it.

## Limited use

The use of information received from Google APIs will adhere to the Chrome Web Store User Data Policy, including the Limited Use requirements. Data is used only to provide the spoiler-blocking and optional recommendation-feedback features described above.

## Contact

For privacy questions, open an issue at [github.com/ge0rg3e/gta-vi-anti-spoiler](https://github.com/ge0rg3e/gta-vi-anti-spoiler/issues).
