
import { roundRect, drawEndScreenHeading, drawEndScreenBackground, newImage, MuteIcon } from './commonui.js'
import { createButton, clearButtons, buttonDraw } from './button.js';

const canvasElement = document.getElementById("secret");
const context = canvasElement.getContext("2d");
const { width, height } = canvasElement;

const muteIcon = MuteIcon();
muteIcon.resetBackground();
const monstrosityImage = newImage("./images/ac.jpg");

const abilityImage = [
    newImage("./images/as1.jpg"),
    newImage("./images/sc1.jpg"),
    newImage("./images/ca1.jpg"),
    newImage("./images/bf1.jpg"),
];

function imagesLoaded(...args) {
    let unloadedTotal = 0;

    if ( !monstrosityImage.complete ) {
      unloadedTotal++;
      monstrosityImage.onload = () => drawMechanicsOverview(...args);
    }
    abilityImage.forEach((image)=> {
        if (!image.complete) {
            unloadedTotal++;
            image.onload = () => drawMechanicsOverview(...args);
        }
    });
    return unloadedTotal == 0;
}

function drawAbilityWithIcon(image, title, cooldown, desc, x, y) {
  const iconSize = 32;
  const spacing = 12;
  let titleWidth = 0;

  context.save();

  context.drawImage(image,x,y,iconSize,iconSize);

  context.font = "bold 16px 'Segoe UI', Arial";
  context.textBaseline = "top";
  context.textAlign = "left";
  context.fillStyle = "#00B4FF";
  context.shadowColor = "rgba(0,60,120,0.7)";
  context.shadowBlur = 2;

  titleWidth = context.measureText(title).width;
  context.fillText(title, x + iconSize + spacing, y);

  context.font = "italic 12px 'Segoe UI', Arial";
  context.fillText(cooldown, x + iconSize + titleWidth + spacing*1.5, y+2);

  context.font = "16px 'Segoe UI', Arial";
  context.fillText(desc, x + iconSize + spacing, y + 18);

  context.restore();
}

export function drawMechanicsOverview() {
  if ( !imagesLoaded() ) return;
  
  context.clearRect(0, 0, width, height);

  drawEndScreenBackground({
    bgTop: "#001322",
    bgBottom: "#000000",
    grid: "rgba(0,180,255,0.1)"
  });

  drawEndScreenHeading("Mechanics Overview", width / 2, 30, {
    shadow: "rgba(0,180,255,0.8)",
    fill: "#00B4FF",
    highlight: "#e0f7ff",
    stroke: "#a0e0ff"
  });

  const abilityColors = {
    boxFill: "rgba(0,180,255,0.15)",
    boxShadow: "rgba(0,130,200,0.6)",
    textFill: "#00B4FF",
    textShadow: "rgba(0,60,120,0.7)"
  };

  context.save();
  context.font = "bold 20px 'Segoe UI', Arial";
  context.fillStyle = abilityColors.textFill;
  context.shadowColor = abilityColors.textShadow;
  context.shadowBlur = 4;
  context.textAlign = "left";
  context.fillText("Monstrosity Abilities", 80, 140);
  context.fillText("Your Abilities", 80, 230);
  context.fillText("Critical Responsibilities", 80, 480);
  context.restore();

  drawAbilityWithIcon(monstrosityImage, "Amber Explosion", "[48s CD, 2s cast]", "AoE Explosion dealing ~500k to all raid members.", 80, 150);

  drawAbilityWithIcon(abilityImage[0], "[1] Amber Strike", "[6s CD, melee range]", "Interrupts Amber Explosion, applies stacking damage taken debuff.", 80, 240);
  drawAbilityWithIcon(abilityImage[1], "[2] Struggle for Control", "[6s CD, 8 willpower]", "Interrupts your own Amber Explosion every 13s.", 80, 290);
  drawAbilityWithIcon(abilityImage[2], "[3] Consume Amber", "[melee range]", "Refills willpower (50 willpower phase 3, 20 willpower otherwise)", 80, 340);
  drawAbilityWithIcon(abilityImage[3], "[4] Break Free", "[<20% hp]", "Exits construct. Also interrupts self.", 80, 390);

  const notesBoxX = 70;
  const notesBoxY = 490;
  const notesBoxWidth = 660;
  const notesBoxHeight = 140;

  context.save();
  context.fillStyle = abilityColors.boxFill;
  roundRect(notesBoxX, notesBoxY, notesBoxWidth, notesBoxHeight, 20);
  context.fill();
  context.shadowColor = abilityColors.boxShadow;
  context.shadowBlur = 15;
  context.globalCompositeOperation = "source-atop";
  roundRect(notesBoxX, notesBoxY, notesBoxWidth, notesBoxHeight, 20);
  context.fill();
  context.restore();

  context.save();
  context.font = "16px 'Segoe UI', Arial";
  context.fillStyle = abilityColors.textFill;
  context.shadowColor = abilityColors.textShadow;
  context.shadowBlur = 3;
  context.textAlign = "left";
  context.textBaseline = "top";

  const lines = [
    "🎯 Your primary target is Amber Monstrosity, mostly ignore Un'Sok until phase 3.",
    "💀 Ensure you interrupt every Amber Monstrosity-Amber Explosion.",
    "⚠️ When Amber Explosion cooldown is nearing, save Amber Strike CD to interrupt.",
    "😵 You cast your own AE every 13s, interrupt with [2]. Watch your willpower!",
    "🧟 As a non-tank, try not to use Consume Amber [3] at all until phase 3."
  ];
  let y = notesBoxY+10;
  for (const line of lines) {
    context.fillText(line, notesBoxX + 20, y);
    y += 26;
  }

  context.restore();


  buttonDraw();
  muteIcon.draw();
}

export function mechanics(back, start) {
  clearButtons();

  createButton({
    x: 220,
    y: height - 80,
    width: 150,
    height: 40,
    text: "Back",
    color: "#5ed65e",
    textColor: "#ffffff",
    onClick: () => { 
      muteIcon.detach();
      back();
    }
  });

  createButton({
    x: 430,
    y: height - 80,
    width: 150,
    height: 40,
    text: "Start",
    color: "#ff5740",
    textColor: "#ffffff",
    onClick: () => {
      muteIcon.detach();
      start();
    }
  });

  muteIcon.attach();
  drawMechanicsOverview();
}
