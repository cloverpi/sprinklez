
import { roundRect, drawEndScreenHeading, drawEndScreenBackground, InputLock, newImage, MuteIcon } from './commonui.js'
import { createButton, clearButtons, buttonDraw } from './button.js';
import { gameStartInit } from './amber.js';
import { layoutDetector, KeyMappings } from './keyboard-layout.js';

const canvasElement = document.getElementById("secret");
const context = canvasElement.getContext("2d");
const { width, height } = canvasElement;
const replay = getCookie("replay").toLowerCase() == "true" ? true : false;

let keyboardLayout = layoutDetector.getLayoutSync();

const muteIcon = MuteIcon();
muteIcon.resetBackground();
const monstrosityImage = newImage("./images/ac.jpg");

const hitZones = [];

const abilityImage = [
    newImage("./images/as1.jpg"),
    newImage("./images/sc1.jpg"),
    newImage("./images/ca1.jpg"),
    newImage("./images/bf1.jpg"),
];

const youtube = [
  { image: newImage('./images/joardee.webp'), link: 'https://www.youtube.com/watch?v=82s_NAFlKLw', text: `Joardee: Amber-Shaper Guide` },
  // { image: newImage('./images/scottejaye.webp'), link: 'https://youtube.com/scottejaye', text: `Scottejaye: Amber-Shaper Guide` },
];
let youtubeIndex = 0;
let youtubeInterval;

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
    youtube.forEach((y)=> {
        if (!y.image.complete) {
            unloadedTotal++;
            y.image.onload = () => drawMechanicsOverview(...args);
        }
    });
    return unloadedTotal == 0;
}

function changeYoutube() {
  const youtubeX = 555;
  const youtubeY = 120+4;
  const youtubeWidth = 190;
  const youtubeHeight = 107;

  const colors = {
    boxFill: "rgba(0,180,255,0.15)",
    boxShadow: "rgba(0,130,200,0.6)",
    textFill: "#00B4FF",
    textShadow: "rgba(0,60,120,0.7)"
  };

  context.save();
  context.drawImage(youtube[youtubeIndex].image,youtubeX,youtubeY,youtubeWidth,youtubeHeight);
  context.font = "13px 'Segoe UI', Arial";
  context.fillStyle = colors.textFill;
  context.shadowColor = colors.textShadow;
  context.shadowBlur = 3;
  context.textAlign = "center";
  context.textBaseline = "top";
  context.fillText(youtube[youtubeIndex].text, youtubeX+(youtubeWidth/2), 120+107+9);
  context.restore();

  hitZones.splice(0, hitZones.length);
  
  const index = youtubeIndex;
  hitZones.push({x: youtubeX, y: youtubeY, width: youtubeWidth, height: youtubeHeight+20, index, onClick: () => { 
    InputLock.lock();
    window.open(youtube[index].link, "_blank"); 
  } });

  youtubeIndex++;
  if (youtubeIndex >= youtube.length) youtubeIndex = 0;
}

function drawYouTube(colors){
  context.save();
  context.fillStyle = colors.boxFill;
  roundRect(550, 120, 200, 134, 5);
  context.fill();
  context.restore();

  changeYoutube();
  
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
  if (!imagesLoaded()) return;

  context.clearRect(0, 0, width, height);

  drawEndScreenBackground({
    bgTop: "#001322",
    bgBottom: "#000000",
    grid: "rgba(0,180,255,0.1)"
  });

  drawEndScreenHeading("Mechanics  Overview", width / 2, 30, {
    shadow: "rgba(0,180,255,0.8)",
    fill: "#00B4FF",
    highlight: "#e0f7ff",
    stroke: "#a0e0ff"
  });

  const leftX = 60;

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
  context.fillText("Monstrosity Abilities", leftX, 140);
  context.fillText("Your Abilities", leftX, 240);
  context.fillText("Critical Responsibilities", leftX, 480);
  context.restore();

  drawAbilityWithIcon(monstrosityImage, "Amber Explosion", "[48s CD, 2s cast]", "AoE Explosion dealing ~500k to all raid members.", leftX, 150);

  // Get dynamic ability keys based on keyboard layout
  const abilityKeys = KeyMappings.getAbilityKeys(keyboardLayout);
  
  drawAbilityWithIcon(abilityImage[0], `[${abilityKeys[0]}] Amber Strike`, "[6s CD, melee range]", "Interrupts Amber Explosion, applies stacking damage taken debuff.", leftX, 250);
  drawAbilityWithIcon(abilityImage[1], `[${abilityKeys[1]}] Struggle for Control`, "[6s CD, 8 willpower]", "Interrupts your own Amber Explosion every 13s.", leftX, 300);
  drawAbilityWithIcon(abilityImage[2], `[${abilityKeys[2]}] Consume Amber`, "[melee range]", "Refills willpower (50 willpower phase 3, 20 willpower otherwise)", leftX, 350);
  drawAbilityWithIcon(abilityImage[3], `[${abilityKeys[3]}] Break Free`, "[<20% hp]", "Exits construct. Also interrupts self.", leftX, 400);

  const notesBoxX = leftX - 10;
  const notesBoxY = 490;
  const notesBoxWidth = 700;
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
    `😵 You cast your own AE every 13s, interrupt with [${abilityKeys[1]}]. Watch your willpower!`,
    `🧟 As a non-tank, try not to use Consume Amber [${abilityKeys[2]}] at all until phase 3.`
  ];
  let y = notesBoxY + 10;
  for (const line of lines) {
    context.fillText(line, notesBoxX + 20, y);
    y += 26;
  }
  context.restore();

  drawYouTube(abilityColors);

  buttonDraw();
  muteIcon.draw();
}


export function mechanics(back, start) {
  clearButtons();

  // Register callback for layout changes
  const layoutChangeCallback = (newLayout) => {
    keyboardLayout = newLayout;
    console.log(`Mechanics page updating to layout: ${newLayout}`);
    drawMechanicsOverview();
  };
  
  layoutDetector.onLayoutChange(layoutChangeCallback);

  // Trigger layout detection if not done yet
  layoutDetector.detectLayout().then((detectedLayout) => {
    keyboardLayout = detectedLayout;
    drawMechanicsOverview(); // Redraw if layout changed
  });

  createButton({
    x: 220,
    y: height - 80,
    width: 150,
    height: 40,
    text: "Back",
    color: "#5ed65e",
    textColor: "#ffffff",
    onClick: () => { 
      cleanupMechanics();
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
      if (typeof(start) != "function") {
        start = gameStartInit;
        setCookie("replay", true, 365);
      };
      cleanupMechanics();
      start();
    }
  });

  canvasElement.addEventListener("mouseup", handleMouseUp);
  canvasElement.addEventListener("mousemove", handleMouseMove);
  muteIcon.attach();

  youtubeInterval = setInterval(drawMechanicsOverview, 10000);

  drawMechanicsOverview();
}

function cleanupMechanics(){
  canvasElement.removeEventListener('mousemove', handleMouseMove);
  canvasElement.removeEventListener('mouseup', handleMouseUp);
  clearInterval(youtubeInterval);
  muteIcon.detach();
}

