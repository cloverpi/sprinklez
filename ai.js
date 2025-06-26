const Status = {
    FAILURE: 0,
    SUCCESS: 1,
    RUNNING: 2,
  };

const Node = {
    SELECTOR: 0,
    SEQUENCE: 1,
    CONDITION: 2,
}

export function Selector(children) {
    return (unit) => {
        for (const child of children) {
            const result = child(unit);
            if (result.status !== Status.FAILURE) return result;
        }
        return { status: Status.FAILURE, node: Node.SELECTOR };
    };
}

export function Sequence(children) {
    return (unit) => {
        for (const child of children) {
            const result = child(unit);
            if (result.status !== Status.SUCCESS) return result;
        }
        return { status: Status.SUCCESS, node: Node.SEQUENCE };
    };
}
  
export function Condition(fn) {
    return (unit) => fn(unit) ? { status: Status.SUCCESS, node: Node.CONDITION } : { status: Status.FAILURE, node: Node.CONDITION };
}

export function Action(fn) {
    return (unit) => fn(unit);
}

export function Named(name, nodeFn) {
    return (unit) => {
        const result = nodeFn(unit);
        // console.log(`[${unit.name}] ${name} → ${result.status}`);
        return { ...result, node: name };
    };
}


export function performAttack(unit, target) {
    if ( !!!target || !!!unit ) return false;
    if (target.hp > 0) {
        target.hp -= 10000;
    //   console.log(`💥 ${unit.name} attacks ${target.name}. Target HP: ${target.hp}`);
    }
}

export function validTarget(unit) {
    return !!unit && unit.active !== false && unit.hp > 0;
}

export function inRange(unit, x, y, radius = 40) {
    const unitCenterX = unit.x + (unit.centerX || 0);
    const unitCenterY = unit.y + (unit.centerY || 0);

    const dx = x - unitCenterX;
    const dy = y - unitCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= radius + (unit.radius || 0);
}

export function unitInRange(unit, target, radius = 0) {
    if (!target) return false;

    const targetCenterX = target.x + (target.centerX || 0);
    const targetCenterY = target.y + (target.centerY || 0);

    return inRange(unit, targetCenterX, targetCenterY, radius + (target.radius/4 || 0));
}

export function applyVelocityFromGoals(unit) {
    // console.log('hi');
    let vx = 0, vy = 0, totalWeight = 0;
    for (const goal of unit.goals || []) {
        const dx = goal.x - unit.x;
        const dy = goal.y - unit.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1) {
            vx += (dx / dist) * goal.weight;
            vy += (dy / dist) * goal.weight;
            totalWeight += goal.weight;
        }
    }
    if (totalWeight > 0) {
        vx /= totalWeight;
        vy /= totalWeight;
        const speed = unit.speed || 2;
        unit.velocityX = vx * speed;
        unit.velocityY = vy * speed;
    } else {
        unit.velocityX = 0;
        unit.velocityY = 0;
    }
}