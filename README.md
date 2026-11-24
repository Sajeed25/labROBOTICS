# Robotics Lab

An interactive 3D learning site for the eight boards robot builders meet first — Arduino Uno, Nano, Mega,
ESP32, NodeMCU, Raspberry Pi Pico, STM32 Blue Pill and Raspberry Pi 4. Every board is drawn in code with
Three.js and can be explored, quizzed on, taken apart and re-soldered, and wired up on a virtual workbench.

## Run it

```powershell
npm install      # only needed to refresh vendor/three (already committed)
npm run dev      # http://localhost:5173
npm run check    # validate mission + board data
```

No build step: it is a static site (ES modules + import map). Deploy the folder to Vercel as-is;
`api/track.js` becomes the anonymous analytics endpoint.

## Features

| Area | What it does |
|---|---|
| **3D stage** | 8 procedural boards, views 3/4 · Top · Bottom · Front, auto-rotate, numbered labels that fly the camera to a part, pin hover tooltips coloured by kind, Ctrl/pinch zoom (plain wheel scrolls the page), ← / → to switch boards, Esc to exit modes |
| **Deep links** | `#esp32`, `?board=pico&view=top&part=mcu`, `?go=quiz|assemble|lab`, `?bench=…` (shared circuit) |
| **Lesson** | In short + key stats, plain-English specs, numbered parts list (synced with 3D), strengths / watch out, pin notes, colour legend that lights matching pins on the model, 2D SVG pinout, first code with syntax highlighting + Copy, project ideas, facts, glossary pop-overs |
| **Find the part quiz** | 6 random questions per board, hint, skip, first-try scoring, results, best score saved |
| **Assembly** | Board comes apart onto a tray, pick → drop on the footprint, press-and-hold to solder (iron, smoke, sizzle), timer, best time saved |
| **Workbench** | 3D ESD mat, breadboards for strip boards, 14 modules, click-to-wire jumper wires (colour by role), drag / rotate (R) / delete (Del), full screen (F), top view, sound toggle, lofi, share link, save/load JSON, autosaved free build |
| **Electrical check** | Short circuits, mixed supplies, TX↔TX / RX↔RX, 5 V into 3.3 V (with the safe 3.3 V TX → 5 V RX exception), motors on pins, missing ground / power, level-shifter sides, boards without a shared ground, 5 V sensors into 3.3 V pins — each with a “Show me” |
| **Missions** | 11 guided builds (Hello LED → Robot brain & muscle) with checklist, Show me, Wire it for me, code tabs, serial monitor, interactive controls, completion + Next mission |
| **Free build** | Net-based simulation: “Drive this pin” switches/sliders, LEDs, buzzer, servo, motor driver → motor, inputs reported to the serial monitor |
| **Compare** | Sortable table, filters (Wi-Fi, 5 V, under $10, Linux), row click loads board + lesson, “Which board should I use?” wizard |
| **Extras** | Light / dark theme, progress badges, synthesised lofi music (Web Audio), privacy-first batched analytics, reduced-motion support, responsive down to 375 px, print stylesheet for the lesson |

## Layout

```
index.html, css/style.css
js/app.js               stage, labels, lesson, quiz, compare, wizard, theme, progress
js/core/builder.js      procedural parts, PCB silkscreen, buildBoard()
js/core/viewer.js       Three.js viewer, camera flights, picking, thumbnails
js/core/assembly.js     take-apart / solder mode
js/core/store.js        localStorage progress, toast, track()
js/boards/*.js          one file per board (data contract below)
js/lab/lab.js           workbench, nets, rule check, simulation, save/share
js/lab/modules.js       14 workbench modules
js/lab/missions.js      guided missions (validated by tools/check-missions.mjs)
js/lofi.js, js/track.js, api/track.js
tools/serve.mjs         zero-dependency dev server
tools/board-test.html   render one board in isolation (?b=esp32&v=top)
```

### Board data contract

Each `js/boards/<id>.js` exports `{ id, name, short, maker, year, tagline, level, lab: { plug, logic }, intro, stats, table, specs,
pcb: { w, d, r, color, holes }, comps: [{ type, x, z, rot, part, … }], headers: [{ type, x, z, dir, rows, pins, pins2, part }],
pinInfo, parts: [{ id, name, desc, quiz }], strengths, pitfalls, pinNotes, code, ideas, facts }`.
Adding a ninth board is one new file plus a line in `js/boards/index.js`.

## Not built yet

Ideas from the original brief that are still open: an editable-code interpreter for Free build, a multimeter tool, extra modules
(IR, relay, IMU, LCD, NeoPixel, stepper), extra boards, translations (i18n), AR view, teacher mode and an offline service worker.

## Link previews

Shared links show a picture card (WhatsApp, Facebook, LinkedIn, X). Each board has its own share page at
`/b/<id>/` that carries the board's title and image, then forwards visitors to `/#<id>`.

- `npm run share` rebuilds the `b/<id>/index.html` pages (run it after renaming a board or editing a tagline).
- To redraw the 1200×630 images in `assets/og/`, run `npm run dev`, open `http://localhost:5173/tools/og.html`
  and press **Render and save all**.
- When deploying, upload the `b/` and `assets/og/` folders too.

## Before each deploy

Run `npm run build`. It rebuilds the board share pages and stamps every CSS/JS link in `index.html` with a
content hash (`?v=…`). The host caches CSS and JS for a week, so without the stamp, returning visitors can get the
new page with an old stylesheet.
