# Temporary stock videos

The Media page contains native HTML video players intended to play inline on the page (`controls`, `playsinline`, and `webkit-playsinline`). Each player streams a temporary Pexels MP4 URL and includes a poster image.

This folder does not currently contain local `.mp4` files. The clips are externally hosted, so playback requires network access and valid Pexels CDN URLs. The video binaries could not be downloaded or playback-verified in the build environment.

When approved academy originals arrive, place local files in this folder and update the `<source src>` values in `../../media/index.html` to relative paths. Remove the temporary-stock placeholder labels when the new media is approved.
