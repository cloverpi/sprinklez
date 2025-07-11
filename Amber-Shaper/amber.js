import * as ai from './ai.js';

const { Named, Selector, Sequence, Condition, Action, inRange, unitInRange, applyVelocityFromGoals, performAttack } = ai

const canvasElement = document.getElementById("secret");
const scoreDisplay = document.getElementById("score");
const context = canvasElement.getContext("2d");

const { width, height } = canvasElement;
const gameHeight = height;

const UPDATEFREQ = 8;
let lastUpdate = (new Date).getTime();
const startTime = (new Date).getTime();
const meleeRange = 20;

const blackBoard = {
    phase: 1,
}
const gameEvents = {
    convert: {
        condition: (time) => time-startTime >= 10000,
        action: () => units["redPlayer"].amber = true,
        endon: () => true,
    },
    convertToAmber: {
        condition: () => units["redPlayer"].amber && units["redPlayer"].image != units["redPlayer"].monstrosityImage,
        action: () => units["redPlayer"].image = units["redPlayer"].monstrosityImage,
        endon: () => false,
    },
    convertToPlayer: {
        condition: () => !units["redPlayer"].amber && units["redPlayer"].image != units["redPlayer"].raiderImage,
        action: () => {units["redPlayer"].image = units["redPlayer"].raiderImage; units["redPlayer"].hp = units["redPlayer"].maxhp},
        endon: () => false,
    },
    bossSpawn: {
        condition: (time) => !units["boss"].active && time-startTime >= 5000,
        action: () => { units["boss"].active = true;
                        units["boss"].hp = units["boss"].maxhp,
                        units["tank"].target = units["boss"],
                        units["boss"].target = units["tank"] },
        endon: () => true,
    },
    monstrositySpawn: {
        condition: (time) => !units["monstrosity"].active && time-startTime >= 15000,
        action: () => { units["monstrosity"].active = true;
                        units["monstrosity"].hp = units["monstrosity"].maxhp,
                        units["tank"].target = units["monstrosity"],
                        units["monstrosity"].target = units["tank"],
                        blackBoard.phase = 2
                    },
        endon: () => true,
    },
    bossRaidDamage: {
        condition: (time) => units["boss"].active && time-startTime >= 5000,
        action: () => { damageUnit(units["boss"], "Raid", 100000);
                        units["boss"].hp = units["boss"].hp < 0 ? 0 : units["boss"].hp},
        endon: () => units["boss"].hp <= 0,
    },
    monstrosityDead: {
        condition: () => (!!units["monstrosity"].active && units["monstrosity"].hp <= 0),
        action: () => {units["monstrosity"].active = false; blackBoard.phase = 3},
        endon: () => true
    },
    bossDead: {
        condition: () => (!!units["boss"].active && units["boss"].hp <= 0),
        action: () => units["boss"].active = false,
        endon: () => true
    },
    monstrosityRaidDamage: {
        condition: (time) => units["monstrosity"].active &&  time-startTime >= 15000,
        action: () => { damageUnit(units["monstrosity"], "Raid", 30000);
                        units["monstrosity"].hp = units["monstrosity"].hp < 0 ? 0 : units["monstrosity"].hp},
        endon: () => units["monstrosity"].hp < 0,
    },
    amberCarapaceAdd: {
        condition: () => units["boss"].active && blackBoard.phase == 2,
        action: () => units["boss"].debuffs.push(
                            { name: "Amber Carapace", lastApply: 0, duration: 0, icon: newImage("./images/ac.jpg"), count: 1, dmgEffect: (toUnit, fromUnit, baseAmount) => {
                                return baseAmount * 0.01;} }
                            ),
        endon: () => true,
    },
    playerAmberDamageTaken: {
        condition: () => units["redPlayer"].amber,
        action: () => {
                        const p = units["redPlayer"];
                        const percenthp = p.hp/p.maxhp;
                        if (percenthp > 0.25) {
                            damageUnit(p, "Raid", 500);
                        } else {
                            damageUnit(p, "Raid", 100);
                        }
                    },
        endon: () => false,
    },
    amberCarapaceRemove: {
        condition: () => units["boss"].active && blackBoard.phase == 3,
        action: () => { const debuffs = units["boss"].debuffs;
                        units["boss"].debuffs = debuffs.filter((d) => d.name != "Amber Carapace")},
        endon: () => true,
    },
    checkDebuffs: {
        condition: () => units["boss"].debuffs.length > 0 || units["monstrosity"].debuffs.length > 0,
        action: (time) => { 

                        function removeExpiredDebuffs(debuffs) {
                            return debuffs.filter( (d)=> {
                                if (d.duration == 0) return true;
                                if ( (time - d.lastApply) > (d.duration * 1000) ) return false;
                                return true;
                            });
                        }
                        units["boss"].debuffs = removeExpiredDebuffs(units["boss"].debuffs);
                        units["monstrosity"].debuffs = removeExpiredDebuffs(units["monstrosity"].debuffs);
                    },
        endon: () => false,
    }
}

