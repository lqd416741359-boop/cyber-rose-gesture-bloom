---
name: cyber-rose-gesture-bloom
description: Use when creating, adapting, or troubleshooting a browser-based cybernetic flower controlled by webcam hand gestures, especially a six-stage bud-to-bloom animation.
---

# Cyber Rose Gesture Bloom

Use this skill for the Cyber Rose demo: a blue-and-gold mechanical rose that reads one hand from the webcam and moves continuously through six visual stages from closed bud to full bloom.

## Core behavior

- Keep the experience browser-first and local; use a small static server for camera permissions.
- Prefer a smooth palm-openness signal over binary gesture swaps.
- Render neighboring stages as a crossfade and ease progress with a spring so petals open and close gradually.
- Treat a closed fist as the closed state and an open palm as the blooming state.
- Keep camera, model-loading, and tracking failures visible with a retry path.

## Runtime requirements

- Open through `start.bat` or `node server.mjs --open`; do not double-click `index.html`.
- Use Chrome or Edge over `http://127.0.0.1:4173/`.
- Ask the user to close other camera consumers (OBS Browser Source, Douyin, video-call apps, or another tab) before retrying.
- MediaPipe Tasks Vision is loaded from its CDN and the hand model from Google storage; a network block should produce a clear retry message.

## Safe changes

When changing the animation, preserve the six-stage asset order, the palm-relative openness calibration, and the keyboard fallback. Run the project test suite after changes:

```powershell
node --test
```

For recording, open the normal browser page and capture that window in OBS. Do not rely on an OBS Browser Source for webcam input.
