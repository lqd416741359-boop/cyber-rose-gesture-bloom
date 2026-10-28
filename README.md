# Cyber Rose · Gesture Bloom

![Cyber Rose cover](assets/cover.png)

> A browser-based blue-gold mechanical rose that blooms gracefully from a closed bud to a full cybernetic flower as your hand opens.

![Six-stage bloom](assets/demo-stages.png)

## What it does

- Reads one hand through the webcam with MediaPipe Hand Landmarker.
- Maps palm openness to six illustrated rose stages.
- Crossfades neighboring stages instead of switching abruptly.
- Adds spring easing, lift, glow, particles, and restrained kinetic motion.
- Includes keyboard fallback, reset, fullscreen, and camera retry states.

## Quick start

1. Install a recent Node.js runtime.
2. Double-click `start.bat`, or run `node server.mjs --open` in this folder.
3. Open `http://127.0.0.1:4173/` in Chrome or Edge.
4. Allow camera access, place one hand in frame, make a fist, then slowly open your palm.

Do not open `index.html` directly: browsers block webcam access from a `file://` page. Keep the server window open while using the demo.

## Recording with OBS

Open the demo in a normal Chrome or Edge window and use OBS **Window Capture** or **Display Capture**. An OBS Browser Source is useful for showing a static page, but it commonly cannot access the physical webcam reliably.

## Camera troubleshooting

- Close Douyin, OBS camera sources, video-call apps, and duplicate demo tabs.
- Use **Retry Camera** after releasing the camera.
- If the model stays on “Loading,” refresh once and check that the browser can reach the MediaPipe CDN and model URL.

## Project layout

| Path | Purpose |
| --- | --- |
| `SKILL.md` | Reusable Codex skill instructions |
| `index.html`, `styles.css` | Demo shell and visual design |
| `src/` | Gesture tracking, state, animation, camera, and particles |
| `assets/` | Six rose stages plus GitHub preview images |
| `tests/` | Node test suite |
| `start.bat`, `server.mjs` | Local development server |

## Tests

```powershell
node --test
```

## License

MIT. See [LICENSE](LICENSE).
