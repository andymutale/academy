# Gelvandale Rugby Academy — Noho-inspired direction

## Intent

A calm, editorial homepage for Gelvandale Rugby Academy in Gqeberha, Eastern Cape. The visual language borrows page rhythm and interaction patterns from the Noho concept reference, but uses Gelvandale identity, current public reporting, temporary stock placeholders and source-linked quotes.

**Tagline:** From Gelvandale to the world.

## Tokens

```css
:root {
  --navy: #102c59;        /* confirmed by current site's theme-color */
  --navy-deep: #0a1d3b;   /* proposed dark surface */
  --gold: #f2b705;        /* proposed crest sample; replace after sampling official crest */
  --paper: #f7f5ef;       /* proposed warm background */
  --ink: #102c59;
  --ink-muted: #5b6b86;   /* proposed muted text */
  --line: #d9dde5;        /* proposed hairline */
}
```

Gold is reserved for actions, selected states and small details. Primary buttons are navy with paper text; secondary buttons are gold with navy text. Dark mode changes paper, surface, ink and line variables. Avoid pink, decorative gradients, heavy borders and drop shadows.

## Typography

The site uses **DM Sans** for general interface and body copy, with **Inter Tight** reserved for the scroll-led motion statement. Headlines are large, sentence-case and deliberately line-broken. Body copy stays calm and plainspoken. Uppercase is reserved for small descriptor labels, not main headlines.

## Layout and components

- Slim sticky header with wordmark, About, Pathways, Stories, FAQ, Display preferences and Enquire.
- Hero split into editorial headline/copy and a six-tile grid of temporary Pexels stock thumbnails, marked as illustrative placeholders. Temporary stock videos appear on the media page.
- Large quote sentence with inline media thumbnails.
- Four pathway cards with an in-page popup, media strip, context and source links.
- Source-scoped community fact carousel.
- Horizontal media rail; only one embedded video is active at a time.
- Founder quote carousel with attribution and source link.
- Four-step “Find your path” quiz and a visibly demo-only enquiry form.
- Founder/story section, source rows, searchable/filterable stories, future statement band, placeholder support areas, FAQ and social cards.
- Footer with location context and the “From Gelvandale to the world” line.
- Persistent mobile enquiry CTA.

## Motion and preferences

Lenis, GSAP and ScrollTrigger are pinned to exact CDN versions and used progressively when available. CSS/native scrolling and content remain usable without them. SplitText is included as an optional pinned dependency, but the current hero uses explicit line spans rather than runtime text splitting. The Display menu exposes Dark mode and Reduce animation; system reduced-motion preference is respected. No content should be hidden if scripts fail.

## Content and honesty

- Do not invent fixtures, squads, current intake dates, eligibility, venue, contact details, sponsorship benefits or funding costs.
- The R235,000 figure for 2026 is reported for Gelvandale Rugby Academy and Little Angels Daycare combined; never present it as academy-only.
- The R260,000 figure for 2024 is reported for Gelvandale Rugby Academy and Gelvandale High School Hostel combined; never present it as academy-only.
- The Namibia story is tied to The Herald's October 2025 report.
- iQhawe Week statements point to the Hollywood Foundation archive.
- Official social profile URLs, crest file and founder's formal role title remain to be confirmed.
- The enquiry form is a demo and sends/stores nothing until an approved endpoint is connected.
- No donation link or amount is published until approved.

## Accessibility

Skip link, landmarks, labelled nav controls, focus rings, native details/summary FAQ, `aria-live` for form status, labelled quiz choices, dialog Escape/close support, arrow-key carousel navigation, minimum touch areas and `prefers-reduced-motion` support. The custom pointer label is decorative; the visible buttons and links remain usable without it.

## Assets still needed

- Official crest or academy mark, ideally SVG or transparent PNG.
- Approved stills and confirmed descriptions for video clips.
- Verified official Instagram/YouTube profile URLs.
- Confirmed public contact person, email/phone, training location, intake and programme details.
- Approved current support priorities, quantities, costs and sponsorship arrangements.


## Stock photography/video placeholder policy

All editorial and decorative photography and video now uses Pexels stock placeholders until the academy supplies approved original media. The academy crest remains separate. Stock assets carry explicit labels and must not be described as documenting academy players, sessions or events.


## Scroll-led motion sequence

A two-stage homepage feature takes the visual motion language of the supplied Butter Scroll demo and adapts it to Gelvandale Rugby Academy: a centred editorial statement with five media slots, followed by a navy timeline panel with five stock-photo/video tiles. The tiles scale and travel from the sentence slots into the timeline as the visitor scrolls. The motion is disabled when reduced motion is requested, and the inline stock video previews have an explicit Play/Pause control. The timeline is illustrative rather than an actual editing interface.
