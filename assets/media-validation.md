# Media and motion QA — static source audit

Checked in the working source tree on 2026-10-16.

## Distinct content groups

- Homepage hero grid: 5 photographs with 5 different source-asset identities.
- “An academy built on…” statement: 4 photographs with 4 different source-asset identities.
- Player pathway cards: 4 photographs with 4 different source-asset identities.
- Homepage media rail: 4 photographs with 4 different source-asset identities. The video poster is not repeated as a fake second video card here.
- Media page photo gallery: 7 photographs with 7 different source-asset identities.
- Actual inline video player definitions: 1, `x6ddah3`, hosted by Dailymotion and identified as World Rugby’s iQhawe Week feature. It is contextual footage, not represented as a Gelvandale-produced video.

Old guessed YouTube IDs were removed. There were no verified additional academy-produced video URLs in the source register available for this build, so this project does not fabricate extra video embeds.

## GSAP use

- GSAP 3.13.0 + ScrollTrigger 3.13.0 animate section reveals.
- Exactly one image has `data-scroll-zoom`: the first inline image in the statement. ScrollTrigger scrubs its scale from 1 to 1.38.
- When a visitor presses Play on the single video, GSAP eases the iframe into its existing 16:9 frame. Video playback does not use the image zoom trigger.
- Motion effects respect `prefers-reduced-motion` and the user’s Reduce animation setting; if GSAP fails to load, the HTML content and player controls remain available.

## Important availability limitation

Photo assets remain on their public publisher CDNs and are not bundled locally. The build environment cannot resolve external DNS, so direct live-host fetches could not be completed here. The build verifies that each section uses distinct source identities and that each photo has a source attribution; it does **not** certify that every publisher CDN will serve every URL from every production region. If a remote image fails, the page displays a source note and keeps its credited source link instead of substituting an unrelated image.