function newImage(src) {
    const img = new Image();
    img.src = src;
    return img;
}

const puddles = [];
const precomputedCracks = [];
const floorBox = [[48,0],[272,0],[288,32],[320,48],[320,272],[288,288],[272,320],[48,320],[32,288],[0,272],[0,48],[32,32]];
const units = {
    "redPlayer": {
                    name: "Sprinklez",
                    team: 1,
                    amber: false,
                    x: canvasElement.clientWidth / 2,
                    y: canvasElement.clientHeight / 2,
                    velocityX: 0,
                    velocityY: 0,
                    radius: 40,
                    centerX: 40,
                    centerY: 40,
                    hp: 420000,
                    maxhp: 420000,
                    willpower: 100,
                    speed: 2,
                    debuffs:[],
                    target: undefined,
                    image: newImage("images/raider.webp"),
                    raiderImage: newImage("images/raider.webp"),
                    monstrosityImage: newImage("images/amberraider.webp"),
                },
    "tank": {
                    name: "Donald",
                    team: 1,
                    x: canvasElement.clientWidth / 2+160,
                    y: canvasElement.clientHeight / 2+120,
                    velocityX: 0,
                    velocityY: 0,
                    radius: 40,
                    centerX: 40,
                    centerY: 40,
                    speed: 2,
                    active: true,
                    target: undefined,
                    image: newImage("images/tank.webp"),
                    hp: 520000,
                    behavior: function() {
                        return Selector([
                        Sequence([
                          Condition((u) => units["boss"].active && !unitInRange(u, units["boss"], meleeRange)),
                          Named("Move to Boss", Action((u) => {
                            u.goals = [{ x: units["boss"].x, y: units["boss"].y, weight: 1 }];
                            return { status: "running" };
                          }))
                        ]),
                        Sequence([
                          Condition((u) => units["monstrosity"].active && !unitInRange(u, units["monstrosity"], meleeRange)),
                          Named("Move to Monstrosity", Action((u) => {
                            u.goals = [{ x: units["monstrosity"].x, y: units["monstrosity"].y, weight: 1 }];
                            return { status: "running" };
                          }))
                        ]),
                        Sequence([
                          Condition((u) =>
                            units["boss"].active &&
                            units["monstrosity"].active &&
                            unitInRange(u, units["boss"], meleeRange) &&
                            unitInRange(u, units["monstrosity"], meleeRange)
                          ),
                          Named("Move to Destination", Action((u) => {
                            u.goals = [{ x: 550, y: 450, weight: 1 }];
                            return { status: "running" };
                          }))
                        ]),
                        Named("Idle", Action((u) => {
                          u.goals = [];
                          u.velocityX = 0;
                          u.velocityY = 0;
                          return { status: "success" };
                        }))
                      ])(this)
                    },
                },
    "boss": {
                        name: "Amber-Shaper Un'sok",
                        active: false,
                        team: 2,
                        x: canvasElement.clientWidth /2 ,
                        y: canvasElement.clientHeight - 100,
                        velocityX: 0,
                        velocityY: 0,
                        radius: 50,
                        centerX: 50,
                        centerY: 50,
                        speed: 2.1,
                        debuffs: [
                        ],
                        hp: 1000000000,
                        maxhp: 1000000000,
                        image: newImage("images/amber-shaper.png"),
                        behavior: function() {
                            return Selector([
                                Sequence([
                                    Condition((u) => blackBoard.phase === 3),
                                    Named("Move to P3 Location", Action((u) => {
                                        u.goals = [{ x: canvasElement.clientWidth /2, y: canvasElement.clientHeight /2 - 100, weight: 1 }];
                                        return { status: "running" };
                                    }))
                                ]),
                                Sequence([
                                    Condition((u) => units["tank"].active && !unitInRange(u, units["tank"])),
                                    Named("Move to Tank", Action((u) => {
                                        u.goals = [{ x: units["tank"].x, y: units["tank"].y, weight: 1 }];
                                        return { status: "running" };
                                    }))
                                ]),
                            ])(this);
                        },
                    },
    "monstrosity":  {
                        name: "Amber Monstrosity",
                        active: false,
                        team: 2,
                        x: canvasElement.clientWidth /2 + 330,
                        y: canvasElement.clientHeight - 100,
                        velocityX: 0,
                        velocityY: 0,
                        radius: 60,
                        centerX: 60,
                        centerY: 60,
                        speed: 2.1,
                        debuffs: [
                        ],
                        hp: 327000000,
                        maxhp: 327000000,
                        image: newImage("images/amber.webp"),
                        behavior: function() {
                            return Selector([
                                Sequence([
                                    Condition((u) => units["tank"].active && !unitInRange(u, units["tank"])),
                                    Named("Move to Tank", Action((u) => {
                                        u.goals = [{ x: units["tank"].x, y: units["tank"].y, weight: 1 }];
                                        return { status: "running" };
                                    }))
                                ]),
                            ])(this);
                        },
                    },
    "amberPuddle": {
                        name: "amber",
                        x: canvasElement.clientWidth / 2,
                        y: canvasElement.clientHeight * 0.8,
                        velocityX: 0,
                        velocityY: 0,
                        radius: 20,
                        centerX: 20,
                        centerY: 20,
                        red: 287,
                        green: 185,
                        blue: 57,
                        maxColor: 40,
                    }
}
for (let i = 0; i<20; i++) {
    puddles.push({ ...units["amberPuddle"] });
    puddles[i].x = Math.round(Math.random()*400)-200 + puddles[i].x
    puddles[i].y = Math.round(Math.random()*250)-125 + puddles[i].y
}

