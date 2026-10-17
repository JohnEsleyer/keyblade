#!/usr/bin/env bash
set -e

APP_NAME="keyblade"
DISPLAY_NAME="Keyblade"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_PATH="${SCRIPT_DIR}/build/bin/${APP_NAME}"
DESKTOP_SRC="${SCRIPT_DIR}/build/linux/${APP_NAME}.desktop"
ICON_SRC="${SCRIPT_DIR}/build/linux/${APP_NAME}.svg"

# Determine install scope (system-wide if root, else user-local)
if [ "$(id -u)" -eq 0 ]; then
  INSTALL_DIR="/usr/local/bin"
  DESKTOP_DIR="/usr/share/applications"
  ICON_DIR="/usr/share/icons/hicolor/scalable/apps"
  SCOPE_MSG="system-wide (/usr/local/bin)"
else
  INSTALL_DIR="${HOME}/.local/bin"
  DESKTOP_DIR="${HOME}/.local/share/applications"
  ICON_DIR="${HOME}/.local/share/icons/hicolor/scalable/apps"
  SCOPE_MSG="user-level (${HOME}/.local)"
fi

print_step() {
  printf "\033[1;34m==>\033[0m \033[1m%s\033[0m\n" "$1"
}

print_success() {
  printf "\033[1;32m==>\033[0m \033[1m%s\033[0m\n" "$1"
}

print_error() {
  printf "\033[1;31mError:\033[0m %s\n" "$1" >&2
}

# Uninstall handling
if [ "$1" = "--uninstall" ] || [ "$1" = "-u" ]; then
  print_step "Uninstalling ${DISPLAY_NAME} from ${SCOPE_MSG}..."
  rm -f "${INSTALL_DIR}/${APP_NAME}"
  rm -f "${DESKTOP_DIR}/${APP_NAME}.desktop"
  rm -f "${ICON_DIR}/${APP_NAME}.svg"

  if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "${DESKTOP_DIR}" >/dev/null 2>&1 || true
  fi
  if command -v gtk-update-icon-cache >/dev/null 2>&1; then
    gtk-update-icon-cache -q "${ICON_DIR}/../../" >/dev/null 2>&1 || true
  fi

  print_success "${DISPLAY_NAME} has been uninstalled successfully."
  exit 0
fi

# Ensure source assets exist
if [ ! -f "${ICON_SRC}" ]; then
  print_error "Icon source missing at ${ICON_SRC}"
  exit 1
fi

if [ ! -f "${DESKTOP_SRC}" ]; then
  print_error "Desktop entry source missing at ${DESKTOP_SRC}"
  exit 1
fi

# Build binary if not already built
if [ ! -f "${BIN_PATH}" ]; then
  print_step "Binary not found at ${BIN_PATH}. Building ${DISPLAY_NAME}..."

  if ! command -v wails >/dev/null 2>&1; then
    print_error "'wails' CLI not found. Please install Wails v2 (go install github.com/wailsapp/wails/v2/cmd/wails@latest) or build the binary first."
    exit 1
  fi

  # Check Ubuntu build requirements (best-effort; only advises)
  HAVE_WEBKIT=""
  for pkg in libwebkit2gtk-4.0-dev libwebkit2gtk-4.1-dev; do
    if dpkg -s "$pkg" >/dev/null 2>&1; then
      HAVE_WEBKIT="$pkg"
      break
    fi
  done

  if ! dpkg -s libgtk-3-dev >/dev/null 2>&1 || [ -z "$HAVE_WEBKIT" ]; then
    printf "\033[1;33mNote:\033[0m If building fails, ensure build dependencies are installed:\n"
    printf "      sudo apt install -y build-essential libgtk-3-dev libwebkit2gtk-4.0-dev\n\n"
  fi

  (cd "${SCRIPT_DIR}" && wails build)
fi

# Create target directories
print_step "Installing ${DISPLAY_NAME} (${SCOPE_MSG})..."
mkdir -p "${INSTALL_DIR}"
mkdir -p "${DESKTOP_DIR}"
mkdir -p "${ICON_DIR}"

# Install binary
install -m 755 "${BIN_PATH}" "${INSTALL_DIR}/${APP_NAME}"

# Install icon
install -m 644 "${ICON_SRC}" "${ICON_DIR}/${APP_NAME}.svg"

# Install .desktop file (updating Exec path if user-local and ~/.local/bin is not in PATH)
if [ "$(id -u)" -ne 0 ]; then
  sed "s|^Exec=${APP_NAME}|Exec=${INSTALL_DIR}/${APP_NAME}|g" "${DESKTOP_SRC}" > "${DESKTOP_DIR}/${APP_NAME}.desktop"
  chmod 644 "${DESKTOP_DIR}/${APP_NAME}.desktop"
else
  install -m 644 "${DESKTOP_SRC}" "${DESKTOP_DIR}/${APP_NAME}.desktop"
fi

# Refresh desktop and icon databases
print_step "Updating desktop and icon caches..."
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "${DESKTOP_DIR}" >/dev/null 2>&1 || true
fi

if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache -f -t "$(dirname "$(dirname "${ICON_DIR}")")" >/dev/null 2>&1 || true
fi

print_success "${DISPLAY_NAME} was installed successfully!"
printf "\nYou can launch it from:\n"
printf "  - Ubuntu Application Menu / Super key search: \"Keyblade\"\n"
printf "  - Terminal: %s\n\n" "${APP_NAME}"

if [ "$(id -u)" -ne 0 ] && [[ ":$PATH:" != *":${HOME}/.local/bin:"* ]]; then
  printf "\033[1;33mTip:\033[0m %s is not in your \$PATH.\n" "${HOME}/.local/bin"
  printf "     Add it by running: echo 'export PATH=\"\$HOME/.local/bin:\$PATH\"' >> ~/.bashrc\n\n"
fi
