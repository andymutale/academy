# Gelvandale Rugby Academy — static HTML build

This is a plain HTML/CSS/JavaScript website. It has no framework build step.

## Current media approach

All editorial and decorative photographs and videos currently use temporary Pexels stock assets. They replace the previously displayed photography and video while the academy gathers high-quality original media. Stock assets carry explicit labels and are not represented as photographs of the academy, its players, its sessions, or particular reported events. The supplied files did not include the official academy crest, so the site uses a labelled GRA monogram fallback instead of requesting a broken crest image. This monogram is not presented as an official academy crest.

The Media page uses one primary gallery of 13 stock image references and four remotely streamed stock video sources (the MP4 binaries are not bundled in this ZIP). The former separate reference-gallery approach and the previous third-party video embed have been removed. The article/source links remain for factual background, but article thumbnails are illustrative stock placeholders.

## Main pages

- `index.html` — Home
- `our-story/index.html` — About Us
- `player-pathway/index.html` — Programs
- `impact/index.html` — Community impact
- `news/index.html` — News
- `media/index.html` — Temporary stock photo gallery and video clips
- `support/index.html` — Support areas and sponsor appeal
- `contact/index.html` — Enquiry preview (not connected to a backend)
- `404.html` — Not found

## Source inventory and future replacement

- `assets/image-url-manifest.txt` lists all temporary image/video URLs.
- `assets/public-media-sources.md` documents the Pexels sources and the temporary-stock policy.
- `script.js` contains the stock imagery used inside the interactive pathway dialogs.
- Page HTML files contain the stock image URLs used in each layout. When originals arrive, replace these URLs in the relevant pages and the pathway-dialog entries in `script.js`, update the manifest, and remove the stock-placeholder labels for the new academy-owned assets.

## Notes and limitations

- Images and video files are externally hosted; the MP4 binaries are not bundled in this ZIP because outbound network/DNS was unavailable in this build environment.
- The native video players now use the direct Pexels CDN MP4 URLs resolved from the supplied download endpoints, rather than using the redirect/download URLs as the player source. Playback still needs verification in a browser with network access.
- The site has not been deployed from this package. Run a browser test at desktop and mobile sizes before production.
- The enquiry form remains a demonstration and does not send or store messages.
- Confirm intake details, contact channels, programme facts and support priorities with the academy before launch.

## Dependencies

The pages load pinned CDN versions of GSAP 3.13.0, ScrollTrigger 3.13.0, SplitText 3.13.0, and Lenis 1.1.20. Navigation and core content remain in HTML if scripts do not load.


### Temporary stock video playback

The Media page uses inline HTML video players with on-page controls. The MP4 streams remain externally hosted on Pexels; local copies are not bundled and playback could not be verified from the build environment.


## Scroll-led media sequence

The selected lead image in the homepage timeline is Pexels photo 3702666, chosen from the supplied stock references and linked to its Pexels source. All displayed stock photographs and video clips remain visibly labelled as temporary placeholders.

The homepage includes a scroll-driven media sequence adapted from the supplied Butter Scroll example. Five temporary stock media tiles move from slots in the “From the pitch to what comes next” statement into a timeline-style film strip. The former “An academy built on…” headline with images embedded between words has been removed; its supporting belief sentence and “Read our story” link remain as a simple bridge section. The rainbow-colour text-shadow animation has also been removed; text uses a restrained fade-in in the academy’s navy palette. Hero photo captions are constrained so they do not obscure large portions of the images, and the hero layout adapts for smaller screens. The sequence reuses the site's existing GSAP, ScrollTrigger and Lenis dependencies; it does not initialise a second smooth-scroll loop. Video previews load and play muted only after the visitor selects the on-page Play clips control; offscreen playback pauses and reduced-motion preferences are respected. All photos and videos remain clearly marked as temporary stock placeholders until the academy provides original media.


## October 2026 — pathway section layout update

