# Your Name • Cinematic Scrollytelling

An immersive, pure visual scrollytelling web experience featuring 500 widescreen landscape frames from Makoto Shinkai's *Your Name* (Kimi no Na wa).

🔗 **Live Website**: [https://charansai11328.github.io/your_name/](https://charansai11328.github.io/your_name/)

---

## ✨ Features

- **Pure Visual Canvas**: Zero clutter, zero text overlays, zero video player controls—the sequence is driven entirely by scrolling.
- **Widescreen 16:9 Landscape**: All 500 frames processed and converted into full horizontal HD resolution.
- **Adaptive Dual-Resolution Pipeline**:
  - **Full HD (1920×1080)** for desktop monitors and high-DPI displays.
  - **Mobile SD (960×540)** for smartphones, reducing payload and GPU memory by ~75%.
- **Kinetic Physics Engine**:
  - Calibrated Linear Interpolation (Lerp) for smooth frame gliding.
  - Subtle camera depth breathing and tactile parallax responding to scroll velocity.
  - Unhindered native vertical scrolling with sleek draggable scrollbar.
- **Tokyo Twilight Ambient Bleed**: Soft blurred secondary backdrop canvas that diffuses the scene's color palette behind the cinematic frame.
- **Mobile Touch Inertia**: Direct touch gesture engine with momentum fling physics and zero horizontal overflow.
- **Universal Input**: Mouse wheel, precision trackpad, touch swipe, scrollbar drag, and keyboard navigation (`ArrowDown`/`ArrowUp`, `PageDown`/`PageUp`, `Space`).

---

## 🛠️ Tech Stack

- **HTML5 Canvas** (High-DPI 2D context)
- **Vanilla JavaScript** (Zero external dependencies)
- **CSS3** (Hardware-accelerated viewport containment & ambient glow)

---

## 🚀 Running Locally

```bash
# Clone the repository
git clone https://github.com/CHARANSAI11328/your_name.git
cd your_name

# Start a local static server
python -m http.server 8080

# Open in your browser
# http://localhost:8080/index.html
```

---

*Made with Makoto Shinkai's "Your Name" sequence.*
