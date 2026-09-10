import * as THREE from 'three';

export class WeatherSystem {
    constructor(scene, dirLight, ambientLight, dayNightSystem) {
        this.scene = scene;
        this.dirLight = dirLight;
        this.ambientLight = ambientLight;
        this.dayNightSystem = dayNightSystem;
        this.weatherType = 'clear'; // 'clear', 'rain'
        this.particles = null;

        // Change weather dynamically every 60 seconds
        setInterval(() => this.changeWeather(), 60000);
    }

    changeWeather() {
        const rand = Math.random();
        // 30% chance for rain
        if (rand < 0.3 && this.weatherType !== 'rain') {
            this.startRain();
        } else if (rand >= 0.3 && this.weatherType !== 'clear') {
            this.stopRain();
        }
    }

    startRain() {
        this.weatherType = 'rain';
        const particleCount = 2000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 100; // x
            positions[i * 3 + 1] = Math.random() * 50;      // y
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100; // z
            velocities.push(0, - (Math.random() * 10 + 10), 0); // fall speed
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            color: 0xaaaaaa,
            size: 0.1,
            transparent: true,
            opacity: 0.6
        });

        this.particles = new THREE.Points(geometry, material);
        this.particles.userData.velocities = velocities;
        this.scene.add(this.particles);
        
        if (this.scene.fog) {
            this.scene.fog.density = 0.015; // Make fog thicker during rain
        }
    }

    stopRain() {
        this.weatherType = 'clear';
        if (this.particles) {
            this.scene.remove(this.particles);
            this.particles.geometry.dispose();
            this.particles.material.dispose();
            this.particles = null;
        }
        if (this.scene.fog) {
            this.scene.fog.density = 0.007; // Return to normal fog
        }
    }

    update(dt) {
        if (this.weatherType === 'rain' && this.particles) {
            const positions = this.particles.geometry.attributes.position.array;
            const velocities = this.particles.userData.velocities;

            for (let i = 0; i < positions.length / 3; i++) {
                positions[i * 3 + 1] += velocities[i * 3 + 1] * dt;
                
                // Reset particle to top if it hits the ground
                if (positions[i * 3 + 1] < 0) {
                    positions[i * 3 + 1] = 50;
                }
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
    }
}