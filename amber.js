import * as ai from './ai.js';
import { win, loss } from './endscreen.js';
import { howToPlayInit, drawHowToPlay } from './howto.js';
import { newImage, newAudio, AudioManager } from './commonui.js'
import { createButton, clearButtons, buttonDraw, simulateClick  } from './button.js';

const { Named, Selector, Sequence, Condition, Action, inRange, unitInRange, applyVelocityFromGoals, performAttack } = ai

const canvasElement = document.getElementById("secret");
const context = canvasElement.getContext("2d");

const { width, height } = canvasElement;
const gameHeight = height;

const UPDATEFREQ = 16.67;
let lastUpdate = Date.now();
let startTime = Date.now();
const meleeRange = 20;
const maxWiggle = 8 * Math.PI / 180; 
const wiggleAmount = 0.8 * Math.PI / 180;

const music = [
    newAudio("sounds/music/1.mp3", 0.3),
    newAudio("sounds/music/4.mp3", 0.3),
    newAudio("sounds/music/3.mp3", 0.3),
    newAudio("sounds/music/2.mp3", 0.2), 
];

const ambience = [
    newAudio("sounds/ambience/1.ogg", 0.15),
    newAudio("sounds/ambience/2.ogg", 0.15),
];

const blackBoard = {
    phase: 1,
    convert: 0,
    end: {win: false, loss: false}, //w/e
    puddles: 0,
    consumeAmber: 0,
    selfExplosions: 0,
}
const gameEvents = {
    convertToAmber: {
        condition: () => units["redPlayer"].amber && units["redPlayer"].image != units["redPlayer"].monstrosityImage,
        action: (time) => { units["redPlayer"].image = units["redPlayer"].monstrosityImage;
                        units["redPlayer"].willpower = 100;
                        toggleActionBars();
                        units["redPlayer"].sound.playing = false;
                        units["redPlayer"].sound = units["redPlayer"].monstrositySound;
                        units["redPlayer"].spells[0].lastCast = time;
                        const breakButton = document.getElementById("break");
                        let wpInterval;
                        wpInterval = setInterval( (player) => {
                            if (!units["redPlayer"].amber){ clearInterval(wpInterval); return};
                            player.willpower -= 2; 

                         }, 1000, units["redPlayer"]);
                        breakButton.classList.add("disabled");
        },
        endon: () => false,
    },
    convertTankToAmber: {
        condition: () => units["tank2"].amber && units["tank2"].image != units["tank2"].monstrosityImage,
        action: (time) => { units["tank2"].image = units["tank2"].monstrosityImage;
                        units["tank2"].willpower = 100; //cheat to get him to consume sooner
                        units["tank2"].spells[0].lastCast = time;
                        let wpInterval;
                        let count = 0;
                        wpInterval = setInterval( (tank) => {
                            count += 2
                            if (!units["tank2"].amber){ clearInterval(wpInterval); return};
                            tank.willpower -= 2;
                            if ( count >= 26 ) {
                                tank.willpower -= 8;
                                count = 0;
                            }
                         }, 1000, units["tank2"]);
        },
        endon: () => false,
    },
    enableBreak: {
        condition: () => units["redPlayer"].amber && (units["redPlayer"].hp/units["redPlayer"].maxhp) <= 0.2,
        action: () => {
                        const breakButton = document.getElementById("break");
                        breakButton.classList.remove("disabled");
        },
        endon: () => false,
    },
    convertToPlayer: {
        condition: () => !units["redPlayer"].amber && units["redPlayer"].image != units["redPlayer"].raiderImage,
        action: () => { units["redPlayer"].image = units["redPlayer"].raiderImage; 
                        units["redPlayer"].hp = units["redPlayer"].maxhp;
                    },
        endon: () => false,
    },
    bossSpawn: {
        condition: (time) => !units["boss"].active && time-startTime >= 1000,
        action: (time) => { units["boss"].active = true;
                        units["boss"].hp = units["boss"].maxhp * 0.75;
                        units["tank"].target = units["boss"];
                        units["boss"].target = units["tank"];
                        const debuffIndex = units["boss"].debuffs.findIndex( (d) =>  d.name === "Destabilize");
                        units["boss"].debuffs[debuffIndex].count = 17;
                        units["boss"].debuffs[debuffIndex].lastApply = time;
                        AudioManager.play(units["boss"].spawnSound);
                     },
        endon: () => true,
    },
    monstrositySpawn: {
        condition: (time) => !units["monstrosity"].active && (units["boss"].hp / units["boss"].maxhp) <= 0.7,
        action: (time) => { units["monstrosity"].active = true;
                        units["monstrosity"].hp = units["monstrosity"].maxhp,
                        units["monstrosity"].spells[0].lastCast = time, //start amber explosion on CD.
                        units["tank"].target = units["monstrosity"],
                        units["monstrosity"].target = units["tank"],
                        blackBoard.phase = 2
                        AudioManager.play(units["monstrosity"].spawnSound);
                    },
        endon: () => true,
    },
    bossRaidDamage: {
        condition: (time) => units["boss"].active && time-startTime >= 5000,
        action: () => { damageUnit(units["boss"], "Raid", 500000);
                        units["boss"].hp = units["boss"].hp < 0 ? 0 : units["boss"].hp},
        endon: () => units["boss"].hp <= 0,
    },
    monstrosityDead: {
        condition: () => (!!units["monstrosity"].active && units["monstrosity"].hp <= 0),
        action: () => {
            units["monstrosity"].active = false; 
            blackBoard.phase = 3; 
            AudioManager.play(units["monstrosity"].deathSound) },
        endon: () => true
    },
    bossDead: {
        condition: () => (!!units["boss"].active && units["boss"].hp <= 0),
        action: () => {units["boss"].active = false; blackBoard.end.win = true},
        endon: () => true
    },
    monstrosityRaidDamage: {
        condition: (time) => units["monstrosity"].active &&  time-startTime >= 15000,
        action: () => { damageUnit(units["monstrosity"], "Raid", 200000);
                        units["monstrosity"].hp = units["monstrosity"].hp < 0 ? 0 : units["monstrosity"].hp},
        endon: () => units["monstrosity"].hp < 0,
    },
    playerAmberDamageTaken: {
        condition: () => units["redPlayer"].amber && blackBoard.phase != 3,
        action: () => {
                        const p = units["redPlayer"];
                        const percenthp = p.hp/p.maxhp;
                        if (percenthp > 0.23) {
                            damageUnit(p, "Raid", 2100);
                        } else {
                            damageUnit(p, "Raid", 450);
                        }
                    },
        endon: () => false,
    },
    tankAmberDamageTaken: {
        condition: () => units["tank2"].amber && blackBoard.phase != 3,
        action: () => {
                        const t = units["tank2"];
                        const percenthp = t.hp/t.maxhp;
                        if (percenthp > 0.23) {
                            damageUnit(t, "Raid", 2100);
                        } else {
                            damageUnit(t, "Raid", 450);
                        }
                    },
        endon: () => false,
    },
    playerDead: {
        condition: () => units["redPlayer"].active && (units["redPlayer"].hp <= 0 || units["redPlayer"].willpower <= 0),
        action: () => {units["redPlayer"].active = false, blackBoard["end"].loss = true},
        endon: () => true,
    },
    amberCarapaceAdd: {
        condition: () => units["boss"].active && blackBoard.phase == 2,
        action: () => units["boss"].debuffs.push(
                            { name: "Amber Carapace", lastApply: 0, duration: 0, icon: newImage("./images/ac.jpg"), count: 1, dmgEffect: (toUnit, fromUnit, baseAmount) => {
                                return baseAmount * 0.01;} }
                            ),
        endon: () => true,
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
    },
    checkPools: {
        condition: () => puddles.length > 0,
        action: (time) => {
                        for (let i = puddles.length -1; i >= 0; i--){
                            if (time - puddles[i].spawnTime >= 30000) {
                                puddles.splice(i, 1);
                                setTimeout(()=> {
                                    const puddle = { ...units["amberPuddle"] }
                                    
                                    puddle.x = Math.round(Math.random()*400)-200 + units["amberPuddle"].x;
                                    puddle.y = Math.round(Math.random()*250)-125 + units["amberPuddle"].y;
                                    console.log(units["monstrosity"].hp/units["monstrosity"].maxhp);
                                    if (units["monstrosity"].active && units["monstrosity"].hp/units["monstrosity"].maxhp < 0.10) {
                                        console.log('trying to spawn p3 amber');
                                        const puddleInterval = setInterval(()=>{
                                            if ( !units["monstrosity"].active ) {
                                                clearInterval(puddleInterval);
                                                puddle.spawnTime = Date.now();
                                                puddles.push(puddle);
                                            }
                                        },randomBellCurve(1000,5000,0.75));
                                    } else {
                                        console.log('spawning normal amber');
                                        puddle.spawnTime = Date.now();
                                        puddles.push(puddle);
                                    }
                                }, randomBellCurve(8000,20000,0.75));
                            }
                        }
                    },
        endon: () => false,
    },
    tutorialAmberStrike: {
        condition: (time) => (tutorialMode && units["redPlayer"].amber),
        action: (time) => {
                    raidWarning = "Press (1) Amber-Strike on Amber Monstrosity on CD.";
                    AudioManager.play(raidWarningSound);
                    setTimeout( ()=> raidWarning = "", 4000);
                    },
        endon: () => true,
    },
    tutorialStruggleForControl: {
        condition: () => ( tutorialMode && units["redPlayer"].amber && units["redPlayer"].casting == 0 ),
        action: (time) => {
                    raidWarning = "Press (2) Struggle For Control to interrupt: Amber Explosion(YOU)";
                    AudioManager.play(raidWarningSound);
                    setTimeout( ()=> raidWarning = "", 4000);
                    },
        endon: () => true,
    },
    tutorialHoldAmberStrike: {
        condition: (time) => ( tutorialMode && units["redPlayer"].amber && (units["monstrosity"].spells[0].cooldown*1000)-(time-units["monstrosity"].spells[0].lastCast) >= 12000 && (units["monstrosity"].spells[0].cooldown*1000)-(time-units["monstrosity"].spells[0].lastCast) <= 13000),
        action: (time) => {
                    raidWarning = "Hold off on (1) Amber-Strike until Amber Explosion has 6 - 5s on CD.";
                    AudioManager.play(raidWarningSound);
                    },
        endon: () => true,
    },
    tutorialInterruptAmberExplosion: {
        condition: () => ( tutorialMode && units["redPlayer"].amber && units["monstrosity"].casting == 0 ),
        action: () => {
                    raidWarning = "Press (1) Amber-Strike to interrupt Amber-Monstrosity.";
                    AudioManager.play(raidWarningSound);
                    setTimeout( ()=> raidWarning = "", 4000);
                    },
        endon: () => true,
    },
    tutorialBreakFree: {
        condition: () => ( tutorialMode && units["redPlayer"].amber && (units["redPlayer"].hp/units["redPlayer"].maxhp) <= 0.2 ),
        action: () => {
                    raidWarning = "Refresh (1) Amber-Strike and immediately (4) Break Free.";
                    AudioManager.play(raidWarningSound);
                    setTimeout( ()=> raidWarning = "", 4000);
                    },
        endon: () => true,
    },
    tutorialConsumeAmber: {
        condition: () => ( tutorialMode && units["redPlayer"].amber && blackBoard.phase == 3 ),
        action: () => {
                    raidWarning = "Press (3) Consume Amber when near an Amber Pool with willpower less than 50%.";
                    AudioManager.play(raidWarningSound);
                    setTimeout( ()=> raidWarning = "", 4000);
                    },
        endon: () => true,
    },
}
let gameEventsTimer;

