// button.js
import { InputLock } from './commonui.js'
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const buttons = [];
const padding = 13;

export function createButton({
  x,
  y,
  width,
  text,
  color = "#ffcc33",
  textColor = "#222",
  simulationLock = false,
  onClick = () => {}
}) {
  const height = 40;
  const depth = 30;
  const radius = 12;

  const button = {
    x, y, width, height, depth, radius,
    text, color, textColor, onClick,
    pressed: false,
    hitPath: null,
    backgroundImageData: null,
    backgroundX: 0,
    backgroundY: 0,
    backgroundWidth: 0,
    backgroundHeight: 0,
    simulationLock,

    contains(mx, my) {
      return this.hitPath && ctx.isPointInPath(this.hitPath, mx, my);
    },

    captureBackground() {
      const box = getButtonBoundingBox(this);
      this.backgroundX = box.x;
      this.backgroundY = box.y;
      this.backgroundWidth = box.width;
      this.backgroundHeight = box.height;
      this.backgroundImageData = ctx.getImageData(box.x, box.y, box.width, box.height);
    },

    restoreBackground() {
      if (this.backgroundImageData) {
        ctx.putImageData(this.backgroundImageData, this.backgroundX, this.backgroundY);
      }
    }
  };

  buttons.push(button);
  return button;
}

export function clearButtons() {
  buttons.splice(0, buttons.length);

}

function getButtonBoundingBox(b) {
  return {
    x: Math.floor(b.x - padding),
    y: Math.floor(b.y - padding),
    width: Math.ceil(b.width + padding * 2),
    height: Math.ceil(b.height + b.depth + padding * 2)
  };
}

export function buttonDraw() {
  InputLock.lock();
  buttons.forEach(b => b.captureBackground());
  buttons.forEach(b => drawButtonShape(b));
}

export function simulateClick(button) {
  button.pressed = true;
  redrawAllButtons();
  setTimeout(() => {
    button.pressed = false;
    redrawAllButtons();
    button.onClick();
  }, 150);
}

function redrawAllButtons() {
  buttons.forEach(b => {
    if (b.backgroundImageData) {
      ctx.putImageData(b.backgroundImageData, b.backgroundX, b.backgroundY);
    }
  });
  buttons.forEach(b => drawButtonShape(b));
}

function drawButtonShape(b) {
  const shiftY = -6;
  const widen = 6;
  const yOffset = b.pressed ? b.depth * 0.6 : 0;

  const top = [
    [b.x + 20, b.y + yOffset],
    [b.x + b.width - 20, b.y + yOffset],
    [b.x + b.width, b.y + b.height + yOffset],
    [b.x, b.y + b.height + yOffset],
  ];

  const front = [
    [top[3][0] + 3, top[3][1] + shiftY],
    [top[2][0] - 3, top[2][1] + shiftY],
    [top[2][0] + widen / 2, top[2][1] + b.depth + shiftY],
    [top[3][0] - widen / 2, top[3][1] + b.depth + shiftY],
  ];

  const frontPath = new Path2D();
  roundBottomCornersOnly(frontPath, front, b.radius);
  ctx.fillStyle = shadeColor(b.color, -20);
  ctx.fill(frontPath);

  const gradLeft = ctx.createLinearGradient(front[0][0], 0, front[0][0] + 20, 0);
  gradLeft.addColorStop(0, "rgba(0,0,0,0.2)");
  gradLeft.addColorStop(1, "transparent");

  const gradRight = ctx.createLinearGradient(front[1][0], 0, front[1][0] - 20, 0);
  gradRight.addColorStop(0, "rgba(0,0,0,0.2)");
  gradRight.addColorStop(1, "transparent");

  ctx.fillStyle = gradLeft;
  ctx.fill(frontPath);
  ctx.fillStyle = gradRight;
  ctx.fill(frontPath);

  const topPath = new Path2D();
  roundTrapezoidPath(topPath, top, { tl: 8, tr: 8, br: 18, bl: 18 });

  ctx.save();
  ctx.translate(0, 2);
  ctx.fillStyle = shadeColor(b.color, -10);
  ctx.fill(topPath);
  ctx.restore();

  ctx.fillStyle = b.pressed ? shadeColor(b.color, 20) : b.color;
  ctx.fill(topPath);

  ctx.lineJoin = "round";
  ctx.strokeStyle = shadeColor(b.color, -40);
  ctx.lineWidth = 2;
  ctx.stroke(topPath);

  const minX = Math.min(...top.map(p => p[0]), ...front.map(p => p[0]));
  const maxX = Math.max(...top.map(p => p[0]), ...front.map(p => p[0]));
  const minY = Math.min(...top.map(p => p[1]), ...front.map(p => p[1]));
  const maxY = Math.max(...top.map(p => p[1]), ...front.map(p => p[1]));
  const hitPath = new Path2D();
  hitPath.rect(minX, minY, maxX - minX, maxY - minY);
  b.hitPath = hitPath;

  ctx.save();
  ctx.fillStyle = b.textColor;
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(b.text, b.x + b.width / 2, b.y + b.height / 2 + yOffset);
  ctx.restore();
}

