import { world } from "@minecraft/server";

function normalize(vector) {
    const length = Math.hypot(vector.x, vector.y, vector.z) || 1;
    return {
        x: vector.x / length,
        y: vector.y / length,
        z: vector.z / length
    };
}

function cross(a, b) {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x
    };
}

function scale(vector, amount) {
    return {
        x: vector.x * amount,
        y: vector.y * amount,
        z: vector.z * amount
    };
}

function add(a, b) {
    return {
        x: a.x + b.x,
        y: a.y + b.y,
        z: a.z + b.z
    };
}

function subtract(a, b) {
    return {
        x: a.x - b.x,
        y: a.y - b.y,
        z: a.z - b.z
    };
}

function dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

function getOrCreateObjective(objectiveId) {
    let objective = world.scoreboard.getObjective(objectiveId);
    if (!objective) {
        try {
            objective = world.scoreboard.addObjective(objectiveId, objectiveId);
        } catch (error) {
            objective = world.scoreboard.getObjective(objectiveId);
        }
    }

    return objective;
}

function setObjectiveScore(objectiveId, player, value) {
    const objective = getOrCreateObjective(objectiveId);
    if (!objective) {
        return;
    }

    objective.setScore(player, value);
}

/**
 * Returns a small set of probe positions around the player's view direction.
 * Use these to spawn test entities and see which ones are still inside the FOV.
 *
 * @param {import("@minecraft/server").Player} player
 * @param {{ distance?: number, yawOffsets?: number[], pitchOffsets?: number[] }} [options]
 * @returns {Array<{ offset: { x: number, y: number, z: number }, position: { x: number, y: number, z: number } }>}
 */
export function fovTest(player, options = {}) {
    const playerPos = player.location;
    const forward = normalize(player.getViewDirection());
    const worldUp = { x: 0, y: 1, z: 0 };
    const right = normalize(cross(worldUp, forward));
    const up = normalize(cross(forward, right));

    const distance = options.distance ?? 6;
    const yawOffsets = options.yawOffsets ?? [-45, -30, -15, 0, 15, 30, 45];
    const pitchOffsets = options.pitchOffsets ?? [0, -10, 10];

    const probes = [];

    for (const yaw of yawOffsets) {
        const yawRadians = (yaw * Math.PI) / 180;
        const horizontal = add(
            scale(forward, Math.cos(yawRadians)),
            scale(right, Math.sin(yawRadians))
        );

        for (const pitch of pitchOffsets) {
            const pitchRadians = (pitch * Math.PI) / 180;
            const direction = normalize(
                add(
                    scale(horizontal, Math.cos(pitchRadians)),
                    scale(up, Math.sin(pitchRadians))
                )
            );
            const offset = scale(direction, distance);

            probes.push({
                offset,
                position: add(playerPos, offset)
            });
        }
    }

    return probes;
}

/**
 * Projects a world position into normalized screen space using the player's view direction.
 * Returns null when the point is behind the player.
 *
 * @param {import("@minecraft/server").Player} player
 * @param {{ x: number, y: number, z: number }} target
 * @param {{ fov?: number, clamp?: boolean }} [options]
 * @returns {{ x: number, y: number, depth: number, visible: boolean } | null}
 */
export function projectWaypointToScreen(player, target, options = {}) {
    const forward = normalize(player.getViewDirection());
    const worldUp = { x: 0, y: 1, z: 0 };
    const right = normalize(cross(worldUp, forward));
    const up = normalize(cross(forward, right));
    const toTarget = subtract(target, player.location);

    const depth = dot(toTarget, forward);
    if (depth <= 0) {
        return null;
    }

    const fovDegrees = options.fov ?? 80;
    const halfFovRadians = ((fovDegrees * Math.PI) / 180) / 2;
    const scaleFactor = Math.tan(halfFovRadians);

    let x = dot(toTarget, right) / (depth * scaleFactor);
    let y = dot(toTarget, up) / (depth * scaleFactor);

    const visible = Math.abs(x) <= 1 && Math.abs(y) <= 1;
    if (options.clamp) {
        x = Math.max(-1, Math.min(1, x));
        y = Math.max(-1, Math.min(1, y));
    }

    return {
        x,
        y,
        depth,
        visible
    };
}

/**
 * Stores the projected waypoint data in scoreboard objectives for HUD usage.
 *
 * @param {import("@minecraft/server").Player} player
 * @param {{ x: number, y: number, z: number }} target
 * @param {{ fov?: number, clamp?: boolean, scale?: number }} [options]
 * @returns {{ x: number, y: number, depth: number, visible: boolean } | null}
 */
export function syncWaypointHudScores(player, target, options = {}) {
    const projection = projectWaypointToScreen(player, target, {
        fov: options.fov,
        clamp: options.clamp ?? true
    });

    const scale = options.scale ?? 1000;

    if (!projection) {
        setObjectiveScore("tfg_wp_x", player, 0);
        setObjectiveScore("tfg_wp_y", player, 0);
        setObjectiveScore("tfg_wp_depth", player, 0);
        setObjectiveScore("tfg_wp_visible", player, 0);
        return null;
    }

    setObjectiveScore("tfg_wp_x", player, Math.round(projection.x * scale));
    setObjectiveScore("tfg_wp_y", player, Math.round(projection.y * scale));
    setObjectiveScore("tfg_wp_depth", player, Math.round(projection.depth * 100));
    setObjectiveScore("tfg_wp_visible", player, projection.visible ? 1 : 0);

    return projection;
}