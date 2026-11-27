/** Editorial guides, part B (5–8). See types.ts for the block model. */

import type { BlogPost } from "./types";

export const POSTS_B: BlogPost[] = [
  {
    slug: "optimize-images-for-websites",
    title: "Optimizing Images for the Web: A Practical Speed Checklist",
    description:
      "How image weight affects loading, what to compress and resize before publishing, and where each byte-saving technique applies — with local browser tools.",
    date: "2026-11-27",
    topic: "Web performance",
    blocks: [
      {
        type: "p",
        text: "Images are the heaviest thing on most web pages. Text, styles and scripts for a typical article add up to a few hundred kilobytes; a single unoptimized hero photo from a modern phone can weigh five times that on its own. Visitors on slow connections wait for those bytes, and Google's page-experience signals measure that waiting. The encouraging part: image optimization is the rare performance job that needs no code changes — just the right preparation of the files before they go up.",
      },
      { type: "h2", text: "Why image weight dominates page speed" },
      {
        type: "p",
        text: "Page load time is mostly data transfer time. When a page contains four photos at 4MB each, a visitor on a 10 Mbps connection spends roughly thirteen seconds just downloading pictures — longer than everything else combined. Shrinking those photos to 500KB each cuts that to under two seconds with no visible difference. This relationship is why the compressors on this site exist, and why 'compress harder' is almost always the first lever: the bytes you never send are the fastest ones.",
      },
      { type: "h2", text: "The pre-publish checklist" },
      {
        type: "ol",
        items: [
          "Resize to display dimensions. If an image renders at 1200px wide on your site, uploading a 4000px original sends four times the pixels the screen can use. Scale the long edge to roughly the rendered width (a bit more for high-DPI screens).",
          "Pick the modern format. WebP at quality ~80 matches JPEG 85–90 visually for a quarter less weight; every current browser supports it.",
          "Compress to a byte budget. A content image belongs in the 100–500KB range; hero images can justify more, thumbnails should sit far below 100KB.",
          "Strip what you do not need. Camera metadata adds bytes and leaks information — for public web images, remove it.",
          "Name and describe honestly. The file name and alt text are content, not decoration — they are what screen readers announce and what image search reads.",
        ],
      },
      {
        type: "tools",
        intro: "The tools behind each checklist step:",
        slugs: ["image-resizer", "optimize-image-for-web", "image-compressor", "near-lossless-image-compressor", "remove-image-metadata"],
      },
      { type: "h2", text: "Quality levels that make sense" },
      {
        type: "p",
        text: "The quality slider is not a matter of taste — the perceptual curve is steep. Between quality 95 and 80, most photos lose nothing most viewers can see while losing half their weight. Below about 60, artifacts appear first in fine texture: hair, foliage, fabric. The near-lossless compressor on this site formalises the gentle end of that curve: it tries high qualities in order and keeps the first one that produces a smaller file, so you get savings without a visible hit — the right choice when you control the layout and just want pages faster.",
      },
      {
        type: "table",
        caption: "Byte budgets by image role",
        headers: ["Image role", "Target size", "Typical settings"],
        rows: [
          ["Hero / banner", "200–500KB", "1920–2400px wide, WebP quality ~80"],
          ["Content photo", "100–300KB", "1200–1600px wide, WebP quality ~80"],
          ["Listing / marketplace photo", "Under 200KB", "1600px wide, per-portal cap"],
          ["Thumbnail / card", "Under 50KB", "400–800px wide, higher compression acceptable"],
          ["Icon / favicon", "A few KB", "Generated at fixed sizes (Favicon Generator)"],
        ],
      },
      { type: "h2", text: "Format choices for the web specifically" },
      {
        type: "p",
        text: "The format guide on this blog covers JPG, PNG and WebP in depth; for web publishing the short version is that WebP is the default, JPEG is the compatibility copy, and PNG is for graphics where compression artifacts would be visible — logos, screenshots, diagrams. Photos saved as PNG by design tools are a classic accidental weight bomb: converting one to WebP or JPEG before upload often removes 80–90% of its weight with no visible change.",
      },
      { type: "h2", text: "What not to do" },
      {
        type: "ul",
        items: [
          "Do not rely on CSS to shrink images — scaling a 4000px image down to a 300px slot in styles still downloads all 4000px of data.",
          "Do not compress the same JPEG repeatedly for each tweak — each pass adds generation softness; compress once from the original.",
          "Do not push quality below the point where the picture visibly degrades to chase kilobytes — below 100KB territory, resizing dimensions beats crushing quality (see the forms guide for that workflow).",
          "Do not strip EXIF from images whose metadata has evidentiary value — cleanup is for publishing copies, not originals.",
        ],
      },
      {
        type: "related",
        slugs: ["jpg-vs-png-vs-webp-which-format-to-use", "reduce-photo-size-for-online-forms", "convert-avif-webp-modern-formats"],
      },
    ],
  },

  {
    slug: "social-media-image-size-cheatsheet",
    title: "Social Media Image Sizes: A Working Cheatsheet (and How to Hit Them)",
    description:
      "Current recommended dimensions for Instagram, Facebook, LinkedIn, YouTube, X and Pinterest posts, covers and banners — with a one-click way to fit them.",
    date: "2026-11-27",
    topic: "Photos",
    blocks: [
      {
        type: "p",
        text: "Every platform crops and scales uploaded images its own way, and a photo that looks perfect in one feed arrives awkwardly zoomed in another. This cheatsheet collects the dimensions each major platform recommends, explains what the platform does with anything that does not match, and shows how this site's dedicated resizers hit each spec in one step — entirely in your browser. One honest caveat first: platforms adjust these specs occasionally, and some render different crops to different devices, so treat the numbers as the working standard they currently are and check a platform's own help page when a layout suddenly misbehaves.",
      },
      { type: "h2", text: "Instagram" },
      {
        type: "p",
        text: "Instagram supports three post shapes: square 1080×1080 (1:1), portrait 1080×1350 (4:5) — the tallest that renders uncut in the feed and the best use of screen space — and landscape 1080×566 (1.91:1). Stories and Reels are 1080×1920 (9:16); anything wider or taller gets cropped to that frame. Uploads above 1080px wide are downscaled by the platform, so sending a 3000px original gains nothing.",
      },
      { type: "h2", text: "Facebook" },
      {
        type: "p",
        text: "The cover photo renders at 820×312 on desktop and 640×360 on mobile — the reason covers with centred text sometimes get their edges trimmed on phones. Profile photos display small but upload large; 720px square or more stays sharp everywhere. Feed photos perform best at 1200px wide or more in any of the standard shapes.",
      },
      { type: "h2", text: "LinkedIn" },
      {
        type: "p",
        text: "The banner strip is 1584×396 (4:1) — a very wide frame that needs deliberate composition because the middle is overlaid by your profile photo on mobile. Profile photos render from 400×400 upward. Feed images at 1200×627 (1.91:1) match the link-preview shape and look native in the timeline.",
      },
      { type: "h2", text: "YouTube, X and Pinterest" },
      {
        type: "p",
        text: "YouTube thumbnails are 1280×720 (16:9) and remain the single highest-leverage image on the platform. Channel banners upload at 2048×1152 with a safe area of 1546×423 visible on all devices — keep text inside that strip. X (Twitter) posts are cleanest at 1600×900 (16:9) and headers at 1500×500. Pinterest pins are 1000×1500 (2:3), the ratio the grid is built around.",
      },
      {
        type: "table",
        caption: "The numbers at a glance",
        headers: ["Placement", "Recommended size", "Ratio"],
        rows: [
          ["Instagram post (square)", "1080×1080", "1:1"],
          ["Instagram post (portrait)", "1080×1350", "4:5"],
          ["Instagram story / reel", "1080×1920", "9:16"],
          ["Facebook cover", "820×312", "≈2.63:1"],
          ["LinkedIn banner", "1584×396", "4:1"],
          ["LinkedIn feed image", "1200×627", "1.91:1"],
          ["YouTube thumbnail", "1280×720", "16:9"],
          ["YouTube banner", "2048×1152", "16:9"],
          ["X post", "1600×900", "16:9"],
          ["X header", "1500×500", "3:1"],
          ["Pinterest pin", "1000×1500", "2:3"],
        ],
      },
      { type: "h2", text: "Hitting a spec in one step" },
      {
        type: "p",
        text: "Each row above has a matching resizer on this site. Load the image, and the tool scales or cover-crops to the exact dimensions — no manual arithmetic, no accidental distortion. Where an image's proportions do not match the target, the resizer either crops to fill (keeping the composition centred) or pads to fit, depending on the tool, so a landscape photo becomes a story without anyone stretching pixels.",
      },
      {
        type: "tools",
        intro: "The platform resizers:",
        slugs: [
          "instagram-post-resizer",
          "instagram-story-resizer",
          "instagram-portrait-resizer",
          "facebook-cover-resizer",
          "facebook-profile-resizer",
          "linkedin-banner-resizer",
          "linkedin-post-resizer",
          "youtube-thumbnail-resizer",
          "youtube-banner-resizer",
          "twitter-header-resizer",
          "x-post-resizer",
          "pinterest-pin-resizer",
        ],
      },
      { type: "h2", text: "Practical notes" },
      {
        type: "ul",
        items: [
          "Platforms compress uploads after download — start from a sharp, reasonably compressed file and the double compression stays invisible; start from a mushy one and it gets worse.",
          "Text placed near frame edges gets cropped somewhere — keep captions inside the middle 80% of covers, banners and stories.",
          "For text-heavy graphics, export as PNG before resizing so the text stays crisp through the rescale (see the format guide for why).",
          "Batch accounts: the resizers accept up to ten files per run, which is how multi-platform campaigns get processed in minutes.",
        ],
      },
      {
        type: "related",
        slugs: ["jpg-vs-png-vs-webp-which-format-to-use", "optimize-images-for-websites"],
      },
    ],
  },

  {
    slug: "convert-avif-webp-modern-formats",
    title: "AVIF and WebP: When to Use the Modern Formats (and When to Convert Back)",
    description:
      "What AVIF and WebP buy you, where support still falls short, and how to convert between modern and classic formats locally when a system demands JPG or PNG.",
    date: "2026-11-27",
    topic: "Formats",
    blocks: [
      {
        type: "p",
        text: "Two modern formats have been quietly reshaping how images travel the web. WebP has been supported by every major browser for years; AVIF arrived later and compresses even more aggressively. Both deliver the same picture as a JPEG or PNG for a fraction of the bytes — and both still run into the same wall: the world beyond browsers. This guide explains what each format is genuinely good for, where the compatibility edges are, and how to convert in either direction on this site without uploading anything.",
      },
      { type: "h2", text: "WebP: the established modern default" },
      {
        type: "p",
        text: "WebP supports lossy and lossless compression, transparency and animation, in one format. At typical photo settings a WebP file runs 25–35% smaller than the JPEG equivalent — which on a page with eight images is real seconds saved for a visitor on mobile data. Browsers, WordPress, CDNs and image CDNs all handle it natively. The remaining friction is at the edges: some desktop applications from before 2020, some specialty upload validators, and some printer pipelines still reject it. That friction defines the workflow: publish WebP to the web, keep a JPEG copy for anything that asks for .jpg by name.",
      },
      { type: "h2", text: "AVIF: the efficient newcomer" },
      {
        type: "p",
        text: "AVIF compresses better than WebP — often another 20% smaller at similar quality — and supports HDR and 12-bit colour that the older formats cannot represent. Browser support is now broad across Chrome, Firefox, Safari and Edge. Its practical weakness is ecosystem maturity: fewer editors, fewer converters, and upload systems that accept it are rarer than those accepting WebP. Files you receive in AVIF (from newer cameras, some apps, some CDN pipelines) are therefore often worth converting to a more portable format before sharing onward.",
      },
      { type: "h2", text: "The conversion workflow, both directions" },
      {
        type: "p",
        text: "Out of AVIF: browsers render AVIF fine, but the email client, the print shop and the government portal on the other end often do not. Converting an AVIF to JPEG (or PNG when edges and text must stay pixel-exact) makes the file portable everywhere. The conversion decodes the AVIF and re-encodes into the target format — visually clean at the default quality, and the original AVIF stays on your machine untouched.",
      },
      {
        type: "p",
        text: "Out of WebP: the same logic applies when a system predates WebP support. WebP to JPEG for photos, WebP to PNG for graphics with sharp edges or transparency. And into the modern formats: PNG to WebP and JPG to WebP are the everyday conversions for shrinking web assets, covered in depth in the optimization guide.",
      },
      {
        type: "tools",
        intro: "Every conversion referenced here runs locally:",
        slugs: ["avif-to-jpg", "avif-to-png", "webp-to-jpg", "webp-to-png", "png-to-webp", "jpg-to-webp", "image-format-converter"],
      },
      { type: "h2", text: "Decision table" },
      {
        type: "table",
        caption: "Which format for which job",
        headers: ["Job", "Choose", "Reason"],
        rows: [
          ["Images served on your own site", "WebP (AVIF if your pipeline supports it)", "Smallest files, universal browser support"],
          ["Email attachment to unknown recipients", "JPEG", "Nothing to check — it opens everywhere"],
          ["Upload form with fixed format rules", "Whatever the form names", "Validators check real bytes, not extensions"],
          ["Archive / editing master", "PNG or original", "Lossless generations, no quality debt"],
          ["Photo received in AVIF to share onward", "Convert to JPEG", "Portability at the receiving end"],
        ],
      },
      { type: "h2", text: "Honest limitations" },
      {
        type: "ul",
        items: [
          "Conversion is re-encoding: AVIF or WebP to JPEG is visually clean, but it is not lossless. Keep the modern-format original as the master.",
          "Animated files convert from their first frame on this site — animation belongs in a dedicated editor's workflow.",
          "Very old AVIF files with exotic colour profiles may render slightly differently after conversion; check the preview against what you expect before downloading.",
        ],
      },
      {
        type: "related",
        slugs: ["jpg-vs-png-vs-webp-which-format-to-use", "optimize-images-for-websites"],
      },
    ],
  },

  {
    slug: "watermark-your-photos-guide",
    title: "Watermarking Photos Properly: Placement, Strength and Batch Workflow",
    description:
      "How to protect images with text, logo, tiled and date watermarks — where to place them, how strong to make them, and how to mark batches consistently.",
    date: "2026-11-27",
    topic: "Guides",
    blocks: [
      {
        type: "p",
        text: "A watermark is a trade: some of the image's beauty exchanged for some protection of its ownership. Done well, it deters casual theft and survives cropping attempts without ruining the picture; done badly, it either sits in the corner waiting to be cropped away or stamps across the whole frame making the photo unusable. This guide covers the practical decisions — which of the four watermark types fits your situation, where to place it, how strong to make it, and how to mark a whole shoot consistently.",
      },
      { type: "h2", text: "The four watermark types and when each fits" },
      {
        type: "p",
        text: "A text watermark is your name, handle or business over the image — the everyday choice for photographers publishing proofs and creators marking shared work. A logo watermark uses your actual mark with transparency respected, which looks more professional and is harder to fake. A tiled watermark repeats the text or mark across the entire frame in a grid — deliberately the hardest to remove, because erasing it means rebuilding the whole image; that is the choice for proofs and previews where protection outranks looks. A date watermark stamps the capture or delivery date, which is less about protection and more about record-keeping: site progress photos, delivery evidence, warranty documentation.",
      },
      {
        type: "tools",
        intro: "The watermarking tools referenced throughout:",
        slugs: ["watermark-image", "add-logo-watermark", "tiled-watermark", "date-watermark", "bulk-watermark"],
      },
      { type: "h2", text: "Placement: visible but not destructive" },
      {
        type: "p",
        text: "The standard advice is a corner at 50–60% opacity, and it survives because it is honest: enough presence to identify the image, not enough to dominate it. But corners have a weakness — they crop away. If the risk is a stranger cropping your mark off and reposting, place the mark so it crosses an area of the image that cannot be cropped out without ruining the composition: across a central subject's midline at low opacity, or along a diagonal. The tiled pattern exists precisely for this: it cannot be beaten by cropping, only by re-editing the image, which is a far higher bar.",
      },
      {
        type: "table",
        caption: "Strength settings by purpose",
        headers: ["Purpose", "Type", "Opacity", "Placement"],
        rows: [
          ["Portfolio / published work", "Text or logo", "40–60%", "Corner or edge"],
          ["Client proofs awaiting approval", "Tiled", "20–30%", "Whole frame"],
          ["Documents and records", "Date", "50–70%", "Any consistent position"],
          ["Social media graphics", "Text", "50%", "Inside the middle 80% (frames get cropped)"],
        ],
      },
      { type: "h2", text: "The batch workflow" },
      {
        type: "p",
        text: "Consistency is what makes a set of images look professional, and manual stamping does not produce it. The bulk watermark tool applies identical settings — same text or logo, same size, opacity and position — to up to ten images per run, delivered as a single ZIP. The workflow that scales: settle your standard on one representative photo (type, opacity, position), note the settings, then run every image of the shoot through the bulk tool with those settings. Every marked file then matches, and the unmarked originals stay untouched in your archive.",
      },
      { type: "h2", text: "Common mistakes" },
      {
        type: "ul",
        items: [
          "Watermarking the only copy. Always keep unmarked originals; a watermark is applied to a copy, and you cannot un-stamp a file later.",
          "Opacity at 100%. A fully opaque mark screams amateur and often violates platform aesthetics; 50–60% identifies just as well and looks deliberate.",
          "Tiny corner marks on images likely to be cropped to square or story ratios — platform crops will cut the mark off entirely. Social-bound images need marks inside the safe middle area.",
          "White text on bright photos. Pick the mark colour from the image's dominant tones, or add the subtle background pill the text tool offers for guaranteed contrast.",
        ],
      },
      {
        type: "p",
        text: "One final honest note: a watermark is a deterrent and an identifier, not a legal shield. It does not replace copyright — which usually attaches automatically to your original work — and it does not stop a determined editor with time and tools. What it reliably does is make casual misuse traceable and inconvenient, and make honest re-sharers carry your name with the picture. For most photographers and small businesses, that is exactly the protection level worth the trade.",
      },
      {
        type: "related",
        slugs: ["strip-image-metadata-privacy", "optimize-images-for-websites"],
      },
    ],
  },
];
