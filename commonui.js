const canvasElement = document.getElementById("secret");
const context = canvasElement.getContext("2d");

const { width, height } = canvasElement;
const patreonLogo = newImage("https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Patreon_logo.svg/541px-Patreon_logo.svg.png?20140225173435");
let patreonArea;

export function newImage(src) {
    const img = new Image();
    img.src = src;
    return img;
}

export const AudioManager = (() => {
    const playing = [];

    function play(audio, onEndCallback) {
        if (!(audio instanceof Audio)) throw new Error("Not an Audio object.");

        audio.currentTime = 0;
        audio.play().catch(() => {});
        playing.push(audio);

        const handleEnded = () => {
            const index = playing.indexOf(audio);
            if (index !== -1) playing.splice(index, 1);
            if (typeof onEndCallback === "function") {
                onEndCallback(audio);
            }
        };

        audio.onended = handleEnded;
    }

    function stop(audio) {
        if (!(audio instanceof Audio)) return;

        audio.pause();
        audio.currentTime = 0;

        const index = playing.indexOf(audio);
        if (index !== -1) playing.splice(index, 1);
    }

    function stopAll() {
        for (const audio of playing) {
            audio.pause();
            audio.currentTime = 0;
        }
        playing.length = 0;
    }

    function getPlaying() {
        return playing.slice();
    }

    return {
        play,
        stop,
        stopAll,
        getPlaying
    };
})();

export function newAudio(src, vol, pr = 1) {
    const snd = new Audio(src);
    snd.volume = vol;
    snd.playbackRate = pr;
    return snd;
}

export const InputLock = (() => {
  let lockUntil = 0;
  function lock(ms = 250) {
    lockUntil = Date.now() + ms;
  }
  function isLocked() {
    return Date.now() < lockUntil;
  }
  function clear() {
    lockUntil = 0;
  }
  return {
    lock,
    isLocked,
    clear
  }
})();

export function roundRect(x, y, w, h, r) {
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + w - r, y);
  context.quadraticCurveTo(x + w, y, x + w, y + r);
  context.lineTo(x + w, y + h - r);
  context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  context.lineTo(x + r, y + h);
  context.quadraticCurveTo(x, y + h, x, y + h - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

export function drawCopyButton(x, y, textToCopy, callback) {
  const width = 48;
  const height = 64;
  const padding = 25; // extra space for glow/text
  const textOffset = 20;

  const bgX = x - padding;
  const bgY = y - padding;
  const bgW = width + padding * 2;
  const bgH = height + padding * 2 + textOffset;

  const notchSize = 10;
  const fauxLines = 3;

  let isHovered = false;
  let pressUntil = 0;
  let copiedUntil = 0;

  // Background snapshot
  const background = context.getImageData(bgX, bgY, bgW, bgH);

  // Draw the button and surrounding state
  function draw() {
    const now = Date.now();
    const pressOffset = now < pressUntil ? 2 : 0;

    // Restore background
    context.putImageData(background, bgX, bgY);

    // BACK PAGE
    context.save();
    context.fillStyle = "#d0d0d0";
    context.strokeStyle = "#aaa";
    context.lineWidth = 1;
    context.translate(2, -2);
    context.fillRect(x, y, width, height);
    context.strokeRect(x, y, width, height);
    context.restore();

    // FRONT PAGE
    context.save();
    context.translate(0, pressOffset);
    context.fillStyle = "#ffffff";
    context.strokeStyle = isHovered ? "#00b4ff" : "#bbb";
    context.lineWidth = 2;

    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + width - notchSize, y);
    context.lineTo(x + width, y + notchSize);
    context.lineTo(x + width, y + height);
    context.lineTo(x, y + height);
    context.closePath();
    context.fill();
    context.stroke();

    // Faux text lines
    context.strokeStyle = "#ccc";
    context.lineWidth = 1;
    for (let i = 0; i < fauxLines; i++) {
      const lineY = y + 10 + i * 10;
      context.beginPath();
      context.moveTo(x + 6, lineY);
      context.lineTo(x + width - 6, lineY);
      context.stroke();
    }

    // Icon
    context.font = "bold 16px 'Segoe UI', sans-serif";
    context.fillStyle = "#00b4ff";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("🔗", x + width / 2, y + height / 2 + 8);

    // Short code
    context.font = "10px 'Segoe UI', sans-serif";
    context.fillStyle = "#333";
    context.fillText("/verify", x + width / 2, y + height / 2 + 24);

    // Label text
    context.font = "12px 'Segoe UI', sans-serif";
    context.fillStyle = "#00b4ff";
    context.fillText("Copy Stats URL", x + width / 2, y + height + textOffset);

    // "Link copied!" above button
    if (now < copiedUntil) {
      context.font = "bold 14px 'Segoe UI', sans-serif";
      context.fillStyle = "#00b4ff";
      context.fillText("Link copied!", x + width / 2, y - 10);
    }

    context.restore();
  }

  // Mousemove: detect hover and redraw
  canvasElement.addEventListener("mousemove", (e) => {
    const rect = canvasElement.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const hovering = mx >= x && mx <= x + width && my >= y && my <= y + height;
    if (hovering !== isHovered) {
      isHovered = hovering;
      draw(); // only redraw on hover state change
    }
  });

  // Mousedown: press effect
  canvasElement.addEventListener("mousedown", (e) => {
    if (InputLock.isLocked()) return;
    const rect = canvasElement.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const inside = mx >= x && mx <= x + width && my >= y && my <= y + height;
    if (inside) {
      pressUntil = Date.now() + 100;
      draw(); // show pressed state
    }
  });

  // Mouseup: copy logic
  canvasElement.addEventListener("mouseup", (e) => {
    if (InputLock.isLocked()) return;
    const rect = canvasElement.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const inside = mx >= x && mx <= x + width && my >= y && my <= y + height;
    if (inside) {
      copiedUntil = Date.now() + 2000;
      navigator.clipboard.writeText(textToCopy);
      callback?.();
      draw(); // show "link copied!"
      setTimeout(()=>draw(), 4000);
    }
  });

  return draw;
}


