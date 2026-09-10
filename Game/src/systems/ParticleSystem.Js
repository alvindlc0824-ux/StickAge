import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.activeBursts = [];
        this.screenShakeDuration = 0;
        this.screenShakeIntensity = 0;
    }

    createBurst(position, colorHex, count = 20, speed = 8) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = [];

        for (let i = 0; i < count * 3; i += 3) {
            positions[i] = position.x;
            positions[i + 1] = position.y + 0.5;
            positions[i + 2] = position.z;

            const u = Math.random() * Math.PI * 2;
            const v = Math.acos(Math.random() * 2 - 1);
            const s = speed * (0.5 + Math.random() * 0.5);

            velocities.push(
                s * Math.sin(v) * Math.cos(u),
                s * Math.sin(v) * Math.sin(u) + 2, // slight upward bias
                s * Math.cos(v)
            );
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: colorHex,
            size: 0.25,
            transparent: true,
            opacity: 1.0
        });

        const points = new THREE.Points(geometry, material);
        this.scene.add(points);

        this.activeBursts.push({
            mesh: points,
            velocities,
            life: 0.6, // duration in seconds
            maxLife: 0.6
        });
    }

    triggerScreenShake(intensity = 0.3, duration = 0.2) {
        this.screenShakeIntensity = intensity;
        this.screenShakeDuration = duration;
    }

    update(dt, camera, baseCameraPosition) {
        // Update Particle Bursts
        for (let i = this.activeBursts.length - 1; i >= 0; i--) {
            const burst = this.activeBursts[i];
            burst.life -= dt;

            if (burst.life <= 0) {
                this.scene.remove(burst.mesh);
                burst.mesh.geometry.dispose();
                burst.mesh.material.dispose();
                this.activeBursts.splice(i, 1);
                continue;
            }

            const positions = burst.mesh.geometry.attributes.position.array;
            for (let j = 0; j < burst.velocities.length / 3; j++) {
                positions[j * 3] += burst.velocities[j * 3] * dt;
                positions[j * 3 + 1] += burst.velocities[j * 3 + 1] * dt;
                positions[j * 3 + 2] += burst.velocities[j * 3 + 2] * dt;

                // Apply simple gravity to particles
                burst.velocities[j * 3 + 1] -= 9.8 * dt;
            }
            burst.mesh.geometry.attributes.position.needsUpdate = true;
            burst.mesh.material.opacity = burst.life / burst.maxLife;
        }

        // Handle Screen Shake offset
        if (this.screenShakeDuration > 0) {
            this.screenShakeDuration -= dt;
            camera.position.x = baseCameraPosition.x + (Math.random() - 0.5) * this.screenShakeIntensity;
            camera.position.y = baseCameraPosition.y + (Math.random() - 0.5) * this.screenShakeIntensity;
            camera.position.z = baseCameraPosition.z + (Math.random() - 0.5) * this.screenShakeIntensity;
        }
    }
}