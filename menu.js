import { title } from './title.js';
import { controls } from './howto.js';
import { drawMechanicsOverview } from './mechanics.js';
import { gameStartInit } from './amber.js';


export function startMenu(){
    title(drawMechanicsOverview, controls, gameStartInit);
    // drawTitle();
    // drawControls( title(drawMechanicsOverview, controls, callback) );
}
