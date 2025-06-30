
import { roundRect, drawLegendLine, drawEndScreenHeading, cheeseParagraph, drawEndScreenBackground, drawPatreonButton, drawFooter, newImage } from './commonui.js'
import { createButton, clearButtons, buttonDraw, simulateClick  } from './button.js';

const canvasElement = document.getElementById("secret");
const context = canvasElement.getContext("2d");
let hoveredSection = null;
let hoverInterval = null;

const { width, height } = canvasElement;
const sections = [];
const mouse = { x: 0, y: 0 };
const colors = {
        background: {
        bgTop: "#001322",
        bgBottom: "#000000",
        grid: "rgba(0,180,255,0.1)",
    },
        heading: {
        shadow: "rgba(0,180,255,0.8)",
        fill: "#00B4FF",
        highlight: "#e0f7ff",
        stroke: "#a0e0ff",
    },
        pinkButton: {
        color: "#ff3064",
        textColor: "#fff"
    }
};

export function howToPlayInit(onStartCallback) {
    clearButtons();
    sections.length = 0;

    const sectionHeight = (canvasElement.height - 160 - 100) / 3;
    const sectionWidth = canvasElement.width - 120;
    const sectionX = 60;
    let sectionY = 110;

    const sectionData = [
    {
        label: "Tab Targeting",
        keys: [{ key: "TAB", wide: true }],
        baseColor: "#442244"
    },
    {
        label: "WASD Movement",
        keys: ["W", "A", "S", "D"],
        baseColor: "#224444"
    },
    {
        label: "Abilities",
        keys: ["1", "2", "3", "4"],
        baseColor: "#443322"
    }
    ];

    sectionData.forEach((sec) => {
    const section = {
        x: sectionX,
        y: sectionY,
        width: sectionWidth,
        height: sectionHeight,
        label: sec.label,
        baseColor: sec.baseColor,
        imageColor: sec.baseColor,
        buttons: [],
        currentIndex: 0
    };

    const keys = sec.keys.map(k => (typeof k === 'string' ? { key: k, wide: false } : k));
    let btnX = sectionX + 30;

    keys.forEach(entry => {
        const btnWidth = entry.wide ? 140 : 80;
        const btn = createButton({
        x: btnX,
        y: sectionY + 60,
        width: btnWidth,
        text: entry.key,
        color: '#242424',
        textColor: '#fff',
        onClick: () => {}
        });
        section.buttons.push(btn);
        btnX += btnWidth + 10;
    });

    sections.push(section);
    sectionY += sectionHeight + 20;
    });

    createButton({
        x: canvasElement.width / 2 - 80,
        y: canvasElement.height - 90,
        width: 160,
        height: 40,
        text: "Start",
        color: colors.pinkButton.color,
        textColor: colors.pinkButton.textColor,
        onClick: () => {
            canvasElement.removeEventListener('mousemove', handleMouseMove);
            if (hoverInterval) {
                clearInterval(hoverInterval);
                hoverInterval = null;
            }
            onStartCallback();
        }
    });
}

export function drawHowToPlay() {
    console.log("Sections created:", sections.length);
    context.clearRect(0, 0, canvasElement.width, canvasElement.height);
    drawEndScreenBackground(colors.background);
    drawEndScreenHeading("How to Play", canvasElement.width / 2, 30, colors.heading);

    context.save();
    for (const section of sections) {
        const isHovered = section === hoveredSection;

        context.shadowColor = isHovered ? "rgba(255, 255, 255, 0.3)" : "transparent";
        context.shadowBlur = isHovered ? 25 : 0;
        context.fillStyle = isHovered ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.4)";
        roundRect(section.x, section.y, section.width, section.height, 18);
        context.fill();
        

        context.fillStyle = "#ddd";
        context.font = "20px Segoe UI";
        context.textAlign = "left";
        context.textBaseline = "top"; 
        context.fillText(section.label, section.x + 20, section.y + 20);

        const imgX = section.x + section.width - 240;
        const imgY = section.y + 30;
        context.fillStyle = section.imageColor;
        roundRect(imgX, imgY, 180, section.height - 60, 12);
        context.fill();
        context.fillStyle = "#ccc";
        context.font = "16px Segoe UI";
        context.textAlign = "center";
        context.fillText("Image", imgX + 90, imgY + (section.height - 60) / 2);
        
    }
    context.restore();

    buttonDraw();
}

function handleMouseMove(e) {
    const rect = canvasElement.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    let newHovered = null;
    for (const section of sections) {
        if (
            mouse.x >= section.x &&
            mouse.x <= section.x + section.width &&
            mouse.y >= section.y &&
            mouse.y <= section.y + section.height
        ) {
            newHovered = section;
            break;
        }
    }

    if (newHovered !== hoveredSection) {
        hoveredSection = newHovered;

        if (hoverInterval) {
            clearInterval(hoverInterval);
            hoverInterval = null;
        }

        if (hoveredSection) {
            hoverInterval = setInterval(() => {
                const buttons = hoveredSection.buttons;
                if (buttons.length > 0) {
                    const i = hoveredSection.currentIndex % buttons.length;
                    simulateClick(buttons[i]);
                    hoveredSection.currentIndex++;
                }
            }, 800);
        }

        drawHowToPlay();
    }
}

canvasElement.addEventListener('mousemove', handleMouseMove);
