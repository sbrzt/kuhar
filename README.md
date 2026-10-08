# Kuhar

**_Kuhar_** (_"cook"_ in South Slavic languages) is a free, client-side web app that generates customizable QR codes in the browser that requires no server, no sign-up, no tracking.

## Features

- Content types: link / text, Wi-Fi, contact (vCard), email
- Live preview while you type
- Custom colours, module shapes, margin, error correction, transparent background
- Background image with the code drawn as dots on top
- Download as PNG (up to 2048 px) or SVG, or copy to the clipboard
- Recipe book: saved settings in `localStorage` (background images are not saved)
- Linkable: `?text=https://example.com` prefills the content
- Works offline after the first visit and can be installed as an app

## How it works

Static files only, no build step. [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT, vendored in `vendor/`) computes the QR matrix. `qr.js` turns the matrix into SVG. PNG output is that SVG drawn on a canvas.

## Run

```sh
./test.sh        # serves http://localhost:8000
node check.mjs   # self-check for qr.js
```

Deploy by copying the files to any static host, for example GitHub Pages.
