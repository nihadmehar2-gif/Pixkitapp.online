import type { ToolCategory } from "./types";

// Re-exported for the category page: the passport category shows the same
// accuracy disclaimer as its tool pages (single source of truth in
// definitions/social-passport.ts).
export { DOCUMENT_PHOTO_NOTE } from "./definitions/social-passport";

export const CATEGORIES: ToolCategory[] = [
  {
    id: "compression",
    name: "Compression",
    slug: "compress",
    description: "Shrink JPG, PNG and WebP files to a target size without visible quality loss.",
    metaTitle: "Compression Tools — 11 Free Online Compressors",
    metaDescription:
      "Shrink JPG, PNG and WebP files to a target size without visible quality loss. Eleven free browser-based compressors hit upload limits — nothing is uploaded.",
    icon: "Minimize2",
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "resizing",
    name: "Resizing",
    slug: "resize",
    description: "Scale images to exact pixels, percentages, target file sizes or preset dimensions.",
    metaTitle: "Resizing Tools — 11 Free Online Image Resizers",
    metaDescription:
      "Scale images to exact pixels, percentages, target file sizes or preset dimensions. Eleven resizers cover width, height, KB targets and batches — all free.",
    icon: "Maximize2",
    color: "from-sky-500 to-cyan-600",
  },
  {
    id: "cropping",
    name: "Cropping",
    slug: "crop",
    description: "Crop to any ratio, cut circles, trim borders or frame the perfect square.",
    metaTitle: "Cropping Tools — 8 Free Online Image Croppers",
    metaDescription:
      "Crop to any ratio, cut circles, trim borders or frame the perfect square. Eight free croppers include an interactive editor plus one-click ratio presets.",
    icon: "Crop",
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "conversion",
    name: "Conversion",
    slug: "convert",
    description: "Convert between JPG, PNG, WebP, BMP, PDF, ICO and Base64 — right in your browser.",
    metaTitle: "Conversion Tools — 20 Free Online Converters",
    metaDescription:
      "Convert between JPG, PNG, WebP, BMP, PDF, ICO and Base64 — right in your browser. Twenty free converters cover every common direction, all processed on your device.",
    icon: "Repeat",
    color: "from-orange-500 to-amber-600",
  },
  {
    id: "rotation",
    name: "Rotation & Flipping",
    slug: "rotate",
    description: "Rotate by exact degrees, straighten horizons and flip images instantly.",
    metaTitle: "Rotation & Flipping — 7 Free Rotate/Flip Tools",
    metaDescription:
      "Rotate by exact degrees, straighten horizons and flip images instantly. Seven tools handle quarter turns, fine angles and mirrors — pixel-exact, private.",
    icon: "RotateCw",
    color: "from-rose-500 to-pink-600",
  },
  {
    id: "filters",
    name: "Filters & Effects",
    slug: "filters",
    description: "Grayscale, sepia, blur, sharpen, pixelate, duotone and cinematic looks.",
    metaTitle: "Filters & Effects — 15 Free Photo Filters",
    metaDescription:
      "Grayscale, sepia, blur, sharpen, pixelate, duotone and cinematic looks. Fifteen free photo effects render live in your browser with adjustable strength.",
    icon: "Wand2",
    color: "from-fuchsia-500 to-purple-600",
  },
  {
    id: "optimization",
    name: "Optimization",
    slug: "optimize",
    description: "One-click web, email and favicon optimization with smart quality control.",
    metaTitle: "Optimization Tools — 7 Free Online Optimizers",
    metaDescription:
      "One-click web, email and favicon optimization with smart quality control. Seven presets resize, compress and convert for faster pages and lighter inboxes.",
    icon: "Gauge",
    color: "from-lime-500 to-green-600",
  },
  {
    id: "metadata",
    name: "Metadata & EXIF",
    slug: "metadata",
    description: "View, inspect and strip EXIF, GPS and hidden image metadata — locally.",
    metaTitle: "Metadata & EXIF Tools — 3 Free Online Viewers",
    metaDescription:
      "View, inspect and strip EXIF, GPS and hidden image metadata — locally. Three privacy tools show what a photo reveals and scrub it clean before you share.",
    icon: "FileSearch",
    color: "from-slate-500 to-slate-700",
  },
  {
    id: "color",
    name: "Color Utilities",
    slug: "color",
    description: "Pick colors, extract palettes, swap channels and key out color backgrounds.",
    metaTitle: "Color Tools — 9 Free Online Pickers & Palettes",
    metaDescription:
      "Pick colors, extract palettes, swap channels and key out color backgrounds. Nine free utilities turn any image into HEX, RGB and HSL values ready to copy.",
    icon: "Palette",
    color: "from-red-500 to-orange-600",
  },
  {
    id: "watermarking",
    name: "Watermarking",
    slug: "watermark",
    description: "Protect photos with text, logo, tiled or date watermarks in seconds.",
    metaTitle: "Watermarking Tools — 5 Free Online Watermarks",
    metaDescription:
      "Protect photos with text, logo, tiled or date watermarks in seconds. Five free watermarking tools brand singles or whole batches with consistent settings.",
    icon: "Stamp",
    color: "from-teal-500 to-emerald-600",
  },
  {
    id: "text",
    name: "Text on Images",
    slug: "text",
    description: "Add captions, quotes, memes and titles with pixel-perfect typography.",
    metaTitle: "Text on Images — 5 Free Online Text Tools",
    metaDescription:
      "Add captions, quotes, memes and titles with pixel-perfect typography. Five free text tools write on images without uploading a single file anywhere, ever.",
    icon: "Type",
    color: "from-indigo-500 to-blue-600",
  },
  {
    id: "transparency",
    name: "Transparency",
    slug: "transparency",
    description: "Remove white backgrounds, key out colours, add transparency, round corners and drop shadows.",
    metaTitle: "Transparency Tools — 7 Free Online Alpha Tools",
    metaDescription:
      "Remove white backgrounds, key out colours, add transparency, round corners and drop shadows. Seven free tools produce clean alpha channels for logos, stickers and UI assets.",
    icon: "Layers",
    color: "from-cyan-500 to-sky-600",
  },
  {
    id: "social",
    name: "Social Media Sizes",
    slug: "social",
    description: "Perfect-size images for Instagram, YouTube, X, LinkedIn, Facebook and Pinterest.",
    metaTitle: "Social Media Sizes — 12 Free Platform Resizers",
    metaDescription:
      "Perfect-size images for Instagram, YouTube, X, LinkedIn, Facebook and Pinterest. Twelve free resizers hit every platform's exact pixel spec in one click.",
    icon: "Share2",
    color: "from-pink-500 to-rose-600",
  },
  {
    id: "passport",
    name: "Passport & ID Photos",
    slug: "passport-photos",
    description: "Print-ready passport, visa and ID photos with common size presets.",
    metaTitle: "Passport & ID Photos — 7 Free Photo Makers",
    metaDescription:
      "Print-ready passport, visa and ID photos with common size presets. Seven free makers cover US, Schengen and Chinese specs at exact 300 DPI dimensions.",
    icon: "IdCard",
    color: "from-amber-500 to-yellow-600",
  },
];

export function categoryById(id: string): ToolCategory | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
