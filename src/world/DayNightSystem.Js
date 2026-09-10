import * as THREE from 'three';

export class DayNightSystem {
    constructor(scene, directionalLight, ambientLight) {
        this.scene = scene;
        this.directionalLight = directionalLight;
        this.ambientLight = ambientLight;
        this.timeOfDay = 0.25; // 0 to 1 (0 = midnight, 0.25 = morning, 0.5 = noon, 0.75 = evening)
        this.cycleSpeed = 0.01; // Speed of time progression
    }

    update(dt) {
        this.timeOfDay = (this.timeOfDay + this.cycleSpeed * dt) % 1;

        // Calculate sun angle based on time of day
        const angle = this.timeOfDay * Math.PI * 2;
        const sunDistance = 50;

        this.directionalLight.position.x = Math.cos(angle) * sunDistance;
        this.directionalLight.position.y = Math.sin(angle) * sunDistance;

        // Adjust lighting and shadow intensity based on height of the sun
        if (this.directionalLight.position.y > 0) {
            // Day time
            const intensity = Math.sin(angle);
            this.directionalLight.intensity = Math.max(0.1, intensity * 1.5);
            this.ambientLight.intensity = Math.max(0.2, intensity * 0.8);
        } else {
            // Night time
            this.directionalLight.intensity = 0.1;
            this.ambientLight.intensity = 0.1;
        }
    }
}