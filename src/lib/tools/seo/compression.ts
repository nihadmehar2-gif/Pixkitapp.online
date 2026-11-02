/** SEO content: Compression (11) + Optimization (7) tools. */

import { seo, ToolSeo } from "../types";

export const COMPRESSION_SEO: Record<string, ToolSeo> = {
  "image-compressor": seo(
    "Free Image Compressor – Shrink JPG, PNG, WebP",
    "Compress JPG, PNG and WebP images right in your browser — can significantly reduce file size. No upload, no signup, no watermark — batch ZIP downloads.",
    "image compressor",
    "The compressor re-encodes your images through the browser's Canvas engine at the quality level you choose, using modern codecs that discard only detail your eye barely notices. A quality of 70–80% typically cuts JPEG/WebP file size substantially — and converting an opaque PNG to JPEG can save far more — while keeping photos fully shareable.",
    "Drop in up to 10 JPG, PNG or WebP files, slide the quality control (or leave the sensible default), optionally pick a different output format, then hit Process. You'll see the new size next to each result before you download them individually or as one ZIP.",
    "Accepts .jpg, .jpeg, .png and .webp up to 30MB each, 10 files per batch. PNG graphics with flat colors compress harder than photographs. Re-compressing an already compressed JPG can soften fine texture, so keep the original for future edits.",
    "Perfect before emailing photos, uploading to marketplace listings that cap file size, or speeding up a slow blog. Web developers use it to hit Core Web Vitals image budgets; students use it to squeeze scans under portal upload limits."
  ),
  "compress-png-image": seo(
    "Compress PNG Online – Keep Transparency",
    "Compress PNG files online free with optional palette reduction to 8–256 colors. Shrink screenshots, logos and graphics while transparency survives intact.",
    "compress png",
    "PNG files are lossless, so this tool shrinks them by reducing color count instead of discarding pixels: a median-cut quantizer builds an optimal 8–256 color palette, then re-encodes the image as an indexed PNG. Flat-color graphics and screenshots drop dramatically in size; photographic PNGs shrink less.",
    "Add your .png files, choose a color budget from the dropdown — 256 for gentle savings, 32 or fewer for aggressive ones — and optionally convert to grayscale for another size win. Process, check each preview on its checkerboard backdrop, then download.",
    "Input is .png only, up to 10 files of 30MB each. Transparency is preserved through every palette level. Photos saved as PNG may band slightly at 32 colors or below — test 128 or 256 first, or convert them to JPG instead for much smaller results.",
    "Ideal for app screenshots, UI mockups, logos, charts and pixel art where crisp edges matter. Developers trim PNG assets before shipping; support teams shrink bug-report screenshots; designers flatten hand-offs so clients receive lean files."
  ),
  "compress-jpeg-image": seo(
    "Compress JPEG/JPG Online – Quality Slider",
    "Compress JPEG photos online with a precise quality slider and metadata control. Get email- and web-ready JPGs without uploads — free, private, instant.",
    "compress jpeg online",
    "This tool decodes your JPEG and re-encodes it at a quality level you control, letting the encoder throw away imperceptible high-frequency detail. There's also a toggle for keeping or dropping EXIF metadata — camera settings, dates and sometimes GPS — which itself can free up tens of kilobytes.",
    "Load up to 10 .jpg files, move the quality slider (75–85 keeps photos looking original), decide whether metadata stays or goes, then process. Each result shows before/after size so you can re-run at a different level if a particular photo lost too much.",
    "Accepts .jpg and .jpeg up to 30MB per file, 10 per batch, and outputs JPEG. Every re-encode is a new JPEG generation, so extremely low settings (below ~40) start to blur fine hair and foliage. For prints, stay at 85 or above.",
    "The everyday fix for 'file too large' errors on job portals, university applications and email attachments. Photographers batch web-sized proofs; sellers compress product shots; anyone cleaning camera dumps uses it to halve storage use before archiving."
  ),
  "compress-webp-image": seo(
    "Compress WebP Images Online – Free & Instant",
    "Reduce WebP file size online with a live quality slider. Smaller modern-format images for faster sites — free, private, no upload required. Batch of 10.",
    "compress webp",
    "WebP is already efficient, but files exported at quality 90+ still carry headroom. The tool decodes your WebP through the browser's native codec and re-encodes it at your chosen quality, trimming bytes that barely change the picture. Because it all happens locally, a 10-file batch finishes in a blink.",
    "Drop your .webp files in, adjust the quality slider — 80 is a solid web default — and process. The results panel lists each file's new size and savings percentage, then you download individually or grab everything as a ZIP archive.",
    "Input: .webp only (animated WebP uses its first frame), up to 10 files and 30MB each. Output is .webp. Compression is lossy here; if you need bit-perfect output, keep your original, since no tool can re-encode WebP without a fresh generation.",
    "Handy when a downloaded WebP asset is heavier than expected, or when page-speed audits flag oversized hero images. Designers recompress exports from design tools; bloggers squeeze stock images before publishing; teams shrink UI assets for leaner bundles."
  ),
  "compress-image-to-50kb": seo(
    "Compress Image to 50KB or Less Online – Free",
    "Compress any photo to 50KB or less online free. Smart quality search finds the best-looking result that fits strict upload limits — nothing is ever uploaded.",
    "compress image to 50kb",
    "Rather than guessing a quality level, this tool searches for one: it encodes your image, measures the true output size, and walks the quality down until the file lands at or under 50KB. You get the highest fidelity the target allows instead of a one-size-fits-all setting.",
    "Add your image, pick JPG (usually the best fit for tiny targets) or WebP, then process. The result card shows the final size — if it says 50KB or less, download it. For very detailed photos, WebP often looks better at this size than JPG.",
    "Accepts .jpg, .png and .webp inputs; output is always 50KB or smaller — the tool tells you instead of exceeding the limit if a target can't be met. Extremely large photos may need to be resized first for the best quality at this size — pair it with the Image Resizer if sharpness matters. Batch limit is 10 files.",
    "Built for hard limits: government forms, exam applications, visa portals and forum avatars that reject anything bigger. Since the whole job runs in your browser tab, sensitive ID scans and certificates never leave your device."
  ),
  "compress-image-to-100kb": seo(
    "Compress Image to 100KB Online – Free & Private",
    "Reduce any image to 100KB or smaller in your browser. Ideal for online applications, profiles and portal uploads with strict size caps — private and instant.",
    "compress image to 100kb",
    "The tool runs a quality-search loop: encode, measure, adjust, repeat — until your image is 100KB or under with the best quality that fits. WebP typically reaches the target with more visible detail than JPG, so both formats are offered and either can win depending on the picture.",
    "Drop up to 10 images, choose the output format, and press Process. Each result reports its exact final size; if one looks soft, try the WebP option or resize dimensions down slightly and run it again. Download files individually or as a ZIP.",
    "Inputs: .jpg, .png, .webp up to 30MB each. Output: 100KB max, in JPG or WebP. At this size, keep dimensions moderate (around 1000–1600px wide) for crisp text and faces; if the image must stay huge, quality has to give somewhere.",
    "Classic targets: scholarship and job portals, ticket uploads, blog comment avatars, and messaging apps that balloon large photos. Because nothing is uploaded, documents like mark sheets and scanned IDs stay completely on your machine."
  ),
  "compress-image-to-200kb": seo(
    "Compress Image to 200KB Online – Best Quality",
    "Compress photos to 200KB online free with smart quality search. Hit upload limits for forms, forums and email attachments while your photo stays sharp.",
    "compress image to 200kb",
    "Instead of a fixed quality guess, the tool iterates: it encodes at high quality, checks the real byte size, and steps down only as far as needed to fit 200KB. That means photos usually keep more detail than a manual slider setting would leave you.",
    "Load your images (up to 10 at a time), select JPG or WebP output, and run the compressor. Review the size readout on each result — most photos land just under the cap at high quality — then download separately or all together as a ZIP.",
    "Accepts .jpg, .png and .webp up to 30MB per file; output is JPG or WebP at 200KB or less. PNG graphics with lots of text convert cleanly, but if crispness of tiny text matters, WebP is usually the safer pick at this target.",
    "A sweet spot for resume photo fields, college application portals, marketplace listings and email attachments where 200KB is the ceiling. Sellers on classified-ad sites use it daily to get product photos past strict upload validation."
  ),
  "compress-image-to-500kb": seo(
    "Compress Image to 500KB Online – Free & Private",
    "Compress images to 500KB or below with near-original quality. Perfect balance of size and sharpness for email, uploads and the web — runs in your browser.",
    "compress image to 500kb",
    "The compressor performs an encode-measure-adjust loop until the file fits 500KB at the highest quality possible. At this roomy target, most 12–24 megapixel photos survive with virtually no visible difference — you're mainly paying for the megabytes, not the pixels.",
    "Drop up to 10 images, choose JPG or WebP, and process. Results show exact sizes so you can confirm each one came in under the limit. Files that are already small pass through with minimal change, and everything downloads individually or zipped.",
    "Input formats: .jpg, .png, .webp (30MB max each). Output: JPG or WebP, 500KB cap. If your source is a 20MP photo that lands too soft, resize it to around 2000px first; 500KB spreads across fewer pixels much more comfortably.",
    "Useful for real-estate listings, blog hero images, marketplace photos and any portal that blocks multi-megabyte uploads. It's also a common pre-flight step for print shops that accept email submissions with a 500KB-per-file policy."
  ),
  "compress-image-to-specific-size": seo(
    "Compress Image to Exact KB – Custom Target",
    "Compress images to any KB target you choose — 30KB, 75KB, 1MB, whatever the form demands. Smart search keeps quality as high as the size allows, error-free.",
    "compress image to specific size",
    "You set the target; the tool finds the encoding. It re-encodes your image repeatedly, measuring true output size each round, and narrows in on the largest quality value that still fits your custom KB limit. The result is the best-looking file that passes the size check.",
    "Add an image, type your exact target in kilobytes into the number field, choose JPG or WebP, and hit process. The output card confirms the achieved size — try the other codec if you want to compare which format looks better at that size.",
    "Accepts .jpg, .png, .webp up to 30MB each, 10 files per run. Targets below ~20KB force visible quality loss on big photos; resizing dimensions alongside compression gives much better results for extreme targets.",
    "Whenever an upload field names an arbitrary number — 75KB for a signature image, 300KB for a product shot, 1MB for a portfolio piece — this is the tool that hits it exactly, on-device, without trial-and-error exports from a heavyweight editor."
  ),
  "near-lossless-image-compressor": seo(
    "Near-Lossless Image Compressor – High Quality",
    "A near-lossless image compressor for photos: high-quality re-encoding most people can't tell from the original — honest, not mathematically lossless.",
    "lossless image compressor",
    "This tool tries quality 95, 90, 85 and 80 in order and keeps the first setting that produces a smaller file than your original. At these levels, artifacts are very hard to spot in most photos — though pixel-peepers comparing crops side by side may notice the difference in fine textures.",
    "Add up to 10 images, pick WebP (best compression) or JPG, and process. Compare each result's preview against the original in the results panel — savings are reported per file. If a particular image must be mathematically lossless, keep the original instead.",
    "Inputs: .jpg, .png, .webp up to 30MB each. Output: WebP or JPG. 'Near-lossless' means savings with no difference most viewers can see at normal sizes; it is still a re-encode, so archivists working with master files should treat originals as irreplaceable.",
    "For photographers delivering client galleries, shops publishing product photos, and anyone who wants smaller files without an obvious quality hit. It's the gentlest setting in the PixKitApp compression family — start here, then compress harder only if you must."
  ),
  "bulk-image-compressor": seo(
    "Bulk Image Compressor – Batch of 10 at Once",
    "Bulk image compressor for up to 10 photos in one click, with total batch savings. JPG, PNG and WebP supported — download one ZIP; mixed batches are fine.",
    "bulk image compressor",
    "The batch pipeline feeds each file through the same Canvas re-encode used by the single-image compressor — your chosen quality and format applied consistently across all of them. Progress is reported as each image finishes, and a grand total shows exactly how many megabytes the batch saved.",
    "Drop a whole folder's worth (up to 10 files), set quality once, optionally switch output format, and process. Every result lists its before/after size; review the previews, then hit the ZIP button to collect the entire batch in one download.",
    "Accepts mixed batches of .jpg, .png and .webp up to 30MB per file, 10 per run. Output can keep each file's original format or normalize everything to one format — handy when a CMS only accepts a single type.",
    "Camera dumps after an event, product-catalog batches, email attachment sets, blog media libraries — anywhere 50 similar photos need the same treatment. One pass here replaces fifty manual exports, entirely on your machine."
  ),

  // Optimization
  "image-optimizer": seo(
    "All-in-One Image Optimizer – Resize + Compress",
    "Optimize images with smart resizing and compression in a single step. Set max dimensions and quality for lean, fast-loading photos — free and private.",
    "image optimizer",
    "This optimizer chains two operations: it scales any image whose longest edge exceeds your max-dimension setting using high-quality multi-step resampling, then re-encodes the result at your chosen quality and format. Resizing first is the real win — a 6000px photo brought to 1920px loses most of its weight before compression even starts.",
    "Drop up to 10 images, set the longest allowed edge (1920px is a great default), pick a quality level and output format, then run. Each result shows new dimensions and size; download individually or as a ZIP archive.",
    "Accepts .jpg, .png and .webp up to 30MB per file, 10 per batch, with WebP, JPEG or PNG output. Images smaller than your max dimension are only re-encoded, never upscaled, so their resolution is safe.",
    "The one-stop pre-publish step for blogs, CMS uploads, and site-speed projects. Marketing teams standardize entire asset folders to one pipeline; freelancers hand clients web-ready files straight from the browser."
  ),
  "optimize-image-for-web": seo(
    "Optimize Images for the Web – WebP Preset",
    "One-click web optimization: resize to 1920px max and compress to WebP quality 85. Lighthouse-friendly images in seconds — no upload, no account, 100% free.",
    "optimize image for web",
    "The tool applies proven web defaults automatically: longest edge capped at 1920 pixels, re-encoded as WebP at quality 85. That combination clears most image audits in Lighthouse and PageSpeed Insights because it attacks both dimensions and codec efficiency, the two things image audits actually measure.",
    "Drop your images and press process — the preset does the deciding. If you want to tune it, adjust the max-dimension and quality sliders before running. Results show final dimensions, byte size and savings; grab a ZIP when you're happy.",
    "Accepts .jpg, .png and .webp up to 30MB each, 10 per batch; output is always WebP with this preset. WebP is supported by every current browser; if you must support legacy software, use the universal converter to emit JPG instead.",
    "Built for developers and site owners prepping page images, hero banners and blog posts. E-commerce teams run every product photo through it before upload, and agencies use it to hand back weight-reduced media libraries."
  ),
  "optimize-png-for-web": seo(
    "Optimize PNG for Web – Palette + Re-encode",
    "Make PNGs web-ready with palette reduction and smart re-encoding. Keep transparency, cut the bloat — free browser-based PNG optimizer. Batch of 10 supported.",
    "optimize png for web",
    "The optimizer rebuilds your PNG around a median-cut palette of 32–256 colors, which collapses the file's color table to exactly what the image needs. Transparent areas survive every step, so soft edges and cut-outs stay intact while the byte count drops, often by half or more on graphics.",
    "Add up to 10 .png files, choose a color budget — 256 for detailed UI shots, 64 for flat icons and logos — and optionally go grayscale. Process, inspect each preview over the transparency checkerboard, then download the batch.",
    "Input: .png only, 30MB max per file, 10 per run; output remains PNG with alpha. Photographic content in PNG form benefits little from palettes — convert those to WebP or JPG via the universal converter for much bigger wins.",
    "Made for web graphics: interface screenshots, diagrams, logos, charts and anything with crisp text where JPEG artifacts would be unacceptable. Documentation teams use it to keep image-heavy docs fast; designers slim app bundles before release."
  ),
  "optimize-jpg-for-web": seo(
    "Optimize JPG for Web – Web-Tuned Quality",
    "Re-encode JPGs at web-tuned quality and strip heavy camera metadata. Fast-loading, beautiful photos for pages and stores — free, private, batch-friendly.",
    "optimize jpg for web",
    "Camera JPEGs carry heavy EXIF blocks and conservative encoder settings tuned for quality, not bytes. This tool decodes your JPG, drops the metadata baggage, and re-encodes at a quality level balanced for screen viewing — where 75–85 is indistinguishable from 100 at normal zoom.",
    "Drop up to 10 .jpg files, adjust the quality slider if you like, and process. The before/after sizes tell the story per file; results can be downloaded one by one or as a single ZIP for bulk hand-offs.",
    "Accepts .jpg and .jpeg up to 30MB per file, 10 per batch; output is JPEG. Each pass is a fresh JPEG generation, so avoid stacking repeated optimization rounds on the same file — work from the original when re-tuning.",
    "The routine step before publishing photos to a store, portfolio or CMS. Real-estate agents squeeze listing galleries; content teams hit image budgets without touching Photoshop; anyone's camera roll gets web-ready in one batch."
  ),
  "favicon-generator": seo(
    "Favicon Generator – All Sizes + favicon.ico",
    "Generate every favicon you need from one image: 16, 32, 48, 96 and 180px PNGs plus a classic favicon.ico. Preview every size before downloading the pack.",
    "favicon generator",
    "The generator center-fits your source image onto a square canvas — with optional padding and background color — then renders it at every standard favicon size using smooth downsampling. All sizes are bundled into a multi-resolution .ico (which Windows expects) plus individual PNGs for modern platforms, including the 180px touch icon.",
    "Drop one square-ish image (SVG, PNG, JPG or WebP), set padding and background if desired, and generate. Each size appears as a preview tile — check the tiny ones are still legible — then download the pack and drop the files in your site root.",
    "Accepts .png, .jpg, .webp and .svg up to 30MB; output is a ZIP containing favicon.ico plus 16/32/48/96/180px PNGs. Source images sharper than 256px produce the cleanest small sizes; logos with transparent backgrounds work best.",
    "Every new website, web app and PWA needs this exact file set. Indie hackers shipping side projects, agencies templating client sites, and open-source maintainers refreshing project branding all run this once per release."
  ),
  "email-image-resizer": seo(
    "Resize Images for Email – 800px Preset",
    "Prepare photos for email automatically: 800px wide, JPEG quality 90 — small enough to send, sharp enough to enjoy. Batch up to 10 photos, free and private.",
    "resize image for email",
    "The preset resizes each image so its longest edge is 800 pixels and re-encodes as JPEG at quality 90 — high quality that keeps photos pleasant on laptop screens while still cutting multi-megabyte camera files down to a size most mail servers accept. Recipients on slow connections and strict corporate mail servers both thank you.",
    "Drop up to 10 photos and press process — the preset is deliberately opinionated. Adjust the dimension or quality sliders if your audience differs, check the before/after sizes, and download the batch as a ZIP ready to attach.",
    "Accepts .jpg, .png and .webp inputs up to 30MB each; output is JPEG at your chosen size. Text in screenshots stays readable at 800px for most uses, but dense documents may need 1200px — raise the slider for those.",
    "Built for photo-heavy emails: family updates, property tours to clients, progress reports with site photos, and anything headed for a 10MB or 25MB attachment ceiling. It's also a polite habit for mailing lists where oversized images get stripped."
  ),
  "image-size-reducer": seo(
    "Image Size Reducer – Before/After Compare",
    "Reduce image size by percentage or dimension with a live before/after comparison. See exactly what each file saves before you download — free browser tool.",
    "image size reducer",
    "The reducer scales your image by a percentage of its original dimensions using multi-step resampling — which preserves far more detail than a single naive downscale — then re-encodes at your chosen quality and format. The results panel pairs every output with its original size so the trade is never a guess.",
    "Drop up to 10 images, set the scale percentage (50% quarters the pixel count), pick a quality level and output format, then process. Review each before/after pair, tweak, re-run if needed, and download individually or zipped.",
    "Accepts .jpg, .png and .webp up to 30MB per file, 10 per batch; output can be JPEG, WebP or PNG. Reducing by percentage is proportional; if you need exact pixel targets instead, use the Image Resizer with width/height fields.",
    "The tool for 'just make it smaller' moments: oversized scans, screenshots destined for docs, camera files headed to chat apps. Because it shows savings numerically per file, it's also a nice teaching tool for non-technical teammates learning image weight."
  ),
};