The home page pathway section uses an editorial four-column composition based on the supplied reference screenshot: small section label at left, oversized two-line heading in the middle, short introduction at right, and a staggered grid of portrait and landscape image cards. The existing four pathway topics, enquiry URLs, pathway detail dialogs, accessibility labels, and visible Pexels placeholder disclosures are retained. Tablet and mobile breakpoints reflow the layout to two and one columns.

## October 2026 — clear five-step navigation and user journey

The primary navigation is consistent across desktop and mobile: **Home → About Us → News → Programs → Contact**. Community impact, support, and media remain accessible through relevant page links and the footer rather than competing as top-level choices.

The homepage hero starts with **Explore Programs** and offers **About Us** as the secondary route. About Us leads to Programs first and Contact second. News closes with an onward call to Programs or Contact. The homepage pathway quiz now routes to the single Contact page and carries its recommended enquiry topic in the URL so it can be preselected.

The crest remains a Home link; the mobile fixed CTA points to Contact. The display preferences control (dark mode and reduced motion) remains available as a utility, not a destination in the five-item primary navigation. Forms remain demo-only and do not send or store information until a real enquiry service is connected.

## Lighthouse / SEO optimization patch (19 October 2026)
- Responsive, compressed Pexels image URLs and `srcset`/`sizes` for public stock imagery.
- First homepage hero image is eagerly loaded with high fetch priority; lower-page imagery remains lazy-loaded.
- Motion-grid videos are not fetched or autoplayed until the visitor activates Play clips.
- Consolidated Google Fonts stylesheet request.
- Canonical, Open Graph, X card, meta description, and SportsOrganization structured data on indexable pages.
- Replaced missing crest image requests with the existing GRA monogram fallback (not presented as an official crest).
- Fixed mobile navigation heading order, enlarged text-link touch targets, and added a stock-video text track.
- Added `llms.txt`, security headers, and improved static asset cache policies in `netlify.toml`.

Re-run Lighthouse on the deployed build. CDN responses, the test device, region, and cache state affect scores; improvements are not guaranteed until verified on the live deployment. The enquiry form remains a preview until an approved submission endpoint is configured.


## October 2026 — mobile-first responsive pass
- The default layout now targets narrow phone widths first, with mobile navigation, compact hero typography, one-column editorial reading flows, large touch targets, safe-area-aware bottom CTA spacing, and reduced-motion support.
- Tablet layouts progressively add two-column content and media grids from 600px. Full desktop navigation and the wide editorial hero/grid layouts are introduced at 1021px and above.
- The homepage image composition, pathways section, story/support/social grids, footers, media rail, mobile menu, and dialogs have explicit responsive baselines.
- The existing five-option navigation journey is retained: Home, About Us, News, Programs, Contact. Display preferences remain a utility, not a sixth destination.
- This is a CSS-only layout pass on top of the SEO/performance patch; no attempt was made to invent missing academy contact details or connect the demonstration form.
- Screenshots and Lighthouse scores still need confirmation in a normal browser and after deployment.


## October 2026 — GSAP horizontal media rail
- The homepage “A closer look inside” media rail now pins and translates horizontally with GSAP + ScrollTrigger on screens 801px and wider. Vertical page scrolling drives the rail across its cards.
- Narrow screens retain native horizontal touch scrolling so the interaction stays mobile-friendly and does not hijack vertical swipes.
- The enhancement respects the site’s reduced-motion preference and falls back to native overflow scrolling if GSAP/ScrollTrigger is unavailable. ScrollTrigger refreshes after initial page load to account for final layout dimensions.

## Mobile navigation update

- The header menu button is also the close button and remains at the same top-right position while the menu is open.
- The mobile menu is simplified to the academy wordmark, five primary destinations, and optional display preferences.
- Links animate in with a subtle stagger; the overlay eases in/out, with reduced-motion support and Escape-to-close retained.
