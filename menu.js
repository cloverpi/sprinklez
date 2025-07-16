import { title } from './title.js';
import { controls } from './howto.js';
import { mechanics } from './mechanics.js';
import { gameStartInit } from './amber.js';
import { AudioManager } from './commonui.js';

function setup(){
    const muted = getCookie("muted").toLowerCase() == "true" ? true : false;
    AudioManager.muteAll(muted);
}

export function startMenu(){
    setup();
    title(mechanics, controls, gameStartInit);
}