let tutorialMode = true;
let raidWarning = "";
const raidWarningSound = newAudio("sounds/raidwarning.ogg", 0.5);
const puddles = [];
const precomputedCracks = [];
const floorBox = [[48,0],[272,0],[288,32],[320,48],[320,272],[288,288],[272,320],[48,320],[32,288],[0,272],[0,48],[32,32]];
const units = {
    "redPlayer": {
                    name: "Sprinklez",
                    team: 1,
                    amber: false,
                    active: true,
                    spawnTime: startTime,
                    x: canvasElement.clientWidth / 2,
                    y: canvasElement.clientHeight / 2,
                    velocityX: 0,
                    velocityY: 0,
                    radius: 40,
                    centerX: 40,
                    centerY: 40,
                    rotation: 0,
                    rotationDirection: 0,
                    hp: 420000,
                    maxhp: 420000,
                    willpower: 100,
                    speed: 3,
                    debuffs:[],
                    casting: -1,
                    spells: [
                                { name: "Amber Explosion(YOU)", lastCast: -1, cooldown: 13, castTime: 2, interruptible: false },
                                { name: "Frostbolt", lastCast: -1, cooldown: 0, castTime: 2, interruptible: false, exclude: true, sound: {precast: newAudio('sounds/redPlayer/prefrost.ogg', 0.2), cast: newAudio('sounds/redPlayer/frost.ogg', 0.2), hit: newAudio('sounds/redPlayer/frosthit.ogg', 0.2) } },
                            ],
                    target: undefined,
                    behavior: function() {
                            return Selector([
                                Sequence([
                                    Condition((u) => u.amber && u.casting == -1 && u.spells[0].lastCast != -1 && (Date.now() - u.spells[0].lastCast) >= (u.spells[0].cooldown * 1000)),
                                    Named("Casting Amber Explosion (YOU)", Action((u) => {
                                        u.casting = 0;
                                        u.spells[u.casting].lastCast = Date.now();
                                        setTimeout(() => {  if (u.casting == 0) {
                                                                blackBoard.selfExplosions += 1
                                                                if (blackBoard.selfExplosions > 2) blackBoard["end"].loss = true;
                                                                console.log("KAAAABOOOOOOM");
                                                                u.casting = -1
                                                                console.log('clearing cast: Amber Explosion');
                                                            };
                                                        }, u.spells[u.casting].castTime * 1000);
                                        return { status: "casting" };
                                    }))
                                ])
                            ])(this);
                        },
                    image: newImage("images/raider.webp"),
                    raiderImage: newImage("images/raider.webp"),
                    monstrosityImage: newImage("images/amberraider.webp"),
                    sound: {

                    },
                    raiderSound: {
                        audio: [
                            newAudio("sounds/redPlayer/walk1.ogg", 0.2, 1.1),
                            newAudio("sounds/redPlayer/walk2.ogg", 0.2, 1.1),
                            newAudio("sounds/redPlayer/walk3.ogg", 0.2, 1.1),
                            newAudio("sounds/redPlayer/walk4.ogg", 0.2, 1.1),
                            newAudio("sounds/redPlayer/walk5.ogg", 0.2, 1.1),
                        ],
                        playingIndex: 1,
                        playing: false,
                    },
                    monstrositySound: {
                        audio: [
                            newAudio("sounds/redPlayer/amber1.ogg", 0.15, 1.4),
                            newAudio("sounds/redPlayer/amber2.ogg", 0.15, 1.4),
                            newAudio("sounds/redPlayer/amber3.ogg", 0.15, 1.4),
                            newAudio("sounds/redPlayer/amber4.ogg", 0.15, 1.4),
                            newAudio("sounds/redPlayer/amber5.ogg", 0.15, 1.4),
                        ],
                        playingIndex: 1,
                        playing: false,
                    },
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
                    speed: 3,
                    rotation: 0,
                    rotationDirection: 0,
                    active: true,
                    spawnTime: startTime,
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
                        Named("Idle", Action((u) => {
                          u.goals = [];
                          u.velocityX = 0;
                          u.velocityY = 0;
                          return { status: "success" };
                        }))
                      ])(this)
                    },
                },
    "tank2": {
                    name: "Ronald",
                    team: 1,
                    amber: true,
                    willpower: 100,
                    x: canvasElement.clientWidth / 2-160,
                    y: canvasElement.clientHeight / 2+120,
                    velocityX: 0,
                    velocityY: 0,
                    radius: 40,
                    centerX: 40,
                    centerY: 40,
                    speed: 3,
                    rotation: 0,
                    rotationDirection: 0,
                    debuffs:[],
                    casting: -1,
                    spells: [
                                { name: "Amber Strike", lastCast: -1, cooldown: 6, castTime: 0, interruptible: false }
                            ],
                    active: true,
                    spawnTime: startTime,
                    target: undefined,
                    image: newImage("images/tank.webp"),
                    raiderImage: newImage("images/tank.webp"),
                    monstrosityImage: newImage("images/ambertank.webp"),
                    sound: {
                        audio: [
                            newAudio("sounds/redPlayer/amber1.ogg", 0.01, 1.4),
                            newAudio("sounds/redPlayer/amber2.ogg", 0.01, 1.4),
                            newAudio("sounds/redPlayer/amber3.ogg", 0.01, 1.4),
                            newAudio("sounds/redPlayer/amber4.ogg", 0.01, 1.4),
                            newAudio("sounds/redPlayer/amber5.ogg", 0.01, 1.4),
                        ],
                        playingIndex: 1,
                        playing: false,
                    },
                    hp: 520000,
                    behavior: function() {
                        return Selector([
                        Sequence([
                          Condition((u) => units["tank2"].willpower < 58 && puddles.length > 0 && distanceFromUnitToXY("tank2", puddles[0].x, puddles[0].y) >= 30+puddles[0].radius ),
                          Named("Move to Puddle", Action((u) => {
                            u.goals = [{ x: puddles[0].x, y: puddles[0].y, weight: 1 }];
                            return { status: "running" };
                          }))
                        ]),
                        Sequence([
                          Condition((u) => units["tank2"].willpower < 58 && puddles.length > 0 && distanceFromUnitToXY("tank2", puddles[0].x, puddles[0].y) <= 30+puddles[0].radius ),
                          Named("Cast Consume Amber", Action((u) => {
                            u.goals = [];
                            u.velocityX = 0;
                            u.velocityY = 0;
                            puddles.shift();
                            blackBoard.consumeAmber += 1;
                            u.willpower += blackBoard.phase == 3 ? 50 : 20;
                            return { status: "casting" };
                          }))
                        ]),
                        Sequence([
                          Condition((u) => units["boss"].active && !unitInRange(u, units["boss"], meleeRange)),
                          Named("Move to Boss", Action((u) => {
                            u.goals = [{ x: units["boss"].x, y: units["boss"].y, weight: 1 }];
                            return { status: "running" };
                          }))
                        ]),
                        Sequence([
                                    Condition((u) => units["tank2"].amber && (Date.now() - u.spells[0].lastCast) >= (u.spells[0].cooldown * 1000)),
                                    Named("Casting Amber Strike", Action((u) => {
                                        u.casting = 0;
                                        u.spells[u.casting].lastCast = Date.now();
                                        setTimeout(() => {  const currentTime = Date.now();
                                                            const target = units["boss"];
                                                            damageUnit(target, u, 332499);
                                                                const debuffIndex = target.debuffs.findIndex( (d) =>  d.name === "Destabilize");
                                                                if ( debuffIndex != -1 ) {
                                                                    target.debuffs[debuffIndex].count += 1
                                                                    target.debuffs[debuffIndex].lastApply = currentTime;
                                                                } else {
                                                                    target.debuffs.push({ name: "Destabilize", icon: newImage("./images/as.jpg"), lastApply: currentTime, duration: 15, count: 1, 
                                                                                    dmgEffect: (toUnit, fromUnit, baseAmount) => {
                                                                                        return baseAmount * (1 + 0.1 * (toUnit.debuffs.find(d => d.name === "Destabilize")?.count || 1));
                                                                                    }  })
                                                                }
                                                            u.casting = -1;
                                                        }, u.spells[u.casting].castTime * 1000);
                                        return { status: "casting" };
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
                        spawnTime: -1,
                        team: 2,
                        x: canvasElement.clientWidth /2 ,
                        y: canvasElement.clientHeight - 100,
                        velocityX: 0,
                        velocityY: 0,
                        radius: 50,
                        centerX: 50,
                        centerY: 50,
                        speed: 3.2,
                        rotation: 0,
                        rotationDirection: 0,
                        debuffs: [{ name: "Destabilize", icon: newImage("./images/as.jpg"), lastApply: 0, duration: 15, count: 17, 
                                dmgEffect: (toUnit, fromUnit, baseAmount) => {
                                    return baseAmount * (1 + 0.1 * (toUnit.debuffs.find(d => d.name === "Destabilize")?.count || 1));
                                }  }],
                        casting: -1,
                        spells: [
                            { name: "Reshape Life", lastCast: startTime-35000, cooldown: 48, castTime: 2, interruptible: false },
                            { name: "Amber Scalpel", lastCast: startTime-40000, cooldown: 48, castTime: 10, interruptible: false }
                        ],
                        hp: 1000000000,
                        maxhp: 1000000000,
                        image: newImage("images/amber-shaper.png"),
                        spawnSound: newAudio('sounds/unsok/spawn.ogg', 0.50),
                        behavior: function() {
                            return Selector([
                                Sequence([
                                    Condition((u) => blackBoard.phase != 3 && u.casting == -1 && (Date.now() - u.spells[1].lastCast) >= (u.spells[1].cooldown * 1000)),
                                    Named("Casting Amber Scalpel", Action((u) => {
                                        u.casting = 1;
                                        u.spells[u.casting].lastCast = Date.now();
                                        setTimeout(() => {  
                                                            const numPuddles = Math.round(randomBellCurve(4,6,1.1));
                                                            const time = Date.now();
                                                            blackBoard.puddles += numPuddles;
                                                            for (let i = 0; i < numPuddles; i++) {
                                                                setTimeout(()=> {
                                                                    const puddle = { ...units["amberPuddle"] }
                                                                    
                                                                    puddle.x = Math.round(Math.random()*400)-200 + units["amberPuddle"].x;
                                                                    puddle.y = Math.round(Math.random()*250)-125 + units["amberPuddle"].y;
                                                                    puddle.spawnTime = Date.now();
                                                                    puddles.push(puddle);
                                                                }, randomBellCurve(8000,20000,1));
                                                            }
                                                            u.casting = -1;
                                                        }, u.spells[u.casting].castTime * 1000);
                                        return { status: "casting" };
                                    }))
                                ]),
                                Sequence([
                                    Condition((u) => (!units["redPlayer"].amber || !units["tank2"]) && u.casting == -1 && (Date.now() - u.spells[0].lastCast) >= (u.spells[0].cooldown * 1000)),
                                    Named("Casting Reshape Life", Action((u) => {
                                        u.casting = 0;
                                        u.spells[u.casting].lastCast = Date.now();
                                        setTimeout(() => {  
                                                            // units["redPlayer"].amber = true;
                                                            const target = !units["tank2"].amber ? units["tank2"] : units["redPlayer"]
                                                            target.amber = true;
                                                            units["redPlayer"].spells[0].lastCast = Date.now();
                                                            units["redPlayer"].casting = -1;
                                                            AudioManager.stop(units["redPlayer"].spells[1].sound.precast);
                                                            u.casting = -1;
                                                        }, u.spells[u.casting].castTime * 1000);
                                        return { status: "casting" };
                                    }))
                                ]),
                                Sequence([
                                    Condition((u) => u.casting != -1),
                                    Named("Holding Position while casting", Action((u) => {
                                        u.goals=[];
                                        u.velocityX=0;
                                        u.velocityY=0;
                                        return { status: "casting: holding position" };
                                    }))
                                ]),
                                Sequence([
                                    Condition((u) => blackBoard.phase === 3),
                                    Named("Move to P3 Location", Action((u) => {
                                        u.goals = [{ x: canvasElement.clientWidth /2, y: canvasElement.clientHeight /2 - 100, weight: 1 }];
                                        return { status: "running" };
                                    }))
                                ]),
                                Sequence([
                                    Condition((u) => units["tank"].active && !unitInRange(u, units["tank"]),5),
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
                        spawnTime: -1,
                        team: 2,
                        x: canvasElement.clientWidth /2 + 330,
                        y: canvasElement.clientHeight - 100,
                        velocityX: 0,
                        velocityY: 0,
                        radius: 60,
                        centerX: 60,
                        centerY: 60,
                        speed: 3.2,
                        rotation: 0,
                        rotationDirection: 0,
                        debuffs: [],
                        casting: -1,
                        sound: {
                        audio: [
                            newAudio("sounds/redPlayer/amber1.ogg", 0.2, 1.4),
                            newAudio("sounds/redPlayer/amber2.ogg", 0.2, 1.4),
                            newAudio("sounds/redPlayer/amber3.ogg", 0.2, 1.4),
                            newAudio("sounds/redPlayer/amber4.ogg", 0.2, 1.4),
                            newAudio("sounds/redPlayer/amber5.ogg", 0.2, 1.4),
                        ],
                        playingIndex: 1,
                        playing: false,
                    },
                        spells: [
                            { name: "Amber Explosion", lastCast: 0, cooldown: 50, castTime: 2, interruptible: true }
                        ],
                        hp: 327000000,
                        maxhp: 327000000,
                        image: newImage("images/amber.webp"),
                        spawnSound: newAudio('sounds/monstrosity/spawn.ogg', 0.15),
                        deathSound: newAudio('sounds/unsok/p3.ogg', 0.15),
                        behavior: function() {
                            return Selector([
                                Sequence([
                                    Condition((u) => u.casting == -1 && (Date.now() - u.spells[0].lastCast) >= ((u.spells[0].cooldown+Math.random()*10) * 1000)),
                                    Named("Casting Amber Explosion", Action((u) => {
                                        u.casting = 0;
                                        u.spells[u.casting].lastCast = Date.now();
                                        setTimeout(() => {  
                                                            if (u.casting == 0 && u.active) {
                                                                console.log("KAAAABOOOOOOM");
                                                                blackBoard["end"].loss = true;
                                                                u.casting = -1
                                                            };
                                                        }, u.spells[u.casting].castTime * 1000);
                                        return { status: "casting" };
                                    }))
                                ]),
                                Sequence([
                                    Condition((u) => u.casting != -1),
                                    Named("Holding Position while casting", Action((u) => {
                                        u.goals=[];
                                        u.velocityX=0;
                                        u.velocityY=0;
                                        return { status: "casting: holding position" };
                                    }))
                                ]),
                                Sequence([
                                    Condition((u) => units["tank"].active && !unitInRange(u, units["tank"],5)),
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
                        active: true,
                        spawnTime: startTime,
                        x: canvasElement.clientWidth / 2,
                        y: canvasElement.clientHeight * 0.8,
                        velocityX: 0,
                        velocityY: 0,
                        radius: 20,
                        centerX: 0,
                        centerY: 0,
                        red: 287,
                        green: 185,
                        blue: 57,
                        maxColor: 40,
                    }
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

function playAmbience() {
    
    function play(){
        for (const a of ambience) {
            a.loop = true;
            AudioManager.play(a);
        }
    }
    play();
}

function playMusic() {
    let musicIndex = 0;

    function play(){
        AudioManager.play(music[musicIndex], ()=>{ 
            musicIndex++;
            if (musicIndex >= music.length) musicIndex = 0;
            console.log(`after music index: ${musicIndex}`);
            play();
        });
    }
    play();
}

function randomBellCurve(min, max, skew) {
  let u = 0, v = 0;
  while(u === 0) u = Math.random()
  while(v === 0) v = Math.random()
  let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v )
  
  num = num / 10.0 + 0.5
  if (num > 1 || num < 0) 
    num = randn_bm(min, max, skew)
  
  else{
    num = Math.pow(num, skew)
    num *= max - min
    num += min
  }
  return num
}


function gameStartInit(){
    startTime = Date.now();
    lastUpdate = Date.now();
    clearButtons();

    //player fussing.
    units["redPlayer"].sound = units["redPlayer"].raiderSound;

    // reset spell CD's on boss.
    units["boss"].spells[0].lastCast = startTime - 15000;
    units["boss"].spells[1].lastCast = startTime - 20000;
    const numPuddles = Math.round(randomBellCurve(5,7,1.1));;
    for (let i = 0; i<numPuddles; i++){
        puddles.push({ ...units["amberPuddle"] });
        puddles[puddles.length-1].x = Math.round(Math.random()*400)-200 + units["amberPuddle"].x;
        puddles[puddles.length-1].y = Math.round(Math.random()*250)-125 + units["amberPuddle"].y;
        const spawnTime = randomBellCurve(startTime-30000, startTime+10000, 0.25)+15000;
        puddles[puddles.length-1].spawnTime = spawnTime;
    }

    gameEventsTimer = setInterval(triggerEvents,200);
    draw();
    playMusic();
    playAmbience();
}

function draw() {
    if (blackBoard["end"].win) {
        AudioManager.stopAll();
        clearInterval(gameEventsTimer);
        win();
    };
    if (blackBoard["end"].loss) {
        AudioManager.stopAll();
        clearInterval(gameEventsTimer);
        loss();
    };
    if (blackBoard["end"].win || blackBoard["end"].loss) return;
    
    
    const currentTime = (new Date).getTime();
    if (units["redPlayer"].active && (currentTime - lastUpdate) >= UPDATEFREQ) {
        update(currentTime);
        lastUpdate = currentTime;
        
        drawGameBackground();
        
        drawObject(units["tank"]);
        drawEnemies();
        drawObject(units["tank2"]);
        drawObject(units["redPlayer"]);

        drawUnitFrames();
        drawFakeBigWigs(currentTime);
        drawCastBars(currentTime);
        drawRaidWarning();
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
    context.closePath();

    drawCracks(context);
    drawCenter(context);

    //outside border
    context.beginPath();
    context.lineWidth = 16;
    context.strokeStyle = "#fff";
    context.rect(0, 0, width, gameHeight);
    context.stroke();
    context.closePath();


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

    const wpFrameDimensions = [300, 30];
    const wpFrameLeftCorner = [Math.round((width/2)-(wpFrameDimensions[0]/2)), 125];
    const wpBarDimensions = [wpFrameDimensions[0]-4, wpFrameDimensions[1]-4];

    if (p.amber) {
        context.beginPath();
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.rect(wpFrameLeftCorner[0], wpFrameLeftCorner[1], wpFrameDimensions[0], wpFrameDimensions[1] );
        context.fill();

        const barWidth = Math.round(wpBarDimensions[0] * (p.willpower/100))
        context.beginPath();
        context.fillStyle = 'rgb(219, 150, 0)';
        context.rect(wpFrameLeftCorner[0]+2, wpFrameLeftCorner[1]+2, barWidth, wpBarDimensions[1] );
        context.fill();
    }

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

    context.save();
    context.font = "16px arial";
    context.textBaseline = "top";
    context.textAlign = "right";
    context.fillStyle ="#3FC7EB";
    context.fillText((pPercenthp*100).toFixed(0),playerFrame[0]+215,playerFrame[1]+10);
    context.restore();


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

    context.save();
    context.font = "16px arial";
    context.textBaseline = "top";
    context.textAlign = "right";
    context.fillStyle ="#751212";
    context.fillText((percenthp*100).toFixed(0),targetFrame[0]+215,targetFrame[1]+10);
    context.restore();

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

function drawFakeBigWigs(time) {
    
    const deadlyfojjiwigsFrameDimensions = [180, 98];
    const deadlyfojjiwigsFrameLeftCorner = [width-25-deadlyfojjiwigsFrameDimensions[0], 25];
    const deadlyfojjiwigsBarDimensions = [deadlyfojjiwigsFrameDimensions[0]-4, 16];
    
    context.beginPath();
    context.fillStyle = 'rgba(0, 0, 0, 0.65)';
    context.rect(deadlyfojjiwigsFrameLeftCorner[0], deadlyfojjiwigsFrameLeftCorner[1], deadlyfojjiwigsFrameDimensions[0], deadlyfojjiwigsFrameDimensions[1]);
    context.fill();

    context.font = "16px arial";
    context.textBaseline = "top";
    context.fillStyle ="#AAAAAA";
    context.fillText("Deadly Fojji Wigs",deadlyfojjiwigsFrameLeftCorner[0]+25,deadlyfojjiwigsFrameLeftCorner[1]+2);

    let spellIndex = 0;
    for (const unitKey of Object.keys(units)) {
        const unit = units[unitKey];
        if (unit.team != units["redPlayer"].team || unitKey == "redPlayer") {
            if ( unit.active && unit.spells != undefined && unit.spells.length > 0 ) {
                const { spells } = unit;
                for (const spell of spells) {
                    if (!spell.exclude) {
                        spellIndex++;
                        let timeLeft = ((spell.cooldown*1000)-(time - spell.lastCast))/1000;
                        timeLeft = timeLeft < 0 ? 0 : timeLeft;
                        const percentLeft = timeLeft / (spell.cooldown);
                        const barWidth = deadlyfojjiwigsBarDimensions[0] * percentLeft;

                        context.beginPath();
                        context.fillStyle = (timeLeft < 5) ? 'rgb(245, 49, 0)' : 'rgb(0, 245, 0)';
                        context.rect(deadlyfojjiwigsFrameLeftCorner[0]+2, deadlyfojjiwigsFrameLeftCorner[1]+((20)*spellIndex), barWidth, deadlyfojjiwigsBarDimensions[1]);
                        context.fill();

                        context.font = "10px arial";
                        context.textBaseline = "top";
                        context.fillStyle ="#4444CC";
                        context.fillText(spell.name,deadlyfojjiwigsFrameLeftCorner[0]+4,deadlyfojjiwigsFrameLeftCorner[1]+((20)*spellIndex)+3);

                        context.font = "10px arial";
                        context.textBaseline = "top";
                        context.fillStyle ="#4444CC";
                        context.fillText(timeLeft.toFixed(1),deadlyfojjiwigsFrameLeftCorner[0]+deadlyfojjiwigsBarDimensions[0]-20,deadlyfojjiwigsFrameLeftCorner[1]+((20)*spellIndex)+3);
                    }
                }
            }
        }
    }
}

function drawCastBars(time){

    for (const unitKey of Object.keys(units)) {
        const unit = units[unitKey];
        if (unit.team != units["redPlayer"].team || unitKey == "redPlayer") {
            if ( unit.spells != undefined && unit.casting != -1) {

                const spell = unit.spells[unit.casting];
                
                const castBarFrameDimensions = [125, 40];
                const unitx = Math.round(unit.x-(castBarFrameDimensions[0]/2));
                const unity = Math.round(unit.y-unit.radius-30);
                const castBarFrameLeftCorner = [unitx, unity];
                const castBarDimensions = [castBarFrameDimensions[0]-4, castBarFrameDimensions[1]/2-4];
                        
                context.beginPath();
                context.fillStyle = 'rgba(0, 0, 0, 0.8)';;
                context.rect(castBarFrameLeftCorner[0], castBarFrameLeftCorner[1], castBarFrameDimensions[0], castBarFrameDimensions[1]);
                context.fill();

                const castPercent = ((time - spell.lastCast) / (spell.castTime * 1000));
                const castTimeLeft = (spell.castTime - (spell.castTime*castPercent)).toFixed(1);
                const barWidth = Math.round(castBarDimensions[0] * castPercent);

                context.beginPath();
                context.fillStyle = 'rgb(245, 49, 0)';
                context.rect(castBarFrameLeftCorner[0]+2, castBarFrameLeftCorner[1]+20+2, barWidth, castBarDimensions[1]);
                context.fill();

                context.font = "12px arial";
                context.textBaseline = "top";
                context.fillStyle ="#AAAAAA";
                context.fillText(unit.name,castBarFrameLeftCorner[0]+2,castBarFrameLeftCorner[1]+6);

                context.save();
                context.font = "10px arial";
                context.textBaseline = "top";
                context.fillStyle ="#AAAAAA";
                context.fillText(spell.name,castBarFrameLeftCorner[0]+2,castBarFrameLeftCorner[1]+20+6);
                context.restore()

                context.font = "12px arial";
                context.textBaseline = "top";
                context.fillStyle ="#AAAAAA";
                context.fillText(castTimeLeft,castBarFrameLeftCorner[0]+castBarFrameDimensions[0]-20,castBarFrameLeftCorner[1]+20+6);

            }
        }
    }
}

function drawRaidWarning() {
    if ( raidWarning == "" ) return;


    context.save();
    context.beginPath();
    context.font = "20px arial";
    context.textBaseline = "top";
    context.textAlign = "center";
    context.fillStyle ="#DD1111";
    context.strokeStyle ="#111111";
    context.lineWidth = 2;
    context.strokeText(raidWarning, width/2, (height/2)-100);
    context.fillText(raidWarning, width/2, (height/2)-100);
    context.closePath();
    context.restore();
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
    { x: width / 2, y: 0 },                 // Top
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
    context.save();

    context.translate(object.x, object.y);
    if (object.rotation) {
        context.rotate(object.rotation);
    }

    context.drawImage(
        object.image,
        -object.centerX,
        -object.centerY,
        object.radius * 2,
        object.radius * 2
    );

    context.restore();
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

function playWalkSound(object) {
    const { sound } = object;
    if ( sound == undefined ) return;
    const { audio } = sound;

    if ( sound.playing == false ) {
        if ( sound.playingIndex == 0 ) {
            sound.playingIndex = Math.random() < 0.85 ? 1 : Math.round(Math.random()*( audio.length - 3 ) + 2);
        } else if (sound.playingIndex == 1) {
            sound.playingIndex = Math.random() < 0.85 ? 0 : Math.round(Math.random()*( audio.length - 3 ) + 2);
        } else {
            sound.playingIndex = Math.floor(Math.random()*2);
        }
        sound.playing = true;
        AudioManager.play(audio[sound.playingIndex], () => {sound.playing = false}) ;
    }
}

function move(object) {
    object.x += object.velocityX;
    object.y += object.velocityY;

    if (object.velocityX == 0 && object.velocityY == 0) { object.rotation = 0; return }
    playWalkSound(object);

    if (object.rotation == 0) object.rotationDirection = Math.sign(object.velocityX) || 1;
    object.rotation += object.rotationDirection * wiggleAmount;
    if ( Math.abs(object.rotation) >= maxWiggle ) {
        object.rotation = (Math.abs(object.rotation) / object.rotation) * maxWiggle;
        object.rotationDirection *= -1;
    }
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

function triggerEvents(){
    const time = Date.now();
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

    updateUnitAI();

    stayOnScreen(units["redPlayer"], false);
    move(units["redPlayer"]);
    if (!units["redPlayer"].amber && (units["redPlayer"].velocityX || units["redPlayer"].velocityY)) {
        units["redPlayer"].casting = -1;
        console.log('clearing cast: Movement');
        AudioManager.stop(units["redPlayer"].spells[1].sound.precast);
    }
    move(units["tank"]);
    move(units["tank2"]);
    move(units["boss"]);
    move(units["monstrosity"]);
}

function updateUnitAI() {
    for (const u of Object.keys(units)) {
        const unit = units[u];
        if (unit.active && unit.behavior != undefined) {
            unit.behavior()
            if (u != "redPlayer") applyVelocityFromGoals(unit)
        }
    }
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
    const button = document.querySelector(`#${spellKeys[event.key].id}`);
    if (units["redPlayer"].amber) { 
        button.click();
    } else {
        frostBolt();
    }
});

document.addEventListener('contextmenu', event => {
    event.preventDefault();
    console.log('rightclick');
    return false;
});


document.querySelector('#actionbar').querySelectorAll(".ability").forEach(button => {
    button.addEventListener("click", () => {
        startCooldown(button);
    });
});

document.querySelector('#actionbarFrostbolt').querySelectorAll(".ability").forEach(button => {
    button.addEventListener("click", () => {
        frostBolt(button);
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

function toggleActionBars(){
    const actionbar = document.querySelector("#actionbar");
    const actionbarfrostbolt = document.querySelector("#actionbarFrostbolt")
    if ( actionbar.className.includes("invisible") ) {
        actionbarfrostbolt.classList.add("invisible");
        actionbar.classList.remove("invisible");
    } else {
        actionbar.classList.add("invisible");
        actionbarfrostbolt.classList.remove("invisible");
    }
}

const abilitySounds = {
    "amberstrike1": newAudio("sounds/redPlayer/as1.ogg",0.4),
    "amberstrike2": newAudio("sounds/redPlayer/as2.ogg",0.4),
    "struggle": newAudio("sounds/redPlayer/struggle.ogg",0.1),
    "consume": newAudio("sounds/redPlayer/consume.ogg",0.3),
    // "break": newAudio("sounds/redPlayer/break.ogg",0.5),  //no sound?
}

function canDoAction(id) {
    let bCanDoAction = false;
    const player = units["redPlayer"];
    const target = units[player.target];
    switch (id) {
        case "amberstrike":
            if (target != undefined && target.active) bCanDoAction = unitInRange(player, target, meleeRange);
            break;
        case "struggle":
            bCanDoAction = (player.willpower >= 8);
            break;
        case "consume":
            if (puddles.length > 0) { 
                puddles.sort((a,b) => distanceFromUnitToXY("redPlayer", a.x, a.y) - distanceFromUnitToXY("redPlayer", b.x, b.y));
                const puddle = puddles[0];
                bCanDoAction = (distanceFromUnitToXY("redPlayer", puddle.x, puddle.y) <= 30+puddle.radius);
            }
            break;
        case "break":
            bCanDoAction = player.amber && ((player.hp / player.maxhp) <= 0.2);
            break;
        case "frostbolt":
            if (target != undefined && target.active) {
                if (player.velocityX == 0 && player.velocityY == 0 ) bCanDoAction = true;
            }
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
                target.debuffs.push({ name: "Destabilize", icon: newImage("./images/as.jpg"), lastApply: currentTime, duration: 15, count: 1, 
                                dmgEffect: (toUnit, fromUnit, baseAmount) => {
                                    return baseAmount * (1 + 0.1 * (toUnit.debuffs.find(d => d.name === "Destabilize")?.count || 1));
                                }  })
            }
            if (target.casting != undefined && target.casting != -1 && target.spells[target.casting].interruptible) target.casting = -1;
            AudioManager.play(abilitySounds["amberstrike1"]);
            AudioManager.play(abilitySounds["amberstrike2"]);
            break;
        case "struggle":
            player.casting = -1;
            player.willpower -= 8;
            AudioManager.play(abilitySounds["struggle"]);
            break;
        case "consume":
            if (puddles.length > 0) { 
                puddles.shift();
                player.willpower += blackBoard.phase < 3 ? 20 : 50;
                player.willpower = player.willpower > 100 ? 100 : player.willpower;
                blackBoard.consumeAmber += 1;
                AudioManager.play(abilitySounds["consume"]);
            }
            break;
        case "break":
            player.amber = false;
            player.casting = -1;
            toggleActionBars();
            break;
        case "frostbolt":
            player.casting = 1;
            player.spells[1].lastCast = Date.now();
            AudioManager.play(player.spells[1].sound.precast);
            setTimeout(() => {  if (player.casting == 1) {
                                    AudioManager.play(player.spells[1].sound.cast);
                                    AudioManager.stop(player.spells[1].sound.precast);
                                    damageUnit(target, player, 51000);
                                    player.casting = -1
                                    setTimeout(() => { AudioManager.play(player.spells[1].sound.hit); }, 1000)
                                };
                            }, player.spells[1].castTime * 1000);
            break;
    }
}

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

function animateButtonCooldown(button){

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

function startCooldown(button) {
    if (!units["redPlayer"].amber) return;
    if (button._cooldownRunning) return;
    if (button.className.includes("disabled")) return;
    if (!canDoAction(button.id)) return;
    button._cooldownRunning = true;

    doAction(button.id);
    animateButtonCooldown(button);
}

function frostBolt() {
    console.log('frostbolt');
    const actionbarfrostbolt = document.querySelector("#actionbarFrostbolt");
    if (actionbarfrostbolt.querySelector(".ability")._cooldownRunning) return;
    if (units["redPlayer"].amber) return;
    if (!canDoAction("frostbolt")) return;

    doAction("frostbolt");
    actionbarfrostbolt.querySelectorAll(".ability").forEach( (button) => {
            animateButtonCooldown(button);
            button._cooldownRunning = true;
        } );
}


howToPlayInit(gameStartInit);
drawHowToPlay();