export function drawLegendLine(boxX, boxY, boxWidth, boxHeight, colors) {
  const text = "The legend of Sprinklez will continue...";
  const fontSize = 26;
  const legendX = boxX + boxWidth / 2;
  const legendY = boxY + boxHeight + 60;

  context.save();
  context.font = `italic bold ${fontSize}px 'Segoe UI', Arial`;
  context.textBaseline = "top";
  context.textAlign = "center";

  context.shadowColor = colors.shadow;
  context.shadowBlur = 12;
  context.fillStyle = colors.fill;
  context.fillText(text, legendX, legendY);

  context.shadowColor = "transparent";
  context.fillStyle = colors.highlight;
  context.fillText(text, legendX, legendY);

  context.lineWidth = 1.5;
  context.strokeStyle = colors.stroke;
  context.strokeText(text, legendX, legendY);
  context.restore();
}

export function drawEndScreenHeading(text, centerX, y, colors) {
  context.save();
  context.font = "bold 72px 'Segoe UI', Arial";
  context.textBaseline = "top";
  context.textAlign = "center";

  context.shadowColor = colors.shadow;
  context.shadowBlur = 25;
  context.fillStyle = colors.fill;
  context.fillText(text, centerX, y);

  context.shadowColor = "transparent";
  context.fillStyle = colors.highlight;
  context.fillText(text, centerX, y);

  context.lineWidth = 1.5;
  context.strokeStyle = colors.stroke;
  context.strokeText(text, centerX, y);
  context.restore();
}

