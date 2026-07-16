# TrackFlow 🚀

> **Monthly Habit Tracker** — Track daily activities, build streaks, and visualize your consistency with a sleek, dark-themed dashboard.

## ✨ Features

- **📊 Monthly Activity Grid** — Activities as rows, days grouped by calendar weeks as columns. Tick each day you complete a habit.
- **3-State Checkboxes** — Mark days as ✅ Done, ⏭️ Skipped, or leave empty.
- **⚡ Quick-Add Bar** — Add activities instantly with emoji and name, right from the main view.
- **📝 Daily Learnings Journal** — Write reflections and notes for each day of the month.
- **📈 Progress Dashboard** — Stat cards, per-activity breakdown bars, productivity graph (canvas), and weekly completion rates.
- **📅 Month Navigation** — Browse past months to review historical data.
- **🔄 Inline Rename & Reorder** — Double-click to rename activities, drag to reorder.
- **🎨 Stunning Dark UI** — Glassmorphism, animated SVG logo, scanline overlay, live clock, smooth micro-animations.
- **💾 Local Storage** — All data persists per-month in your browser. No account needed.
- **📱 Responsive** — Works on desktop, tablet, and mobile.
- **📦 PWA Ready** — Installable as a standalone app on mobile via "Add to Home Screen".

## 🖥️ Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 (semantic) |
| Styling | Vanilla CSS (custom properties, grid, flexbox) |
| Logic | Vanilla JavaScript (ES6+, IIFE pattern) |
| Charts | HTML5 Canvas API |
| Fonts | Google Fonts — Inter, Space Grotesk, Orbitron |
| Storage | localStorage (per-month partitioned) |

Zero dependencies. No build step. No frameworks.

## 🚀 Getting Started

### Run Locally

1. **Clone the repo:**
   ```bash
   git clone https://github.com/abhiimaske/TrackFlow.git
   cd TrackFlow
   ```

2. **Open in browser:**
   Simply open `index.html` in any modern browser — no server required.

   Or use a local server:
   ```bash
   # Python
   python -m http.server 8000

   # Node.js (npx)
   npx serve .
   ```

3. **Visit:** [http://localhost:8000](http://localhost:8000)

### Deploy

This is a static site — deploy anywhere:

- **GitHub Pages:** Settings → Pages → Deploy from `main` branch
- **Netlify:** Connect repo, publish directory = `/`
- **Vercel:** Import repo, framework = "Other"

## 📂 Project Structure

```
TrackFlow/
├── index.html        # Main HTML structure
├── style.css         # All styles (dark theme, responsive)
├── app.js            # Application logic (grid, dashboard, persistence)
├── favicon.svg       # Animated SVG favicon
├── manifest.json     # PWA manifest
├── 404.html          # Custom 404 page
├── print.css         # Print-friendly stylesheet
└── README.md         # This file
```

## 🎮 Keyboard Shortcuts

| Key | Action |
|---|---|
| `N` | Open Add Activity modal |
| `←` / `→` | Navigate months |
| `Esc` | Close any open modal |
| `?` | Show keyboard shortcuts |

## 📸 Screenshots

> *Coming soon — deploy and capture!*

## 🤝 Contributing

1. Fork the repo
2. Create your branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Built with ❤️ by [@abhiimaske](https://github.com/abhiimaske)**
