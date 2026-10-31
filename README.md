# Beacon Nicolas Mkhabele: Data Science Portfolio

A fast, single-page portfolio for sharing with recruiters. It's plain HTML, CSS and JavaScript, so there's no build step, and it's hosted free on GitHub Pages.

**Live site (after you turn on Pages):** https://beaconnicolas.github.io/pushing/

## What's in here

```
index.html          Page layout, plus the title/description used in link previews
js/content.js       ← ALL your text: profile, projects, skills, experience
js/main.js          Renders content.js and runs the interactive bits
css/style.css       Styling, including light and dark themes
assets/             Favicon, link-preview image, and your CV/photo when you add them
video/              "Send HD video" tool (separate page, see below)
```

## Put it online with GitHub Pages (one-time, about 2 minutes)

1. On GitHub, open this repository and go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Pick the branch that holds these files (for example `main`) and the **/ (root)** folder, then click **Save**.
4. Wait about a minute and refresh. GitHub shows the live URL at the top of the Pages settings.

From then on, every push to that branch updates the site automatically.

> **Want a cleaner link?** Rename this repository to `BeaconNicolas.github.io` (Settings → General → Repository name). The site then lives at `https://beaconnicolas.github.io/`. If you do this, update the two `og:url` / `og:image` URLs near the top of `index.html` and the URL in this README.

## Update your content

Everything you'd want to change is in **`js/content.js`**. You can edit it right on GitHub: open the file, click the pencil icon, make changes, then click **Commit changes**.

- **Add your email:** set `email: "you@example.com"` and an "Email me" button appears.
- **Add your CV:** upload your PDF to `assets/` as `resume.pdf`, then set `resume: "assets/resume.pdf"`. "Download CV" buttons appear in the header, the intro and the contact section.
- **Add a photo:** upload it to `assets/` (for example `photo.jpg`) and set `photo: "assets/photo.jpg"`. Without one, your initials are shown.
- **Add a project:** copy one `{ ... }` block in `projects`, paste it after a comma, and edit it. Filter buttons are created from each project's `category`.
- **Hide something:** set a text field to `""`, or delete a list item.
- **Update the GitHub activity graph:** the `activity` block holds one digit per day (0–4) copied from your BMW GitHub contribution graph, plus the yearly totals. Take a new screenshot of the graph and ask Claude to re-read it, or edit the digits and totals yourself.

The page title and link-preview text (what LinkedIn or WhatsApp shows when you paste your link) live in the `<head>` of `index.html`.

## Preview on your computer

Open `index.html` in a browser, or run a tiny local server from this folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Features

- Responsive, from phones to wide screens
- Light and dark themes (follows the visitor's system setting, with a toggle)
- Project filters by category
- An interactive lab in the intro: k-means clustering (choose k, new data, click to add points) and a simulated AWS solve pipeline
- A "Selected work" bento grid: featured project (`featured: true`), an "At a glance" tile (`telemetry`), a code tile (`snippets`) and the contribution graph with hover tooltips
- Tech logos on skills and tags (Devicon SVGs in `assets/icons`, matched by name), category pills (`tag`), and impact pills on each job (`impact`)
- Clean print layout, in case a recruiter prints the page
- Link-preview image and meta tags for LinkedIn, WhatsApp and email
- Accessible: keyboard navigation, skip link, reduced-motion support

## Send HD video (`video/`)

A separate page at **https://beaconnicolas.github.io/pushing/video/** that gets a video ready to send to anyone, on iPhone or Android:

1. Pick or drop a video (MP4, MOV, WebM, MKV; iPhone HEVC included).
2. Choose **Full HD 1080p** (recommended), **HD 720p**, **Keep the original resolution**, or **Fit a file size** (for example "under 16 MB").
3. It's converted to an **H.264 + AAC MP4**, the one format every iPhone and Android phone plays. Rotation is baked in, the bitrate suits the resolution, and the index sits at the front so playback starts straight away.
4. Tap **Send** to open the phone's share sheet (WhatsApp, Messages, Telegram, email, AirDrop…), or **Save to device**.

Everything runs in the browser through WebCodecs. **Nothing is uploaded**, so there's no server and no storage cost. It needs Chrome or Edge (desktop or Android), or Safari 16.4+ (iPhone/iPad on iOS 16.4+, or Mac). Files that are already phone-friendly H.264 at the right size are copied untouched instead of re-encoded.

The video engine is [Mediabunny](https://mediabunny.dev/) (MPL-2.0), copied into `video/vendor/` so the page doesn't depend on a CDN. The AAC encoder add-on (about 1 MB) only loads in browsers that can't encode AAC themselves. The `video/` folder is self-contained, so you can copy it into any other GitHub Pages repository as is.
