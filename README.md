
# ProPDF Merger

A high-performance, professional, and privacy-first PDF and Image merger that runs entirely in your browser.

## Features
- **PDF Merging**: Merge up to 10,000 PDFs into one.
- **Image Conversion**: Convert JPG, PNG, WebP, SVG and more to PDF.
- **Quality Control**: Select from Maximum, High, Standard, or Compressed presets.
- **Virtualized Performance**: Uses `react-window` to handle thousands of files smoothly.
- **Privacy First**: 100% client-side processing using Web Workers and `pdf-lib`.

## Vercel Deployment

This project is optimized for deployment on [Vercel](https://vercel.com).

1. **Push to GitHub**: Push this code to a GitHub repository.
2. **Import to Vercel**: Connect your GitHub account to Vercel and import the repository.
3. **Framework Preset**: Vercel will automatically detect **Vite**.
4. **Deploy**: Click "Deploy". Your app will be live with an SSL certificate.

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Tech Stack
- **React 19**: Modern UI components.
- **Vite**: Ultra-fast build tool.
- **Tailwind CSS**: Professional styling.
- **pdf-lib**: Client-side PDF manipulation.
- **pdf.js**: PDF rendering and thumbnails.
- **Web Workers**: Off-thread processing to prevent UI freezing.
