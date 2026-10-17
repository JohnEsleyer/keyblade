# Keyblade

A minimal, offline desktop authenticator built with **Wails v2 (Go)** and
**React + Tailwind CSS**.

## Features

- **QR upload & extraction** — import an OTP secret straight from a QR image
  (drag & drop or upload). Decoded with `makiuchi-d/gozxing`.
- **QR display** — generate and inspect the QR code for any stored account on
  demand, using `skip2/go-qrcode`.
- **Real-time TOTP engine** — RFC 6238 HMAC-SHA1, 6 digits / 30 seconds, with
  smooth circular countdown rings.
- **Minimalist aesthetic** — monochrome slate/zinc palette, glassmorphism,
  glowing accents, and fully custom components (dialogs, dropdowns, file drop
  zones, toasts — no native browser controls).
- **Local & private** — accounts are stored in a local JSON vault, never sent
  anywhere.

## Project layout

```text
keyblade/
├── app.go            # TOTP engine, vault persistence, QR read/generate
├── main.go           # Wails entrypoint / window options
├── install.sh        # Ubuntu install/uninstall script
├── go.mod
├── build/
│   └── linux/
│       ├── keyblade.svg      # vector app icon
│       └── keyblade.desktop  # freedesktop launcher entry
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── components/
    │   │   ├── Dialog.tsx
    │   │   ├── Dropdown.tsx
    │   │   ├── FileDropZone.tsx
    │   │   ├── Icons.tsx
    │   │   ├── QRModal.tsx
    │   │   ├── Toast.tsx
    │   │   └── TOTPCard.tsx
    │   ├── index.css
    │   └── main.tsx
    ├── tailwind.config.js
    └── postcss.config.js
```

## Development

```bash
wails dev
```

Runs the Go backend, serves the Vite dev server with hot reload, and mounts the
desktop window. A browser dev server is also available at
http://localhost:34115.

## Build

```bash
wails build
```

Produces a native binary in `build/bin/`.

## Ubuntu Installation

You can install Keyblade directly to your desktop menu and dock using the
included installer. It installs the binary, an SVG icon, and a `.desktop`
launcher, then refreshes the desktop and icon caches.

### 1. User installation (no sudo required)

```bash
./install.sh
```

Installs to `~/.local/bin`, `~/.local/share/applications`, and
`~/.local/share/icons/hicolor/scalable/apps`.

### 2. System-wide installation

```bash
sudo ./install.sh
```

Installs to `/usr/local/bin`, `/usr/share/applications`, and
`/usr/share/icons/hicolor/scalable/apps`.

### Uninstall

```bash
./install.sh --uninstall
# or, if installed system-wide:
sudo ./install.sh --uninstall
```

Once installed you can launch Keyblade from the Ubuntu Application Menu (Super
key → search "Keyblade") or by running `keyblade` in a terminal.
