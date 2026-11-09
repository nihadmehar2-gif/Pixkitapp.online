/** Targeted FAQ upgrades — hand-written Q&As added on top of existing hand-written /
 *  generated FAQs. Grounded in each tool's real options and limits, and informed by
 *  real query patterns observed in Google Autocomplete (see scripts/keyword-map.json):
 *  unit-conversion questions ("in cm/inches"), quality questions ("without losing
 *  quality"), and privacy questions. Merge logic lives in src/lib/tools/index.ts. */

export interface FaqItem {
  q: string;
  a: string;
}

/** Per-slug upgrades. `replace` swaps the answer of an existing question
 *  (matched case-insensitively); `add` appends new Q&As (skipped if the same
 *  question already exists). */
export const FAQ_UPGRADES: Record<string, { replace?: FaqItem[]; add?: FaqItem[] }> = {
  "resize-image-to-kb": {
    replace: [
      {
        q: "Is my image uploaded to a server when I use Resize to KB?",
        a: "No. The file is read straight into your browser tab, resampled and re-encoded on your device, and the download is generated locally — no copy ever leaves your machine, and nothing is stored after you close the tab.",
      },
    ],
    add: [
      {
        q: "Why did the tool shrink the dimensions instead of only lowering quality?",
        a: "The tool searches both dimensions and JPEG/WebP quality to hit your KB target. If quality reduction alone can't reach the target without ruining the image, it reduces the longest edge as well — that's usually the better trade-off for form uploads.",
      },
      {
        q: "What KB target should I choose for online forms?",
        a: "Most exam, visa and job-application forms accept photos between 20 KB and 100 KB and signatures between 10 KB and 20 KB. Check the exact limit on your form, then enter that number as the target — the tool finds the closest possible fit.",
      },
    ],
  },
  "image-resizer": {
    replace: [
      {
        q: "Can I resize many images at once?",
        a: "Yes — drop up to 10 files per batch and each is resized with the same width, height and aspect settings, while every file keeps its own proportions. Download results individually or grab them all in one ZIP archive.",
      },
    ],
    add: [
      {
        q: "What's the difference between resizing and compressing?",
        a: "Resizing changes the pixel dimensions (width × height); compressing reduces the file size in KB/MB. Shrinking dimensions always reduces file size, but you can also compress without changing dimensions — that's what the Image Compressor tools are for.",
      },
    ],
  },
  "compress-png-image": {
    add: [
      {
        q: "Will compressing a PNG make it blurry?",
        a: "No. PNG compression here works by reducing the number of colors (palette quantization), not by smoothing pixels. Flat graphics, screenshots and logos come out visually identical; photographs with millions of colors benefit from lowering the color count less aggressively.",
      },
      {
        q: "Is transparency preserved when compressing PNG?",
        a: "Yes — the alpha channel survives palette reduction, so transparent logos and overlays stay transparent. Only the optional grayscale toggle changes the colors themselves.",
      },
    ],
  },
  "compress-image-to-50kb": {
    add: [
      {
        q: "Is 50 KB enough quality for a photo?",
        a: "For ID forms, profile pictures and document uploads, yes — 50 KB is a common requirement and the tool reaches it while keeping the image legible. For large prints or archiving, use a higher target like the 200 KB or 500 KB tools instead.",
      },
      {
        q: "Which output format should I pick for a 50 KB file?",
        a: "JPEG for photographs and for forms that only accept .jpg. WebP usually reaches the same size with slightly better sharpness — use it if the receiving site accepts WebP uploads.",
      },
    ],
  },
  "crop-image": {
    add: [
      {
        q: "Does cropping reduce image quality?",
        a: "Cropping keeps the original pixels of the remaining area untouched, so the part you keep stays as sharp as the source. You only lose the areas you cut away. The quality slider affects the re-encode step, not the crop itself.",
      },
      {
        q: "Which aspect ratios can I crop to?",
        a: "The editor is free-form with ratio locks, and dedicated tools cover the common ratios in one click: 1:1 square, 16:9, 9:16, 4:3 and 3:2, plus circle crops. Open the ratio list in the editor for all presets.",
      },
    ],
  },
  "webp-to-jpg": {
    add: [
      {
        q: "Will converting WebP to JPG lose transparency?",
        a: "Yes — JPG has no transparency channel, so transparent areas are filled with a solid background (white by default, adjustable with the background color control). If you need to keep transparency, use the WebP to PNG converter instead.",
      },
      {
        q: "Why did my download save as a .webp file?",
        a: "Chrome, Edge and Firefox save most images as WebP because many websites serve that format to save bandwidth. It's just a file format — run it through this converter to get a normal JPG that any app opens.",
      },
    ],
  },
  "image-to-pdf": {
    add: [
      {
        q: "How many images can I combine into one PDF?",
        a: "Up to 10 images per batch, each becoming one page in the order you added them. Drop files one by one to control page order, and use the PDF writer's page-size and margin options to fine-tune the layout before exporting.",
      },
      {
        q: "What page sizes can the PDF use?",
        a: "A4, Letter, A5 and A3, with automatic, portrait or landscape orientation and an adjustable margin. Auto orientation rotates each page to best fit that image's proportions.",
      },
    ],
  },
  "favicon-generator": {
    add: [
      {
        q: "What sizes does the favicon set include?",
        a: "The complete set: 16 px browser-tab icon, 32 px taskbar, 48 px desktop shortcut, 96 px, a 180 px Apple touch icon, and a multi-resolution favicon.ico that bundles the small sizes in one file — everything a modern website needs.",
      },
      {
        q: "Where do I put the favicon files on my website?",
        a: "Upload favicon.ico plus the PNG sizes to your site root, then reference them in your HTML <head>. Most browsers pick up /favicon.ico automatically; the PNGs are declared with <link rel=\"icon\"> tags for sharper results on high-DPI screens.",
      },
    ],
  },
  "image-metadata-viewer": {
    add: [
      {
        q: "What metadata can I see in a photo?",
        a: "For JPEG: full EXIF — camera make and model, exposure, ISO, aperture, focal length, date taken and GPS coordinates when present. For PNG: the chunk inspector shows color type, bit depth, DPI and other container data.",
      },
      {
        q: "Does viewing metadata upload or change my photo?",
        a: "No on both counts. The file is parsed inside your browser tab and nothing is sent anywhere — the report is generated locally, and your image is never modified or stored.",
      },
    ],
  },
  "remove-image-metadata": {
    add: [
      {
        q: "What's the difference between Remove Metadata and Remove GPS Data?",
        a: "Remove Metadata strips every EXIF, GPS and vendor tag — the output is pure pixels. Remove GPS Data removes only the location tags and keeps the rest of the metadata (camera, settings, timestamps). Choose based on how much you want to keep.",
      },
      {
        q: "Will removing metadata change how my photo looks?",
        a: "No. Metadata removal re-encodes the same pixels. JPEG output uses a high quality setting you can adjust; PNG output is lossless. Colors and sharpness stay exactly as they were.",
      },
    ],
  },
  "watermark-image": {
    replace: [
      {
        q: "Which opacity works best?",
        a: "15–30% is the sweet spot for most photos: visible enough to discourage theft, subtle enough not to spoil the image. Go stronger (40–60%) for proof sheets and previews where protection matters more than looks.",
      },
    ],
    add: [
      {
        q: "Which position should I choose for a watermark?",
        a: "Bottom-right or top-left are the least intrusive and the most common. Center placement offers the strongest protection because it can't be cropped out — but it's also the most visible on the image itself.",
      },
    ],
  },
  "remove-white-background": {
    replace: [
      {
        q: "What output format?",
        a: "PNG — the standard format that preserves transparency everywhere: design tools, browsers, presentations and marketplaces. Exporting as JPEG would fill the transparent areas back in with a solid color.",
      },
    ],
    add: [
      {
        q: "Does it work on photos with busy backgrounds?",
        a: "It's designed for product shots, logos and graphics on white or near-white backgrounds. The flood-fill removes white areas connected to the border, so textured or cluttered backgrounds won't fully clear — for those, use the chroma-key or color-removal tool with a tolerance and feather that suit the photo.",
      },
    ],
  },
  "passport-photo-maker": {
    add: [
      {
        q: "Can I use a phone selfie as the source photo?",
        a: "Yes, if you follow the basics: plain background, even front lighting, neutral expression, no glasses glare, head and shoulders visible. The tool crops and sizes it to the official dimensions — it cannot fix bad lighting or a tilted head, so take the shot carefully.",
      },
      {
        q: "What does 35×45 mm mean in pixels?",
        a: "At the official 300 DPI print standard, 35×45 mm equals 413×531 pixels — exactly what this tool outputs. That's the size accepted by most countries using the Schengen/ICAO standard; US passports use 2×2 inches (600×600 px).",
      },
    ],
  },
  "us-passport-photo": {
    add: [
      {
        q: "What are the US passport photo rules?",
        a: "2×2 inches (51×51 mm) printed at 300 DPI = 600×600 pixels, taken within the last 6 months on a plain white or off-white background, neutral expression, no glasses. The US Department of State accepts photos taken at home with a phone camera if these rules are met — check travel.state.gov for the current requirements before you apply, since they can change.",
      },
    ],
  },
  "china-visa-photo": {
    add: [
      {
        q: "What are the China visa photo requirements?",
        a: "33×48 mm at 300 DPI = 390×567 pixels, on a plain white or near-white background, full face visible with a neutral expression and no head covering (unless worn daily for religious reasons). Photos must be recent — taken within the last 6 months. Exact specifications are set by the Chinese embassy or consulate handling your application, so confirm the current rules with them before submitting.",
      },
      {
        q: "Can I print a China visa photo at home?",
        a: "Yes — generate the photo here, then open the Photo Print Sheet tool to arrange copies on 4×6-inch paper at 300 DPI with cut lines. Print on photo paper for the sharpness consulate checks expect.",
      },
    ],
  },
  "id-photo-1-inch": {
    add: [
      {
        q: "What is a 1-inch ID photo in pixels?",
        a: "25×35 mm at 300 DPI equals 295×413 pixels — exactly what this tool outputs. The one-inch format is a standard for small ID cards, resumes and application forms. Requirements for specific documents vary by issuer, so confirm the size your document needs before printing.",
      },
    ],
  },
  "schengen-visa-photo": {
    replace: [
      {
        q: "What size is a schengen visa (35×45mm)?",
        a: "413×531 pixels — 35×45 mm at the official 300 DPI print standard. Your face should take about 70–80% of the frame height, centered, on a plain light background.",
      },
    ],
    add: [
      {
        q: "Which countries use the 35×45 mm Schengen photo standard?",
        a: "All Schengen Area countries in Europe (Germany, France, Italy, Spain, Netherlands and others) plus most ICAO-following countries. The photo must be 35×45 mm — output here at 413×531 pixels, 300 DPI — with the face taking roughly 70–80% of the frame.",
      },
    ],
  },
  "linkedin-profile-photo": {
    add: [
      {
        q: "What size should a LinkedIn profile photo be?",
        a: "LinkedIn displays profile pictures between 400×400 and 768×768 pixels; uploading a square image at least 400×400 px keeps it sharp on every device. This tool crops your headshot to the right square with a clean background so the crop lands on your face, not your shoulder.",
      },
    ],
  },
  "photo-print-sheet": {
    add: [
      {
        q: "How do I print passport photos at home?",
        a: "Generate the photo with the passport maker, open this print sheet tool, and print the 4×6-inch (10×15 cm) sheet on photo paper at 300 DPI. Cut along the cut lines — each cell is exactly the photo size you selected.",
      },
      {
        q: "What paper should I print the sheet on?",
        a: "Any 4×6-inch photo paper works — glossy or matte. Kiosks and minilabs print at 300 DPI natively, so the sheet comes out at exactly the right physical size. Avoid plain office paper: it's thinner and colors look duller, which matters for ID photos.",
      },
    ],
  },
  "webp-to-png": {
    add: [
      {
        q: "Does WebP to PNG keep transparency?",
        a: "Yes — PNG fully supports the alpha channel, so transparent WebP logos and overlays convert without any background added. This is the right converter when you need to keep transparency; use WebP to JPG when you need maximum compatibility instead.",
      },
    ],
  },
  "png-to-jpg": {
    add: [
      {
        q: "What happens to transparency when converting PNG to JPG?",
        a: "JPG cannot store transparency, so transparent pixels are filled with the background color you choose — white by default. Check the preview after converting: if the design was meant to sit on a different background, adjust the color and convert again.",
      },
    ],
  },
  "image-color-picker": {
    add: [
      {
        q: "How do I copy a color from an image?",
        a: "Open your image, then click anywhere on it to sample that exact pixel. The color appears as HEX, RGB and HSL codes with one-click copy buttons, so you can paste it straight into CSS, design software or a brand guide.",
      },
    ],
  },
  "bulk-image-compressor": {
    add: [
      {
        q: "How many images can the bulk compressor handle?",
        a: "Up to 10 files per batch, 30 MB each — with the same quality and format settings applied to every file. Each image is compressed independently in your browser, and the whole set can be downloaded as one ZIP archive.",
      },
    ],
  },
  "image-to-base64": {
    add: [
      {
        q: "When should I use Base64 instead of an image file?",
        a: "Base64 embeds the image directly into HTML, CSS or JSON — useful for small icons, email templates and single-file demos. It makes files roughly 33% larger than the binary image, so keep it for small graphics, not photos.",
      },
    ],
  },
  "svg-to-png": {
    add: [
      {
        q: "Why does my SVG export look sharper at 2× or 4×?",
        a: "SVG is vector data, so the renderer redraws it at whatever scale you choose. Exporting at 1× matches the file's natural size; 2× and 4× produce more pixels, which stays crisp when the PNG is viewed on high-DPI screens or zoomed.",
      },
    ],
  },
  "straighten-image": {
    add: [
      {
        q: "How much can I rotate to straighten a photo?",
        a: "The slider covers ±15° in 0.5° steps — typically enough for tilted horizons, which rarely exceed a few degrees. Zoom-fill scales the frame up just enough to hide the corners that appear when the image rotates, so the straightened result stays rectangular.",
      },
    ],
  },
};
