# Classroom Tool Detection — VisionAI

An AI web application designed specifically for **Classroom Tool Detection** (Pen, Book, and Duster), powered by a model trained on **[Google Teachable Machine](https://teachablemachine.withgoogle.com/)**, embedded via **[@teachablemachine/image](https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image)** and **[TensorFlow.js](https://www.tensorflow.org/js)**.

---

## 🎯 Target Classroom Tools

The model is trained and optimized to recognize:
1. 🖊️ **Pen** — Ballpoint pens, gel pens, styluses, and markers.
2. 📖 **Book** — Textbooks, notebooks, bound diaries, and readers.
3. 🧹 **Duster** — Blackboard/whiteboard felt and wooden erasers.

---

## 🌟 Key Features

- **Embedded & Hidden Model Configuration**:
  - The model endpoint is hardcoded into the application logic, hiding backend links from students/users.
  - Automatically loads on launch with fallback to local `./model/` files for offline capability.
- **Interactive Tool Showcase Bar**:
  - Displays cards for all 3 classroom tools with live percentage badges.
  - Actively glows and elevates when a tool is detected in the video stream.
- **Dual Recognition Interfaces**:
  - 📷 **Live Classroom Camera**: Real-time continuous inference loop using `tmImage.Webcam` with mirror flipping, FPS counter, and latency meter.
  - 🖼️ **Tool Photo Mode**: Drag & drop any photo of a pen, book, or duster, click to browse, or paste directly from your clipboard (`Ctrl+V` / `Cmd+V`).
- **Detection Feedback**:
  - **Hero Detection Banner** showing detected tool emoji, title, and confidence meter.
  - **Voice Announcements (TTS)** to speak detected tools aloud (e.g. *"Pen detected"*).
  - **Snapshot Gallery** to capture test frames with classification tags.

---

## 🚀 Quick Start

Start the local server:

```bash
# Using Node.js (Recommended)
npm start
# or: node server.js
```

*Alternatively, using Python:*
```bash
python3 -m http.server 3000
```

Open your browser to:
```
http://localhost:3000
```

---

## 📂 Project Structure

```
image-recognition/
├── index.html              # Classroom tool detection UI
├── css/
│   └── styles.css          # Dark classroom theme & tool card glow animations
├── js/
│   └── app.js              # Hardcoded model runner & real-time detection pipeline
├── model/                  # Local offline model cache
│   ├── model.json          # Model topology
│   ├── metadata.json       # Labels: ["Pen", "Book", "Duster"]
│   ├── model.weights.bin   # Trained weights binary
│   └── README.md
├── server.js               # Node.js HTTP static server
├── package.json            # NPM scripts & metadata
└── README.md
```

---

## 📜 License
MIT