let movementKeys = {
    "w": false,
    "a": false,
    "s": false,
    "d": false,
}

let spellKeys ={
    "1": {id: "amberstrike", time: 0} ,
    "2": {id: "struggle", time: 0} ,
    "3": {id: "consume", time: 0} ,
    "4": {id: "break", time: 0} ,
}

function draw() {
    const currentTime = (new Date).getTime();
    if ((currentTime - lastUpdate) >= UPDATEFREQ) {
        update(currentTime);
        lastUpdate = currentTime;
        drawGameBackground();
        
        drawObject(units["tank"]);
        drawEnemies();
        drawObject(units["redPlayer"]);

        drawUnitFrames();
    }
    
    requestAnimationFrame(draw);
}

function drawGameBackground() {
    const gradient = context.createRadialGradient(width/2, gameHeight/2, 100, width/2, gameHeight/2, 400);
    gradient.addColorStop(0, "#473400");
    gradient.addColorStop(0.75, "#382900");
    context.beginPath();
    context.fillStyle = gradient;
    context.rect(0, 0, width, gameHeight);
    context.fill();

    drawCracks(context);
    drawCenter(context);

    //outside border
    context.beginPath();
    context.lineWidth = 16;
    context.strokeStyle = "#fff";
    context.rect(0, 0, width, gameHeight);
    context.stroke();

    drawPuddles();
}

