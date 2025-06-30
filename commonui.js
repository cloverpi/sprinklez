const canvasElement = document.getElementById("secret");
const context = canvasElement.getContext("2d");

const { width, height } = canvasElement;
const patreonLogo = newImage("https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Patreon_logo.svg/541px-Patreon_logo.svg.png?20140225173435");

export function newImage(src) {
    const img = new Image();
    img.src = src;
    return img;
}

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

export function drawLegendLine(boxX, boxY, boxWidth, boxHeight, colors) {
  const text = "The legend of Sprinklez will continue...";
  const fontSize = 26;
  const legendX = boxX + boxWidth / 2;
  const legendY = boxY + boxHeight + 90;

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

export function cheeseParagraph(text, colors) {
  const paragraph = text;

  const boxX = 200;
  const boxY = 240;
  const boxWidth = 580;
  const boxHeight = 140;

  const paddingY = 20;
  const lineHeight = 26;
  const maxTextWidth = 300;

  context.save();
  
  const words = paragraph.split(" ");
  const lines = [];

  let currentLine = "";
  for (let word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(testLine).width > maxTextWidth && currentLine !== "") {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  
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

export function drawEndScreenBackground(colors) {
  context.save();

  const bgGrad = context.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, colors.bgTop);
  bgGrad.addColorStop(1, colors.bgBottom);
  context.fillStyle = bgGrad;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = colors.grid;
  context.lineWidth = 1;
  for (let x = 0; x < width; x += 40) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = 0; y < height; y += 40) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  context.restore();
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