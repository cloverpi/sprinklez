
import { roundRect, drawEndScreenHeading, drawEndScreenBackground, newImage } from './commonui.js'
import { createButton, clearButtons, buttonDraw } from './button.js';

const canvasElement = document.getElementById("secret");
const context = canvasElement.getContext("2d");
const { width, height } = canvasElement;

// Mechanics Overview Canvas Page

export function drawMechanicsOverview(back, start) {
  clearButtons();
  context.clearRect(0, 0, width, height);

  // Background
  drawEndScreenBackground({
    bgTop: "#001322",
    bgBottom: "#000000",
    grid: "rgba(0,180,255,0.1)"
  });

  // Title
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

  // Section Headings
  context.save();
  context.font = "bold 20px 'Segoe UI', Arial";
  context.fillStyle = abilityColors.textFill;
  context.shadowColor = abilityColors.textShadow;
  context.shadowBlur = 4;
  context.textAlign = "left";
  context.fillText("Abilities", 80, 140);
  context.fillText("Critical Mechanics", 80, 420);
  context.restore();

  // Abilities section
  drawAbilityWithIcon("[1] Amber Strike", "Interrupts boss's Amber Explosion, applies stacking debuff.", 80, 160);
  drawAbilityWithIcon("[2] Struggle for Control", "Interrupts your own Amber Explosion every 13s.", 80, 210);
  drawAbilityWithIcon("[3] Consume Amber", "Refills willpower. Only use in Phase 3.", 80, 260);
  drawAbilityWithIcon("[4] Break Free", "Exits construct at 20% HP. Also interrupts self.", 80, 310);

  // Critical Mechanics box
  const notesBoxX = 70;
  const notesBoxY = 450;
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

//   drawLegendLine(notesBoxX, notesBoxY, notesBoxWidth, notesBoxHeight, {
//     shadow: "rgba(0,180,255,0.9)",
//     fill: "rgba(0,200,255,0.8)",
//     highlight: "#a0f0ff",
//     stroke: "rgba(200,255,255,0.7)"
//   });

  context.save();
  context.font = "16px 'Segoe UI', Arial";
  context.fillStyle = abilityColors.textFill;
  context.shadowColor = abilityColors.textShadow;
  context.shadowBlur = 3;
  context.textAlign = "left";
  context.textBaseline = "top";

  const lines = [
    "🧟 Monstrosity casts Amber Explosion → Use [1] near the end of the cast",
    "😵 You auto-cast Amber Explosion every 13s → Interrupt with [2]",
    "💀 Willpower depleting or HP low → Use [4] to exit safely",
    "⚠️ In Phase 3 → Use [3] to refill willpower and keep stacking [1]"
  ];
  let y = notesBoxY + 20;
  for (const line of lines) {
    context.fillText(line, notesBoxX + 20, y);
    y += 26;
  }

  context.restore();

  // Buttons
  createButton({
    x: 220,
    y: height - 80,
    width: 150,
    height: 40,
    text: "Back",
    color: "#88888",
    textColor: "#ffffff",
    onClick: () => back()
  });

  createButton({
    x: 430,
    y: height - 80,
    width: 150,
    height: 40,
    text: "Start",
    color: "#00B4FF",
    textColor: "#ffffff",
    onClick: () => start()
  });

  buttonDraw();
}

function drawAbilityWithIcon(title, desc, x, y) {
  const iconSize = 32;
  const spacing = 12;

  context.save();

  // Placeholder icon box
  context.fillStyle = "#444";
  context.fillRect(x, y, iconSize, iconSize);

  context.font = "16px 'Segoe UI', Arial";
  context.textBaseline = "top";
  context.textAlign = "left";
  context.fillStyle = "#00B4FF";
  context.shadowColor = "rgba(0,60,120,0.7)";
  context.shadowBlur = 2;

  context.fillText(title, x + iconSize + spacing, y);
  context.fillText(desc, x + iconSize + spacing, y + 18);

  context.restore();
}