function drawEnemies() {
    const enemies = Object.keys(units).filter(u =>  units[u].team != undefined &&
                                                    units[u].active &&
                                                    units[u].team != units["redPlayer"].team) ;
    enemies.forEach(u => drawObject(units[u]));  
}

function drawUnitFrames() {
    const playerFrame = [25,25,220,60];

    const p = units["redPlayer"];
    const pPercenthp = p.hp/p.maxhp;
    context.beginPath();
    context.fillStyle = "black";
    context.rect(playerFrame[0], playerFrame[1], playerFrame[2], playerFrame[3]);
    context.fill();
    context.drawImage(
        p.image,
        playerFrame[0],
        playerFrame[1]+2,
        55,
        55
    );
    context.beginPath(); // health
    context.fillStyle = "#3FC7EB";
    context.rect(playerFrame[0]+55, playerFrame[1]+2, (playerFrame[2]-57)*pPercenthp, 33);
    context.fill();

    context.beginPath(); // mana
    context.fillStyle ="#0000AA";
    context.rect(playerFrame[0]+55, playerFrame[1]+2+33+2, playerFrame[2]-57, 21);
    context.fill();

    context.font = "16px arial";
    context.textBaseline = "top";
    context.fillStyle ="#111111";
    context.fillText(p.name,playerFrame[0]+55+3,playerFrame[1]+10);


    if (p.target == null) return;
    
    const t = units[p.target];
    const targetFrame = [playerFrame[2]+25+25,25,220,60];
    context.beginPath();
    context.fillStyle = "black";
    context.rect(targetFrame[0], targetFrame[1], targetFrame[2], targetFrame[3]);
    context.fill();
    context.drawImage(
        t.image,
        targetFrame[0],
        targetFrame[1]+2,
        55,
        55
    );

    const percenthp = t.hp/t.maxhp
    context.beginPath(); // health
    context.fillStyle = "#751212";
    context.rect(targetFrame[0]+55, targetFrame[1]+2, (targetFrame[2] - 57)*percenthp, 33);
    context.fill();

    context.font = "16px arial";
    context.textBaseline = "top";
    context.fillStyle ="#111111";
    context.fillText(t.name,targetFrame[0]+55+3,targetFrame[1]+10);

    const currentTime = Date.now();
    for (let i=0; i < t.debuffs.length; i++) {
        const debuff = t.debuffs[i];
        const x = targetFrame[0]+targetFrame[2]-(i*32)-24;
        const y = targetFrame[1]+targetFrame[3]+4;
        context.drawImage(
            debuff.icon,
            x,
            y,
            24,
            24
        );
        if ( debuff.count > 1 ) {
            context.font = "16px arial";
            context.textBaseline = "top";
            context.fillStyle ="#FFFFFF";
            context.fillText(debuff.count,x+16,y-4);
        };
        if ( debuff.lastApply > 0 && debuff.duration > 0 ) {
            const timeLeft = Math.round(debuff.duration-(currentTime - debuff.lastApply)/1000);
            context.font = "12px arial";
            context.textBaseline = "top";
            context.fillStyle ="#FFFFFF";
            context.fillText(timeLeft,x+6,y+8);
        }
    }
}

