import { world, } from "@minecraft/server";
import { ParticleTypes, ParticleEffectsLibrary, CircleEffect, ParticleEffectSequenceController, ParticleEffectSequence, } from "./extensions/particles";
var tempSequencesList = [
    {
        name: "rings",
        repeating: true,
        sequence: {
            0: {
                type: "circle",
                position: { x: 5, y: 0, z: 0 },
                particleType: "minecraft:basic_flame_particle",
                radius: 3,
                yOffset: 1,
                duration: 10,
                particleCount: 50,
                rotationSpeed: 0,
            },
            10: {
                type: "circle",
                position: { x: 5, y: 1, z: 0 },
                particleType: "minecraft:basic_flame_particle",
                radius: 2,
                yOffset: 1,
                duration: 10,
                particleCount: 50,
                rotationSpeed: 0,
            },
            20: {
                type: "circle",
                position: { x: 5, y: 2, z: 0 },
                particleType: "minecraft:basic_flame_particle",
                radius: 0.1,
                yOffset: 1,
                duration: 10,
                particleCount: 50,
                rotationSpeed: 0,
            },
        },
    },
];
var circleId = NaN;
var explodeId = NaN;
const effectsLibrary = new ParticleEffectsLibrary();
const sequenceController = new ParticleEffectSequenceController();
for (const sequenceData of tempSequencesList) {
    const sequence = new ParticleEffectSequence(sequenceData.repeating);
    for (const [time, effectData] of Object.entries(sequenceData.sequence)) {
        let effect;
        switch (effectData.type) {
            case "circle":
                effect = new CircleEffect(effectData.position, effectData.particleType, {
                    radius: effectData.radius,
                    yOffset: effectData.yOffset,
                    duration: effectData.duration,
                    particleCount: effectData.particleCount,
                    rotationSpeed: effectData.rotationSpeed,
                });
                break;
            default:
                console.warn(`Unknown effect type: ${effectData.type}`);
                continue;
        }
        sequence.addEffect(parseInt(time), effect);
    }
    sequenceController.addSequence(sequence);
}
const newSequence = new ParticleEffectSequence(true);
newSequence.addEffect(0, new CircleEffect({ x: 0, y: 0, z: 0 }, ParticleTypes.BASIC_FLAME, {
    radius: 4,
    yOffset: 1,
    duration: 20,
    particleCount: 50,
}));
newSequence.addEffect(20, new CircleEffect({ x: 0, y: 1, z: 0 }, ParticleTypes.BASIC_FLAME, {
    radius: 3,
    yOffset: 1,
    duration: 20,
    particleCount: 50,
    rotationSpeed: 0,
}));
newSequence.addEffect(40, new CircleEffect({ x: 0, y: 2, z: 0 }, ParticleTypes.BASIC_FLAME, {
    radius: 2,
    yOffset: 1,
    duration: 20,
    particleCount: 50,
    rotationSpeed: 0,
}));
newSequence.addEffect(60, new CircleEffect({ x: 0, y: 3, z: 0 }, ParticleTypes.BASIC_FLAME, {
    radius: 0.1,
    yOffset: 1,
    duration: 20,
    particleCount: 50,
    rotationSpeed: 0,
}));
const sequenceId = sequenceController.addSequence(newSequence);
world.afterEvents.itemUse.subscribe((event) => {
    effectsLibrary.removeEffect(circleId);
    effectsLibrary.removeEffect(explodeId);
    const item_used = event.itemStack;
    const player = event.source;
    const position = player.location;
    if (item_used.nameTag === "sequence") {
    }
    if (item_used.nameTag === "circle") {
        circleId = effectsLibrary.createSphere(position, ParticleTypes.BASIC_FLAME, {
            radius: 5,
            yOffset: 1,
            particleCount: 500,
            rotationSpeed: 0,
            particlesPerTick: 1,
        });
    }
    if (item_used.nameTag === "point") {
        effectsLibrary.createPoint(position, ParticleTypes.BASIC_FLAME, {
            yOffset: 1,
        });
        
    }
    if (item_used.nameTag === "line") {
        effectsLibrary.createLine(position, { x: position.x + 5, y: position.y + 5, z: position.z + 2.5 }, ParticleTypes.BASIC_FLAME, {});
    }
    if (item_used.nameTag === "plane") {
        effectsLibrary.createPlane({ x: position.x - 5, y: position.y - 5, z: position.z - 2.5 }, { x: position.x + 5, y: position.y + 5, z: position.z + 2.5 }, ParticleTypes.BASIC_FLAME, {
            filled: true,
            particleCountX: 10,
            particleCountY: 10,
        });
    }
    if (item_used.nameTag === "explode") {
        explodeId = effectsLibrary.createExplosion(position, ParticleTypes.TOOTHPASTE, {
            radius: 2,
            yOffset: 0,
            particleCount: 500,
            speed: 0.5,
        });
    }
    if (item_used.nameTag === "trail") {
        effectsLibrary.createTrail(player, ParticleTypes.BASIC_FLAME, {});
    }
});
/*[
  {
    name: "rings",
    sequence: [
      {
        type: "circle",
        position: { x: 0, y: 0, z: 0 },
        particleType: "minecraft:basic_flame_particle",
        radius: 0.1,
        yOffset: 1,
        duration: 100,
        particleCount: 50,
        rotationSpeed: 0,
      },
      {
        type: "circle",
        position: { x: 0, y: 1, z: 0 },
        particleType: "minecraft:basic_flame_particle",
        radius: 0.1,
        yOffset: 1,
        duration: 100,
        particleCount: 50,
        rotationSpeed: 0,
      },
      {
        type: "circle",
        position: { x: 0, y: 2, z: 0 },
        particleType: "minecraft:basic_flame_particle",
        radius: 0.1,
        yOffset: 1,
        duration: 100,
        particleCount: 50,
        rotationSpeed: 0,
      },
    ],
  },
];*/
//# sourceMappingURL=main.js.map