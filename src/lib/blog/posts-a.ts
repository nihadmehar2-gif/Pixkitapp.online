/** Editorial guides, part A (1–4). See types.ts for the block model. */

import type { BlogPost } from "./types";

export const POSTS_A: BlogPost[] = [
  {
    slug: "reduce-photo-size-for-online-forms",
    title: "How to Reduce a Photo's Size for Online Forms (Without Ruining It)",
    description:
      "Upload limits on government, exam and job forms explained — hit any KB cap with the right target, dimensions and format, entirely in your browser.",
    date: "2026-11-27",
    topic: "Guides",
    blocks: [
      {
        type: "p",
        text: "Few things stall an application quite like the upload field that rejects your photo for being 'too large'. Government portals, university admission systems, recruitment sites and visa applications almost all enforce file-size ceilings — commonly 50KB, 100KB, 200KB or 500KB — and the rejection message rarely explains how to fix the picture. The good news: shrinking a photo is a two-minute job once you understand what the size limit actually measures and which lever (quality, dimensions, format) moves the number most.",
      },
      {
        type: "p",
        text: "This guide walks through the whole process on this site, and every tool mentioned runs entirely inside your browser tab. Your photo — including sensitive documents like ID scans and mark sheets — is never uploaded anywhere; processing happens on your own device and the finished file lands directly in your downloads folder.",
      },
      { type: "h2", text: "Why upload limits exist (and what they check)" },
      {
        type: "p",
        text: "A size cap looks arbitrary but it is just storage and bandwidth arithmetic. A portal that receives 100,000 applications a year, each carrying a 4MB camera photo, has to move and store hundreds of gigabytes it does not need — a 100KB photo does the same job for a fraction of that. The validator on the form checks one thing: the byte size of the file you attach. It does not care how many pixels the image has, only how many bytes it occupies on disk.",
      },
      {
        type: "p",
        text: "That distinction matters because it defines the fix. A photo's byte size is driven by three things: its pixel dimensions (a 4000×3000 image holds 12 million pixels to describe), its encoding quality (how aggressively the JPEG or WebP encoder discarded invisible detail), and its format (PNG stores every pixel losslessly and is huge for photos; JPEG and WebP store what the eye needs). To pass a KB cap you adjust these levers — you do not need to 'reduce quality' in the vague sense, you need the right combination of dimensions and encoding for the target.",
      },
      { type: "h2", text: "Step 1 — Read the form's exact requirement" },
      {
        type: "p",
        text: "Before touching any tool, note down exactly what the form demands. There are usually three separate numbers hiding in the fine print: a maximum file size ('photo must be under 100KB'), sometimes a minimum file size ('between 20KB and 100KB' — some systems reject tiny files as corrupt), and often required pixel dimensions ('200×230 pixels' for signatures is a classic Indian exam-portal spec, '600×600 pixels' for US passport uploads). Write them down. It is remarkably easy to fix the wrong number and still fail — compressing a photo that was actually rejected for its dimensions.",
      },
      {
        type: "callout",
        text: "If the form says 'up to 100KB', aim a little below it — 90–95KB leaves room for any server-side rounding. If it gives a range, aim for the middle of the range rather than scraping the floor.",
      },
      { type: "h2", text: "Step 2 — Pick the matching target tool" },
      {
        type: "p",
        text: "PixKitApp has a compressor for each of the common ceilings, plus one for arbitrary numbers. They all work the same honest way: the tool encodes your image, measures the true output size, steps the quality down only as far as needed, and reports the achieved size on the result card. None of them will silently hand you an oversized file.",
      },
      {
        type: "tools",
        intro: "Match the form's cap to the tool — or use the custom-target compressor for anything else:",
        slugs: [
          "compress-image-to-50kb",
          "compress-image-to-100kb",
          "compress-image-to-200kb",
          "compress-image-to-500kb",
          "compress-image-to-specific-size",
        ],
      },
      { type: "h2", text: "Step 3 — Get the dimensions right first" },
      {
        type: "p",
        text: "Byte targets and pixel targets interact. Squeezing a 12-megapixel camera photo into 50KB forces brutal quality cuts because the compressor has to describe 12 million pixels with 50 kilobytes of data. Resize the photo to a sensible dimension first and the same byte budget suddenly spreads comfortably — faces stay crisp, text stays readable.",
      },
      {
        type: "table",
        caption: "Dimension guidance by target size",
        headers: ["Byte target", "Suggested long edge", "Notes"],
        rows: [
          ["50KB", "800–1200px", "Signature scans and headshots fit cleanly; dense photos soften"],
          ["100KB", "1000–1600px", "The application-photo sweet spot — faces and small text stay sharp"],
          ["200KB", "1600–2400px", "Comfortable; most photos lose nothing visible"],
          ["500KB", "2000px and up", "Near-original quality for web use"],
        ],
      },
      {
        type: "p",
        text: "If the form prescribes exact pixel dimensions, crop and resize to them first — the Resize tools take an exact width and height, and the Crop tools handle the aspect ratio. Then compress to the byte target.",
      },
      {
        type: "tools",
        intro: "Dimension and crop tools referenced above:",
        slugs: ["resize-image-to-dimensions", "crop-image", "image-resizer"],
      },
      { type: "h2", text: "Step 4 — Choose JPG or WebP deliberately" },
      {
        type: "p",
        text: "At tight byte targets the output format changes what survives. JPEG degrades gracefully on photographs but shows blocky artifacts around sharp text and lines. WebP usually fits the same image with more visible detail per kilobyte, which makes it the better choice for screenshots, signatures and scanned documents — provided the receiving portal accepts .webp uploads. When a form strictly requires .jpg, use JPEG output; when it accepts either, try both and compare the previews. The difference at 50–100KB is often easy to see.",
      },
      { type: "h2", text: "Common mistakes that cause rejections" },
      {
        type: "ul",
        items: [
          "Compressing an already-compressed screenshot instead of the original file — every generation stacks softness, and you may also inherit a size floor from previous artifacts.",
          "Renaming a file to .jpg when the portal rejects .png — the bytes stay PNG and many validators check the real format, not the extension. Convert properly instead.",
          "Flattening a transparent PNG onto JPEG output without noticing — the background becomes solid white or black, which occasionally gets photos rejected for 'wrong background'. Flatten deliberately onto the colour the form expects.",
          "Checking the file size in the file manager instead of on the tool's result card — the card shows the exact achieved size before you download, so you can re-run immediately if it is off.",
        ],
      },
      { type: "h2", text: "A worked example" },
      {
        type: "p",
        text: "Suppose a job portal wants a passport-style photo 'under 100KB, roughly 3.5×4.5cm proportion'. The file is a 3MB phone photo at 3000×4000 pixels. The path: crop to the right proportion (3.5:4.5) so the face fills the frame the way passport photos do, resize the long edge to about 1400px so the byte budget has room, then compress to 100KB with WebP output if the portal allows it — or JPEG if it insists on .jpg. The result card confirms the size, you download, and the upload passes on the first try. Total time: about two minutes, entirely on your device.",
      },
      {
        type: "related",
        slugs: ["jpg-vs-png-vs-webp-which-format-to-use", "passport-photo-size-guide"],
      },
    ],
  },

  {
    slug: "jpg-vs-png-vs-webp-which-format-to-use",
    title: "JPG vs PNG vs WebP: Which Image Format Should You Actually Use?",
    description:
      "A plain-language comparison of JPEG, PNG and WebP — compression, transparency, text sharpness and file size — so every export decision takes seconds.",
    date: "2026-11-27",
    topic: "Formats",
    blocks: [
      {
        type: "p",
        text: "Every image task ends with the same quiet decision: which format to save as. Pick wrong and the file is either five times bigger than it needs to be, or a crisp logo grows fuzzy edges, or a transparency turns into an ugly white box. The choice is genuinely simple once you understand what each format stores — and this guide explains it without the folklore.",
      },
      { type: "h2", text: "The one-sentence version" },
      {
        type: "p",
        text: "JPEG for photographs, PNG for graphics that need sharp edges or transparency, WebP when you want both worlds in one smaller file. Everything else in this article is detail supporting that rule, plus the exceptions where it bends.",
      },
      { type: "h2", text: "JPEG — the photograph format" },
      {
        type: "p",
        text: "JPEG (file extension .jpg or .jpeg) is a lossy format designed around how human vision works. The encoder discards detail your eye barely registers — subtle colour shifts, high-frequency texture — and keeps the structure the eye cares about. That is why a photo saved at quality 80 can weigh a tenth of its PNG equivalent and still look identical at arm's length. It is also why JPEG is a bad match for graphics: the same discarding process produces visible 'mosquito noise' around sharp edges and small text, which is why screenshots saved as JPEG look slightly dirty compared to the PNG original.",
      },
      {
        type: "ul",
        items: [
          "Use JPEG for: photos, scanned documents, marketplace listings, anything continuous-tone.",
          "Avoid JPEG for: screenshots with text, logos, line art, and anything requiring transparency — JPEG has no alpha channel, so transparent areas flatten onto a solid colour.",
          "Watch out for: generation loss. Every re-save re-encodes the whole image, so keep the original for future edits.",
        ],
      },
      { type: "h2", text: "PNG — the graphics format" },
      {
        type: "p",
        text: "PNG is lossless: every pixel is stored exactly, and transparency is part of the specification. That makes it the only correct choice for logos, icons, screenshots, charts and pixel art — formats where a single blurred edge is a defect. The cost is size: because nothing is discarded, a photographic PNG weighs several times more than the same photo as JPEG. PNG does have a trick for flat graphics — palette reduction, where an image is limited to 256 or fewer colours — which is exactly what the PNG compressor on this site does: screenshots and logos shrink dramatically with palette reduction, while photos barely change because they contain thousands of natural colours.",
      },
      {
        type: "ul",
        items: [
          "Use PNG for: logos, screenshots, UI assets, images with transparency, text-heavy graphics.",
          "Avoid PNG for: photographs destined for the web or email — the file is needlessly large.",
          "Watch out for: photos saved as PNG by editing software. Convert them to JPEG or WebP and the same picture travels for a fraction of the bytes.",
        ],
      },
      { type: "h2", text: "WebP — the modern middle ground" },
      {
        type: "p",
        text: "WebP is Google's format, and every current browser supports it. Its selling point is efficiency: at the same visual quality a WebP file is typically 25–35% smaller than the JPEG equivalent, and it supports transparency and lossless modes too — one format that covers most of what JPEG and PNG each do, smaller. The trade-offs are compatibility at the edges (some older desktop applications, some government upload validators, some printer drivers) and the fact that support outside browsers — photo editors, operating system previews — is still uneven in places. A practical pattern: publish to the web as WebP, keep JPEG copies when a form or person specifically asks for .jpg, and convert freely between the two when needs change.",
      },
      {
        type: "tools",
        intro: "Conversions between the three formats take one click and run locally:",
        slugs: ["png-to-jpg", "jpg-to-png", "png-to-webp", "jpg-to-webp", "webp-to-jpg", "webp-to-png"],
      },
      { type: "h2", text: "Decision table" },
      {
        type: "table",
        caption: "What to save, by situation",
        headers: ["Situation", "Best format", "Why"],
        rows: [
          ["Photo for a website or listing", "WebP, JPEG second", "Smallest file at the same visible quality"],
          ["Upload form demanding .jpg", "JPEG", "Validator checks the real format, not the name"],
          ["Logo or icon with transparency", "PNG or WebP", "Both keep alpha; PNG is the safest default"],
          ["Screenshot for documentation", "PNG", "Text stays pixel-sharp; JPEG blurs small letters"],
          ["Photo for a 50–100KB upload cap", "WebP if allowed, else JPEG", "WebP keeps more detail per byte at tight targets"],
          ["Image attached to an email to a stranger", "JPEG", "Universal compatibility, no surprises"],
        ],
      },
      { type: "h2", text: "Two honest footnotes" },
      {
        type: "p",
        text: "First, AVIF exists — a newer format that compresses even better than WebP and is now supported by all major browsers, though tooling around it remains thinner. This site converts out of AVIF (for example Avif to JPG) because receiving systems are still far more likely to accept the older formats. Second, 'quality' numbers are not comparable across formats: WebP quality 80 looks roughly like JPEG quality 85–90, so copying slider values between formats misjudges results. Always judge by the preview, not the number.",
      },
      {
        type: "related",
        slugs: ["convert-avif-webp-modern-formats", "optimize-images-for-websites", "reduce-photo-size-for-online-forms"],
      },
    ],
  },

  {
    slug: "passport-photo-size-guide",
    title: "Passport & Visa Photo Size Guide: Every Common Spec, Correctly Framed",
    description:
      "US passport, Schengen visa, China visa and 1-inch ID photo specifications explained — exact sizes, framing rules and how to prepare compliant photos privately.",
    date: "2026-11-27",
    topic: "Photos",
    blocks: [
      {
        type: "p",
        text: "Identity photographs are the most standardised images most people ever produce — and the specifications are strict because automated face-matching systems compare your photo against your face at border control. This guide collects the sizes people most often ask about, explains the framing rules that actually get photos rejected, and shows how to prepare a compliant file on this site without sending your face to any server. One warning applies to everything below: requirements are set by issuing authorities and do change — treat this page as orientation and the authority's own page as the binding source before you submit.",
      },
      { type: "h2", text: "US passport photo" },
      {
        type: "p",
        text: "The US Department of State specifies a 2×2 inch (51×51 mm) photograph. For digital submissions the accepted size is 600×600 pixels or larger; printed photos must measure exactly 2×2 inches, which at 300 DPI equals 600×600 pixels. The head must measure roughly 1–1⅜ inches (25–35 mm) from chin to crown, centred in the frame. The background must be plain white or off-white, the photo taken within the last six months, and the expression neutral with both eyes open. Glasses are no longer permitted in US passport photos.",
      },
      {
        type: "tools",
        intro: "Prepare the US spec and print sheets locally:",
        slugs: ["us-passport-photo", "passport-photo-maker", "photo-print-sheet"],
      },
      { type: "h2", text: "Schengen visa photo" },
      {
        type: "p",
        text: "Schengen-area visa applications (most of Europe) use the ICAO-standard 35×45 mm photograph. The face must occupy about 70–80% of the frame height — roughly 32–36 mm from chin to crown — on a light, plain background. The photo must be recent, in focus, printed on photo-quality paper if submitted physically, and show the full face without sunglasses, head coverings (with documented religious exceptions) or shadows across the face. Because 35×45 mm does not correspond to a round pixel count, the practical approach is to crop to the proportion and let the tool size the file at print resolution.",
      },
      {
        type: "tools",
        intro: "Crop a photo to the Schengen spec:",
        slugs: ["schengen-visa-photo"],
      },
      { type: "h2", text: "China visa photo" },
      {
        type: "p",
        text: "The Chinese visa photo specification is 33×48 mm, a slightly taller frame than the Schengen standard, again on a plain white background with the face occupying the majority of the frame. Online application systems commonly request the photo as a JPG between 40KB and 120KB — a rare case where a visa photo has an explicit byte ceiling, which pairs the passport tools with the compressors described in our upload-limits guide.",
      },
      {
        type: "tools",
        intro: "Crop a photo to the China visa spec:",
        slugs: ["china-visa-photo"],
      },
      { type: "h2", text: "One-inch ID photo (Chinese 1寸 standard)" },
      {
        type: "p",
        text: "The 1-inch ID photo is a common requirement for Chinese applications, student records and personnel files. At 300 DPI it measures 295×413 pixels (25×35 mm). The same framing rules apply — plain background, face filling most of the frame, even lighting — and because the spec is a fixed pixel size, the tool can output the file at exactly 295×413 without any resampling ambiguity.",
      },
      {
        type: "tools",
        intro: "Produce a 1-inch ID file at the exact pixel size:",
        slugs: ["id-photo-1-inch"],
      },
      { type: "h2", text: "The rules that actually cause rejections" },
      {
        type: "p",
        text: "Across every jurisdiction, the rejection reasons repeat. Lighting and shadow cause more failures than size: a face half-lit by a window, or a hard shadow line across the background, fails automated checks. Framing comes second — a head too small in the frame (common when people hold the camera at arm's length) or cropped so the chin or hairline is cut. Glasses now fail for US passports; reflections in lenses fail elsewhere. Expressions must be neutral — smiling photographs are formally non-compliant in several systems even though they feel friendlier. And the background must be genuinely plain: a wall with texture, a door frame, or another person's shoulder edge all count as failures.",
      },
      {
        type: "table",
        caption: "Quick reference",
        headers: ["Document", "Photo size", "Digital size", "Background"],
        rows: [
          ["US passport", "2×2 in (51×51 mm)", "600×600px or larger", "White / off-white"],
          ["Schengen visa", "35×45 mm", "Crop to 35:45 proportion", "Light, plain"],
          ["China visa", "33×48 mm", "Commonly 40–120KB JPG", "White"],
          ["1-inch ID (1寸)", "25×35 mm", "295×413px at 300 DPI", "Plain, usually white or blue"],
        ],
      },
      {
        type: "callout",
        text: "Specifications change and national systems enforce their own edge cases. Before any submission, confirm the current requirement on the issuing authority's website — the tools here prepare the file, but the authority defines what passes.",
      },
      { type: "h2", text: "How to shoot an acceptable photo at home" },
      {
        type: "ol",
        items: [
          "Stand 0.5–1 m from a plain, evenly lit background, facing a window or diffuse light so the face casts no shadow on the wall.",
          "Have someone shoot at eye level (or prop the phone accordingly) with the full head plus a little shoulder visible.",
          "Keep a neutral expression, both eyes open, no glasses, no head covering unless worn daily for religious reasons.",
          "Open the passport tool for your document type, load the photo, and follow the on-screen head guides — they implement the size proportions above.",
          "Download the result, and for byte-capped systems run it through the matching compressor (see the forms guide) before uploading.",
        ],
      },
      {
        type: "related",
        slugs: ["reduce-photo-size-for-online-forms", "strip-image-metadata-privacy"],
      },
    ],
  },

  {
    slug: "strip-image-metadata-privacy",
    title: "What Your Photos Really Reveal: Finding and Stripping Hidden Metadata",
    description:
      "EXIF, GPS and PNG metadata explained — what a photo leaks, how to inspect it in seconds, and how to produce a clean copy without losing the original.",
    date: "2026-11-27",
    topic: "Privacy",
    blocks: [
      {
        type: "p",
        text: "Every photo you take is two files in one: the visible picture, and a layer of embedded text describing how it was made. The technical name is metadata — EXIF in JPEGs, chunk data in PNGs — and it routinely includes the camera model, lens, exact timestamp, exposure settings, sometimes serial numbers, and, when location services are on, precise GPS coordinates. Post a photo straight from your camera roll and you may be publishing your home address, your workplace, or your child's school schedule without a single word of text.",
      },
      { type: "h2", text: "What kind of data hides in a photo" },
      {
        type: "p",
        text: "A typical smartphone JPEG carries dozens of EXIF fields. The harmless ones describe the picture: width, height, orientation, colour space. The sensitive ones describe you: the GPS block stores latitude and longitude to several decimal places — precise enough to identify a building; the timestamp records the exact second of capture; the Make and Model fields name your exact device, which is occasionally useful to attackers correlating accounts. Camera originals are the risky files. Screenshots are naturally clean, and most social platforms strip location data on upload — but the original file on your device, and any file you email or share directly, carries everything.",
      },
      {
        type: "callout",
        text: "The fastest way to know what a specific file reveals: open it in the Metadata Viewer on this site. It decodes EXIF, GPS records and PNG chunks entirely in your browser — the file never leaves your device, which matters when you are checking exactly the files you would not want to upload anywhere.",
      },
      {
        type: "tools",
        intro: "The three metadata tools referenced in this guide:",
        slugs: ["image-metadata-viewer", "remove-image-metadata", "remove-gps-data"],
      },
      { type: "h2", text: "Inspect before you share" },
      {
        type: "p",
        text: "Make the inspection a habit with a fixed routine. Before posting or sending any camera original: open the Metadata Viewer, read what is attached, and pay specific attention to three fields — GPS coordinates (presence matters more than the numbers), the capture timestamp, and the camera model. You will often find the camera and lens recorded even when GPS is absent, and a precise timestamp can be more revealing than people expect: a photo 'from the garden' timestamped 14:32 on a weekday tells a reader where you were at that hour.",
      },
      { type: "h2", text: "Strip selectively or completely" },
      {
        type: "p",
        text: "There are two levels of cleanup, and choosing between them is the practical decision. Remove GPS Data deletes only the location records and leaves the rest of the EXIF intact — the right choice when you want to keep the camera settings and capture time (photographers use this constantly for publishing) but are sharing somewhere the location would be sensitive: a new home, a hotel, a school event. Remove Metadata re-encodes a clean copy with the metadata layer stripped entirely — the choice for classified ads, marketplace listings, public profiles and anything where you want the file to carry the picture and nothing else.",
      },
      {
        type: "table",
        caption: "Which cleanup for which situation",
        headers: ["Situation", "Use", "What survives"],
        rows: [
          ["Posting a photo taken at home or work", "Remove GPS Data", "Camera settings and timestamps — location gone"],
          ["Marketplace or classified listing", "Remove Metadata", "Nothing but the pixels"],
          ["Sharing kids' school or sports photos", "Remove Metadata", "Nothing but the pixels — safest default"],
          ["Photography portfolio", "Remove GPS Data (or nothing)", "EXIF craft data if you want it public"],
          ["Legal or journalistic evidence", "Nothing — consult the process owner", "Metadata can be evidence; stripping destroys it"],
        ],
      },
      { type: "h2", text: "Verify the result, keep the original" },
      {
        type: "p",
        text: "Cleanup only counts if you verify it. After stripping, run the cleaned file through the Metadata Viewer again and confirm it reports nothing — the tools read your file and write a new one, so the check takes seconds and turns 'should be clean' into 'is clean'. Then file management: keep the original untouched in your archive rather than overwriting it, because the original carries the camera settings you may want later, and because a process that strips data is a one-way door — you cannot put GPS coordinates back after deleting them if you later need them.",
      },
      { type: "h2", text: "Limits worth knowing" },
      {
        type: "ul",
        items: [
          "Stripping metadata changes the file's bytes, which invalidates any cryptographic signature the original had — relevant in evidentiary contexts, irrelevant for social sharing.",
          "Visible content can still be identifying: a house number in frame, a street sign, a reflected screen. Metadata removal does not blur the picture — that is a cropping or editing job.",
          "Some platforms re-compress uploads anyway, stripping metadata on their side. Do not rely on it — the platform's stripping is their policy, not your control.",
          "PDFs and documents carry their own metadata layers; this guide covers images, which are the commonest accidental leak.",
        ],
      },
      {
        type: "related",
        slugs: ["reduce-photo-size-for-online-forms", "jpg-vs-png-vs-webp-which-format-to-use"],
      },
    ],
  },
];
