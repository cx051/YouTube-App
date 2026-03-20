
<h1 align="center">YouTubeApp</h1>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:ff0000,50:8B0000,100:000000&height=140&section=header&text=&fontColor=ffffff&animation=fadeIn" />
</p>

<p align="center">
  <img src="assets/YouTube.svg" width="120" />
</p>

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?size=20&duration=3000&center=true&vCenter=true&width=700&lines=Fast+YouTube+Desktop+Client;Ad-Free+Experience;Optimized+for+Performance&color=FF0000&pause=800" />
</p>


![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Platform](https://img.shields.io/badge/platform-Linux%20\(Ubuntu%2022.04%2B\)-orange)
![Electron](https://img.shields.io/badge/Electron-Framework-47848F?logo=electron\&logoColor=white)
![License](https://img.shields.io/badge/license-ISC-green)
![Status](https://img.shields.io/badge/status-experimental-lightgrey)
[![powered by Ghostery](https://img.shields.io/badge/ghostery-powered-blue?logo=ghostery)](https://github.com/ghostery/adblocker)

---

## 🎬 Overview

YouTubeApp is a lightweight Electron-based desktop client designed for a **fast, clean, and distraction-free YouTube experience**.

It combines **network-level ad blocking** with **DOM-level optimizations** to ensure minimal interruptions and optimal playback.

![App Screenshot](assets/screenshot.png)

---

**v2.0.0** is currently the most stable release.
Ad-blocking functionality and overall performance are only guaranteed for this version and later. Versions prior to v2.0.0 may have inconsistent or degraded ad-blocking behavior and are not recommended for use.

## ✨ Features

* 🧭 Clean, minimal UI with custom window controls
* 🛡️ Advanced ad-blocking (Ghostery + uBlock filters)
* ⚡ Persistent caching for fast startup (~50ms)
* 🎯 Automatic highest-quality video selection
* 🚫 Auto-skip and removal of ads
* 🧹 One-click browsing data cleanup
* 🔍 Zoom controls
* 🔒 Privacy-focused design

---

## 🧠 Architecture

### 🔹 Hybrid Ad-Blocking System

* **Network Layer**

  * Powered by `@ghostery/adblocker-electron`
  * Uses EasyList, EasyPrivacy, uBlock filters

* **DOM Layer**

  * Removes residual ads dynamically
  * Handles YouTube UI updates
  * Auto-skips and fast-forwards ads

---

### ⚡ Caching System

* Binary cache stored in user data directory
* First run: ~1.5s initialization
* Subsequent runs: ~50ms startup

---

### 🔄 Execution Flow

```text
Initialize Adblock Engine
        ↓
Load from Cache (if available)
        ↓
Attach to Electron Session
        ↓
Load YouTube
        ↓
Inject custom-adblock.js
        ↓
Continuous DOM Cleanup
```

---

## ⚙️ Performance

* Reduced startup latency via caching
* Optimized script injection timing
* Singleton-style adblocker design
* Minimal runtime overhead

---

## 🧰 Tech Stack

* Electron
* @ghostery/adblocker-electron
* uBlock Origin filter lists
* Vanilla JS, HTML, CSS

---

## 📦 Installation

```bash
sudo dpkg -i youtube*.deb
```

**Tested on:** Ubuntu 22.04 LTS+

---

## 📁 Project Structure

```bash
YouTubeApp/
├── assets/
├── scripts/
│   └── custom-adblock.js
├── main.js
├── preload.js
├── index.html
├── adblocker.js
└── package.json
```

---

## ⚠️ Known Limitations

* Depends on YouTube’s frontend (can break with updates)
* Ad-blocking may require adjustments over time
* Limited cross-platform support
* Not production-focused


---

## Disclaimer

This is a personal project intended for experimentation and individual use.
Long-term maintenance and compatibility are not guaranteed.
This project is an independent application and is not affiliated with, endorsed by, or associated with Google LLC or any of its subsidiaries, including YouTube.

---

## 👤 Author

Made with ❤️ by cx051

---

## 📜 License

ISC License

---