function drawCenter(ctx){
    const xOff = (width/2)-160;
    const yOff = 160;
    const gradient = ctx.createRadialGradient(width/2, 320, 40, width/2, 320, 180);
    gradient.addColorStop(0, "#283e4f");
    gradient.addColorStop(0.75, "#11202b");
    ctx.fillStyle = gradient;
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#735400";
    ctx.lineJoin = "miter";
    ctx.lineCap = "butt";
    ctx.beginPath();
    ctx.moveTo(floorBox[0][0]+xOff,floorBox[0][1]+yOff)
    for (let i=1;i<floorBox.length;i++){
        ctx.lineTo(floorBox[i][0]+xOff,floorBox[i][1]+yOff);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function generateNoisyCirclePoints(cx, cy, radius, segments = 60, noiseAmount = 4) {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    let x = cx + Math.cos(angle) * radius;
    let y = cy + Math.sin(angle) * radius;
    x += (Math.random() - 0.5) * noiseAmount;
    y += (Math.random() - 0.5) * noiseAmount;
    points.push({ x, y });
  }
  return points;
}

function precomputeCrackPaths() {
  const numRings = 4;
  const ringSpacing = 135;

  const edges = [
    { x: width / 2, y: 0 },             // Top
    { x: width / 2, y: gameHeight },        // Bottom
    { x: 0, y: gameHeight / 2 },            // Left
    { x: width, y: gameHeight / 2 },        // Right
  ];
  const corners = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: 0, y: gameHeight },
    { x: width, y: gameHeight },
  ];

  const centers = [...edges, ...corners];

  for (const origin of centers) {
    for (let i = 1; i <= numRings; i++) {
      const radius = i * ringSpacing;
      const points = generateNoisyCirclePoints(origin.x, origin.y, radius);
      precomputedCracks.push(points);
    }
  }
}
function drawCracks(ctx) {
  ctx.strokeStyle = "rgba(12, 12, 3, 0.55)";
  ctx.lineWidth = 3;

  for (const points of precomputedCracks) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.stroke();
  }
}
precomputeCrackPaths();

function drawPuddles() {
    puddles.forEach( (puddle) => {

        context.beginPath();
        const amberPuddle = units["amberPuddle"];
        const r = puddle.red + (Math.round(Math.random()*4)-2);
        puddle.red = (Math.abs(amberPuddle.red - r) < amberPuddle.maxColor) ? r : puddle.red;
        const g = puddle.green + (Math.round(Math.random()*4)-2);
        puddle.green = (Math.abs(amberPuddle.green - g) < amberPuddle.maxColor) ? g : puddle.green;
        const b = puddle.blue + (Math.round(Math.random()*4)-2);
        puddle.blue = (Math.abs(amberPuddle.blue - b) < amberPuddle.maxColor) ? b : puddle.blue;
        
        
        context.fillStyle = `rgb(${puddle.red},${puddle.green},${puddle.blue})`;
        context.arc(puddle.x, puddle.y, puddle.radius, 0, 2 * Math.PI);
        context.fill();
        context.lineWidth = 4;
        context.strokeStyle = `rgb(${puddle.red-30},${puddle.green-30},${puddle.blue-15})`;
        context.stroke();
    });
}

function drawObject(object) {
    context.drawImage(
        object.image,
        object.x - object.centerX,
        object.y - object.centerY,
        object.radius * 2,
        object.radius * 2
    );
}

function stayOnScreen(object, bounce) {
    if (bounce) {
        if (object.x - object.radius < 0) {
            object.velocityX = -object.velocityX;
            object.x = object.radius;
        }
        if (object.x + object.radius > canvasElement.clientWidth) {
            object.velocityX = -object.velocityX;
            object.x = -object.radius + canvasElement.clientWidth;
        }

        if (object.y - object.radius < 0) {
            object.velocityY = -object.velocityY;
            object.y = object.radius;
        }
        if (object.y + object.radius > canvasElement.clientHeight) {
            object.velocityY = -object.velocityY;
            object.y = -object.radius + canvasElement.clientHeight;
        }
    } else {
        if (object.x - object.radius < 0) {
            object.velocityX = 0;
            object.x = object.radius;
        }
        if (object.x + object.radius > canvasElement.clientWidth) {
            object.velocityX = 0;
            object.x = -object.radius + canvasElement.clientWidth;
        }

        if (object.y - object.radius < 0) {
            object.velocityY = 0;
            object.y = object.radius;
        }
        if (object.y + object.radius > canvasElement.clientHeight) {
            object.velocityY = 0;
            object.y = -object.radius + canvasElement.clientHeight;
        }
    }
}

function move(object) {
    object.x += object.velocityX;
    object.y += object.velocityY;
}

