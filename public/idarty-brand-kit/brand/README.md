# Idarty Brand Kit v1.1

The icon is the letter **i**: the head is the dot, the body is the stem, the cut-out is an open door.
In the English logo the body height equals the x-height of "darty", the baseline sits on the bottom of the body, and the head aligns with the top of the "d".

## Files
- `svg/`  Master vector logos: `idarty-logo-{en|ar}-{black|white|color|color-dark}.svg`, `idarty-icon-{black|white|color|color-dark}.svg`
- `png/`  Transparent PNG exports (logos 2400 px wide, icons 1024 px tall)
- `favicon/` `icon.svg` (adapts to light/dark tabs), `favicon.ico` (16/32/48), `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `maskable-512.png`, `app-icon.svg`
- `idarty-brand-sheet.png / .svg`  One-page overview

## Colors
Ink #0B0B0F · Paper #FFFFFF · Mist #F4F5F7 · Teal #0F766E (primary, 5.5:1 on white) · Teal Bright #2DD4BF (dark mode accent)

## Next.js (App Router)
Copy into `app/`: `icon.svg`, `favicon.ico`, and `apple-touch-icon.png` renamed to `apple-icon.png`. Next picks them up automatically.
For a PWA manifest use `icon-192.png`, `icon-512.png` and `maskable-512.png` (purpose: "maskable").

## Rules
Clear space = head diameter. Min size: logo 96 px wide, icon 16 px (favicon uses a wider door slot).
Never separate the icon from the wordmark in English ("darty" alone is not the name). Use black or white; the accent head is optional.
Do not stretch, rotate, outline or recolor the body.
English wordmark: traced from the original design. Arabic wordmark: Tajawal ExtraBold (SIL OFL), converted to outlines.
