/**
 * Page-specific depth content (intro / comparison table / common mistakes)
 * for the near-duplicate clusters identified in the November 2026 audit:
 * the KB-target compressors, the fixed-angle rotators, the format resizers
 * and the BMP conversions.
 *
 * RULES for this file (content-differentiation requirement):
 *   - Every string must be specific to ITS page. No sentence may be reused
 *     between two tools; shared mechanics are described in different words
 *     with different examples.
 *   - Every claim must be true of the actual implementation (see the
 *     corresponding processor in src/lib/tools/processors/): the compressors
 *     run an encode-measure-adjust quality-search loop; rotations happen at
 *     90-degree multiples without resampling and re-encode at quality 85;
 *     BMP output is a 24-bit bitmap written by the in-browser encoder with
 *     transparency flattened onto a chosen background; the resizers scale by
 *     width with an optional aspect lock and a per-format quality control.
 *   - Tables stay qualitative or cite the same guidance as the page's own
 *     FAQ — no invented benchmark numbers.
 */

import { ToolSeoExtras } from "../types";

export const SEO_EXTRAS: Record<string, ToolSeoExtras> = {
  /* ---------------- Compression: KB-target family ---------------- */

  "compress-image-to-50kb": {
    intro:
      "Fifty kilobytes is one of the smallest targets still useful for photographs, and it is unforgiving: a 4000×3000 camera photo squeezed into 50KB has to lose most of its fine detail, while a small headshot or a scan of a signature fits comfortably. That difference is why this tool searches for a quality level instead of using a fixed one — it measures what your actual picture can survive. The result is the sharpest file that passes a 50KB ceiling, rather than a blurry output from an overly aggressive preset. Because the whole search runs locally, ID scans and certificates needed for official forms never leave your device.",
    table: {
      caption: "What to expect at the 50KB target",
      headers: ["Source image", "Realistic approach", "Typical outcome"],
      rows: [
        ["Portrait or signature scan, ≤1500px long edge", "Compress directly, JPG output", "Fits with clean detail; text stays readable"],
        ["Phone photo, 2000–4000px long edge", "Resize to ~800–1200px first, then compress", "Acceptable sharpness for avatars and small prints"],
        ["Dense photo or screenshot with tiny text", "WebP output, or crop away unneeded areas", "Fits, but fine text may soften — check the preview"],
        ["Already under 50KB", "Passes through with minimal re-encoding", "Essentially unchanged"],
      ],
    },
    mistakes: [
      {
        problem: "Compressing a 12-megapixel original straight to 50KB",
        fix: "The quality search has to cut so hard that the picture turns mushy. Resize the image to roughly 800–1200px on the long edge first (the Resize tools do this in one step), then compress — the 50KB budget then spreads over fewer pixels and faces stay sharp.",
      },
      {
        problem: "Assuming the tool will exceed the limit if needed",
        fix: "It never does — if the target cannot be met at a usable quality, the tool reports it instead of silently handing you an oversized file. If that happens, reduce dimensions or switch the output format and run it again.",
      },
      {
        problem: "Using JPG for graphics with sharp edges",
        fix: "At tiny sizes, JPEG's block artifacts show up fastest around text and lines. For screenshots, logos and signature scans, compare the WebP output — per byte it usually keeps edges cleaner at 50KB.",
      },
      {
        problem: "Re-compressing an already tiny image repeatedly",
        fix: "Every pass is a fresh generation and stacks softness. Compress once from the original; if you need a different size, go back to the source file rather than re-running the output.",
      },
    ],
  },

  "compress-image-to-100kb": {
    intro:
      "A 100KB ceiling is the classic threshold for application portals: exam forms, recruitment sites, scholarship submissions and ticket bookings commonly refuse anything larger, yet they still want a photo a human can read. This tool is built around that exact balance. Its quality search measures your file after each encoding round, so the output lands just under the cap with as much detail as the budget allows — and since 100KB is roomier than 50KB, a reasonably sized photo keeps faces and small print crisp. Nothing is uploaded during any of it, which matters when the image is a scanned ID or mark sheet.",
    table: {
      caption: "How 100KB compares with the neighbouring targets",
      headers: ["Target", "Best suited for", "Dimension guidance", "Quality outcome"],
      rows: [
        ["50KB", "Strictest portals, avatars", "~800–1200px long edge", "Usable, visible softness on big originals"],
        ["100KB (this page)", "Exam/job application photos", "~1000–1600px long edge", "Faces and small text stay crisp"],
        ["200KB", "Forms plus marketplace photos", "~1600–2400px long edge", "Comfortable, rarely distinguishable"],
        ["500KB", "Email, blogs, listings", "~2000px+ long edge", "Near-original for most photos"],
      ],
    },
    mistakes: [
      {
        problem: "Submitting a portrait cropped too tightly",
        fix: "Portals that accept 100KB photos usually also prescribe dimensions (for example 200×230 pixels for signature files). Crop to the required aspect ratio first with the Crop tool, then compress — a correctly framed image both passes validation and looks right at small sizes.",
      },
      {
        problem: "Letting the browser upscale a small scan",
        fix: "Compression cannot add detail. If your scan is already small and slightly soft, compressing harder only makes it worse; keep dimensions as they are and accept the file, or rescan at a higher setting.",
      },
      {
        problem: "Ignoring the format choice",
        fix: "The tool offers JPG and WebP because at fixed byte targets they behave differently: JPEG degrades gracefully on photographs, WebP usually keeps more visible detail per kilobyte. If the portal accepts either, try WebP first and compare previews.",
      },
      {
        problem: "Checking size after download instead of on the result card",
        fix: "The result card reports the exact final size before you download. Read it there — if a file came in well under 100KB, the search left quality on the table and you can afford slightly larger dimensions in the next run.",
      },
    ],
  },

  "compress-image-to-200kb": {
    intro:
      "200KB sits in the practical middle: large enough that photos keep essentially all of their visible quality, small enough to clear the caps on college application portals, classified-ad listings, forums and many email systems. For most phone pictures the quality search finishes at a high encoding level — the megabytes shrink while the pixels stay. This is also the first target where dimension guidance relaxes: you rarely need to pre-resize, and text-heavy screenshots survive cleanly. Sellers on marketplace sites use this target daily because product photos pass upload validation without looking cheap.",
    table: {
      caption: "Choosing between the mid-size targets",
      headers: ["Situation", "Pick", "Why"],
      rows: [
        ["Form field says 'max 200KB'", "This tool", "Exact match to the cap — the search stops just under it"],
        ["Form says 'under 1MB' but you want speed", "200KB", "Quarter the size, no visible loss on typical photos"],
        ["Listing site with 5MB limit", "Near-lossless compressor", "Keeps maximum quality when no hard cap binds you"],
        ["Photo must also print well", "200KB with ≥2000px dimensions", "Enough bytes for screen use; printing needs the original"],
      ],
    },
    mistakes: [
      {
        problem: "Treating 200KB as a quality loss you must accept",
        fix: "At this budget most 12–24 megapixel photos land at high encoding quality with no difference you can spot at normal viewing sizes. If the preview does look soft, the likely cause is extreme source dimensions — resize to around 1600–2400px on the long edge and run again.",
      },
      {
        problem: "Uploading screenshots with tiny UI text",
        fix: "Dense screenshots need bytes for sharp text. At 200KB they usually fit, but if small labels blur, switch the output to WebP — its per-byte efficiency preserves fine text better than JPEG at the same size.",
      },
      {
        problem: "Compressing a PNG logo straight to JPG",
        fix: "Opaque logos convert fine, but if the logo sits on transparency, JPEG fills the background with a solid colour. Flatten onto the intended background first (Add Background Color), or keep PNG output where the tool offers it.",
      },
      {
        problem: "Bundling ten photos and expecting uniform quality",
        fix: "The search optimises each file independently, so results show different final sizes. Check each result card; if one photo fell unusually far below the cap, that image simply needed less — nothing is wrong with it.",
      },
    ],
  },

  "compress-image-to-500kb": {
    intro:
      "By 500KB the trade-off almost disappears: this is a roomy target where the compressor's job is mostly to shed megabytes, not detail. Most 12–24 megapixel photos re-encode at a quality level high enough that side-by-side comparison with the original shows no visible difference — which is exactly why 500KB is the favourite ceiling for blog hero images, real-estate listings and marketplace photos. Pages also load faster: three 500KB images instead of three 4MB ones cut megabytes of transfer per visitor. The quality-search loop still runs the same measured way — you get the best-looking file that fits, not a fixed preset.",
    table: {
      caption: "Where 500KB lands for common photo sizes",
      headers: ["Source", "Typical handling at 500KB", "Visible change"],
      rows: [
        ["Smartphone photo, 8–16MP", "High quality, often minor dimension headroom left", "None at normal viewing"],
        ["High-res camera photo, 24MP+", "High quality; resize to ~2000px only if the preview looks soft", "None to slight, zoomed in"],
        ["Already-compressed JPG under 500KB", "Minimal re-encoding or pass-through", "None"],
        ["Large PNG graphic", "Consider WebP or JPG output for the biggest savings", "Edges stay clean; transparency flattens on JPG"],
      ],
    },
    mistakes: [
      {
        problem: "Expecting 500KB output to be print-quality",
        fix: "It is a web-and-email target. A 500KB file looks flawless on screens but carries a fraction of the data a print shop wants. Keep your original for printing and treat the 500KB copy as the distribution version.",
      },
      {
        problem: "Sending 500KB photos through a 100KB-capped portal",
        fix: "The targets exist separately for a reason: when a form names a smaller cap, use the matching tool (or Compress to Exact KB) instead of hoping the reviewer tolerates an oversized upload.",
      },
      {
        problem: "Re-saving the 500KB output over and over",
        fix: "Every generation stacks softness even at high quality. Download once from this tool; if you need another size later, start from the original again.",
      },
      {
        problem: "Compressing transparent PNGs to JPG",
        fix: "JPEG has no alpha channel, so transparency is flattened — usually onto white or black. Choose WebP output to keep transparency, or flatten deliberately onto the right background colour before converting.",
      },
    ],
  },

  "compress-image-to-specific-size": {
    intro:
      "Upload forms love arbitrary numbers: 75KB for a signature, 120KB for a badge photo, 300KB for a product shot, 1MB for a portfolio piece. Retrying a fixed preset against those caps is trial-and-error; this tool turns the target itself into the input. Type the exact kilobyte figure, and the quality search narrows in on the largest quality value that still fits — the same measured loop the other compressors use, but aimed at whatever number the form demands. Combined with the two KB presets it covers the whole range: use the presets for the common ceilings and this tool for everything else.",
    table: {
      caption: "Picking a target that will actually pass validation",
      headers: ["Form language", "Safe target to enter", "Note"],
      rows: [
        ["'Maximum 100KB'", "100", "The search guarantees at-or-under; the preset page works identically"],
        ["'Around 150KB' / 'up to 150KB'", "140–150", "Staying slightly under avoids rounding surprises on the portal"],
        ["'Between 50KB and 100KB'", "75–95", "Some systems reject files that are too small, too — read both bounds"],
        ["'1MB or less'", "1000", "Enter KB, not MB — 1MB equals 1000KB in this tool's units"],
      ],
    },
    mistakes: [
      {
        problem: "Entering megabytes into a kilobyte field",
        fix: "The number field reads kilobytes, so a '1MB' requirement means 1000. Entering 1 produces a 1KB file — instantly caught because the result card shows the achieved size.",
      },
      {
        problem: "Chasing an extreme target like 10KB",
        fix: "Below roughly 20KB a detailed photo must lose visible quality no matter the codec. Resize the dimensions down first — fewer pixels at the same byte budget look far better than heavy compression across many pixels.",
      },
      {
        problem: "Ignoring which side of the range your portal checks",
        fix: "Some validators enforce a minimum too (files that are 'too small' get rejected as corrupt). When a range is stated, aim for its middle rather than scraping the floor.",
      },
      {
        problem: "Testing with the wrong copy of the image",
        fix: "Always compress from your original. A file that has already been compressed, screenshotted or re-saved has lost the detail this tool would otherwise preserve.",
      },
    ],
  },

  /* ---------------- Rotation: fixed-angle family ---------------- */

  "rotate-image-90": {
    intro:
      "The sideways phone photo is the single most common rotation problem — a portrait shot lands landscape because the camera was held vertically and the file's pixels are stored that way. This tool performs the quarter turn clockwise: an exact 90° rotation that swaps width and height and moves every pixel to its new position without resampling, so nothing is interpolated and no sharpness is invented or lost by the rotation itself. The frame is then re-encoded at high quality (85) to produce the finished file. Batch mode handles up to ten sideways photos in one pass, which is how most camera dumps get fixed in seconds.",
    table: {
      caption: "Choosing the right correction for a sideways photo",
      headers: ["How the photo looks now", "Use", "Result"],
      rows: [
        ["Top of the scene points right", "Rotate 90° clockwise (this page)", "Upright; dimensions swap to portrait"],
        ["Top of the scene points left", "Rotate 270° (90° counterclockwise)", "Upright; dimensions swap to portrait"],
        ["Completely upside down", "Rotate 180°", "Upright; dimensions unchanged"],
        ["Slightly tilted horizon (a few degrees)", "Straighten Image", "Fine angle correction with edge crop"],
        ["Mirrored left-to-right (text backwards)", "Flip Horizontal", "Mirror correction — not a rotation problem"],
      ],
    },
    mistakes: [
      {
        problem: "Rotating twice instead of using the opposite direction",
        fix: "Turning a left-leaning photo clockwise 90° puts it upside down, not upright. If the first guess was wrong, undo by going back to the original and using Rotate 270° — stacking corrections on an already re-encoded file costs another generation.",
      },
      {
        problem: "Expecting the file's EXIF orientation tag to fix itself",
        fix: "Some viewers auto-rotate using the embedded orientation flag, which is why a photo looks right in one app and sideways in another. This tool rotates the actual pixels, so the result is upright everywhere — the honest, permanent fix.",
      },
      {
        problem: "Using 180° for a sideways photo",
        fix: "A quarter turn and a half turn are different corrections: 180° keeps the dimensions, 90° swaps them. If the photo ends up flipped vertically, you rotated 180° instead of 90° — rerun from the original.",
      },
      {
        problem: "Needing pixel-perfect archiving after rotation",
        fix: "Re-encoding at quality 85 is visually clean but technically a new JPEG generation. For archival copies, keep the original untouched; the rotated file is the working copy for sharing and uploads.",
      },
    ],
  },

  "rotate-image-180": {
    intro:
      "Upside-down files come from two places: inverted scans of photos and slides fed into flatbed scanners the wrong way, and the rare camera shot where the sensor orientation was recorded without the flip the photographer intended. A 180° rotation is the exact correction — it remaps every pixel to its opposite position with no interpolation, and because a half turn preserves width and height, the dimensions stay identical. Like its quarter-turn siblings, the tool re-encodes the corrected frame at high quality (85), and batch mode lets you right a whole stack of inverted scans in one run.",
    table: {
      caption: "180° versus the flips it is often confused with",
      headers: ["Operation", "What changes", "Use it when"],
      rows: [
        ["Rotate 180° (this page)", "Both axes — the image turns upside down to upright", "Scans and photos that are inverted"],
        ["Flip Vertical", "Top and bottom mirror; text reads upside-down after it", "Reflections and mirrored effects"],
        ["Flip Horizontal", "Left and right swap; text reads backwards", "Mirror-image mistakes, text backwards"],
        ["Rotate 90°", "Dimensions swap between landscape and portrait", "Sideways photos, not inverted ones"],
      ],
    },
    mistakes: [
      {
        problem: "Using Flip Vertical to correct an upside-down photo",
        fix: "A vertical flip mirrors the image instead of turning it — faces end up looking wrong and text reads reversed even though the composition looks 'right side up'. Only a true 180° rotation restores an inverted photo correctly.",
      },
      {
        problem: "Re-scanning inverted originals instead of rotating the file",
        fix: "Rescanning loses time and adds another generation of scanner artifacts. Rotate the existing scan here — the pixels move without resampling, which is gentler than a second pass through hardware.",
      },
      {
        problem: "Applying 180° to a sideways (quarter-turn) problem",
        fix: "If the photo is lying on its side, 180° makes it inverted-sideways. Check which edge the top of the scene points to: sideways means 90° or 270°; inverted means this tool.",
      },
      {
        problem: "Rotating an already-correct file 'to be safe'",
        fix: "Each pass is a re-encode. Only process files that are actually wrong — the batch list should contain inverted images only, not your whole folder.",
      },
    ],
  },

  "rotate-image-270": {
    intro:
      "A 270° clockwise turn is the same correction as a 90° counterclockwise turn — this page exists because people search for both names when a photo leans the opposite way. Mechanically it matches the other fixed-angle rotators: pixels move to their quarter-turned positions without resampling, width and height swap, and the upright frame is saved at high quality (85). It is the right tool when the top of a sideways photo points to the left, a situation that happens constantly with front-facing camera shots and photos exported from certain editors. Batch up to ten images per run, all corrected identically.",
    table: {
      caption: "Direction cheat-sheet for quarter turns",
      headers: ["Photo currently", "Correct tool", "Equivalent name for the same turn"],
      rows: [
        ["Top of scene points left", "Rotate 270° (this page)", "'90° counterclockwise' or '90° CCW'"],
        ["Top of scene points right", "Rotate 90° clockwise", "'Quarter turn CW'"],
        ["Inverted (both axes wrong)", "Rotate 180°", "'Upside down fix'"],
        ["Slightly crooked horizon", "Straighten Image", "Angle slider, not a quarter turn"],
      ],
    },
    mistakes: [
      {
        problem: "Picking 90° when the photo needed 270°",
        fix: "The two quarter turns are opposites; one corrects a photo leaning one way and the other makes it fully inverted. If your result is upside down after rotating, go back to the original and use the opposite page — 270° and 90° cancel each other.",
      },
      {
        problem: "Correcting the corrected file",
        fix: "Each rotation run re-encodes the image at quality 85. Two passes mean two generations. Start from the original file whenever a correction turns out wrong; the tool list shows exactly which direction each page applies.",
      },
      {
        problem: "Confusing rotation with flipping for mirrored text",
        fix: "If text in a scanned document reads backwards, the fix is Flip Horizontal, not any rotation. Rotations change orientation; flips change chirality — they solve different mistakes.",
      },
      {
        problem: "Worrying about quality loss from 'big' rotations",
        fix: "Rotations at 90-degree multiples move pixels without resampling — there is no interpolation blur from the turn itself. The only re-encode is the final save at quality 85, the same as the other rotators.",
      },
    ],
  },

  /* ---------------- Resizing: per-format family ---------------- */

  "resize-png-image": {
    intro:
      "PNG files are the graphics of the web — logos, screenshots, UI assets, pixel art and anything with sharp edges or transparency. Resizing them is a different job from resizing photos: alpha transparency has to survive the scaling untouched, and flat colour areas must stay flat instead of picking up ringing artifacts. This tool scales by width with an optional aspect-ratio lock, keeps the PNG format end-to-end, and runs up to ten files per batch. Typical jobs: bringing a 2400px export down to the 512px an app store expects, or trimming a set of screenshots to a uniform width for documentation.",
    table: {
      caption: "Common PNG resize targets",
      headers: ["Destination", "Typical width", "Note"],
      rows: [
        ["App store icon source", "512px", "The stores themselves generate smaller sizes from this"],
        ["Favicon source", "256–512px", "Then convert with Image to ICO for multi-size .ico files"],
        ["Documentation screenshots", "800–1200px", "Uniform width keeps text size consistent across a page"],
        ["Email signature logo", "300–400px", "Keep aspect lock on unless the logo is deliberately wide"],
      ],
    },
    mistakes: [
      {
        problem: "Resizing a photographic PNG instead of converting it first",
        fix: "A photo saved as PNG weighs several times its JPEG equivalent, and resizing does not change that. If the image has no transparency, convert to JPG and resize that — the file gets smaller both ways at once.",
      },
      {
        problem: "Enlarging a small PNG and expecting crisp results",
        fix: "Scaling up interpolates pixels; a 100px logo becomes soft at 400px no matter the tool. Find a larger source or vector version. For modest upscales, this tool's output is fine for screens — just check edges in the preview.",
      },
      {
        problem: "Turning off aspect lock and distorting graphics",
        fix: "Logos and UI elements have proportions that the eye notices. Unlock the ratio only for deliberate non-square crops (like a banner strip); everything else keeps the lock on.",
      },
      {
        problem: "Resizing screenshots of text too far down",
        fix: "Small UI text becomes unreadable below roughly 60% of its native size. If documentation screenshots must shrink a lot, crop to the relevant region instead of squeezing the whole window into a tiny width.",
      },
    ],
  },

  "resize-jpg-image": {
    intro:
      "JPEG is where the photo resizing work happens: camera dumps, profile pictures, marketplace listings and email attachments. This tool pairs the width control with a JPEG quality slider (default 90, range 30–100), because a resize is always a re-encode and you should decide how much quality the new file carries. At the default setting, downsizing a typical 12-megapixel photo to 1600px wide leaves it looking identical on screen while cutting file size by a large factor. Batch mode covers up to ten photos per run, each reported with its new dimensions before you download.",
    table: {
      caption: "Width presets that cover most photo jobs",
      headers: ["Use", "Suggested width", "Why"],
      rows: [
        ["Web page / blog body", "1200–1600px", "Matches typical content columns on modern screens"],
        ["Marketplace or listing photo", "1600–2000px", "Detailed enough for buyers, fast to load"],
        ["Email attachment", "1024–1280px", "Keeps a full message with several photos under limits"],
        ["Full-screen hero image", "1920–2400px", "Survives large displays without visible softness"],
      ],
    },
    mistakes: [
      {
        problem: "Resizing with the quality slider far below 90",
        fix: "Dimension scaling plus aggressive compression multiply each other's softness. For resized photos keep quality at 85–95 — the size saving from dimensions dwarfs what an extra 20 points of compression adds.",
      },
      {
        problem: "Entering the height you want into the width field",
        fix: "The tool scales by width with aspect lock on; portrait photos therefore need the long edge's value in the width field. Unlock the ratio only when you deliberately want different proportions.",
      },
      {
        problem: "Upscaling small images for 'better print size'",
        fix: "Interpolation adds pixels, not detail — a 800px photo upscaled to 3000px prints soft and blotchy. Print the original or shoot again; resizing is a downscale job.",
      },
      {
        problem: "Resizing the same JPG repeatedly for different platforms",
        fix: "Every pass is another JPEG generation. Keep the original untouched and produce each platform's copy from it in a single run.",
      },
    ],
  },

  "resize-webp-image": {
    intro:
      "WebP is the modern web format — smaller files at the same visual quality, supported by every current browser. Resizing WebP assets is a routine site-maintenance job: a hero image exported at 2600px, a WebP screenshot from a design tool, or downloaded assets heavier than the page-speed audit allows. This tool decodes through the browser's native WebP codec, scales by width with aspect lock, and re-encodes at the quality you choose — keeping the format's efficiency instead of round-tripping through another format. Batch mode handles up to ten files, with each result's new size listed before download.",
    table: {
      caption: "WebP resize workflow by task",
      headers: ["Task", "Settings", "Expected effect"],
      rows: [
        ["Shrink an oversized hero image", "Width 1920, quality 80", "Large LCP improvement, no visible change"],
        ["Batch-trim UI assets to a grid width", "Width per spec, aspect lock on", "Uniform dimensions, leaner bundles"],
        ["Resize a WebP photo for a listing", "Width 1600, quality 85", "Upload passes, details stay crisp"],
        ["Convert-and-resize in one step", "Resize here, or convert first with PNG to WebP", "Both orders work; one step is faster"],
      ],
    },
    mistakes: [
      {
        problem: "Assuming WebP needs a bigger quality value to look right",
        fix: "WebP's efficiency curve differs from JPEG's — quality 80 in WebP usually matches the look of JPEG 85–90. Start at 80 and compare the preview; pushing quality to 95 mostly wastes bytes.",
      },
      {
        problem: "Resizing animated WebP and expecting the animation to survive",
        fix: "The tool works on the first frame of animated files, by design. For animations use a dedicated editor; this resizer is for still images.",
      },
      {
        problem: "Mixing up dimension resize with byte-size compression",
        fix: "Changing width changes pixels; a KB target needs the compressors (for example Compress Image to 100KB). If a form checks file size, use those tools; if it checks dimensions, use this one.",
      },
      {
        problem: "Serving upscaled WebP from a small source",
        fix: "Upscaling cannot restore detail that was never captured. Keep assets at capture or export size and scale down only — that is where this tool gives clean, predictable results.",
      },
    ],
  },

  /* ---------------- Conversion: BMP family ---------------- */

  "jpg-to-bmp": {
    intro:
      "BMP is the oldest format still regularly demanded: legacy Windows utilities, industrial controllers, embedded display panels and some lab equipment read raw 24-bit bitmaps and nothing else. Converting a JPG into that world is a one-way street — BMP stores every pixel uncompressed, so the output is dramatically larger than the source — and this tool exists to do that conversion correctly rather than through renames that break real readers. It decodes your JPEG, writes a proper 24-bit bottom-up BMP with a custom in-browser encoder, and hands the file back locally. Use it when a device or program explicitly names BMP as its accepted input.",
    table: {
      caption: "What the conversion changes",
      headers: ["Aspect", "JPG (input)", "BMP (output)"],
      rows: [
        ["Compression", "Lossy, compact", "None — raw pixel data"],
        ["Typical size (1MP photo)", "100–300KB", "Roughly 3MB (width × height × 3 bytes)"],
        ["Transparency", "Not present in JPEG", "Not present — opaque output"],
        ["Quality", "Carries source artifacts", "Pixel-exact copy of decoded JPG"],
        ["Compatibility", "Universal", "Legacy/industrial software, Windows utilities"],
      ],
    },
    mistakes: [
      {
        problem: "Renaming .jpg to .bmp instead of converting",
        fix: "The bytes stay JPEG no matter the extension, and real BMP readers reject the file. Conversion means decoding and re-encoding — exactly what this tool does — not renaming.",
      },
      {
        problem: "Converting photos 'for quality'",
        fix: "BMP adds no quality; it copies the decoded JPG pixels into an uncompressed container. Artifacts in the source stay. BMP only makes sense when the receiving system demands the format.",
      },
      {
        problem: "Emailing or archiving in BMP",
        fix: "A converted photo is several megabytes with zero benefit outside its target system. Keep JPG for people, produce BMP copies only for the device that asks for them.",
      },
      {
        problem: "Expecting smaller files by 'compressing' the BMP",
        fix: "Standard BMP is uncompressed by definition. If a size limit applies on the legacy system, shrink the pixel dimensions before converting — dimensions, not format, control a BMP's size.",
      },
    ],
  },

  "png-to-bmp": {
    intro:
      "Transparent PNGs meet one hard fact in the BMP world: the 24-bit bitmap format has no alpha channel. Every transparent region must become a solid colour before the file can be written, and this tool makes that decision explicit instead of silent — you pick the background (white by default) and the flattening happens as part of the conversion. The output is a genuine 24-bit BMP written by the same in-browser encoder the other BMP converters use, suitable for legacy software, industrial displays and embedded systems. Everything runs locally, so the file never leaves your machine.",
    table: {
      caption: "Flattening choices before conversion",
      headers: ["Background pick", "Result", "Best for"],
      rows: [
        ["White (default)", "Transparent areas become white", "Documents, most legacy software"],
        ["Black", "Transparent areas become black", "Dark UI assets going into device screens"],
        ["Brand colour", "Transparent areas match your palette", "Logos placed on known backgrounds"],
        ["Matched to destination page", "Flattened copy blends in", "Fixed-background industrial displays"],
      ],
    },
    mistakes: [
      {
        problem: "Assuming transparency will 'carry over' to BMP",
        fix: "It cannot — BMP has no alpha channel in the 24-bit form this tool writes. Choose the background deliberately; whatever you pick becomes permanently part of the pixels.",
      },
      {
        problem: "Picking a background that fights the image",
        fix: "A white logo flattened onto black turns into an awkward halo and vice versa. Check the preview after conversion and, if the edge looks contaminated, re-run with the colour the destination actually uses.",
      },
      {
        problem: "Renaming .png to .bmp",
        fix: "Extensions do not convert data. A renamed PNG still contains PNG chunks and fails in strict BMP readers; this tool re-encodes the pixels into a real 24-bit bitmap.",
      },
      {
        problem: "Using BMP output for the web",
        fix: "BMP files are uncompressed and enormous compared to PNG or WebP — browsers render them, but pages load painfully. BMP conversion is for legacy systems; keep the PNG for anything online.",
      },
    ],
  },

  "bmp-to-jpg": {
    intro:
      "BMP files arrive from scanners, industrial software, exported reports and old Windows applications, and they are huge — every pixel stored raw. Converting to JPEG turns that bitmap into a shareable photo: the encoder discards detail the eye barely notices and the file shrinks by a large factor, small enough to email, upload or archive. This tool decodes your BMP in the browser and re-encodes it as a standard JPEG, with the whole pipeline running locally. It is the routine fix when a legacy system's output needs to travel through the modern world.",
    table: {
      caption: "What changes in the move to JPG",
      headers: ["Aspect", "BMP (input)", "JPG (output)"],
      rows: [
        ["File size (1MP)", "≈3MB raw", "100–300KB typical"],
        ["Compression", "None", "Lossy, visually clean at high quality"],
        ["Sharing", "Awkward — huge files, filters reject them", "Universal"],
        ["Best practice", "Keep the original for the legacy system", "Distribute and archive the JPG copy"],
      ],
    },
    mistakes: [
      {
        problem: "Deleting the BMP after converting",
        fix: "The JPG is a re-encode, and the legacy system that produced or consumes BMPs will still want the original format. Keep the source; the JPG is the distribution copy.",
      },
      {
        problem: "Converting BMP screenshots containing small text at low quality",
        fix: "JPEG artifacts appear first around sharp text. For screenshots and documents, use a high quality setting — or convert to PNG instead when the text must stay pixel-perfect.",
      },
      {
        problem: "Expecting the JPG to be smaller than it is for grayscale scans",
        fix: "JPEG compresses colour detail hardest; flat grayscale bitmaps shrink less dramatically. The result is still far smaller than the raw BMP — just check the reported size rather than assuming a fixed ratio.",
      },
      {
        problem: "Renaming .bmp to .jpg",
        fix: "A renamed file keeps BMP bytes and fails in strict readers and upload validators. The pixels must be decoded and re-encoded as JPEG, which is what this tool does.",
      },
    ],
  },

  "bmp-to-png": {
    intro:
      "When the destination is the modern web rather than an email inbox, the right way out of BMP is PNG: lossless, universally supported and much lighter than a raw bitmap while keeping every pixel exactly as it was decoded. This tool converts Windows BMP bitmaps into PNG files in the browser — the standard path for scanned artwork, pixel graphics and legacy screenshots whose edges and text must remain untouched. Where the BMP carried no transparency (it never does), the PNG is a clean opaque image ready for sites, editors and archives.",
    table: {
      caption: "BMP's two exit routes compared",
      headers: ["", "BMP → PNG (this page)", "BMP → JPG"],
      rows: [
        ["Fidelity", "Lossless — pixels preserved exactly", "Lossy re-encode"],
        ["Size saving", "Large vs raw BMP", "Largest"],
        ["Text / sharp edges", "Perfect", "Slight artifacts possible"],
        ["Best for", "Archival copies, artwork, screenshots", "Photos, email, strict size caps"],
      ],
    },
    mistakes: [
      {
        problem: "Choosing PNG when a form enforces a KB limit",
        fix: "Lossless means larger files, and upload validators that check size will still reject a big scan. Use BMP to JPG for size-capped submissions; keep this conversion when fidelity matters more than bytes.",
      },
      {
        problem: "Expecting transparency to appear in the PNG",
        fix: "The source BMP is opaque, so the PNG is opaque too — conversion cannot invent an alpha channel. To cut a background out afterwards, use Remove White Background or Make Image Transparent.",
      },
      {
        problem: "Renaming the extension instead of converting",
        fix: "Renamed files keep their BMP bytes; browsers tolerate them sometimes, strict tools do not. A real decode-and-re-encode is what makes the file genuinely PNG.",
      },
      {
        problem: "Re-saving the PNG through other tools 'to make sure'",
        fix: "PNG is lossless, but re-saving through editors can strip colour profiles or add metadata. Download once from here and store it — no further passes needed.",
      },
    ],
  },
};