function applyDebuffDamageModifiers(toUnit, fromUnit, baseAmount) {
    let amount = baseAmount;

    for (const debuff of (toUnit.debuffs || [])) {
        if (typeof debuff.dmgEffect === "function") {
            amount = debuff.dmgEffect(toUnit, fromUnit, amount);
        }
    }
    return Math.round(amount);
}

function damageUnit(toUnit, fromUnit, amount) {
    if (!!!toUnit || !!!amount) return;
    const finalAmount = applyDebuffDamageModifiers(toUnit, fromUnit, amount);
    toUnit.hp -= finalAmount;
}

function triggerEvents(time){
    Object.keys(gameEvents).forEach( (k) =>{
        if (gameEvents[k].condition(time)) {         
            gameEvents[k].action(time)
            if (gameEvents[k].endon(time)) delete gameEvents[k];
        }

    });
}

function update(time) {
    const speed = 2;
    let velocityX = 0;
    let velocityY = 0;

    if (movementKeys["w"]) velocityY = -1;
    if (movementKeys["s"]) velocityY = 1;
    if (movementKeys["a"]) velocityX = -1;
    if (movementKeys["d"]) velocityX = 1;

    if (velocityX !== 0 && velocityY !== 0) {
        velocityX *= Math.SQRT1_2;
        velocityY *= Math.SQRT1_2;
    }

    units["redPlayer"].velocityX = velocityX * speed;
    units["redPlayer"].velocityY = velocityY * speed;

    triggerEvents(time);

    updateUnitAI();

    stayOnScreen(units["redPlayer"], false);
    move(units["redPlayer"]);
    move(units["tank"]);
    move(units["boss"]);
    move(units["monstrosity"]);
}

function distanceFromUnitToXY(unit1Key, x, y) {
    const unit1 = units[unit1Key];
    return Math.sqrt((unit1.x - x)**2 + (unit1.y - y)**2);
}

function distanceBetweenUnits(unit1Key, unit2Key) {
    const unit1 = units[unit1Key];
    const unit2 = units[unit2Key];

    return Math.sqrt((unit1.x - unit2.x)**2 + (unit1.y - unit2.y)**2);
}

function distanceFromPlayer(unitKey) {
    return distanceBetweenUnits("redPlayer",unitKey);
}

document.addEventListener("keydown", e => {
    if ( e.code == 'Tab' ) {
        e.preventDefault()
        const targetable = Object.keys(units).filter(u => 
                                                        units[u].active &&
                                                        units[u].hp > 0 && 
                                                        units[u].team != units["redPlayer"].team &&
                                                        u != units["redPlayer"].target);
        if (!!targetable.length) {
            targetable.sort((a,b) => distanceFromPlayer(a) - distanceFromPlayer(b));
            console.log(targetable);
            units["redPlayer"].target = targetable[0];
            units["tank"].target = units[targetable[0]];
        }
    }
});

document.addEventListener("keyup", event => {
    if (typeof movementKeys[event.key] === 'undefined') return;
    movementKeys[event.key] = false;
});

document.addEventListener("keypress", event => {
    if (typeof movementKeys[event.key] === 'undefined') return;
    if (movementKeys[event.key] === true) return;
    movementKeys[event.key] = true;
});

document.addEventListener("keypress", event => {
    if (typeof spellKeys[event.key] === 'undefined') return;
    document.querySelector(`#${spellKeys[event.key].id}`).click()

});

document.addEventListener('contextmenu', event => {
    event.preventDefault();
    console.log('rightclick');
    return false;
});

document.querySelectorAll(".ability").forEach(button => {
    button.addEventListener("click", () => {
        startCooldown(button);
    });
});


document.addEventListener("mousemove", event => {
    const relX = event.clientX - canvasElement.offsetLeft;
    const relY = event.clientY - canvasElement.offsetTop;
    blackBoard.mouseX = relX < 0 ? 0 : relX;
    blackBoard.mouseY = relY < 0 ? 0 : relY;
    blackBoard.mouseX = relX > width ? width : relX;
    blackBoard.mouseY = relY > gameHeight ? gameHeight : relY;
});

