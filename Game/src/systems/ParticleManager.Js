import * as THREE from 'three';

export class ParticleManager {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
    }

    spawnBurst(position, color = 0xef4444, count = 25) {
        if (!position) return;

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = [];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y + 1;
            positions[i * 3 + 2] = position.z;

            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                Math.random() * 5 + 1,
                (Math.random() - 0.5) * 5
            ));
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Create a soft glowing circle texture dynamically
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.4, `#${color.toString(16).padStart(6, '0')}`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.PointsMaterial({
            size: 0.5,
            map: texture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const pointsSystem = new THREE.Points(geometry, material);
        this.scene.add(pointsSystem);

        this.particles.push({
            mesh: pointsSystem,
            velocities: velocities,
            life: 0.6,
            maxLife: 0.6
        });
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
                continue;
            }

            const positions = p.mesh.geometry.attributes.position.array;
            for (let j = 0; j < p.velocities.length; j++) {
                positions[j * 3] += p.velocities[j].x * dt;
                positions[j * 3 + 1] += p.velocities[j].y * dt;
                positions[j * 3 + 2] += p.velocities[j].z * dt;
                p.velocities[j].y -= 6 * dt; // Gravity pull
            }
            p.mesh.geometry.attributes.position.needsUpdate = true;
            p.mesh.material.opacity = p.life / p.maxLife;
        }
    }
}