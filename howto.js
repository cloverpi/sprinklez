
import { roundRect, drawEndScreenHeading, drawEndScreenBackground, newImage, MuteIcon } from './commonui.js'
import { createButton, clearButtons, buttonDraw, simulateClick  } from './button.js';
import { layoutDetector, KeyMappings } from './keyboard-layout.js';

const canvasElement = document.getElementById("secret");
const context = canvasElement.getContext("2d");
let hoveredSection = null;
let hoverInterval = null;
const replay = getCookie("replay").toLowerCase() == "true" ? true : false;

const muteIcon = MuteIcon();
muteIcon.resetBackground();
const tabImage = [
    newImage("./images/keytab.webp"),
    newImage("./images/as1.jpg"),
];
const wasdImage = [
    newImage("./images/keyw.webp"),
    newImage("./images/keya.webp"),
    newImage("./images/keys.webp"),
    newImage("./images/keyd.webp"),
];
const abilityImage = [
    newImage("./images/as1.jpg"),
    newImage("./images/sc1.jpg"),
    newImage("./images/ca1.jpg"),
    newImage("./images/bf1.jpg"),
];

const { width, height } = canvasElement;
const sections = [];
const mouse = { x: 0, y: 0 };

let keyboardLayout = layoutDetector.getLayoutSync();
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

function imagesLoaded(images) {
    let unloadedTotal = 0;
    images.forEach((image)=> {
        if (!image.complete) {
            unloadedTotal++;
            image.onload = () => drawHowToPlay();
        }
    });
    return unloadedTotal == 0;
}

export function howToPlayInit(back, start) {
    clearButtons();
    sections.length = 0;

    const sectionHeight = (canvasElement.height - 160 - 100) / 3;
    const sectionWidth = canvasElement.width - 120;
    const sectionX = 60;
    let sectionY = 110;

    // Register callback for layout changes
    const layoutChangeCallback = (newLayout) => {
        keyboardLayout = newLayout;
        console.log(`Controls page updating to layout: ${newLayout}`);
        // Re-initialize with new layout
        howToPlayInit(back, start);
        drawHowToPlay();
    };
    
    layoutDetector.onLayoutChange(layoutChangeCallback);

    // Trigger layout detection if not done yet
    layoutDetector.detectLayout().then((detectedLayout) => {
        keyboardLayout = detectedLayout;
        drawHowToPlay(); // Redraw if layout changed
    });

    // Dynamic key mappings based on detected keyboard layout
    const getMovementKeys = () => KeyMappings.getMovementKeys(keyboardLayout);
    const getAbilityKeys = () => KeyMappings.getAbilityKeys(keyboardLayout);
    
    const getMovementLabel = () => {
        const layoutName = KeyMappings.getLayoutDisplayName(keyboardLayout);
        const keys = KeyMappings.getMovementKeys(keyboardLayout);
        return `${keys.join("")} Movement (${layoutName})`;
    };

    const getAbilityLabel = () => {
        const layoutName = KeyMappings.getLayoutDisplayName(keyboardLayout);
        const keys = KeyMappings.getAbilityKeys(keyboardLayout);
        return `Abilities (${layoutName}: ${keys.join("")})`;
    };

    const sectionData = [
        {
            label: "Tab Targeting",
            keys: [{ key: "TAB", wide: true }],
            baseColor: "#442244",
            images: tabImage,
        },
        {
            label: getMovementLabel(),
            keys: getMovementKeys(),
            baseColor: "#224444",
            images: wasdImage,
        },
        {
            label: getAbilityLabel(),
            keys: getAbilityKeys(),
            baseColor: "#443322",
            images: abilityImage,
        }
    ];

    sectionData.forEach((sec) => {
        const section = {
            x: sectionX,
            y: sectionY,
            width: sectionWidth,
            height: sectionHeight,
            label: sec.label,
            activeButton: 0,
            images: sec.images,
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
            simulationLock: true,
            onClick: () => {}
        });
        section.buttons.push(btn);
        btnX += btnWidth + 10;
    });

    sections.push(section);
    sectionY += sectionHeight + 20;
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
            canvasElement.removeEventListener('mousemove', handleMouseMove);
            muteIcon.detach();

            if (hoverInterval) {
                clearInterval(hoverInterval);
                hoverInterval = null;
            }
            back();
        }
    });

    createButton({
        x: 430,
        y: height - 80,
        width: 150,
        height: 40,
        text: replay ? "Start" : "Next",
        color: "#ff5740",
        textColor: "#ffffff",
        onClick: () => {
            canvasElement.removeEventListener('mousemove', handleMouseMove);
            muteIcon.detach();

            if (hoverInterval) {
                clearInterval(hoverInterval);
                hoverInterval = null;
            }
            start(back);
        }
    });

    muteIcon.attach();
}

export function drawHowToPlay() {
    if (!imagesLoaded(tabImage)) return;
    if (!imagesLoaded(wasdImage)) return;
    if (!imagesLoaded(abilityImage)) return;

    context.clearRect(0, 0, canvasElement.width, canvasElement.height);
    drawEndScreenBackground(colors.background);
    drawEndScreenHeading("Controls", canvasElement.width / 2, 30, colors.heading);

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
        context.drawImage(section.images[section.currentIndex],imgX+60, imgY-13, 120, 120);
        
    }
    context.restore();

    buttonDraw();
    muteIcon.draw();
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
        if (hoveredSection != null) hoveredSection.currentIndex = 0; 

        if (hoverInterval) {
            clearInterval(hoverInterval);
            hoverInterval = null;
        }

        if (hoveredSection) {
            hoverInterval = setInterval(() => {
                const buttons = hoveredSection.buttons;
                if (buttons.length > 0) {
                    simulateClick(buttons[hoveredSection.currentIndex]);
                    drawHowToPlay();
                    hoveredSection.currentIndex++;
                    if (hoveredSection.currentIndex >= buttons.length) hoveredSection.currentIndex = 0;
                }
            }, 800);
        }

        drawHowToPlay();
    }
}

export function controls(back, start) {
    canvasElement.addEventListener('mousemove', handleMouseMove);
    howToPlayInit(back, start);
    drawHowToPlay();
}

