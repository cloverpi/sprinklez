import { drawLegendLine, drawEndScreenHeading, cheeseParagraph, drawEndScreenBackground, drawFooter, newImage, newAudio, AudioManager, drawCopyButton, roundRect } from './commonui.js'
import { createButton, clearButtons, buttonDraw } from './button.js';

const LZString = window.LZString;

const canvasElement = document.getElementById("secret");
const context = canvasElement.getContext("2d");

const { width, height } = canvasElement;
const winImage = newImage("images/wooo2.webp");
const victorySound = newAudio("sounds/victory.ogg", 0.5);
const failureSound = newAudio("sounds/failure.ogg", 0.5);

function drawEndScreenImage(colors, onLoadCallback) {
  if (winImage.complete) {
    context.save();
    const glowX = 95;
    const glowY = 320;
    const glowRadius = 140;

    const radGrad = context.createRadialGradient(
      glowX,
      glowY,
      glowRadius * 0.3,
      glowX,
      glowY,
      glowRadius
    );
    radGrad.addColorStop(0, colors.glowCenter);
    radGrad.addColorStop(1, colors.glowEdge);

    context.fillStyle = radGrad;
    context.shadowColor = colors.glowShadow;
    context.shadowBlur = 18;
    context.beginPath();
    context.arc(glowX, glowY, glowRadius, 0, 2 * Math.PI);
    context.fill();

    context.shadowColor = colors.imageShadow;
    context.shadowBlur = 20;
    context.shadowOffsetX = 5;
    context.shadowOffsetY = 5;
    context.drawImage(winImage, 25, 165);
    context.restore();
  } else {
    winImage.onload = () => onLoadCallback();
  }
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const hh = hrs.toString().padStart(2, '0');
    const mm = mins.toString().padStart(1, '0');
    const ss = secs.toString().padStart(2, '0');

    return `${mm}:${ss}`;
  }

function drawPoints({
  text,
  x,
  y,
  angle = 0,
  font = "bold 36px 'Segoe UI', Arial",
  minScale = 1,
  maxScale = 1.23,
  pulseSpeed = 1.2,
  boxWidth = 220,
  boxHeight = 90,
  shadowColor,
  shadowBlur = 25,
  fillColor,
  highlightColor,
  strokeColor,
  lineWidth = 1.5
}) {
  const grabX = Math.round(x - boxWidth / 2);
  const grabY = Math.round(y - boxHeight / 2);
  const grabW = Math.round(boxWidth);
  const grabH = Math.round(boxHeight);
  const bg = context.getImageData(grabX, grabY, grabW, grabH);

  let start = Date.now();

  function draw() {
    const now = Date.now();
    const elapsed = (now - start) / 1000;
    const t = (elapsed * Math.PI * 2) / pulseSpeed;
    const scale = minScale + (maxScale - minScale) * (0.5 + 0.5 * Math.sin(t));
    context.putImageData(bg, grabX, grabY);

    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.scale(scale, scale);
    context.font = font;
    context.textBaseline = "middle";
    context.textAlign = "center";
    context.shadowColor = shadowColor;
    context.shadowBlur = shadowBlur;
    context.fillStyle = fillColor;
    context.fillText(text, 0, 0);
    context.shadowColor = "transparent";
    context.fillStyle = highlightColor;
    context.fillText(text, 0, 0);
    context.lineWidth = lineWidth;
    context.strokeStyle = strokeColor;
    context.strokeText(text, 0, 0);
    context.restore();

    requestAnimationFrame(draw);
  }

  draw();
}