export function cheeseParagraph(text, colors, boxX = 200, boxY = 240, boxWidth = 580, boxHeight = 140) {
  const paddingY = 20;
  const lineHeight = 26;
  const maxTextWidth = 500;

  context.save();
  context.font = "18px 'Segoe UI', Arial";

  const rawLines = text.split("\n");
  const lines = [];

  for (const rawLine of rawLines) {
    const words = rawLine.split(" ");
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (context.measureText(testLine).width > maxTextWidth && currentLine !== "") {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) lines.push(currentLine);
  }

  context.fillStyle = colors.boxFill;
  roundRect(boxX, boxY, boxWidth, boxHeight, 22);
  context.fill();

  context.shadowColor = colors.boxShadow;
  context.shadowBlur = 15;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  context.globalCompositeOperation = "source-atop";
  roundRect(boxX, boxY, boxWidth, boxHeight, 22);
  context.fill();
  context.restore();

  const textX = boxX + 285;
  let textY = boxY + paddingY;

  context.save();
  context.font = "18px 'Segoe UI', Arial";
  context.fillStyle = colors.textFill;
  context.textBaseline = "top";
  context.textAlign = "center";
  context.shadowColor = colors.textShadow;
  context.shadowBlur = 3;
  context.shadowOffsetX = 1;
  context.shadowOffsetY = 1;

  for (const line of lines) {
    context.fillText(line, textX, textY);
    textY += lineHeight;
  }
  context.restore();

  return {
    boxX,
    boxY,
    boxWidth,
    boxHeight,
    contentBottom: textY,
    centerX: boxX + boxWidth / 2,
  };
}

export function drawBackgroundGrid(grid, w = width, h = height) {
  context.save();

  context.strokeStyle = grid;
  context.lineWidth = 1;
  for (let x = 0; x < w; x += 40) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, h);
    context.stroke();
  }
  for (let y = 0; y < h; y += 40) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(w, y);
    context.stroke();
  }
  context.restore();
}

export function drawEndScreenBackground(colors) {
  context.save();

  const bgGrad = context.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, colors.bgTop);
  bgGrad.addColorStop(1, colors.bgBottom);
  context.fillStyle = bgGrad;
  context.fillRect(0, 0, width, height);

   context.restore();

  drawBackgroundGrid(colors.grid);
}

export function drawPatreonButton(x, y, width = 225, height = 40, colors = {}, onLoadCallback) {
    patreonLogo.onload = () => {
        console.log("Patreon logo loaded");
        if (typeof onLoadCallback == "function") onLoadCallback();
    };
  context.save();

  const {
    fill = "#FF424D",
    shadow = "rgba(255, 66, 77, 0.8)",
    text = "white"
  } = colors;

  context.fillStyle = fill;
  context.shadowColor = shadow;
  context.shadowBlur = 10;
  roundRect(context, x, y, width, height, 20);
  context.fill();

  const logoHeight = height * 0.6;
  const logoWidth = (patreonLogo.width / patreonLogo.height) * logoHeight;

  if (patreonLogo.complete && patreonLogo.naturalWidth !== 0) {
    context.drawImage(patreonLogo, x + 12, y + (height - logoHeight) / 2, logoWidth, logoHeight);
  }

  context.font = "bold 18px 'Segoe UI', Arial";
  context.textBaseline = "middle";
  context.textAlign = "left";
  context.fillStyle = text;
  context.shadowColor = "transparent";
  context.fillText("Support on Patreon", x + 12 + logoWidth + 10, y + height / 2);
  context.restore();

  canvasElement.addEventListener("click", (e) => {
    if (InputLock.isLocked()) return;
    const rect = canvasElement.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (
      clickX >= x &&
      clickX <= x + width &&
      clickY >= y &&
      clickY <= y + height
    ) {
      window.open("https://patreon.com/CloverPi", "_blank");
    }
  });

  canvasElement.addEventListener("mousemove", (e)=> {
  const rect = canvasElement.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const inside =
      mouseX >= x &&
      mouseX <= x + width &&
      mouseY >= y &&
      mouseY <= y + height;

    canvasElement.style.cursor = inside ? "pointer" : "default";
  });

  return { x, y, width, height };
}

export function drawFooter(colors = {}, patreonColors = {}, onLoadCallback) {
  context.save();
  const footerY = height - 70;
  const footerCenterX = width / 2 + 75;
  const patreonBtnX = footerCenterX - 100;
  const patreonBtnY = footerY;

  drawPatreonButton(patreonBtnX, patreonBtnY, 225, 40, patreonColors, onLoadCallback);

  context.font = "14px 'Segoe UI', Arial";
  context.textAlign = "center";
  context.textBaseline = "top";
  context.shadowColor = colors.shadow || "rgba(0,0,0,0.6)";
  context.shadowBlur = 4;
  context.fillStyle = colors.fill || "#888";
  context.fillText("© 2025 CloverPi | Written by Gnerf-Whitemane", width / 2 + 75, footerY + 50);

  context.restore();
}