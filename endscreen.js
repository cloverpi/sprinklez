import { drawLegendLine, drawEndScreenHeading, cheeseParagraph, drawEndScreenBackground, drawFooter, newImage, newAudio, AudioManager, drawCopyButton } from './commonui.js'
import { createButton, clearButtons, buttonDraw } from './button.js';

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


  console.log(encodeURIComponent(window.btoa(JSON.stringify(stats))));

  const winReason = 
  `AmberStrike Total: ${stats.amberStrike}\n
  AmberStrike Monstrosity: ${stats.amberStrikeMonstrosity}\n
  AmberStrike Un'Sok: ${stats.amberStrikeUnsok}\n
  Self Interrupts : ${stats.selfInterrupt}\n
  Monstrosity Interrupts: ${stats.selfInterrupt}
  `
  const boxStatsInfo = cheeseParagraph(
    winReason,
    colors.paragraph, boxInfo.boxX, boxInfo.boxY + boxInfo.boxHeight + 20, boxInfo.boxWidth, 160
  );

  const drawCopy = drawCopyButton(boxStatsInfo.boxX+450, boxStatsInfo.boxY+50, `https://cloverpi.github.io/sprinklez/verify.html?win=${encodeURIComponent(window.btoa(JSON.stringify(stats)))}`);
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
