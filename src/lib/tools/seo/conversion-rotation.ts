/** SEO content: Conversion (20) + Rotation (7) tools. */

import { seo, ToolSeo } from "../types";

export const CONVERSION_SEO: Record<string, ToolSeo> = {
  "webp-to-jpg": seo(
    "WebP to JPG Converter Online – Free & Fast",
    "Convert WebP to JPG online for free — batch up to 10 images with quality control and transparency flattening. Private, instant, no upload — all on-device.",
    "WebP to JPG converter online",
    "The converter decodes your WebP files with the browser's native image engine, flattens any transparency onto the background color you pick, and re-encodes each image as a JPG at the quality you set. Everything runs on your device — no server round-trip, no queue, no watermark.",
    "Drop one or more .webp files onto the upload area, set the JPG quality (92% is a good default) and choose a background for transparent regions. Press Convert, preview the results, then download individual files or the whole batch as a ZIP.",
    "Input: .webp, including animated WebP (its first frame is converted). Output: .jpg. Batches are capped at 10 files with a 30MB per-file limit. Because JPG has no alpha channel, transparent pixels become your chosen background color — white by default.",
    "Use it when an upload form, email client or older app rejects WebP — marketplace listings, CMS media libraries, print shops and messaging apps are the usual offenders. Photographers also use it to hand JPG proofs to clients from WebP camera exports."
  ),
  "webp-to-png": seo(
    "WebP to PNG Converter – Lossless & Transparent",
    "Convert WebP to PNG online free with full transparency preserved. Lossless output for graphics, logos and screenshots — private, fully in-browser, instant.",
    "webp to png converter",
    "This converter decodes WebP through the browser's native engine and re-encodes the pixels as PNG without any quality dial — PNG is lossless, so every pixel and every semi-transparent edge arrives exactly as decoded. There are simply no settings to get wrong.",
    "Drop up to 10 .webp files, press Convert, and download the PNGs individually or as a ZIP. The preview grid confirms transparency survived before you save anything.",
    "Accepts .webp up to 30MB per file, 10 per batch; output is always .png. Files can grow when a highly compressed WebP photo becomes PNG — that's lossless storage doing its job. For smaller results on photos, WebP→JPG is the pragmatic path.",
    "The route to take when an app accepts PNG but not WebP: design tools with PNG-only import, documentation systems, older Android webviews, and any asset pipeline that needs alpha plus lossless. Screenshots and UI graphics come through pixel-perfect."
  ),
  "jpg-to-png": seo(
    "JPG to PNG Converter – No Extra Quality Loss",
    "Convert JPG to PNG online free. No extra quality loss during conversion, ideal for editing masters and text-heavy images — private, instant, no watermark.",
    "jpg to png converter",
    "The tool unwraps your JPEG's decoded pixels into a lossless PNG container. No new compression artifacts are added — though artifacts already baked into the JPG by its camera or previous save remain, since no converter can undo past JPEG loss.",
    "Drop up to 10 .jpg files and press Convert — there are no settings because none are needed. Preview each result, then download files individually or the batch as a ZIP.",
    "Input: .jpg/.jpeg up to 30MB each, 10 per run. Output: .png, typically larger than the source for photographs (lossless costs bytes). For text-heavy images and screenshots the size gap is smaller and the crispness gain can be worth it.",
    "Converting photos before repeated editing rounds (PNG survives saves without generational loss), feeding image editors that prefer PNG, and preparing images for tools that demand the format. Also the standard fix for 'PNG required' upload fields."
  ),
  "png-to-jpg": seo(
    "PNG to JPG Converter – Background Control",
    "Convert PNG to JPG online with a background color picker for transparency. Slash file sizes on photos — free, instant, batch of 10, no upload or signup.",
    "png to jpg converter",
    "Your PNG is decoded, transparent regions are filled with the background color you choose, and the image is re-encoded as JPG at your quality setting. Photographic content routinely drops dramatically in size because JPEG's compression suits continuous tones far better than PNG's lossless rows.",
    "Drop up to 10 .png files, set JPG quality (92 keeps things crisp) and pick the fill color for transparency — white for documents, black for video overlays. Convert, preview, download individually or zipped.",
    "Accepts .png up to 30MB per file, 10 per batch; output is .jpg. Transparency cannot survive — JPG has no alpha channel — so the fill color choice matters on graphics. Logos with soft edges may show slight haloing against their new background.",
    "The classic pre-upload slim-down for photo platforms that reject PNG, email attachments and CMS libraries with size quotas. Also commonly used to flatten design exports into universal, everywhere-compatible JPGs."
  ),
  "png-to-webp": seo(
    "PNG to WebP Converter – Same Quality, Less Size",
    "Convert PNG to WebP online free. PNG-class quality and transparency at a fraction of the file size — the modern format for faster websites and lighter apps.",
    "png to webp converter",
    "The converter runs the browser's native WebP encoder over your decoded PNG pixels, preserving the alpha channel and, at 90%+ quality, staying visually indistinguishable from the lossless original. Graphics with transparency typically shrink noticeably; opaque photos shrink even more.",
    "Drop up to 10 .png files, adjust the quality slider if you like (90 is a safe default), and convert. Preview each result over the transparency checkerboard, then download files or a ZIP.",
    "Accepts .png up to 30MB each, 10 per run; output is .webp with alpha preserved. Every current browser renders WebP; very old enterprise software may not — that's what the PNG→JPG route is for.",
    "The go-to move for page-speed work: converting logo files, UI assets, icons and screenshots from PNG to WebP routinely wins a Lighthouse performance point. Also used to slim app bundles and design-system asset folders."
  ),
  "jpg-to-webp": seo(
    "JPG to WebP Converter – Smaller Files, Same Look",
    "Convert JPG to WebP online free for significantly smaller files at the same visual quality. Build faster sites with the modern codec — private and instant.",
    "jpg to webp converter",
    "The browser's WebP encoder re-encodes your decoded JPG pixels at the quality you pick. WebP's modern compression usually lands well below JPEG's file size at matching visual quality, and because the tool works locally, converting a 10-photo batch takes seconds rather than an upload round-trip.",
    "Drop up to 10 .jpg files, set the WebP quality — 85 is a strong default for photos — and convert. Results show the size delta per file; download individually or as one ZIP.",
    "Accepts .jpg/.jpeg up to 30MB per file, 10 per batch; output is .webp. A single re-encode at high quality is visually safe, but stacking conversions across formats repeatedly compounds softness — convert from the original where possible.",
    "The single biggest image performance win for most websites: converting blog photos, store product shots and hero images from JPG to WebP directly improves load time and Lighthouse scores without changing how pages look."
  ),
  "gif-to-png": seo(
    "GIF to PNG Converter – Extract First Frame",
    "Turn a GIF's first frame into a full-quality PNG image online. Perfect for previews, thumbnails, docs and GIF-free platforms — free, private, instant.",
    "gif to png converter",
    "The tool decodes the first frame of your GIF and re-encodes it as a lossless PNG. GIF's 256-color ceiling means gradients were already banded in the source; PNG keeps exactly what's there without adding artifacts, and any transparency in the frame is preserved.",
    "Drop one .gif file and press Convert — no settings needed. The extracted still appears in the preview; download the PNG and use it anywhere stills are expected.",
    "Accepts .gif up to 30MB, single file per run; output is .png of the first frame only — animation doesn't survive by design. If you need a different moment, use a platform that exports that frame first.",
    "Making video-link previews, posting a GIF moment to platforms that auto-convert animations, extracting a still for documentation, and creating thumbnails from animated stickers. Also useful for debugging what a GIF's opening frame actually shows."
  ),
  "gif-to-webp": seo(
    "GIF to WebP Converter – Modern & Smaller",
    "Convert GIF files to efficient WebP images in your browser. Better compression and color depth from any GIF — free, private, no upload, with quality control.",
    "gif to webp converter",
    "Your GIF's first frame is decoded and re-encoded as WebP at the quality you choose. WebP lifts GIF's two big constraints — 256 colors and heavy compression — typically producing a smaller file with smoother gradients for the same visual moment.",
    "Drop one .gif file, adjust quality if desired, and convert. The result previews immediately; download the .webp for use in modern apps and websites.",
    "Accepts .gif up to 30MB; single file per run; output is a static .webp of the first frame, not an animation. Animated WebP output is a different beast — this tool is for stills.",
    "Modernizing legacy GIF assets for web pages (a still WebP is far lighter than a looping GIF), refreshing icon libraries, and converting old forum avatars. Anywhere GIF content must live in a modern pipeline, this is the first stop."
  ),
  "bmp-to-jpg": seo(
    "BMP to JPG Converter – Shrink Huge Bitmaps",
    "Convert Windows BMP bitmaps to compact JPG online. Turn huge uncompressed files into shareable photos — free, private, batch-friendly, up to 10 files.",
    "bmp to jpg converter",
    "BMP files store raw pixels with essentially no compression — a 1920×1080 screenshot weighs over 6MB. This tool decodes the bitmap and re-encodes it as JPG at your quality level, typically producing a file that is a small fraction of the original and that every device and app can open.",
    "Drop up to 10 .bmp files, set the JPG quality (90 is the sweet spot for screenshots), and convert. Preview each result, then download individually or as a ZIP.",
    "Accepts .bmp up to 30MB per file (which, for BMP, is not very many megapixels), 10 per batch; output is .jpg. BMPs from specialized industrial software occasionally use unusual headers — if one fails to load, it's the source, not you.",
    "Classic scenario: an old app or scanner exported BMP and nothing modern wants it. Converting to JPG makes the file emailable, uploadable and storable at a fraction of the space — batch mode handles whole folders of legacy exports."
  ),
  "bmp-to-png": seo(
    "BMP to PNG Converter – Lossless Modernization",
    "Convert BMP bitmaps to lossless PNG online free. Same pixels, modern format, far smaller file — private, instant, batch up to 10, zero settings needed.",
    "bmp to png converter",
    "The tool re-wraps your bitmap's exact pixels into PNG's lossless, compressed container. Nothing changes visually — PNG's DEFLATE compression simply stores the same data far more efficiently than BMP's raw rows, commonly cutting file size dramatically with zero quality risk.",
    "Drop up to 10 .bmp files and convert — no settings to configure. Results preview instantly; download individually or as one ZIP for the batch.",
    "Accepts .bmp up to 30MB each, 10 per run; output is .png. For screenshots and flat graphics PNG is ideal; for photographs destined to stay small, the BMP→JPG route compresses further at slight (invisible) cost.",
    "Modernizing legacy screenshots, scanner exports and old app output where pixel fidelity matters — documentation archives, patent drawings, medical and lab tooling exports. PNG also unlocks transparency that BMP rarely carried."
  ),
  "jpg-to-bmp": seo(
    "JPG to BMP Converter – Raw Bitmap Output",
    "Convert JPG images to uncompressed BMP format online. For legacy software, industrial tools and systems that demand raw bitmaps — free, private, always local.",
    "jpg to bmp converter",
    "The decoder turns your JPEG into raw pixels and writes them out as a standard 24-bit BMP — no compression, no quality settings, no surprises. The output is as plain an image file as exists, which is exactly why certain old and industrial software insists on it.",
    "Drop one .jpg file and convert. The preview confirms the image, then download the .bmp — expect it to be much larger than the source, since BMP stores every pixel uncompressed.",
    "Accepts .jpg/.jpeg up to 30MB; single file per run; output is .bmp (24-bit). BMP carries no transparency and no EXIF — metadata from the source does not transfer, which is sometimes itself the goal.",
    "Feeding engraving machines, embroidery software, legacy CAD viewers, kiosk firmware and vintage applications that read only BMP. Also useful as a neutral intermediate when some other tool needs raw, uncompressed input."
  ),
  "png-to-bmp": seo(
    "PNG to BMP Converter – Flatten & Rasterize",
    "Convert PNG images to BMP bitmap format online. Lossless raw output for legacy apps — transparency flattened to your chosen color. Runs fully in-browser.",
    "png to bmp converter",
    "Your PNG's pixels are decoded and written as a standard 24-bit BMP. Because BMP has no alpha channel, transparent regions are flattened onto the background color you select before writing — white is the usual choice for documents and print pipelines.",
    "Drop one .png file, pick a background color for transparent areas, and convert. Download the .bmp and hand it to whatever legacy system is waiting for it.",
    "Accepts .png up to 30MB; single file per run; output is uncompressed .bmp, so file size grows substantially — that's inherent to the format, not a bug. Semi-transparent edge pixels blend into your chosen background.",
    "The bridge to BMP-only ecosystems: factory machinery UIs, old point-of-sale software, embedded displays, and vintage games or tools. Anywhere the requirement reads 'must be a .bmp', this gets you there from modern assets."
  ),
  "avif-to-jpg": seo(
    "AVIF to JPG Converter – Next-Gen to Universal",
    "Convert AVIF images to universal JPG online free. Works in Chrome, Edge and Opera — private, on-device browser conversion for the newest image format.",
    "avif to jpg converter",
    "AVIF is the newest mainstream codec and not every app speaks it yet. This tool decodes AVIF using the browser's built-in codec (Chrome, Edge and Opera ship one) and re-encodes the pixels as JPG at your chosen quality, flattening any transparency onto a background color.",
    "Drop up to 10 .avif files, set JPG quality, pick a background color for transparent regions, and convert. Preview the results, then download individually or as a ZIP.",
    "Input: .avif up to 30MB each, 10 per batch; output is .jpg. Requires a browser with native AVIF decoding — Safari and Firefox users should try a Chromium browser if loading fails. Transparency flattens (JPG has no alpha).",
    "The standard fix when a download arrives as .avif and an upload form, editor or print shop only accepts JPG. Handy for stock-image downloads, CMS uploads and messaging apps that haven't adopted the format."
  ),
  "avif-to-png": seo(
    "AVIF to PNG Converter – Lossless with Alpha",
    "Convert AVIF images to lossless PNG with transparency support online. Free in-browser tool for the newest image format — private, instant, batch-capable.",
    "avif to png converter",
    "The tool decodes your AVIF through the browser's native codec and writes lossless PNG, preserving the alpha channel exactly — soft edges and semi-transparent overlays arrive intact. No quality settings exist because PNG recompression doesn't degrade pixels.",
    "Drop up to 10 .avif files, press Convert, and download the PNGs individually or zipped. The checkerboard preview confirms which areas are genuinely transparent.",
    "Input: .avif up to 30MB per file, 10 per batch; output is .png. Needs a browser with AVIF decoding (current Chrome, Edge, Opera). Photographic AVIFs grow in size as PNG — that's lossless storage, not a defect.",
    "For design workflows that received next-gen downloads: extracting assets from AVIF into editors that want PNG, preserving transparency for compositing, and feeding documentation or app pipelines that haven't adopted AVIF."
  ),
  "image-to-pdf": seo(
    "Image to PDF Converter – Multi-Page & A4",
    "Convert JPG, PNG and WebP images to PDF online — one image per page, up to 10 pages. Choose A4/Letter, orientation and margins. Free, private, watermark-free.",
    "image to pdf converter",
    "The converter lays each image onto a PDF page in your chosen paper size and orientation, applying your margin setting, and writes a real multi-page PDF document entirely in the browser — a minimal PDF writer runs in JavaScript, so nothing is uploaded anywhere.",
    "Add up to 10 images in the order you want pages to appear, pick A4, Letter, A5 or A3 with portrait, landscape or auto orientation, set margins, and convert. Download the finished PDF and it's ready to print or email.",
    "Accepts .jpg, .png and .webp up to 30MB each, 10 images per PDF. Images keep their proportions within the page; very large photos are re-encoded at your quality setting to keep the PDF reasonable in size.",
    "Turning receipts, scanned documents, ID cards, drawings and photo sets into single, printable files — for expense reports, school submissions, job applications and paperwork portals that accept only PDF."
  ),
  "image-to-ico": seo(
    "Image to ICO Converter – Multi-Size Icons",
    "Create a Windows .ico file with embedded sizes from 16 to 256px from any image. The favicon and app-icon maker for sites and apps — free, private, in-browser.",
    "image to ico converter",
    "The tool renders your image at each size you list and packs all renditions into a single multi-resolution .ico — the container format Windows shortcuts and browsers' favicon lookups expect. Smooth downsampling keeps small sizes legible, and the size list is editable if you need a custom set.",
    "Drop one image (PNG, JPG, WebP or SVG), edit the size list if needed — 16, 32, 48, 64, 128, 256 is the classic set — and convert. Download the .ico and reference it as your favicon or shortcut icon.",
    "Accepts .png, .jpg, .webp and .svg up to 30MB; single file per run; output is .ico. Square sources work best; non-square images are fitted into square frames. Very detailed logos may need simplification to read clearly at 16px.",
    "Website favicons with proper Windows support, desktop application icons, folder icons, and shortcut branding. Pair it with the Favicon Generator when you also want modern PNG favicon sizes for Apple and Android touch devices."
  ),
  "image-to-base64": seo(
    "Image to Base64 Encoder – Data URI Generator",
    "Encode images to Base64 strings or ready-to-paste data URIs for CSS, HTML and JSON embedding. Copy or download the text instantly — free, private, in-browser.",
    "image to base64",
    "The tool reads your image file's raw bytes and encodes them to Base64 text — either as a bare string or as a complete data: URI ready to paste into an img src or CSS background. Encoding is a pure byte transformation: decode it later and you get the identical file back.",
    "Drop one image, toggle the data-URI format on if you want the ready-to-use wrapper, and encode. Copy the output to your clipboard or download it as a .txt file.",
    "Accepts .jpg, .png, .webp, .gif and .svg up to 30MB; single file per run. Base64 inflates size by about 33%, so it shines for small icons and inline SVG — embedding large photos this way bloats documents and hurts caching.",
    "Inlining tiny logos and icons to eliminate extra HTTP requests, embedding images in single-file HTML emails or READMEs, passing images inside JSON APIs, and storing small graphics in stylesheets for offline tools."
  ),
  "base64-to-image": seo(
    "Base64 to Image Decoder – Paste & Preview",
    "Decode Base64 strings or data URIs back into viewable, downloadable images. Paste text or drop a .txt file — instant preview, free, private and fully local.",
    "base64 to image",
    "The decoder strips any data-URI prefix, validates the Base64, decodes the bytes, and detects the actual image type from magic numbers — so it works whether the payload is PNG, JPEG, WebP, GIF or something exotic. The decoded blob is previewed in-browser, never uploaded.",
    "Paste your Base64 text or data URI into the textarea (or drop a .txt file), and the image appears immediately. Confirm what it is, then download it as a properly named image file.",
    "Accepts any Base64 image payload pasted as text or a .txt file up to 30MB. Invalid or truncated Base64 is reported clearly rather than half-decoded. Output format matches whatever the bytes actually are.",
    "Extracting images from JSON API responses, reversing an image-to-base64 encoding, debugging data URIs found in CSS, recovering images from log files and single-file HTML documents, and inspecting what an embedded string really contains."
  ),
  "svg-to-png": seo(
    "SVG to PNG Converter – 1x–4x Sharp Export",
    "Rasterize SVG vectors to sharp PNG at 1x–4x scale. Perfect for icons, logos and print — free in-browser converter with PNG, JPG and WebP output options.",
    "svg to png",
    "The tool renders your SVG at a multiple of its intrinsic size — 1x through 4x — so vector edges stay razor sharp at the output resolution instead of being rasterized small and upscaled. You can also emit JPEG or WebP if the destination prefers a different format.",
    "Drop one .svg file, choose a scale factor and output format, and convert. The preview shows the rendered raster; download it and it's ready for anywhere vectors aren't accepted.",
    "Accepts .svg up to 30MB; single file per run; output is .png (default), .jpg or .webp. External references inside the SVG (remote images, web fonts) may not load during rasterization — inline your fonts for faithful output.",
    "Exporting icons and logos for app stores, creating @2x/@3x assets from a single vector, generating social-share images from SVG templates, and sending vector artwork to print shops that request raster files."
  ),
  "image-format-converter": seo(
    "Universal Image Converter – JPG, PNG, WebP",
    "A universal image converter for JPG, PNG and WebP — smart defaults, transparency handling and batch support. Free, private, no upload, mixed batches OK.",
    "universal image converter",
    "One tool for every direction: it decodes JPG, PNG, WebP, GIF, BMP, AVIF and SVG inputs, then re-encodes to whichever of JPG, PNG or WebP you choose — with a quality slider, a background color for flattening transparency, and batch support for mixed-format drops.",
    "Drop up to 10 images in any mix of formats, pick the target format and quality, set a background color for transparency, and convert. Every result previews before you download individually or as a ZIP.",
    "Accepts .jpg, .png, .webp, .gif, .bmp, .avif and .svg up to 30MB per file, 10 per batch. JPG output flattens transparency; PNG keeps it; WebP keeps it and compresses best. SVG rasterizes at its intrinsic size.",
    "The one bookmark for 'the file is in the wrong format': converting camera dumps, client hand-offs, stock downloads and screenshots into exactly what the next tool, platform or print shop demands — without installing anything."
  ),

  // Rotation
  "rotate-image": seo(
    "Rotate Image to Any Angle Online – Free",
    "Rotate images to any degree from -180° to 180° with background fill or auto-crop. Fine-tune tilts in single degrees — free, private, in-browser, instant.",
    "rotate image online",
    "Unlike fixed-turn tools, this one takes any angle: your image rotates on a live preview with fine-grained control, and you choose how corners are handled — auto-crop trims to the largest straight rectangle, while background fill (solid color or transparency) preserves the full frame.",
    "Drop up to 10 images, drag the angle slider while watching the preview, pick auto-crop or a fill background, choose an output format, then process and download.",
    "Accepts .jpg, .png and .webp up to 30MB each, 10 per batch. Non-90° angles require resampling, so a small amount of softness is normal; PNG output with transparent fill is the cleanest way to keep rotated corners.",
    "Leveling slightly tilted scans and photos, creative diagonal compositions, rotating text overlays, and preparing sprites for games. For exact quarter or half turns, the dedicated 90/180/270 tools are faster and skip the resampling step."
  ),
  "rotate-image-90": seo(
    "Rotate Image 90 Degrees Clockwise – Instant",
    "Rotate images 90 degrees clockwise instantly. Exact quarter-turn, re-encoded at high quality — batch up to 10, free, private, pixel-exact geometry.",
    "rotate image 90 degrees",
    "A 90° turn is a pure permutation of pixels — no interpolation and no resampling; the tool swaps rows for columns exactly, so width and height simply trade places. The rotated frame is then re-encoded at high quality (85), which keeps photos looking sharp while shrinking often-large camera files. Choose PNG output via the converter tools afterwards if you need a mathematically lossless copy.",
    "Drop up to 10 images and process — there's nothing to configure because a quarter turn has exactly one correct answer. Download results individually or as a ZIP.",
    "Accepts .jpg, .png and .webp up to 30MB each, 10 per batch; output dimensions are the input's height×width. EXIF orientation flags don't transfer, which is usually what you want after a manual correction.",
    "Fixing photos imported sideways from cameras and scanners, converting landscape shots to portrait for stories and print, and preparing mixed-orientation batches for a uniform layout. Geometry is pixel-exact and the high-quality re-encode is safe for everyday photo use."
  ),
  "rotate-image-180": seo(
    "Rotate Image 180 Degrees – Upside Down Fix",
    "Flip images fully upside down with an exact 180° rotation. High-quality output, instant results, completely private — batch of 10, nothing to configure.",
    "rotate image 180 degrees",
    "A 180° rotation mirrors the pixel grid both horizontally and vertically — a pure rearrangement with zero interpolation, leaving dimensions unchanged. The remapped frame is then saved at high quality (85); photos stay sharp, though the file is a fresh encode rather than a bit-for-bit copy of the original.",
    "Drop up to 10 images and process immediately — no options, no ambiguity. Download the corrected files one by one or together as a ZIP.",
    "Accepts .jpg, .png and .webp up to 30MB per file, 10 per batch. Output keeps the original width and height. Scanned negatives and documents occasionally carry their own rotation flags — this tool overrides them with real pixels.",
    "Righting photos scanned upside down, fixing upside-down webcam captures and phone imports, rotating document scans before OCR, and correcting film scans where the strip orientation got lost."
  ),
  "rotate-image-270": seo(
    "Rotate Image 270° – Counterclockwise Turn",
    "Rotate images 270° clockwise (90° counterclockwise). Exact quarter-turn the other way, re-encoded at high quality — batch of 10, free, private and instant.",
    "rotate image 270 degrees",
    "Rotating 270° clockwise is the same transformation as 90° counterclockwise — and like all quarter turns it's a pure pixel permutation: every pixel moves, none are resampled, and width and height swap. The result is saved at high quality, so photos stay sharp while the encoder keeps file sizes reasonable.",
    "Drop up to 10 images and hit process — the fixed angle means no settings. Results download individually or as a single ZIP for the batch.",
    "Accepts .jpg, .png and .webp up to 30MB each, 10 per run; output dimensions are height×width of the source. As with the other fixed rotators, no EXIF orientation metadata is written — the pixels themselves are correct.",
    "Portrait conversions the other direction, correcting scans that came in rotated the 'wrong' way, and matching mixed batches so all images share one orientation before layout or upload."
  ),
  "flip-image-horizontal": seo(
    "Flip Image Horizontally (Mirror) – Instant",
    "Mirror images left-to-right instantly with an exact horizontal flip. Great for selfies, artwork, designs and text-free photos — free, private, batch of 10.",
    "flip image horizontally",
    "A horizontal flip reflects every row of pixels around the vertical center line — a rearrangement with no resampling; dimensions stay identical and sharpness is preserved in the geometry. The mirrored frame is then re-encoded at high quality (85) to keep the saved file compact.",
    "Drop up to 10 images and process — one flip, zero settings. Download the mirrored results individually or as a ZIP.",
    "Accepts .jpg, .png and .webp up to 30MB each, 10 per batch. Text and logos become reversed (obviously) — avoid flipping images that contain readable words, or flip everything except the text layer in an editor.",
    "Fixing selfie mirroring, matching design mockups that assume a different composition direction, flipping game sprites to face the other way, and correcting scanned transparencies that came through backwards."
  ),
  "flip-image-vertical": seo(
    "Flip Image Vertically – Upside-Down Mirror",
    "Flip images top-to-bottom with a vertical mirror. Useful for scans, reflections and design work — instant, high quality, completely private, batch of 10.",
    "flip image vertically",
    "The vertical flip reflects each column of pixels around the horizontal center line. Like its horizontal sibling, it's a pure permutation — no interpolation, identical dimensions — and it's the correct fix for content that's mirrored rather than rotated. The flipped frame is saved at high quality to keep the output file lean.",
    "Drop up to 10 images and process instantly. Results download one by one or as a combined ZIP.",
    "Accepts .jpg, .png and .webp up to 30MB per file, 10 per batch. If your image is upside down rather than mirrored, a 180° rotation is the right tool — flipping and rotating differ exactly in this way.",
    "Correcting scanner output that mirrored transparencies, creating reflection effects for design work, flipping game tilemaps and sprite sheets, and preparing mirrored variants for print transfers that reverse during application."
  ),
  "straighten-image": seo(
    "Straighten Crooked Photos – ±15° Correction",
    "Straighten images with fine angle correction from -15° to +15° and smart zoom-fill that hides the corners. Fix tilted horizons right in your browser.",
    "straighten image",
    "You nudge the angle while watching a live preview; the tool rotates and, when zoom-fill is on, scales the image just enough that no empty corners show — the classic straighten-without-cropping-look. Small angles cost almost no quality because the resample is gentle.",
    "Drop one image, drag the angle slider in tenths of a degree until the horizon sits level in the preview, keep zoom-fill enabled for a full-bleed result, then process and download.",
    "Accepts .jpg, .png and .webp up to 30MB; single-image editing. Beyond about 5°, zoom-fill starts cropping noticeably into the frame — for bigger corrections, crop afterward or shoot straighter next time (easier said than done).",
    "The most common photo fix there is: sea horizons, architectural lines, scanned documents scanned slightly askew, and table-top product shots. One slider beats opening a heavyweight editor for a two-degree correction."
  ),
};
