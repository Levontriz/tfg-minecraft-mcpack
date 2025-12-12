import { MolangVariableMap, world, system } from "@minecraft/server";
class ParticleEffectsLibrary {
    constructor() {
        this.activeEffects = new Map();
        this.nextEffectId = 0;
        // Register tick event to update all active effects
        system.runInterval(() => {
            this.updateEffects();
        }, 1);
    }
    /**
     * Update all active particle effects
     */
    updateEffects() {
        for (const [id, effect] of this.activeEffects) {
            if (effect.isDone()) {
                this.activeEffects.delete(id);
                continue;
            }
            effect.update();
        }
    }
    /**
     * Add a particle effect to the active effects list
     * @param {ParticleEffect} effect - The effect to add
     * @returns {number} - The ID of the added effect
     */
    addEffect(effect) {
        const effectId = this.nextEffectId++;
        this.activeEffects.set(effectId, effect);
        return effectId;
    }
    /**
     * Remove a particle effect by ID
     * @param {number} effectId - The ID of the effect to remove
     */
    removeEffect(effectId) {
        if (this.activeEffects.has(effectId)) {
            this.activeEffects.delete(effectId);
        }
    }
    /**
     * Create an explosion effect at a position
     * @param {Object} position - The center position with x, y, z coordinates
     * @param {string} particleType - The type of particle to spawn
     * @param {Object} options - Additional options
     * @returns {number} - The ID of the created effect
     */
    createExplosion(position, particleType, options = {}) {
        const explosion = new ExplosionEffect(position, particleType, options);
        return this.addEffect(explosion);
    }
    /**
     * Create a circle effect at a position
     * @param {Object} position - The center position with x, y, z coordinates
     * @param {string} particleType - The type of particle to spawn
     * @param {Object} options - Additional options
     * @returns {number} - The ID of the created effect
     */
    createCircle(position, particleType, options = {}) {
        const circle = new CircleEffect(position, particleType, options);
        return this.addEffect(circle);
    }
    createSphere(position, particleType, options = {}) {
        const sphere = new SphereEffect(position, particleType, options);
        return this.addEffect(sphere);
    }
    createLine(startPosition, endPosition, particleType, options = {}) {
        const line = new LineEffect(startPosition, endPosition, particleType, options);
        return this.addEffect(line);
    }
    createPlane(startPosition, endPosition, particleType, options = {}) {
        const plane = new PlaneEffect(startPosition, endPosition, particleType, options);
        return this.addEffect(plane);
    }
    createPoint(position, particleType, options = {}) {
        const point = new PointEffect(position, particleType, options);
        return this.addEffect(point);
    }
    /**
     * Create a trail effect following an entity
     * @param {Entity} entity - The entity to follow
     * @param {string} particleType - The type of particle to spawn
     * @param {Object} options - Additional options
     * @returns {number} - The ID of the created effect
     */
    createTrail(entity, particleType, options = {}) {
        const trail = new EntityTrailEffect(entity, particleType, options);
        return this.addEffect(trail);
    }
}
class ParticleEffect {
    constructor(particleType, options = {}) {
        this.particleType = particleType;
        this.duration = options.duration || Infinity; // Duration in ticks
        this.startTime = system.currentTick;
        this.particlesPerTick = options.particlesPerTick || 1;
        this.molang = options.molang || new MolangVariableMap(); // Optional MoLang expression
    }
    /**
     * Check if the effect has finished
     * @returns {boolean} - True if the effect is done
     */
    isDone() {
        return system.currentTick - this.startTime >= this.duration;
    }
    /**
     * Update the effect (called every tick)
     */
    update() {
        // To be implemented by subclasses
    }
    /**
     * Spawn a particle at a position
     * @param {Object} position - The position to spawn the particle with x, y, z coordinates
     * @param {Object} velocity - The velocity of the particle with x, y, z components
     */
    spawnParticle(position, velocity = { x: 0, y: 0, z: 0 }) {
        const dimension = world.getDimension("overworld");
        // Using MoLang if provided, otherwise use simple parameters
        const params = this.molang || new MolangVariableMap();
        dimension.spawnParticle(this.particleType, position, params);
    }
}
class CircleEffect extends ParticleEffect {
    constructor(position, particleType, options = {}) {
        super(particleType, options);
        this.position = position;
        this.radius = options.radius || 2;
        this.yOffset = options.yOffset || 0;
        this.particleCount = options.particleCount || 20; // Particles per circle
        this.rotationSpeed = options.rotationSpeed || 0.02;
        this.currentAngle = 0;
    }
    update() {
        for (let i = 0; i < this.particleCount; i++) {
            const angle = (i / this.particleCount) * Math.PI * 2 + this.currentAngle;
            const x = this.position.x + Math.cos(angle) * this.radius;
            const y = this.position.y + this.yOffset;
            const z = this.position.z + Math.sin(angle) * this.radius;
            this.spawnParticle({ x, y, z });
        }
        this.currentAngle += this.rotationSpeed;
        if (this.currentAngle > Math.PI * 2) {
            this.currentAngle -= Math.PI * 2;
        }
    }
}
class SphereEffect extends ParticleEffect {
    constructor(position, particleType, options = {}) {
        super(particleType, options);
        this.position = position;
        this.radius = options.radius || 2;
        this.yOffset = options.yOffset || 0;
        this.particleCount = options.particleCount || 20; // Particles per circle
        this.rotationSpeed = options.rotationSpeed || 0;
        this.currentAngle = 0;
    }
    update() {
        for (let i = 0; i < this.particleCount; i++) {
            // Distribute points evenly on a sphere using the Fibonacci sphere algorithm
            const phi = Math.acos(1 - 2 * (i / this.particleCount));
            const theta = Math.PI * 2 * i * (1 / ((1 + Math.sqrt(5)) / 2));
            // Add rotation for animation
            const rotatedTheta = theta + this.currentAngle;
            // Convert spherical coordinates to Cartesian
            const x = this.position.x + Math.sin(phi) * Math.cos(rotatedTheta) * this.radius;
            const y = this.position.y + Math.sin(phi) * Math.sin(rotatedTheta) * this.radius;
            const z = this.position.z + Math.cos(phi) * this.radius;
            this.spawnParticle({ x, y, z });
        }
        this.currentAngle += this.rotationSpeed;
    }
}
class PointEffect extends ParticleEffect {
    constructor(position, particleType, options = {}) {
        super(particleType, options);
        this.position = position;
        this.yOffset = options.yOffset || 0;
    }
    update() {
        // Spawn a single particle at the specified position
        this.spawnParticle({ x: this.position.x, y: this.position.y + this.yOffset, z: this.position.z });
    }
}
class LineEffect extends ParticleEffect {
    constructor(startPosition, endPosition, particleType, options = {}) {
        super(particleType, options);
        this.startPoint = startPosition;
        this.endPoint = endPosition;
        this.yOffset = options.yOffset || 0;
        this.particleCount = options.particleCount || 20; // Particles per line
    }
    update() {
        if (this.particleCount < 2) {
            throw new Error("At least 2 particles are required (the start and end points)");
        }
        // Calculate the vector from start to end point
        const vector = {
            x: this.endPoint.x - this.startPoint.x,
            y: this.endPoint.y - this.startPoint.y,
            z: this.endPoint.z - this.startPoint.z,
        };
        // Calculate positions and spawn particles
        for (let i = 0; i < this.particleCount; i++) {
            let position;
            // For first and last particle, use exact start/end points to avoid floating-point errors
            if (i === 0) {
                position = Object.assign({}, this.startPoint);
            }
            else if (i === this.particleCount - 1) {
                position = Object.assign({}, this.endPoint);
            }
            else {
                // Calculate the interpolation factor
                const t = i / (this.particleCount - 1);
                // Calculate the position using linear interpolation
                position = {
                    x: this.startPoint.x + t * vector.x,
                    y: this.startPoint.y + t * vector.y,
                    z: this.startPoint.z + t * vector.z,
                };
            }
            // Spawn the particle at this position
            this.spawnParticle(position);
        }
    }
}
class PlaneEffect extends ParticleEffect {
    constructor(startPosition, endPosition, particleType, options = {}) {
        super(particleType, options);
        this.startPoint = startPosition;
        this.endPoint = endPosition;
        this.filled = options.filled || false;
        this.yOffset = options.yOffset || 0;
        this.particleCountX = options.particleCountX || 20; // Particles per line
        this.particleCountY = options.particleCountY || 20; // Particles per line
    }
    update() {
        // Ensure we have at least 2 particles on each axis to form a rectangle
        this.particleCountX = Math.max(2, this.particleCountX);
        this.particleCountY = Math.max(2, this.particleCountY);
        // Calculate the min and max points to ensure consistent rectangle bounds
        const minX = Math.min(this.startPoint.x, this.endPoint.x);
        const maxX = Math.max(this.startPoint.x, this.endPoint.x);
        const minY = Math.min(this.startPoint.y, this.endPoint.y);
        const maxY = Math.max(this.startPoint.y, this.endPoint.y);
        const minZ = Math.min(this.startPoint.z, this.endPoint.z);
        const maxZ = Math.max(this.startPoint.z, this.endPoint.z);
        // Calculate width, height and depth of the rectangle
        const width = maxX - minX;
        const height = maxY - minY;
        const depth = maxZ - minZ;
        // Calculate step size based on particle count
        const stepX = width / (this.particleCountX - 1);
        const stepY = height / (this.particleCountY - 1);
        // Spawn particles
        if (this.filled) {
            // Fill the entire rectangle with particles
            for (let i = 0; i < this.particleCountX; i++) {
                for (let j = 0; j < this.particleCountY; j++) {
                    const x = minX + i * stepX;
                    const y = minY + j * stepY;
                    // Calculate z based on the relative position within the plane
                    // This creates a smooth gradient between the z values of the corners
                    const normalizedX = i / (this.particleCountX - 1);
                    const normalizedY = j / (this.particleCountY - 1);
                    // Interpolate z value based on position within the rectangle
                    const z = minZ +
                        (normalizedX * normalizedY * (maxZ - minZ) +
                            normalizedX * (1 - normalizedY) * (maxZ - minZ) +
                            (1 - normalizedX) * normalizedY * (maxZ - minZ) +
                            (1 - normalizedX) * (1 - normalizedY) * (minZ - minZ));
                    this.spawnParticle({ x: x, y: y, z: z });
                }
            }
        }
        else {
            // Only spawn particles on the perimeter
            // Horizontal edges (front and back on X axis)
            for (let i = 0; i < this.particleCountX; i++) {
                const x = minX + i * stepX;
                const normalizedX = i / (this.particleCountX - 1);
                // Front edge (minY)
                const frontZ = minZ + normalizedX * (maxZ - minZ);
                this.spawnParticle({ x: x, y: minY, z: frontZ });
                // Back edge (maxY)
                const backZ = minZ + normalizedX * (maxZ - minZ);
                this.spawnParticle({ x: x, y: maxY, z: backZ });
            }
            // Vertical edges (left and right on Y axis) - skip corners as they're already covered
            for (let j = 1; j < this.particleCountY - 1; j++) {
                const y = minY + j * stepY;
                const normalizedY = j / (this.particleCountY - 1);
                // Left edge (minX)
                const leftZ = minZ + normalizedY * (maxZ - minZ);
                this.spawnParticle({ x: minX, y: y, z: leftZ });
                // Right edge (maxX)
                const rightZ = minZ + normalizedY * (maxZ - minZ);
                this.spawnParticle({ x: maxX, y: y, z: rightZ });
            }
        }
    }
}
class ExplosionEffect extends ParticleEffect {
    constructor(position, particleType, options = {}) {
        super(particleType, options);
        this.position = position;
        this.particleCount = options.particleCount || 100;
        this.speed = options.speed || 0.5;
        this.radius = options.radius || 1;
        this.particles = [];
        this.generated = false;
    }
    generateParticles() {
        for (let i = 0; i < this.particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const x = Math.sin(phi) * Math.cos(theta);
            const y = Math.sin(phi) * Math.sin(theta);
            const z = Math.cos(phi);
            this.particles.push({
                velocity: {
                    x: x * this.speed,
                    y: y * this.speed,
                    z: z * this.speed,
                },
                position: {
                    x: this.position.x,
                    y: this.position.y,
                    z: this.position.z,
                },
            });
        }
        this.generated = true;
    }
    update() {
        if (!this.generated) {
            this.generateParticles();
        }
        for (const particle of this.particles) {
            // Update position based on velocity
            particle.position.x += particle.velocity.x;
            particle.position.y += particle.velocity.y;
            particle.position.z += particle.velocity.z;
            // Apply a bit of gravity
            particle.velocity.y -= 0.01;
            // Spawn the particle
            this.spawnParticle(particle.position, particle.velocity);
        }
        // Only run for a short time
        if (system.currentTick - this.startTime > 20) {
            this.particles = [];
        }
    }
    isDone() {
        return system.currentTick - this.startTime > 20 || super.isDone();
    }
}
class EntityTrailEffect extends ParticleEffect {
    constructor(entity, particleType, options = {}) {
        super(particleType, options);
        this.entity = entity;
        this.spacing = options.spacing || 0.2; // Distance between particles
        this.lastPos = entity.location;
    }
    update() {
        const currentPos = this.entity.location;
        // Calculate distance moved
        const dx = currentPos.x - this.lastPos.x;
        const dy = currentPos.y - this.lastPos.y;
        const dz = currentPos.z - this.lastPos.z;
        const distanceMoved = Math.sqrt(dx * dx + dy * dy + dz * dz);
        // Spawn particles along the path if moved enough
        if (distanceMoved >= this.spacing) {
            const segments = Math.floor(distanceMoved / this.spacing);
            for (let i = 0; i <= segments; i++) {
                const ratio = i / segments;
                const pos = {
                    x: this.lastPos.x + dx * ratio,
                    y: this.lastPos.y + dy * ratio + 0.1, // Slightly above ground
                    z: this.lastPos.z + dz * ratio,
                };
                this.spawnParticle(pos);
            }
            this.lastPos = currentPos;
        }
    }
}
class ParticleEffectSequenceController {
    constructor() {
        this.sequences = new Map();
        this.nextEffectId = 0;
        system.runInterval(() => {
            this.updateSequences();
        }, 1);
    }
    updateSequences() {
        for (const [id, sequence] of this.sequences) {
            if (sequence.isDone()) {
                if (sequence.repeat) {
                    sequence.startTime = system.currentTick;
                }
                else {
                    this.sequences.delete(id);
                }
            }
            else {
                sequence.update();
            }
        }
    }
    addSequence(sequence) {
        const effectId = this.nextEffectId++;
        this.sequences.set(effectId, sequence);
        return effectId;
    }
    removeSequence(effectId) {
        this.sequences.delete(effectId);
    }
}
class ParticleEffectSequence {
    constructor(repeat) {
        this.startTime = system.currentTick;
        this.repeat = repeat || false;
        this.effects = new Map();
    }
    addEffect(delay, effect) {
        this.effects.set(delay, effect);
    }
    isDone() {
        const currentTick = system.currentTick;
        let totalDuration = 0;
        for (const effect of this.effects.values()) {
            totalDuration += effect.duration;
        }
        return currentTick - this.startTime >= totalDuration;
    }
    update() {
        const currentTick = system.currentTick;
        for (const [delay, effect] of this.effects) {
            if (currentTick >= this.startTime + delay && currentTick <= this.startTime + delay + effect.duration) {
                effect.update();
            }
        }
    }
}
// List of some native Bedrock particle types
const ParticleTypes = {
    CAMPFIRE_SMALL: "minecraft:campfire_smoke_particle",
    BASIC_FLAME: "minecraft:basic_flame_particle",
    BASIC_SMOKE: "minecraft:basic_smoke_particle",
    WATER_SPLASH: "minecraft:water_splash_particle",
    WATER_WAKE: "minecraft:water_wake_particle",
    REDSTONE_DUST: "minecraft:redstone_dust_particle",
    SNOWFLAKE: "minecraft:snowflake_particle",
    FALLING_DUST: "minecraft:falling_dust_particle",
    CRITICAL_HIT: "minecraft:critical_hit_particle",
    END_ROD: "minecraft:end_rod_particle",
    DRAGON_BREATH: "minecraft:dragon_breath_particle",
    TOTEM: "minecraft:totem_particle",
    HEART: "minecraft:heart_particle",
    VILLAGER_ANGRY: "minecraft:villager_angry_particle",
    VILLAGER_HAPPY: "minecraft:villager_happy_particle",
    ENCHANTING_TABLE: "minecraft:enchanting_table_particle",
    NOTE: "minecraft:note_particle",
    PORTAL: "minecraft:portal_particle",
    LAVA_PARTICLE: "minecraft:lava_particle",
    BUBBLE: "minecraft:bubble_particle",
    TOOTHPASTE: "minecraft:elephant_tooth_paste_vapor_particle",
};
export { ParticleTypes, EntityTrailEffect, ExplosionEffect, ParticleEffect, ParticleEffectsLibrary, CircleEffect, PointEffect, SphereEffect, LineEffect, PlaneEffect, ParticleEffectSequenceController, ParticleEffectSequence, };
//# sourceMappingURL=particles.js.map