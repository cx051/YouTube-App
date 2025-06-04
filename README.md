# YouTubeApp

   ![Logo](assets/YouTube.svg)

A fast, modern, and privacy-focused YouTube desktop app with built-in ad blocker, hardware acceleration toggle, and customizable sound effects toggle.  
Made with ♥ by cx051.

---

## ✨ Features

- **Ad Blocking**  
  Blocks YouTube ads and annoyances using multiple aggressive public filter lists (EasyList, EasyPrivacy, uBlock Annoyances, AdGuard YouTube).

- **Hardware Acceleration Toggle**  
  Hardware acceleration is disabled by default for stability. You can enable or disable it at any time using the toggle in the dropdown menu.

- **Customizable Sound Effects Toggle**  
  - Modern UI pop sound for window and navigation controls.
  - Notification sound for custom app events.
  - Sound effects are enabled by default and can be toggled on/off from the dropdown menu.
  - Splash screen features unique intro music (always plays, not affected by sound toggle).

- **Animated Splash Screen**  
  Opera GX–style animated splash with intro music for a premium feel.

- **Performance Optimizations**  
  - Background throttling disabled for smooth playback.
  - Optional WebGL software fallback for compatibility.

- **Cross-Platform**  
  Build for Windows and Linux (Debian package and portable EXE/installer).

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Git](https://git-scm.com/)

### Install & Run (Development)

```bash
git clone https://github.com/cx051/youtube-app.git
cd youtube-app
npm install
npm start
```

### Build Packages

```bash
# For Windows (portable EXE and installer)
npm run dist

# For Linux (.deb package)
npm run dist
```

Output builds will be in the `dist/` folder.

---

## 🛡️ Adblocker Technology

This app uses [@ghostery/adblocker-electron](https://github.com/cliqz-oss/adblocker/tree/master/packages/adblocker-electron) with the following filter lists:

- [EasyList](https://easylist.to/easylist/easylist.txt)
- [EasyPrivacy](https://easylist.to/easylist/easyprivacy.txt)
- [uBlock Annoyances (YouTube)](https://github.com/uBlockOrigin/uAssets/blob/master/filters/annoyances-youtube.txt)
- [AdGuard YouTube Filters](https://github.com/AdguardTeam/AdguardFilters/blob/master/English/sections/youtube.txt)

---

## 🎵 Sound Effects

- **UI Pop**: Plays on window controls (minimize, maximize, close) and navigation (back, forward, reload).
- **Notification**: For custom events (trigger via `window.playNotificationSound()`).
- **Splash Intro**: Always plays on the splash screen (not affected by sound toggle).
- **Toggle**: Sound effects are enabled by default and can be toggled on/off at runtime from the dropdown menu.

---

## ⚙️ Advanced Controls

- **Hardware Acceleration**:  
  Disabled by default. Toggle on/off at runtime from the dropdown menu for systems that support GPU acceleration.

- **Sound Effects**:  
  Enabled by default. Toggle on/off at runtime from the dropdown menu.

---

## 📁 File Structure

```
assets/
  audio/           # OGG sound files (ui-pop.ogg, notification.ogg, splash-intro.ogg)
  YouTube.*        # App icons (png, ico, icns, svg)
components/        # React components
scripts/           # Renderer JS (dropdown, splash, etc.)
main.js            # Electron main process
preload.js         # Electron preload
adblocker.js       # Adblocker setup
index.html         # Main app window
splash.html        # Splash screen
```

---

## 🙋 FAQ

**Q: How do I enable/disable sound effects?**  
A: Use the "Sound Effects: On/Off" toggle in the dropdown menu (top right). You can toggle this at any time while the app is running.

**Q: How do I enable/disable hardware acceleration?**  
A: Use the "Hardware Acceleration" toggle in the dropdown menu. It's off by default for compatibility and can be toggled at runtime.

**Q: What platforms are supported?**  
A: Windows (installer & portable), Linux (.deb). Mac support can be added if requested.

---

## 📜 License

ISC License. See [LICENSE](./LICENSE) for details.

---

## 🦄 Credits

- [@ghostery/adblocker-electron](https://github.com/cliqz-oss/adblocker/tree/master/packages/adblocker-electron)
- [React](https://react.dev/)
- [Framer Motion](https://www.framer.com/motion/)
- Audio assets from [Pixabay](https://pixabay.com/sound-effects/) and [Mixkit](https://mixkit.co/).

---

## 💡 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---
