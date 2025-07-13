import { newImage, drawBackgroundGrid, roundRect } from './commonui.js';
import { createButton, clearButtons, buttonDraw } from './button.js';
import { startMenu } from './menu.js';

const canvasElement = document.getElementById("secret");
const ctx = canvasElement.getContext("2d");
const { width, height } = canvasElement;

const topHeight = height * 2 / 3;
const bottomHeight = height - topHeight;
const leftY = topHeight / 2 + 30;
const rightY = topHeight / 2 - 30;
const featherThickness = 15;

function createGridPattern(grid) {
    drawBackgroundGrid(grid);
}

const bossImage = newImage("images/amber-shaper-title.webp");
const raiderImage = newImage("images/will-title.webp");
const bottombg = newImage("images/bg-title.webp");

export function drawTitle() {
  if (!bossImage.complete) bossImage.onload = () => drawTitle();
  if (!raiderImage.complete) raiderImage.onload = () => drawTitle();
  if (!bottombg.complete) bottombg.onload = () => drawTitle();


  // === Red ENEMY Section ===
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, leftY);
  ctx.lineTo(width, rightY);
  ctx.lineTo(width, topHeight);
  ctx.lineTo(0, topHeight);
  ctx.closePath();
  ctx.clip();

  const gradEnemy = ctx.createLinearGradient(0, 0, 0, topHeight);
  gradEnemy.addColorStop(0, "#330000");
  gradEnemy.addColorStop(1, "#110000");
  ctx.fillStyle = gradEnemy;
  ctx.fillRect(0, 0, width, height);
  createGridPattern("rgba(255,80,80,0.2)");
  ctx.restore();

  // === Glowing Border for ENEMY Section ===
  ctx.save();
  ctx.strokeStyle = "rgba(255, 80, 80, 0.4)";
  ctx.lineWidth = 4;
  ctx.shadowColor = "rgba(255, 80, 80, 0.6)";
  ctx.shadowBlur = 12;

  ctx.beginPath();
  ctx.moveTo(0, leftY);
  ctx.lineTo(width, rightY);
  ctx.lineTo(width, topHeight);
  ctx.lineTo(0, topHeight);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // === Blue PLAYER Section ===
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, rightY);
  ctx.lineTo(0, leftY);
  ctx.closePath();
  ctx.clip();

  const gradPlayer = ctx.createLinearGradient(0, 0, 0, topHeight);
  gradPlayer.addColorStop(0, "#001322");
  gradPlayer.addColorStop(1, "#000000");
  ctx.fillStyle = gradPlayer;
  ctx.fillRect(0, 0, width, height);

  createGridPattern("rgba(0,180,255,0.2)");
  ctx.restore();

  // === Glowing Border for PLAYER Section ===
  ctx.save();
  ctx.strokeStyle = "rgba(0, 180, 255, 0.4)";
  ctx.lineWidth = 4;
  ctx.shadowColor = "rgba(0, 180, 255, 0.6)";
  ctx.shadowBlur = 12;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, rightY);
  ctx.lineTo(0, leftY);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();


  // === Feathered Divider Shadow ===
  const p1 = { x: 0, y: leftY };
  const p2 = { x: width, y: rightY };

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / len;
  const ny = dx / len;

  const p3 = { x: p2.x + nx * featherThickness, y: p2.y + ny * featherThickness };
  const p4 = { x: p1.x + nx * featherThickness, y: p1.y + ny * featherThickness };

  const featherGrad = ctx.createLinearGradient(p1.x, p1.y, p4.x, p4.y);
  featherGrad.addColorStop(0, "rgba(0, 0, 0, 0.2)");
  featherGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = featherGrad;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.lineTo(p4.x, p4.y);
  ctx.closePath();
  ctx.fill();

  ctx.drawImage(bossImage, 500, 175);
  ctx.drawImage(raiderImage, 10, -60);

  // === Lower Section: Black Panel ===
  // ctx.fillStyle = "#000";
  // ctx.fillRect(0, topHeight, width, bottomHeight);
  ctx.drawImage(bottombg, 0, topHeight);

  // Top
  let grad = ctx.createLinearGradient(0, topHeight, 0, topHeight + 100);
  grad.addColorStop(0, "rgba(0,0,0,0.9)");
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, topHeight, width, 100);

  // Bottom
  grad = ctx.createLinearGradient(0, topHeight + bottomHeight, 0, topHeight + bottomHeight - 100);
  grad.addColorStop(0, "rgba(0,0,0,0.9)");
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, topHeight + bottomHeight - 100, width, 100);

  // Left
  grad = ctx.createLinearGradient(0, 0, 100, 0);
  grad.addColorStop(0, "rgba(0,0,0,0.9)");
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, topHeight, 100, bottomHeight);

  // Right
  grad = ctx.createLinearGradient(width, 0, width - 100, 0);
  grad.addColorStop(0, "rgba(0,0,0,0.9)");
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(width - 100, topHeight, 100, bottomHeight);

  ctx.strokeStyle = "#106197"; // Choose a third, neutral anchor color
  ctx.lineWidth = 4;
  ctx.beginPath();
  // Left
  ctx.moveTo(0, topHeight);
  ctx.lineTo(0, height);
  // Right
  ctx.moveTo(width, topHeight);
  ctx.lineTo(width, height);
  // Bottom
  ctx.moveTo(0, height);
  ctx.lineTo(width, height);
  ctx.stroke();

  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.translate(0, topHeight);
  drawBackgroundGrid("#106197", width, bottomHeight); // muted cyan or themed grid
  ctx.restore();

  // ctx.save();
  // ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  // ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  // ctx.lineWidth = 1.5;

  // roundRect(40, topHeight + 20, width - 80, bottomHeight - 40, 20);
  // ctx.fill();
  // ctx.stroke();
  // ctx.restore();


  // === Draw VS and Labels ===
  ctx.font = "bold 90px sans-serif";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText("VS", width / 2, topHeight / 2 + 35);

  ctx.font = "bold 48px sans-serif";
  ctx.fillText("The Undying Sprinklez", width / 2+60, (leftY+10) / 2);
  ctx.fillText("Amber-Shaper Un'Sok", width / 2-120, (rightY + topHeight) / 2+40);

  // === Draw Visual Buttons on Black Section ===


  // "How to" header
  // ctx.font = "bold 28px sans-serif";
  // ctx.fillStyle = "#88ccff";
  // ctx.textAlign = "center";
  // ctx.fillText("How to", width / 2, topHeight + 40);

  // Button Row: Mechanics & Keybinds
  buttonDraw();
}

  // function drawButton(x, y, w, h, text) {
  //   ctx.save();
  //   ctx.fillStyle = "#007BFF";
  //   ctx.shadowColor = "rgba(0,180,255,0.4)";
  //   ctx.shadowBlur = 8;
  //   ctx.lineJoin = "round";
  //   ctx.beginPath();
  //   const r = 10;
  //   ctx.moveTo(x + r, y);
  //   ctx.lineTo(x + w - r, y);
  //   ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  //   ctx.lineTo(x + w, y + h - r);
  //   ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  //   ctx.lineTo(x + r, y + h);
  //   ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  //   ctx.lineTo(x, y + r);
  //   ctx.quadraticCurveTo(x, y, x + r, y);
  //   ctx.closePath();
  //   ctx.fill();

  //   ctx.fillStyle = "#fff";
  //   ctx.font = "bold 20px sans-serif";
  //   ctx.textAlign = "center";
  //   ctx.textBaseline = "middle";
  //   ctx.fillText(text, x + w / 2, y + h / 2);
  //   ctx.restore();
  // }


export function title(mechanics, controls, start) {
  clearButtons();

  createButton({
          x: 220,
          y: topHeight + 50,
          width: 160,
          height: 40,
          text: "Mechanics",
          color: "#4588c7",
          textColor: "#fff",
          onClick: () => mechanics(startMenu, start)
      });

  createButton({
        x: 420,
        y: topHeight + 50,
        width: 160,
        height: 40,
        text: "Controls",
        color: "#66cc66",
        textColor: "#fff",
        onClick: () => controls(startMenu, start)
    });

    createButton({
        x: 220,
        y: topHeight + 140,
        width: 360,
        height: 40,
        text: "Start",
        color: "#ff1e00",
        textColor: "#fff",
        onClick: () => start()
    });
    drawTitle();
}