export function win(stats) {
  AudioManager.play(victorySound);
  const colors = {
    heading: {
      shadow: "rgba(0,180,255,0.8)",
      fill: "#00B4FF",
      highlight: "#e0f7ff",
      stroke: "#a0e0ff",
    },
    paragraph: {
      boxFill: "rgba(0,180,255,0.15)",
      boxShadow: "rgba(0,130,200,0.6)",
      textFill: "#00B4FF",
      textFillAlternate: "#0097d6",
      textShadow: "rgba(0,60,120,0.7)",
    },
    legend: {
      shadow: "rgba(0,180,255,0.9)",
      fill: "rgba(0,200,255,0.8)",
      highlight: "#a0f0ff",
      stroke: "rgba(200,255,255,0.7)",
    },
    image: {
      glowCenter: "rgba(0,180,255,0.5)",
      glowEdge: "rgba(0,180,255,0)",
      glowShadow: "rgba(0,180,255,0.7)",
      imageShadow: "rgba(0,0,0,0.9)",
    },
    background: {
      bgTop: "#001322",
      bgBottom: "#000000",
      grid: "rgba(0,180,255,0.1)",
    },
    footer: {
      shadow: "rgba(0,0,0,0.6)",
      fill: "#888",
    },
    patreon: {
      fill: "#FF424D",
      shadow: "rgba(255, 66, 77, 0.8)",
      text: "white",
    },
  };

  console.log("You win!");
  context.clearRect(0, 0, width, height);

  drawEndScreenBackground(colors.background);
  drawEndScreenImage(colors.image, win);

  const paragraphBox = {
    x: 200,
    y: 220,
    width: 580,
  };

  drawEndScreenHeading("Congratulations!", paragraphBox.x + paragraphBox.width / 2, 60, colors.heading);

  
  const boxInfo = cheeseParagraph(
    "Your raidleader wants to sire your children, and your parents finally love you. Jeff from accounting, who never liked anything, openly wept, and Amber-Shaper Sticky-Socks respawned just to ask for your autograph.", 
    colors.paragraph, 200, 160, );


  const rows = [
                ["AmberStrike Total", stats.amberStrike ?? 0, stats.amberStrike * 10],
                ["AmberStrike Monstrosity", stats.amberStrikeMonstrosity ?? 0, stats.amberStrikeMonstrosity * 150],
                ["AmberStrike Un'Sok", stats.amberStrikeUnsok ?? 0, stats.amberStrikeUnsok * 15],
                ["Self Interrupts", stats.selfInterrupt ?? 0, stats.selfInterrupt * 50],
                ["Self Explosions", stats.selfExplosion ?? 0, (-(stats.selfExplosion * 250))+250],
                ["Monstrosity Interrupts", stats.interrupt ?? 0, stats.interrupt * 100],
                ["Consume Amber", stats.consumeAmber ?? 0, (stats.consumeAmber * -1)+25],
                ["Time to Kill ", formatTime(stats.timePlayed ?? 0), Math.floor(((stats.timePlayed/1000) * -1)+500)],
            ];

  const totalPoints = rows.reduce((sum, [, , pts]) => sum + pts, 0);

  context.fillStyle = colors.paragraph.boxFill;
  roundRect(boxInfo.boxX, boxInfo.boxY + boxInfo.boxHeight + 20,  boxInfo.boxWidth, 160, 22);
  context.fill();

  context.shadowColor = colors.boxShadow;
  context.shadowBlur = 15;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  context.globalCompositeOperation = "source-atop";
  const boxStatsInfo = roundRect(boxInfo.boxX, boxInfo.boxY + boxInfo.boxHeight + 20,  boxInfo.boxWidth, 160, 22);
  context.fill();

  let rowY = boxStatsInfo.boxY + 8;
  let rowX = boxStatsInfo.boxX + 20;
  const lineHeight = 18;

  context.save();
  context.font = "18px 'Segoe UI', Arial";
  context.fillStyle = colors.paragraph.textFill;
  context.textBaseline = "top";
  context.textAlign = "left";
  context.shadowColor = colors.paragraph.textShadow;
  context.shadowBlur = 3;
  context.shadowOffsetX = 1;
  context.shadowOffsetY = 1;

  for (let i = 0; i < rows.length; i++) {
    const color = Math.floor(i/2) == i/2 ? colors.paragraph.textFill : colors.paragraph.textFillAlternate;
    const [ name, value, points ] = rows[i];

    context.fillStyle = color;
    context.fillText(name, rowX, rowY);
    context.fillText(value, rowX+220, rowY);
    context.fillText(points+"pts", rowX+270, rowY);
    rowY += lineHeight;
  }
  context.restore();


  drawPoints({
    text: totalPoints + 'pts',
    x: boxStatsInfo.boxX + 415,
    y: boxStatsInfo.boxY + (boxStatsInfo.boxHeight / 2),
    angle: -(Math.PI / 4),
    font: "bold 36px 'Segoe UI', Arial",
    minScale: 1,
    maxScale: 1.05,
    pulseSpeed: 3,
    boxWidth: 130,
    boxHeight: 130,
    shadowColor: colors.heading.shadow,
    shadowBlur: 5,
    fillColor: colors.fill,
    highlightColor: colors.heading.highlight,
    strokeColor: colors.heading.stroke,
    lineWidth: 1.5
  });

  const objExport = { 
                      asm: stats.amberStrikeMonstrosity,
                      asu: stats.amberStrikeUnsok,
                      ca: stats.consumeAmber,
                      i: stats.interrupt,
                      se: stats.selfExplosion,
                      si: stats.selfInterrupt,
                      t: stats.time,
                      tp: stats.timePlayed,
                    }
  
  const drawCopy = drawCopyButton(boxStatsInfo.boxX+500, boxStatsInfo.boxY+40, `https://cloverpi.github.io/sprinklez/verify.html?win=${LZString.compressToEncodedURIComponent((JSON.stringify(objExport)))}`);
  drawCopy();

  drawLegendLine(boxStatsInfo.boxX, boxStatsInfo.boxY-20, boxStatsInfo.boxWidth, boxStatsInfo.boxHeight, colors.legend);

  clearButtons();

  const buttonY = boxStatsInfo.boxY + boxStatsInfo.boxHeight + 100;
  createButton({
    x: 300,
    y: buttonY,
    width: 150,
    height: 50,
    text: "Join Peak",
    color: "#ff3064",
    textColor: "#fff",
    onClick: () => window.open("https://discord.com/invite/NKScm9qt97", "_blank"),
  });
  createButton({
    x: 520,
    y: buttonY,
    width: 150,
    height: 50,
    text: "Go Again",
    color: "#b0002c",
    textColor: "#fff",
    onClick: () => window.location.reload(),
  });

  buttonDraw();
  drawFooter(colors.footer, colors.patreon, win);
}