function polarToCartesian(cx, cy, r, angle) {
    const rad = (angle - 90) * Math.PI / 180;
    return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad)
};
}

function describeSector(cx, cy, r, startAngle, endAngle) {
    startAngle = startAngle % 360;
    endAngle = endAngle % 360;

    let sweep = (360 + endAngle - startAngle) % 360;
    const largeArcFlag = sweep > 180 ? 1 : 0;

    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);

    return [
        "M", cx, cy,
        "L", start.x, start.y,
        "A", r, r, 0, largeArcFlag, 1, end.x, end.y,
        "Z"
    ].join(" ");
}

function canDoAction(id) {
    let bCanDoAction = false;
    const player = units["redPlayer"];
    const target = units[player.target];
    switch (id) {
        case "amberstrike":
            if (target != undefined && target.active) bCanDoAction = unitInRange(player, target, meleeRange);
            // console.log(unitInRange(player, target, meleeRange));
            break;
        case "struggle":
            bCanDoAction = player.willpower >= 8;
            break;
        case "consume":
            if (puddles.length > 0) { 
                puddles.sort((a,b) => distanceFromUnitToXY("redPlayer", a.x, a.y) > distanceFromUnitToXY("redPlayer", b.x, b.y));
                const puddle = puddles[0];
                bCanDoAction = inRange(player,puddle.x + puddle.centerX, puddle.y + puddle.centerY,0);
            }
            break;
        case "break":
            bCanDoAction = (player.hp / player.maxhp) <= 0.2;
            break;
    }
    return bCanDoAction;
}

function doAction(id) {
    const player = units["redPlayer"];
    const target = units[player.target];
    
    switch (id) {
        case "amberstrike":
            const currentTime = Date.now();
            damageUnit(target, player, 332499);
            const debuffIndex = target.debuffs.findIndex( (d) =>  d.name === "Destabilize");
            if ( debuffIndex != -1 ) {
                target.debuffs[debuffIndex].count += 1
                target.debuffs[debuffIndex].lastApply = currentTime;
            } else {
                target.debuffs.push({ name: "Destabilize", icon: newImage("./images/as.jpg"), lastApply: currentTime, duration: 60, count: 1, 
                                dmgEffect: (toUnit, fromUnit, baseAmount) => {
                                    return baseAmount * (1 + 0.1 * (toUnit.debuffs.find(d => d.name === "Destabilize")?.count || 1));
                                }  })
            }
            console.log(debuffIndex)
            break;
        case "struggle":
            //self-interrupt: NYI
            break;
        case "consume":
            if (puddles.length > 0) { 
                puddles.shift();
                player.willpower += blackBoard.phase == 3 ? 50 : 20;
            }
            break;
        case "break":
            // bCanDoAction = (player.hp / player.maxhp) <= 0.2;
            break;
    }
}

function startCooldown(button) {
    if (button._cooldownRunning) return;
    if (button.className.includes("disabled")) return;
    if (!canDoAction(button.id)) return;
    button._cooldownRunning = true;

    doAction(button.id);

    const path = button.querySelector('.cooldown-fill');
    const text = button.querySelector('.cooldown-text');
    const duration = parseInt(button.getAttribute('data-cd'), 10) || 5000;
    const startTime = Date.now();

    const cx = 50;
    const cy = 50;
    const r = 70;

    text.style.display = "block";

    function animate() {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const endAngle = 0;
        const startAngle = 360 * progress;

        if (progress < 1) {
        path.setAttribute("d", describeSector(cx, cy, r, startAngle, endAngle));

        const remaining = ((duration - elapsed) / 1000).toFixed(1);
        text.textContent = remaining;

        requestAnimationFrame(animate);
        } else {
            path.setAttribute("d", "");
            text.style.display = "none";
            button._cooldownRunning = false;
            }
    }
    animate();
}

function updateUnitAI() {
    for (const u of Object.keys(units)) {
        const unit = units[u];
        if (unit.active && unit.behavior != undefined) {
            unit.behavior()
            applyVelocityFromGoals(unit)
        }
    }
}

draw();