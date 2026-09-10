import * as THREE from 'three';

export class ThirdPersonCamera {
    constructor(camera, canvas, target) {
        this.camera = camera;
        this.canvas = canvas;
        this.target = target;

        this.yaw = 0;
        this.pitch = -0.28;
        this.distance = 8;
        this.minDistance = 3.2;
        this.maxDistance = 14;

        this.sensitivity = 0.004;
        this.minPitch = -1.0;
        this.maxPitch = 0.65;
        this.smoothing = 12;
        this.dragging = false;

        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.dragging = true;
                canvas.requestPointerLock?.();
            }
        });

        document.addEventListener('mouseup', () => (this.dragging = false));

        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === canvas || this.dragging) {
                this.yaw -= e.movementX * this.sensitivity;
                this.pitch -= e.movementY * this.sensitivity;
                this.pitch = THREE.MathUtils.clamp(this.pitch, this.minPitch, this.maxPitch);
            }
        });

        canvas.addEventListener(
            'wheel',
            (e) => {
                this.distance = THREE.MathUtils.clamp(this.distance + e.deltaY * 0.008, this.minDistance, this.maxDistance);
                e.preventDefault();
            },
            { passive: false }
        );
    }

    // Direction pointing directly from the camera towards the player target
    getForward() {
        return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    }

    // Right-vector relative to camera view
    getRight() {
        return new THREE.Vector3(-Math.cos(this.yaw), 0, Math.sin(this.yaw)).normalize();
    }

    update(dt) {
        const p = this.target.position;
        const horizontal = Math.cos(this.pitch) * this.distance;

        // Position camera behind target relative to yaw angle
        const desired = new THREE.Vector3(
            p.x + Math.sin(this.yaw) * horizontal,
            p.y + 2.4 - Math.sin(this.pitch) * this.distance,
            p.z + Math.cos(this.yaw) * horizontal
        );

        const t = 1 - Math.exp(-this.smoothing * dt);
        this.camera.position.lerp(desired, t);

        const look = new THREE.Vector3(p.x, p.y + 1.2, p.z);
        this.camera.lookAt(look);
    }
}