export function loss(stats) {
  AudioManager.play(failureSound);
  const colors = {
    heading: {
      shadow: "rgba(255, 80, 80, 0.8)",
      fill: "#FF5050",
      highlight: "#FF9090",
      stroke: "#FF4040",
    },
    paragraph: {
      boxFill: "rgba(255, 80, 80, 0.15)",
      boxShadow: "rgba(200, 40, 40, 0.6)",
      textFill: "#FF5050",
      textShadow: "rgba(120, 20, 20, 0.7)",
    },
    legend: {
      shadow: "rgba(255, 80, 80, 0.9)",
      fill: "rgba(255, 120, 120, 0.8)",
      highlight: "#FFB0B0",
      stroke: "rgba(255, 200, 200, 0.7)",
    },
    image: {
      glowCenter: "rgba(255, 80, 80, 0.5)",
      glowEdge: "rgba(255, 80, 80, 0)",
      glowShadow: "rgba(255, 80, 80, 0.7)",
      imageShadow: "rgba(0, 0, 0, 0.9)",
    },
    background: {
      bgTop: "#220000",
      bgBottom: "#110000",
      grid: "rgba(255, 80, 80, 0.1)",
    },
    footer: {
      shadow: "rgba(0, 0, 0, 0.6)",
      fill: "#888",
    },
    patreon: {
      fill: "#FF424D",
      shadow: "rgba(255, 66, 77, 0.8)",
      text: "white",
    },
  };

  console.log("You lost...");
  context.clearRect(0, 0, width, height);

  drawEndScreenBackground(colors.background);
  drawEndScreenImage(colors.image,loss);

  const paragraphBox = {
    x: 200,
    y: 220,
    width: 580,
  };

  drawEndScreenHeading("Game Over", paragraphBox.x + paragraphBox.width / 2, 120, colors.heading);

  const boxInfo = cheeseParagraph(
    "You failed your team so badly, they want nothing to do with you. Your raidleader lets out a long, deep sigh and says, 'I'm not mad, I'm just disappointed.'",
    colors.paragraph
  );

  let failReason = "You Failed!";
  switch (stats.failReason) {
    case "selfExplosion":
      failReason = "You blew up more than once.";
      break;
    case "amberExplosion":
      failReason = "You allowed the Amber Monstrosity to blow up.";
      break;
    case "willpower":
      failReason = "You ran out of willpower.";
      break;
    case "hp":
      failReason = "You ran out of health.";
      break;
  }
  const boxStatsInfo = cheeseParagraph(
    failReason,
    colors.paragraph, boxInfo.boxX, boxInfo.boxY + boxInfo.boxHeight + 10, boxInfo.boxWidth, 60
  );

  drawLegendLine(boxStatsInfo.boxX, boxStatsInfo.boxY, boxStatsInfo.boxWidth, boxStatsInfo.boxHeight, colors.legend);

  clearButtons();

  const buttonY = boxStatsInfo.boxY + boxStatsInfo.boxHeight + 110;
  createButton({
    x: 410,
    y: buttonY,
    width: 150,
    height: 50,
    text: "Try Again",
    color: "#b0002c",
    textColor: "#fff",
    onClick: () => window.location.reload(),
  });

  buttonDraw();
  drawFooter(colors.footer, colors.patreon, loss);
}
