import { newImage, drawBackgroundGrid, drawEndScreenHeading, InputLock, newAudio, AudioManager, MuteIcon } from './commonui.js';
import { createButton, clearButtons, buttonDraw } from './button.js';
import { startMenu } from './menu.js';

const canvasElement = document.getElementById("secret");
const context = canvasElement.getContext("2d");
const { width, height } = canvasElement;
const replay = getCookie("replay").toLowerCase() == "true" ? true : false;

const topHeight = height * 2 / 3;
const bottomHeight = height - topHeight;
const leftY = topHeight / 2 + 30;
const rightY = topHeight / 2 - 30;
const featherThickness = 15;

const hitZones = [];

const muteIcon = MuteIcon();
const music = newAudio("sounds/music/snow.mp3", 0.3);
const bossImage = newImage("images/amber-shaper-title.webp");
const raiderImage = newImage("images/will-title.webp");
const bottombg = newImage("images/bg-title.webp");

const patreonImage = newImage("images/patreon.svg");
const githubImage = newImage("images/github.svg");

function handleMouseMove(e) {
  const rect = canvasElement.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  let insideZones = 0;

  hitZones.forEach( (z) => {
    const inside =
        mouseX >= z.x &&
        mouseX <= z.x + z.width &&
        mouseY >= z.y &&
        mouseY <= z.y + z.height;

    if (inside) insideZones++
  });
  canvasElement.style.cursor = insideZones > 0 ? "pointer" : "default";
}

function handleMouseUp(e) {
  const rect = canvasElement.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  let insideZones = 0;

  hitZones.forEach( (z) => {
    if (!InputLock.isLocked()) {
      const inside =
          mouseX >= z.x &&
          mouseX <= z.x + z.width &&
          mouseY >= z.y &&
          mouseY <= z.y + z.height;

      if (inside) z.onClick();
    }
  });
}

function drawPatreonImage(x, y, width = 225, height = 40) {
  context.save();

  const logoHeight = height * 0.6;
  const logoWidth = (patreonImage.width / patreonImage.height) * logoHeight;
  const patreonText = "Patreon";

  context.font = "bold 18px 'Segoe UI', Arial";
  context.textBaseline = "middle";
  context.textAlign = "left";
  context.fillStyle = "#fff";
  context.shadowColor = "transparent";
  context.fillText(patreonText, x + 10, y + height / 2);
  
  if (patreonImage.complete && patreonImage.naturalWidth !== 0) {
    context.drawImage(patreonImage, x + 18 + context.measureText(patreonText).width , (y + (height - logoHeight) / 2)-2, logoWidth, logoHeight);
  }
  context.restore();

  hitZones.push({x,y,width,height, onClick: () => { 
    InputLock.lock();
    window.open("https://patreon.com/CloverPi", "_blank"); 
  } });

  return { x, y, width, height };
}

function drawGithub(x, y, width = 125, height = 40) {
  context.save();

  const logoHeight = height * 0.6;
  const logoWidth = (githubImage.width / githubImage.height) * logoHeight;
  const githubText = "GitHub";

  context.font = "bold 18px 'Segoe UI', Arial";
  context.textBaseline = "middle";
  context.textAlign = "left";
  context.fillStyle = "#fff";
  context.shadowColor = "transparent";
  context.fillText(githubText, x + 20 + logoWidth, y + height / 2);
  
  if (githubImage.complete && githubImage.naturalWidth !== 0) {
    context.drawImage(githubImage, x + 10 , (y + (height - logoHeight) / 2)-2, logoWidth, logoHeight);
  }
  context.restore();

  hitZones.push({x,y,width,height, onClick: () => { 
    InputLock.lock();
    window.open("https://github.com/cloverpi/sprinklez", "_blank"); 
  } });

  return { x, y, width, height };
}

