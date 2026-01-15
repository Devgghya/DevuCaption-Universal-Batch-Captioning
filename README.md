# DevuCaption - Universal Batch Captioning

> **AI-powered image annotation for dataset creation**  
> Generate high-quality, descriptive captions for your images using Google's Gemini AI. Perfect for machine learning datasets, LoRa training, and Stable Diffusion fine-tuning.

![DevuCaption Banner](https://img.shields.io/badge/AI-Powered-blue?style=for-the-badge) ![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

---

## ✨ What is DevuCaption?

**DevuCaption** is a web-based tool that automatically generates detailed, accurate captions for your images in bulk. Whether you're building a dataset for AI training, cataloging photos, or creating annotations for creative projects, DevuCaption handles it all with precision.

### Key Features

- 🎯 **Batch Processing** - Upload hundreds of images at once
- 🧠 **AI-Powered** - Uses Google Gemini AI for expert-level descriptions
- 🎨 **Flexible Caption Lengths** - From one-liners to extensive 100-word descriptions
- 🌍 **Universal Support** - Works with portraits, landscapes, objects, architecture, and more
- 🇮🇳 **Cultural Awareness** - Specialized terminology for Indian attire, jewelry, and cultural elements
- 📦 **Easy Export** - Download as ZIP (individual .txt files) or CSV
- 🔒 **Privacy-First** - Your API key stays in your browser, never sent to our servers
- ⚡ **Fast & Free** - No server costs, runs entirely client-side

---

## 🚀 How to Use

### 1️⃣ Get Your API Key (One-time Setup)

DevuCaption requires your own Google Gemini API key:

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (starts with `AIza...`)

> **Note:** The API key is stored locally in your browser and never shared. Google's free tier is generous for personal use.

### 2️⃣ Open the App

Visit the live app: **[https://devgghya.github.io/DevuCaption-Universal-Batch-Captioning/](https://devgghya.github.io/DevuCaption-Universal-Batch-Captioning/)**

### 3️⃣ Configure Your API Key

1. Click **"Set API Key"** in the top-right corner
2. Paste your Gemini API key
3. Click anywhere outside the box to save

### 4️⃣ Choose Caption Length

Select your preferred caption style:
- **One Line** (5-8 words) - Ultra-concise descriptions
- **Very Short** (10-15 words) - Core subject only
- **Short** (20-30 words) - Subject + environment
- **Long** (40-60 words) - Detailed descriptions
- **Very Long** (80-100 words) - Exhaustive analysis

### 5️⃣ Upload Your Images

1. Drag & drop images into the upload zone (or click to browse)
2. Supports: JPG, PNG, WEBP, and most common formats
3. No limit on batch size (though rate limits may apply)

### 6️⃣ Start Captioning

1. Click **"Start Captioning"**
2. Watch as AI analyzes each image
3. Captions appear in real-time

### 7️⃣ Review & Edit

- ✏️ Click any caption to edit manually
- ✅ Select/deselect images for export
- 🔄 Regenerate captions for selected images

### 8️⃣ Export Your Captions

- **Download ZIP** - Get individual `.txt` files (one per image)
- **Download CSV** - Single spreadsheet with filename + caption columns

---

## 🎯 Use Cases

- **AI/ML Dataset Creation** - Prepare training data for Stable Diffusion, LoRa, or custom models
- **Image Cataloging** - Auto-generate metadata for photo libraries
- **Accessibility** - Create alt-text descriptions for websites
- **E-commerce** - Bulk product descriptions
- **Research** - Annotate image datasets for academic studies
- **Creative Projects** - Generate detailed scene descriptions

---

## 🛠️ Technical Details

### Caption Quality

DevuCaption uses a carefully engineered prompt system to ensure:
- **Objective descriptions** (no subjective terms like "beautiful" or "stunning")
- **Structured output** (subject → attributes → pose/action → background/lighting)
- **Specialized terminology** for cultural elements (Sherwani, Kundan jewelry, etc.)
- **Consistent formatting** across thousands of images

### Privacy & Security

- ✅ **Your API key** stays in your browser (localStorage)
- ✅ **Images** are processed client-side, sent directly to Google Gemini
- ✅ **No server storage** - we don't see or save your images or captions
- ✅ **Open source** - inspect the code yourself

### Rate Limits

Google Gemini's free tier has rate limits. DevuCaption automatically:
- Throttles requests (3.5s between images)
- Retries failed requests with exponential backoff
- Shows clear error messages if limits are hit

---

## 💻 For Developers

### Local Development

```bash
# Clone the repository
git clone https://github.com/Devgghya/DevuCaption-Universal-Batch-Captioning.git
cd DevuCaption-Universal-Batch-Captioning

# Install dependencies
npm install

# Run dev server
npm run dev
```

Open http://localhost:3000 in your browser.

### Build for Production

```bash
npm run build
```

Output is in the `dist/` folder.

### Tech Stack

- **React 19** - UI framework
- **Vite 6** - Build tool & dev server
- **TypeScript** - Type safety
- **Google Gemini AI** - Image annotation backend
- **JSZip** - Batch export to ZIP
- **Tailwind CSS** - Styling

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

---

## 👨‍💻 Created By

**Devgghya Kulshrestha**  
[GitHub](https://github.com/Devgghya) | [Portfolio](https://devgghya.github.io)

---

## ❓ FAQ

**Q: Is this free to use?**  
A: Yes! The app is free. You just need your own (free) Google Gemini API key.

**Q: How many images can I process?**  
A: No hard limit from our end, but Google's API has rate limits on the free tier. The app handles this automatically.

**Q: What image formats are supported?**  
A: JPG, PNG, WEBP, and most common web formats.

**Q: Can I use this offline?**  
A: No, it requires an internet connection to call the Gemini AI API.

**Q: Do you store my images or captions?**  
A: No. Everything runs in your browser. We never see your data.

**Q: The captions aren't perfect, can I edit them?**  
A: Yes! Click any caption to edit it manually before exporting.

---

**⭐ If you find this useful, consider starring the repo!**
