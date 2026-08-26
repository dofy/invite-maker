<div align="center">
  <img src="public/favicon.svg" width="88" height="88" alt="Tsudoi logo" />
  <h1>Tsudoi</h1>
  <p><strong>Design once. Personalize every invitation.</strong></p>
  <p>A privacy-first visual editor for high-resolution invitations and local CSV/TXT batch generation.</p>
  <p>
    <a href="https://tsudoi.yahaha.net"><strong>Open Tsudoi</strong></a>
    ·
    <a href="#local-development">Run locally</a>
    ·
    <a href="https://github.com/dofy/invite-maker/issues">Feedback</a>
  </p>
  <p>
    <img src="https://img.shields.io/github/package-json/v/dofy/invite-maker?style=flat-square&amp;color=b89a67" alt="Version" />
    <img src="https://img.shields.io/badge/PWA-offline_ready-456a64?style=flat-square" alt="Offline-ready PWA" />
    <img src="https://img.shields.io/badge/data-local_only-765a4a?style=flat-square" alt="Data stays local" />
    <img src="https://img.shields.io/badge/languages-8-4f647d?style=flat-square" alt="Eight interface languages" />
  </p>
  <p><a href="README.zh-CN.md">简体中文</a> · <strong>English</strong> · <a href="README.ja.md">日本語</a></p>
</div>

![Tsudoi visual invitation workspace](public/og-image.png)

Tsudoi turns one background design into one or an entire batch of personalized invitations. Upload a background, add and style text directly on the canvas, then download an original-resolution PNG. For personalized versions, import CSV or TXT data and export the complete batch as a ZIP archive.

> [!IMPORTANT]
> Backgrounds, recipient data, templates, and generated files remain on your device. Tsudoi has no upload or server-side rendering path.

## How It Works

| 1. Design | 2. Personalize | 3. Export |
| --- | --- | --- |
| Upload a portrait, landscape, or square background. Add text, drag it into place, and fine-tune its style. | Mix regular text with CSV/TXT and dynamic variables. Import data and preview any record. | Download one original-resolution PNG or generate up to 200 images as a local ZIP. |

## Product Highlights

### What You See Is What You Export

- Move text freely or use fixed-width wrapping with nine anchor positions
- Snap positions and widths to canvas edges, centers, safe areas, and other text layers
- Preview and export share the same coordinate and rendering model, preserving the original image resolution
- Includes Chinese, English, Japanese, and Korean invitation fonts with language-appropriate system fallbacks
- Interface available in Simplified Chinese, Traditional Chinese, English, German, Japanese, Korean, Spanish, and French
- Supports system, light, and dark themes, with the preference stored on the local device
- Installable as a PWA; core editing and export remain available offline after the first load
- Displays a random dark illustration placeholder before a background is uploaded

### One Template, Every Personalized Version

Combine regular text and variables freely:

```text
Dear {{csv.name}}
You are warmly invited
Seat: {{index:3}}
Date: {{date}}
```

After importing data, select any row to preview its content. Once everything looks right, Tsudoi generates each PNG and packages the results as a ZIP on the local device.

### Data Stays on the Local Device

Tsudoi does not upload backgrounds, templates, or recipient lists, and it does not rely on server-side image rendering. Image rendering, CSV/TXT parsing, and ZIP packaging all happen locally, leaving no copy of your materials on a server.

## Available Variables

Spaces are allowed around variable names and colons, for example `{{ time }}` and `{{ index : 4 }}`.

| Variable | Purpose |
| --- | --- |
| `{{txt}}` | Uses the current TXT line; every non-empty line generates one image |
| `{{csv.name}}` | Uses the `name` column from the current CSV row; Unicode headers are supported |
| `{{date}}` | Current local date in `YYYY-MM-DD` format |
| `{{time}}` | Current local time in `HH:mm:ss` format |
| `{{datetime}}` | Current local date and time |
| `{{index}}` | Generation sequence starting at 1 |
| `{{index:3}}` | Pads the sequence to the requested width, for example `001`; supports 1–12 digits |
| `{{uuid}}` | Generates a unique UUID for each text layer in each image |

## Importing Data

- When a template only uses `{{txt}}`, import a TXT file; every non-empty line represents one image
- When a template uses `{{csv.header}}`, import a CSV file with a header row containing every referenced column
- `{{txt}}` and `{{csv.*}}` cannot be mixed in the same template
- A single batch supports up to 200 records to protect lower-memory devices
- UTF-8 encoding is recommended for CSV and TXT files

## Reusable Templates

The editor can import and export template JSON. A template stores the canvas safe area, text, variables, styles, widths, coordinates, and anchors. It does not contain the background image or imported data, so it can be shared safely for continued editing.

Importing a template preserves the current background and replaces only the text layers and safe-area padding.

## Product Boundaries

- A real background image is required before final export; placeholder illustrations are never exported as finished backgrounds
- Batch generation depends on device performance and currently supports up to 200 images per run
- If Google Fonts is unavailable, the editor falls back to language-appropriate system fonts, which may look slightly different
- Templates do not embed their background images; provide the image separately when moving a template

## Local Development

Requires Node.js 22+ and pnpm:

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173`.

Run the full validation suite before release:

```bash
pnpm check
```

The project is fully static and can be deployed directly to Cloudflare Pages. Each deployment advances the patch number to the next even value before building (for example, `2.3.6` to `2.3.8`):

```bash
pnpm run deploy
```

The production build uses `https://tsudoi.yahaha.net` as the default canonical URL and `og:url`. It can be overridden for a separate deployment when needed:

```bash
VITE_SITE_URL=https://example.com pnpm build
```

## Product Technology

The current Web edition uses React, TypeScript, Vite, Zustand, and Konva. Mantine provides interface components, Papa Parse reads CSV files, Zod validates templates, and JSZip creates archives. Cloudflare Pages only distributes static assets and never receives user materials.

## Roadmap

- Ready-to-use invitation templates
- Undo, redo, and layer ordering
- Web Worker support for more responsive large-batch generation
- More multilingual fonts and reusable layout presets

## GitHub

Website: [tsudoi.yahaha.net](https://tsudoi.yahaha.net)

Repository: [github.com/dofy/invite-maker](https://github.com/dofy/invite-maker)

Product suggestions, compatibility reports, and other feedback are welcome through GitHub Issues.