export function drawTitle() {
  if (!bossImage.complete) bossImage.onload = () => drawTitle();
  if (!raiderImage.complete) raiderImage.onload = () => drawTitle();
  if (!bottombg.complete) bottombg.onload = () => drawTitle();
  if (!patreonImage.complete) patreonImage.onload = () => drawTitle();
  if (!githubImage.complete) githubImage.onload = () => drawTitle();


  // === Red ENEMY Section ===
  context.save();
  context.beginPath();
  context.moveTo(0, leftY);
  context.lineTo(width, rightY);
  context.lineTo(width, topHeight);
  context.lineTo(0, topHeight);
  context.closePath();
  context.clip();

  const gradEnemy = context.createLinearGradient(0, 0, 0, topHeight);
  gradEnemy.addColorStop(0, "#330000");
  gradEnemy.addColorStop(1, "#110000");
  context.fillStyle = gradEnemy;
  context.fillRect(0, 0, width, height);
  drawBackgroundGrid("rgba(255,80,80,0.2)");
  context.restore();

  context.save();
  context.strokeStyle = "rgba(255, 80, 80, 0.4)";
  context.lineWidth = 4;
  context.shadowColor = "rgba(255, 80, 80, 0.6)";
  context.shadowBlur = 12;

  context.beginPath();
  context.moveTo(0, leftY);
  context.lineTo(width, rightY);
  context.lineTo(width, topHeight);
  context.lineTo(0, topHeight);
  context.closePath();
  context.stroke();
  context.restore();

  // === Blue PLAYER Section ===
  context.save();
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(width, 0);
  context.lineTo(width, rightY);
  context.lineTo(0, leftY);
  context.closePath();
  context.clip();

  const gradPlayer = context.createLinearGradient(0, 0, 0, topHeight);
  gradPlayer.addColorStop(0, "#001322");
  gradPlayer.addColorStop(1, "#000000");
  context.fillStyle = gradPlayer;
  context.fillRect(0, 0, width, height);

  drawBackgroundGrid("rgba(0,180,255,0.2)");
  context.restore();

  context.save();
  context.strokeStyle = "rgba(0, 180, 255, 0.4)";
  context.lineWidth = 4;
  context.shadowColor = "rgba(0, 180, 255, 0.6)";
  context.shadowBlur = 12;

  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(width, 0);
  context.lineTo(width, rightY);
  context.lineTo(0, leftY);
  context.closePath();
  context.stroke();
  context.restore();
  const p1 = { x: 0, y: leftY };
  const p2 = { x: width, y: rightY };

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / len;
  const ny = dx / len;

  const p3 = { x: p2.x + nx * featherThickness, y: p2.y + ny * featherThickness };
  const p4 = { x: p1.x + nx * featherThickness, y: p1.y + ny * featherThickness };

  const featherGrad = context.createLinearGradient(p1.x, p1.y, p4.x, p4.y);
  featherGrad.addColorStop(0, "rgba(0, 0, 0, 0.2)");
  featherGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

  context.fillStyle = featherGrad;
  context.beginPath();
  context.moveTo(p1.x, p1.y);
  context.lineTo(p2.x, p2.y);
  context.lineTo(p3.x, p3.y);
  context.lineTo(p4.x, p4.y);
  context.closePath();
  context.fill();

  context.drawImage(bossImage, 500, 175);
  context.drawImage(raiderImage, 10, -60);

  context.drawImage(bottombg, 0, topHeight);

  // Top
  let grad = context.createLinearGradient(0, topHeight, 0, topHeight + 100);
  grad.addColorStop(0, "rgba(0,0,0,0.9)");
  grad.addColorStop(1, "transparent");
  context.fillStyle = grad;
  context.fillRect(0, topHeight, width, 100);

  // Bottom
  grad = context.createLinearGradient(0, topHeight + bottomHeight, 0, topHeight + bottomHeight - 100);
  grad.addColorStop(0, "rgba(0,0,0,0.9)");
  grad.addColorStop(1, "transparent");
  context.fillStyle = grad;
  context.fillRect(0, topHeight + bottomHeight - 100, width, 100);

  // Left
  grad = context.createLinearGradient(0, 0, 100, 0);
  grad.addColorStop(0, "rgba(0,0,0,0.9)");
  grad.addColorStop(1, "transparent");
  context.fillStyle = grad;
  context.fillRect(0, topHeight, 100, bottomHeight);

  // Right
  grad = context.createLinearGradient(width, 0, width - 100, 0);
  grad.addColorStop(0, "rgba(0,0,0,0.9)");
  grad.addColorStop(1, "transparent");
  context.fillStyle = grad;
  context.fillRect(width - 100, topHeight, 100, bottomHeight);

  context.strokeStyle = "#106197"; 
  context.lineWidth = 4;
  context.beginPath();
  // Left
  context.moveTo(0, topHeight);
  context.lineTo(0, height);
  // Right
  context.moveTo(width, topHeight);
  context.lineTo(width, height);
  // Bottom
  context.moveTo(0, height);
  context.lineTo(width, height);
  context.stroke();

  context.save();
  context.globalAlpha = 0.25;
  context.translate(0, topHeight);
  drawBackgroundGrid("#106197", width, bottomHeight); 
  context.restore();

  context.font = "bold 90px sans-serif";
  context.fillStyle = "#fff";
  context.textAlign = "center";
  context.fillText("VS", width / 2, topHeight / 2 + 35);

  context.font = "bold 48px sans-serif";
  context.fillText("The Undying Sprinklez", width / 2+60, (leftY+10) / 2);
  context.fillText("Amber-Shaper Un'Sok", width / 2-120, (rightY + topHeight) / 2+40);

  drawPatreonImage(683, 690);
  drawGithub(0, 690);

  buttonDraw();
  muteIcon.draw();
}

