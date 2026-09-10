import * as THREE from 'three';

export class PlayerController {
    constructor(player, input, cameraSystem, combatSystem) {
        this.player = player;
        this.input = input;
        this.cameraSystem = cameraSystem;
        this.combatSystem = combatSystem;

        this.walkSpeed = 6.0;
        this.sprintSpeed = 10.0;
        this.jumpForce = 7.0;
        this.gravity = -18.0;

        this.velocity = new THREE.Vector3();
        this.isGrounded = true;
        this.isDodging = false;
        this.dodgeTimer = 0;
    }

    update(dt) {
        if (this.player.isDead || !this.input) return;

        if (this.input.isKeyDown('KeyQ') && !this.isDodging && this.isGrounded) {
            this.isDodging = true;
            this.dodgeTimer = 0.3;
        }

        if (this.isDodging) {
            this.dodgeTimer -= dt;
            if (this.dodgeTimer <= 0) {
                this.isDodging = false;
            }
        }

        const isSprinting = this.input.isKeyDown('ShiftLeft') || this.input.isKeyDown('ShiftRight');
        const speed = this.isDodging ? this.sprintSpeed * 1.5 : (isSprinting ? this.sprintSpeed : this.walkSpeed);

        const moveDir = new THREE.Vector3();

        // Corrected Z directions (W = Forward = -Z, S = Backward = +Z)
        if (this.input.isKeyDown('KeyW')) moveDir.z -= 1;
        if (this.input.isKeyDown('KeyS')) moveDir.z += 1;
        if (this.input.isKeyDown('KeyA')) moveDir.x -= 1;
        if (this.input.isKeyDown('KeyD')) moveDir.x += 1;

        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();

            const yaw = (this.cameraSystem && typeof this.cameraSystem.getYaw === 'function')
                ? this.cameraSystem.getYaw()
                : 0;

            const rotationEuler = new THREE.Euler(0, yaw, 0, 'YXZ');
            moveDir.applyEuler(rotationEuler);

            this.player.root.position.x += moveDir.x * speed * dt;
            this.player.root.position.z += moveDir.z * speed * dt;

            const targetAngle = Math.atan2(moveDir.x, moveDir.z);
            this.player.root.rotation.y = targetAngle;
        }

        if (this.input.isKeyDown('Space') && this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
        }

        this.velocity.y += this.gravity * dt;
        this.player.root.position.y += this.velocity.y * dt;

        if (this.player.root.position.y <= 0) {
            this.player.root.position.y = 0;
            this.velocity.y = 0;
            this.isGrounded = true;
        }
    }
}