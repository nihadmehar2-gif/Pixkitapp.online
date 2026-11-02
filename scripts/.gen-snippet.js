window.__makeTestImages = async function () {
  async function mk(canvas, mime, quality) {
    const blob = await new Promise(r => canvas.toBlob(r, mime, quality));
    const arr = new Uint8Array(await blob.arrayBuffer());
    const ext = mime.split("/")[1].replace("jpeg", "jpg");
    return new File([arr], "test." + ext, { type: mime });
  }
  // PHOTO-LANDSCAPE 1600x1000 JPEG q95
  const c1 = document.createElement("canvas"); c1.width = 1600; c1.height = 1000;
  let g = c1.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 1600, 1000);
  grad.addColorStop(0, "#2b6cb0"); grad.addColorStop(0.5, "#63b3ed"); grad.addColorStop(1, "#f6ad55");
  g.fillStyle = grad; g.fillRect(0, 0, 1600, 1000);
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(255,255,255," + (0.04 + (i % 5) * 0.03) + ")";
    g.beginPath(); g.arc(200 + (i * 173) % 1400, 150 + (i * 97) % 700, 30 + (i % 7) * 18, 0, 7); g.fill(); }
  g.fillStyle = "#1a202c"; g.font = "bold 64px Arial"; g.fillText("Sharpness Test 2026", 60, 120);
  g.font = "bold 28px Arial"; g.fillText("fine detail line 0123456789", 60, 950);
  g.strokeStyle = "#000"; g.lineWidth = 2;
  for (let x = 60; x < 760; x += 14) { g.beginPath(); g.moveTo(x, 860); g.lineTo(x + 7, 900); g.stroke(); }
  // PNG GRAPHIC + TRANSPARENCY 800x600
  const c2 = document.createElement("canvas"); c2.width = 800; c2.height = 600;
  let g2 = c2.getContext("2d");
  g2.clearRect(0, 0, 800, 600);
  g2.fillStyle = "#e53e3e"; g2.fillRect(60, 60, 300, 200);
  g2.fillStyle = "#2f855a"; g2.beginPath(); g2.arc(560, 300, 140, 0, 7); g2.fill();
  g2.fillStyle = "#000"; g2.font = "bold 56px Arial"; g2.fillText("PIXKIT", 70, 560);
  g2.font = "bold 22px Arial"; g2.fillText("crisp text on transparency", 70, 520);
  // PORTRAIT 900x1400 JPEG q95
  const c3 = document.createElement("canvas"); c3.width = 900; c3.height = 1400;
  let g3 = c3.getContext("2d");
  const grad3 = g3.createLinearGradient(0, 1400, 900, 0);
  grad3.addColorStop(0, "#6b46c1"); grad3.addColorStop(1, "#faf089");
  g3.fillStyle = grad3; g3.fillRect(0, 0, 900, 1400);
  g3.fillStyle = "rgba(0,0,0,0.35)";
  for (let i = 0; i < 30; i++) { g3.fillRect((i * 137) % 820, (i * 211) % 1300, 60, 60); }
  g3.fillStyle = "#111"; g3.font = "bold 72px Arial"; g3.fillText("PORTRAIT", 60, 200);
  // WEBP 1000x700
  const c4 = document.createElement("canvas"); c4.width = 1000; c4.height = 700;
  let g4 = c4.getContext("2d");
  const grad4 = g4.createLinearGradient(0, 0, 1000, 700);
  grad4.addColorStop(0, "#38a169"); grad4.addColorStop(1, "#ecc94b");
  g4.fillStyle = grad4; g4.fillRect(0, 0, 1000, 700);
  g4.fillStyle = "#111"; g4.font = "bold 60px Arial"; g4.fillText("WEBP SRC", 80, 120);
  // BIG PHOTO 3000x2000 JPEG q95
  const c5 = document.createElement("canvas"); c5.width = 3000; c5.height = 2000;
  let g5 = c5.getContext("2d");
  const grad5 = g5.createLinearGradient(0, 0, 3000, 2000);
  grad5.addColorStop(0, "#4299e1"); grad5.addColorStop(0.4, "#9f7aea"); grad5.addColorStop(1, "#f56565");
  g5.fillStyle = grad5; g5.fillRect(0, 0, 3000, 2000);
  for (let i = 0; i < 120; i++) { g5.fillStyle = "rgba(255,255,255," + (0.03 + (i % 6) * 0.025) + ")";
    g5.beginPath(); g5.arc((i * 431) % 3000, (i * 277) % 2000, 40 + (i % 9) * 22, 0, 7); g5.fill(); }
  g5.fillStyle = "#111"; g5.font = "bold 120px Arial"; g5.fillText("HI-RES 3000x2000", 100, 300);

  const defs = [
    { name: "photo-landscape.jpg", canvas: c1, file: await mk(c1, "image/jpeg", 0.95) },
    { name: "logo-transparent.png", canvas: c2, file: await mk(c2, "image/png") },
    { name: "portrait.jpg", canvas: c3, file: await mk(c3, "image/jpeg", 0.95) },
    { name: "source.webp", canvas: c4, file: await mk(c4, "image/webp", 0.95) },
    { name: "big-photo.jpg", canvas: c5, file: await mk(c5, "image/jpeg", 0.95) },
  ];
  window.__testImages = defs;
  window.__refs = {};
  for (const d of defs) {
    const bmp = await createImageBitmap(d.file);
    const c = document.createElement("canvas"); c.width = bmp.width; c.height = bmp.height;
    c.getContext("2d").drawImage(bmp, 0, 0);
    window.__refs[d.name] = c;
  }
  return defs.map(d => ({ name: d.name, size: d.file.size, type: d.file.type }));
};
