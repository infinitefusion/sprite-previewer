const SCALE = 2;

const canvases = [
  document.getElementById("c0"),
  document.getElementById("c1"),
  document.getElementById("c2")
];

const ctxs = canvases.map(c => {
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  return ctx;
});

let images = [null, null, null];

let frameIndex = 0;
let direction = 0;
let fps = 6;
let paused = false;

// ================= DRAG & DROP =================
canvases.forEach((canvas, index) => {
  canvas.addEventListener("dragover", e => e.preventDefault());

  canvas.addEventListener("drop", e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.endsWith("png")) return;

    const img = new Image();
    img.onload = () => loadSprite(index, img);
    img.src = URL.createObjectURL(file);
  });
});

// ================= LOAD SPRITE =================
function loadSprite(index, img) {
  images[index] = img;

  const frameW = img.width / 4;
  const frameH = img.height / 4;

  const displayW = frameW * SCALE;
  const displayH = frameH * SCALE;

  const dpr = window.devicePixelRatio || 1;
  const canvas = canvases[index];
  const ctx = ctxs[index];

  canvas.style.width  = displayW + "px";
  canvas.style.height = displayH + "px";
  canvas.width  = displayW * dpr;
  canvas.height = displayH * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;

  draw(index);
}

// ================= DRAW =================
function draw(index) {
  const img = images[index];
  if (!img) return;

  const ctx = ctxs[index];
  const canvas = canvases[index];

  const frameW = img.width / 4;
  const frameH = img.height / 4;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(
    img,
    frameIndex * frameW,
    direction * frameH,
    frameW,
    frameH,
    0,
    0,
    canvas.width / (window.devicePixelRatio || 1),
    canvas.height / (window.devicePixelRatio || 1)
  );
}

// ================= ANIMATION (FIXED) =================
let lastTime = 0;

function animate(timestamp) {
  if (!paused) {
    const interval = 1000 / fps;

    if (timestamp - lastTime >= interval) {
      frameIndex = (frameIndex + 1) % 4;
      canvases.forEach((_, i) => draw(i));
      lastTime = timestamp;
    }
  }
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

function exportGif(index) {
  const img = images[index];
  if (!img) return alert("No sprite loaded.");

  const frameW = img.width / 4;
  const frameH = img.height / 4;

  const off = document.createElement("canvas");
  off.width  = frameW * SCALE;
  off.height = frameH * SCALE;

  const offCtx = off.getContext("2d");
  offCtx.imageSmoothingEnabled = false;

  const frames = [];

  for (let f = 0; f < 4; f++) {
    // ✅ HARD CLEAR WITH BACKGROUND COLOR
    offCtx.fillStyle = "#8bb0d8";
    offCtx.fillRect(0, 0, off.width, off.height);

    offCtx.drawImage(
        img,
        f * frameW,
        direction * frameH,
        frameW,
        frameH,
        0,
        0,
        off.width,
        off.height
    );

    frames.push(off.toDataURL("image/png"));
  }

  gifshot.createGIF(
      {
        images: frames,
        interval: 1 / fps,
        gifWidth: off.width,
        gifHeight: off.height,

        // ✅ MATCH THE CANVAS CLEAR COLOR
        background: "#8bb0d8",

        // ✅ PREVENT GHOSTING / ARTIFACTS
        dither: false,
        sampleInterval: 1,
        numWorkers: 2
      },
      result => {
        if (!result.error) {
          const a = document.createElement("a");
          a.href = result.image;
          a.download = "sprite.gif";
          a.click();
        }
      }
  );
}




// ================= CONTROLS =================
document.getElementById("fps").addEventListener("input", e => {
  fps = +e.target.value;
});

document.getElementById("pause").onclick = () => {
  paused = !paused;
};

document.getElementById("next").onclick = () => {
  if (paused) {
    frameIndex = (frameIndex + 1) % 4;
    canvases.forEach((_, i) => draw(i));
  }
};

// Direction buttons
document.querySelectorAll("button[data-dir]").forEach(btn => {
  btn.onclick = () => {
    direction = +btn.dataset.dir;
    canvases.forEach((_, i) => draw(i));
  };
});

// ================= KEYBOARD =================
window.addEventListener("keydown", e => {
  if (e.key === "ArrowDown") direction = 0;
  if (e.key === "ArrowLeft") direction = 1;
  if (e.key === "ArrowRight") direction = 2;
  if (e.key === "ArrowUp") direction = 3;

  canvases.forEach((_, i) => draw(i));
});
