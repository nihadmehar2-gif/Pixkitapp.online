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
    intro: [
      "These compressors re-encode pictures on your own device, so a heavy camera photo can shrink before it goes anywhere — there is no upload step to wait for. The eleven tools split the job by goal: set a quality level yourself with Image Compressor, hit a strict form or attachment limit with the 50KB, 100KB, 200KB, 500KB or custom-KB versions, or let the bulk tool process up to ten files and hand you one ZIP.",
      "A practical starting point is quality 75–85%: photos typically drop to a fraction of their original weight with no visible change. PNG screenshots and logos re-encode losslessly in their own format, so text stays crisp — when a PNG photo needs far bigger savings, choosing JPEG or WebP output trades a little fidelity for a much smaller file.",
    ],
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
    intro: [
      "Resizing changes the pixel dimensions of a picture, and these tools cover every way you might need to do it: exact width and height, a percentage scale, width-only or height-only fits, a target file size in KB, and dedicated versions for PNG, JPG and WebP that preserve format-specific details like transparency.",
      "The main resizer downscales in gradual halving steps before the final pass, which keeps shrunken photos noticeably sharper than a single naive stretch. Lock the aspect ratio when composition matters, or unlock it when a form demands precise pixels. Downsizing is where these tools shine — for making pictures bigger, the Enlarge Image tool adds multi-step upscaling and optional sharpening to limit the softening that any enlargement causes.",
    ],
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
    intro: [
      "Cropping removes what you don't want and reframes what you do. The interactive Crop Image editor lets you drag the frame freely with a locked or open ratio, while the one-click presets cover the shapes people need most: perfect squares for avatars, circles for profile badges, and 16:9, 9:16, 4:3 or 3:2 frames for video thumbnails, stories, prints and presentations.",
      "Auto Trim Borders works differently — it detects a plain border around screenshots or scanned photos and cuts it away with an adjustable tolerance plus optional padding. A detail worth knowing: circle crops export as transparent PNG, so the corners stay see-through wherever you place the result.",
    ],
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
    intro: [
      "Twenty converters cover the practical directions between JPG, PNG, WebP, BMP, AVIF, PDF, ICO and Base64. When a website rejects an upload, an older program wants a BMP, or a print shop asks for JPG, this is the quickest fix — the file is decoded and re-encoded on your device in seconds, never sent anywhere.",
      "A few honest details help you pick the right tool: GIF conversion takes the first frame only, Image to PDF builds one page per picture (up to ten), Image to ICO bundles several favicon sizes into one file, and SVG to PNG rasterizes vectors at 1–4× scale. Transparent images keep their alpha channel when the target format supports it, and flatten onto your chosen background colour when it doesn't.",
    ],
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
    intro: [
      "These tools fix orientation in the most literal sense: quarter turns in one click, a full 180°, an exact custom angle, or a mirror flip in either direction — all re-encoded locally at high quality so photos keep their detail through the transform.",
      "Straighten Image deserves a special mention for tilted horizons: it corrects up to ±15° and zooms slightly to hide the empty corners that any straightening creates. And if a photo keeps showing up sideways in one particular app, the cause is usually an orientation tag the app ignores — an actual pixel rotation here rewrites the pixels themselves, so the fix holds everywhere.",
    ],
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
    intro: [
      "These fifteen effects are adjustments and looks rather than stickers: luminance-accurate black and white, sepia, colour inversion, Gaussian blur, unsharp-mask sharpening, slider-controlled brightness, contrast, saturation and hue, plus character effects such as vintage fade, posterize, pixelation, duotone, film grain and vignette.",
      "Every effect renders a live preview as you move the controls, and your original file is never modified — the look applies to a copy you download. To stack looks, run the output of one filter through another; because nothing is uploaded, experimenting costs nothing but a moment.",
    ],
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
    intro: [
      "Optimization is compression with a destination in mind. These seven tools start from a goal — a faster website, a lighter email, a finished favicon — and choose sensible dimensions and quality for you. Optimize for Web, for instance, caps photos at 1920px and re-encodes at WebP quality 85, exactly what page-speed checkers like to see; the email tool produces 800px JPEGs that slip under attachment limits, and the favicon generator outputs every size platforms ask for in one download.",
      "If you'd rather watch the savings, the Image Size Reducer shows a live before/after size comparison, so you can confirm the result with your own eyes before downloading.",
    ],
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
    intro: [
      "Every photo can carry hidden text: camera model, exposure settings, capture time and often GPS coordinates. The Metadata Viewer decodes EXIF, GPS records and PNG chunks on your device, so you can see exactly what a file reveals before you post it.",
      "When something shouldn't travel with the picture, Remove Metadata re-encodes a clean copy, and Remove GPS Data targets location records specifically while leaving the rest of the file untouched. A useful habit: screenshots and re-saved images are often already clean, while camera originals are the ones worth checking — especially anything shot near home or work.",
    ],
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
    intro: [
      "These nine utilities read colour out of pictures and put it to work. The picker zooms in so you can grab an exact pixel as HEX, RGB or HSL; the palette extractor runs median-cut quantization to pull a usable brand palette from any photo; and the dominant- and average-colour tools distil an image down to a single swatch for theming or ambient backgrounds.",
      "On the editing side, Replace Color swaps one shade for another with tolerance control, Chroma Key keys a colour out to transparency, and the temperature, threshold and channel-mixer tools handle white balance, high-contrast masks and creative channel swaps.",
    ],
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
    intro: [
      "Five tools cover the practical ways to mark a photo as yours: a text stamp with control over font, size, opacity and position; a logo overlay that respects transparent PNGs; a tiled pattern repeating across the whole frame; a date stamp for record-keeping; and a bulk version that applies identical settings to ten photos at once, downloaded as a single ZIP.",
      "The balance to strike is visible but not destructive — around 50–60% opacity in a corner usually protects a photo without ruining it. For proofs and previews where protection matters more than looks, the tiled watermark is deliberately the hardest to crop out.",
    ],
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
    intro: [
      "Sometimes a picture needs words on it, and these five tools each do one job well. Add Text to Image handles free-form typography — colour, weight, size and an optional background pill for readability. Caption Bar wraps longer sentences in a styled bar above or below the photo, the meme generator pairs bold top-and-bottom text the classic way, Quote Card sets a quotation with attribution for social sharing, and Title Banner builds blog thumbnails with a headline on a colour bar.",
      "Everything renders on your device, so drafts of unpublished work stay private until you choose to share them.",
    ],
  },
  {
    id: "transparency",
    name: "Transparency",
    slug: "transparency",
    description: "Remove white backgrounds, key out colours, add transparency, round corners and drop shadows.",
    metaTitle: "Transparency Tools — 7 Free Online Alpha Tools",
    metaDescription:
      "Remove white backgrounds, key out colours, round corners and add drop shadows. Seven free transparency tools create clean alpha channels for logos and stickers.",
    icon: "Layers",
    color: "from-cyan-500 to-sky-600",
    intro: [
      "Transparency work is alpha-channel work: deciding which pixels stay, which turn see-through, and how clean the edge between them looks. Remove White Background uses flood-fill that protects white details inside your subject, Make Transparent keys out any solid colour with tolerance and feathering, and Transparent PNG Maker cleans up the semi-transparent edges of existing cutouts.",
      "The direction reverses too: Add White Background and Add Background Color flatten transparent PNGs onto a solid base — something marketplaces and print shops often require — while Round Corners and PNG Drop Shadow finish graphics for the web. Save results as PNG; JPG has no alpha channel and would flatten your work.",
    ],
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
    intro: [
      "Every platform crops and recompresses uploads to its own spec, and posting the wrong size is how images end up blurry or awkwardly cut. These twelve resizers ship the exact dimensions — 1080×1080 Instagram posts, 1080×1920 stories, 1500×500 X headers, 1584×396 LinkedIn banners, 1280×720 YouTube thumbnails and the rest — so one click frames your picture correctly.",
      "Where the aspect ratio differs from your photo, you choose the strategy: cover-crop fills the frame edge to edge, while pad keeps the whole image and fills the gaps. Because platforms compress aggressively, starting from a sharp, correctly sized upload is the single best way to keep images looking professional after they're processed.",
    ],
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
    intro: [
      "These seven tools produce ID photos at the exact dimensions officials ask for — the US 2×2-inch (600×600px), the Schengen 35×45mm (413×531px) and the Chinese 33×48mm specs among them — always at 300 DPI print quality with head-position guides on screen. The general maker accepts common presets, the dedicated tools pin one country's format, LinkedIn Headshot crops a professional 400×400 square, and Photo Print Sheet arranges photos on a 4×6 sheet with cut lines for any kiosk.",
      "One honest note that the tool pages themselves repeat: requirements vary by issuing authority and change over time, so treat these as correctly sized drafts and confirm the current rules with the official source before printing.",
    ],
  },
];

export function categoryById(id: string): ToolCategory | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