canvas.addEventListener("mousedown", (e) => {
  if (InputLock.isLocked()) return;
  const { left, top } = canvas.getBoundingClientRect();
  const mx = e.clientX - left;
  const my = e.clientY - top;
  buttons.forEach(b => {
    if (!b.simulationLock && b.contains(mx, my)) {
      b.pressed = true;
      redrawAllButtons();
    }
  });
});

canvas.addEventListener("mouseup", (e) => {
  if (InputLock.isLocked()) return;
  buttons.forEach(b => {
    if (!b.simulationLock && b.pressed) {
      b.pressed = false;
      redrawAllButtons();
      b.onClick();
    }
  });
});

function roundTrapezoidPath(path, points, radius) {
  const [tl, tr, br, bl] = points;
  const r = typeof radius === "number" ? { tl: radius, tr: radius, br: radius, bl: radius } : radius;
  function cornerArc(p1, p2, p3, r) {
    const v1 = { x: p1[0] - p2[0], y: p1[1] - p2[1] };
    const v2 = { x: p3[0] - p2[0], y: p3[1] - p2[1] };
    const len1 = Math.hypot(v1.x, v1.y);
    const len2 = Math.hypot(v2.x, v2.y);
    const uv1 = { x: v1.x / len1, y: v1.y / len1 };
    const uv2 = { x: v2.x / len2, y: v2.y / len2 };
    return {
      start: [p2[0] + uv1.x * r, p2[1] + uv1.y * r],
      end: [p2[0] + uv2.x * r, p2[1] + uv2.y * r],
      center: p2,
    };
  }
  let arc = cornerArc(bl, tl, tr, r.tl);
  path.moveTo(...arc.start);
  path.quadraticCurveTo(...arc.center, ...arc.end);
  arc = cornerArc(tl, tr, br, r.tr);
  path.lineTo(...arc.start);
  path.quadraticCurveTo(...arc.center, ...arc.end);
  arc = cornerArc(tr, br, bl, r.br);
  path.lineTo(...arc.start);
  path.quadraticCurveTo(...arc.center, ...arc.end);
  arc = cornerArc(br, bl, tl, r.bl);
  path.lineTo(...arc.start);
  path.quadraticCurveTo(...arc.center, ...arc.end);
  path.closePath();
}

function roundBottomCornersOnly(path, points, radius) {
  const [tl, tr, br, bl] = points;
  path.moveTo(...tl);
  path.lineTo(...tr);
  path.lineTo(br[0], br[1] - radius);
  path.quadraticCurveTo(br[0], br[1], br[0] - radius, br[1]);
  path.lineTo(bl[0] + radius, bl[1]);
  path.quadraticCurveTo(bl[0], bl[1], bl[0], bl[1] - radius);
  path.lineTo(...tl);
  path.closePath();
}

function shadeColor(color, percent) {
  const f = parseInt(color.slice(1), 16);
  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent) / 100;
  const R = f >> 16;
  const G = (f >> 8) & 0x00FF;
  const B = f & 0x0000FF;
  const newColor = (0x1000000 +
    (Math.round((t - R) * p + R) << 16) +
    (Math.round((t - G) * p + G) << 8) +
    Math.round((t - B) * p + B)).toString(16).slice(1);
  return `#${newColor}`;
}