function LoadingScreen(mechanics, controls, start) {
  const image = newImage("images/raider.webp");

  function drawOrbitingImage({centerX, centerY, radius, angleRad, imgWidth, imgHeight}) {
    const x = centerX + Math.cos(angleRad) * radius;
    const y = centerY + Math.sin(angleRad) * radius;
    context.save();
    context.translate(x, y);
    context.rotate(angleRad + Math.PI / 2);
    context.drawImage(image, -imgWidth / 2, -imgHeight, imgWidth, imgHeight);
    context.restore();
  }

  let angle = 0;
  let UPDATEFREQ = 16.67;  //~60fps
  let lastUpdate = Date.now();
  const text="Loading...";
  const centerX = width/2;
  const centerY = height/2;
  function animate() {
    if ( lastUpdate+Date.now() >= UPDATEFREQ ) {
      lastUpdate = Date.now();
      context.clearRect(0, 0, width, height);
      drawBackgroundGrid("rgba(0,180,255,0.2)");

      context.save();
      context.font = "bold 48px 'Segoe UI', Arial";
      context.textBaseline = "middle";
      context.textAlign = "center";

      context.shadowColor = "rgba(0,180,255,0.8)";
      context.shadowBlur = 25;
      context.fillStyle = "#00B4FF";
      context.fillText(text, centerX, centerY);

      context.shadowColor = "transparent";
      context.fillStyle = "#e0f7ff";
      context.fillText(text, centerX, centerY);

      context.lineWidth = 1.5;
      context.strokeStyle = "#a0e0ff";
      context.strokeText(text, centerX, centerY);
      context.restore();

      drawOrbitingImage({
        centerX: width/2,
        centerY: height/2,
        radius: 120,
        angleRad: angle,
        imgWidth: 64,
        imgHeight: 64
      });
        angle += 0.025;
    }
    if (document.readyState != "complete"){ 
      requestAnimationFrame(animate); 
    } else {
      title(mechanics,controls,start);
    }
  }
  animate();
}

export function title(mechanics, controls, start) {
  if (document.readyState == "complete") {
      clearButtons();

      const canvasCenterX = canvasElement.width / 2;

      const smallButtonWidth = 160 * 0.75;
      const largeButtonWidth = 280 * 1.11;

      const mechanicsY = topHeight + 80;
      const controlsY = topHeight + 80;
      const startY = topHeight + 140;

      if (replay) {
        createButton({
          x: canvasCenterX - smallButtonWidth - 10,
          y: mechanicsY,
          width: 160,
          height: 40,
          scale: 0.75,
          text: "Mechanics",
          color: "#4588c7",
          textColor: "#fff",
          onClick: () => {
            cleanupTitle();
            mechanics(startMenu, start);
          }
        });

        createButton({
          x: canvasCenterX + 10,
          y: controlsY,
          width: 160,
          height: 40,
          scale: 0.75,
          text: "Controls",
          color: "#66cc66",
          textColor: "#fff",
          onClick: () => {
            cleanupTitle();
            controls(startMenu, start);
          }
        });
      }

      createButton({
        x: canvasCenterX - (largeButtonWidth / 2),
        y: startY,
        width: 280,
        height: 40,
        scale: 1.11,
        text: "Start",
        color: "#ff1e00",
        textColor: "#fff",
        onClick: () => {
          cleanupTitle();
          if (replay) {
            start();
          } else {
            controls(startMenu, mechanics);
          }
        }
      });

      canvasElement.addEventListener("mouseup", handleMouseUp);
      canvasElement.addEventListener("mousemove", handleMouseMove);
      muteIcon.attach();

      drawTitle();
  } else {
    LoadingScreen(mechanics, controls, start);
  }
}

function cleanupTitle(){
  canvasElement.removeEventListener('mousemove', handleMouseMove);
  canvasElement.removeEventListener('mouseup', handleMouseUp);
  muteIcon.detach();
}

function enableMusicAutoplayOnUserInput() {
  const unlock = () => {
    music.loop = "true";
    AudioManager.play(music);
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
}

enableMusicAutoplayOnUserInput();


