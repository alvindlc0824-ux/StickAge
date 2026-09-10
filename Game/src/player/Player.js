import * as THREE from 'three';

export class Player {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        this.hp = 100;
        this.maxHp = 100;
        this.mp = 100;
        this.maxMp = 100;
        this.exp = 0;
        this.maxExp = 100;
        this.level = 1;
        this.isDead = false;

        // Track equipped gear safely to prevent NaN stats
        this.equippedWeapon = null;

        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
        const material = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
        this.root = new THREE.Mesh(geometry, material);
        this.root.position.set(0, 1, 0);
        this.root.castShadow = true;
        this.scene.add(this.root);

        this.velocity = new THREE.Vector3();
        this.moveState = { forward: false, backward: false, left: false, right: false, sprint: false };
        this.speed = 5.0;

        this.initInput();
    }

    // Helper method to compute total attack safely, defaulting missing values to 0
    getAttackPower() {
        let baseAtk = 10;
        let weaponAtk = this.equippedWeapon?.atkBonus || this.equippedWeapon?.atk || 0;
        let skillBonus = 0;

        if (this.gameRef && this.gameRef.skillTree) {
            skillBonus = this.gameRef.skillTree.getFireballBonusDamage() || 0;
        }

        return baseAtk + weaponAtk + skillBonus;
    }

    initInput() {
        window.addEventListener('keydown', (e) => {
            if (this.isDead) return;
            const k = e.key.toLowerCase();
            if (k === 'w') this.moveState.forward = true;
            if (k === 's') this.moveState.backward = true;
            if (k === 'a') this.moveState.left = true;
            if (k === 'd') this.moveState.right = true;
            if (e.shiftKey) this.moveState.sprint = true;

            if (k === 'f') this.performSlash();
            if (k === '1') this.castFireball();
            if (k === '2') this.castHeal();
        });

        window.addEventListener('keyup', (e) => {
            const k = e.key.toLowerCase();
            if (k === 'w') this.moveState.forward = false;
            if (k === 's') this.moveState.backward = false;
            if (k === 'a') this.moveState.left = false;
            if (k === 'd') this.moveState.right = false;
            if (!e.shiftKey) this.moveState.sprint = false;
        });
    }

    addExp(amount) {
        this.exp += amount;
        if (this.exp >= this.maxExp) {
            this.exp -= this.maxExp;
            this.level += 1;
            this.maxExp = Math.floor(this.maxExp * 1.5);
            if (this.gameRef && this.gameRef.skillTree) {
                this.gameRef.skillTree.addPoints(1);
            }
            if (this.gameRef && this.gameRef.spawnFloatingTextAtWorldPos) {
                this.gameRef.spawnFloatingTextAtWorldPos("LEVEL UP!", this.root.position.clone().add(new THREE.Vector3(0, 2.5, 0)), '#eab308');
            }
        }
    }

    performSlash() {
        if (this.isDead) return;
        
        let totalAtk = this.getAttackPower();

        if (this.gameRef && this.gameRef.enemyManager) {
            const manager = this.gameRef.enemyManager;
            
            manager.enemies.forEach((enemy) => {
                if (enemy.isDead) return;
                const dist = this.root.position.distanceTo(enemy.group.position);
                if (dist < 3.5) {
                    enemy.takeDamage(totalAtk, false);
                }
            });

            if (manager.boss && !manager.boss.isDead) {
                const bossDist = this.root.position.distanceTo(manager.boss.group.position);
                if (bossDist < 5.0) {
                    manager.boss.takeDamage(totalAtk, false);
                }
            }
        }

        if (this.gameRef && this.gameRef.spawnFloatingTextAtWorldPos) {
            this.gameRef.spawnFloatingTextAtWorldPos("SLASH!", this.root.position.clone().add(new THREE.Vector3(0, 2, 0)), '#f59e0b');
        }
    }

    castFireball() {
        if (this.isDead || this.mp < 20) return;
        this.mp -= 20;

        let fireballDmg = 35 + (this.equippedWeapon?.atkBonus || this.equippedWeapon?.atk || 0);
        if (this.gameRef && this.gameRef.skillTree) {
            fireballDmg += this.gameRef.skillTree.getFireballBonusDamage();
        }

        const fireballGeo = new THREE.SphereGeometry(0.4, 8, 8);
        const fireballMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const fireball = new THREE.Mesh(fireballGeo, fireballMat);
        
        fireball.position.copy(this.root.position).add(new THREE.Vector3(0, 1, 0));
        this.scene.add(fireball);

        const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(this.root.quaternion);
        
        const animateFireball = () => {
            fireball.position.addScaledVector(dir, 18 * 0.016);

            let hit = false;
            if (this.gameRef && this.gameRef.enemyManager) {
                const manager = this.gameRef.enemyManager;
                
                manager.enemies.forEach((enemy) => {
                    if (!hit && !enemy.isDead && fireball.position.distanceTo(enemy.group.position) < 1.8) {
                        hit = true;
                        enemy.takeDamage(fireballDmg, false);
                    }
                });

                if (!hit && manager.boss && !manager.boss.isDead) {
                    if (fireball.position.distanceTo(manager.boss.group.position) < 3.0) {
                        hit = true;
                        manager.boss.takeDamage(fireballDmg, false);
                    }
                }
            }

            if (hit || fireball.position.distanceTo(this.root.position) > 35) {
                fireball.geometry.dispose();
                fireball.material.dispose();
                this.scene.remove(fireball);
            } else {
                requestAnimationFrame(animateFireball);
            }
        };
        requestAnimationFrame(animateFireball);

        if (this.gameRef && this.gameRef.spawnFloatingTextAtWorldPos) {
            this.gameRef.spawnFloatingTextAtWorldPos("-20 MP", this.root.position.clone().add(new THREE.Vector3(0, 2, 0)), '#3b82f6');
        }
    }

    castHeal() {
        if (this.isDead || this.mp < 30) return;
        this.mp -= 30;
        this.hp = Math.min(this.maxHp, this.hp + 40);

        if (this.gameRef && this.gameRef.spawnFloatingTextAtWorldPos) {
            this.gameRef.spawnFloatingTextAtWorldPos("+40 HP", this.root.position.clone().add(new THREE.Vector3(0, 2, 0)), '#22c55e');
        }
    }

    takeDamage(amount) {
        if (this.isDead) return;
        this.hp -= amount;

        if (this.gameRef && this.gameRef.spawnFloatingTextAtWorldPos) {
            this.gameRef.spawnFloatingTextAtWorldPos(`-${amount}`, this.root.position.clone().add(new THREE.Vector3(0, 2, 0)), '#ef4444');
        }

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        if (this.gameRef && this.gameRef.hud) {
            this.gameRef.hud.showDeathScreen(true);
        }

        setTimeout(() => {
            this.respawn();
        }, 3000);
    }

    respawn() {
        this.hp = this.maxHp;
        this.mp = this.maxMp;
        this.isDead = false;
        this.root.position.set(0, 1, 0);

        if (this.gameRef && this.gameRef.hud) {
            this.gameRef.hud.showDeathScreen(false);
        }
    }

    update(dt) {
        if (this.isDead) return;

        const inputDir = new THREE.Vector3();
        if (this.moveState.forward) inputDir.z -= 1;
        if (this.moveState.backward) inputDir.z += 1;
        if (this.moveState.left) inputDir.x -= 1;
        if (this.moveState.right) inputDir.x += 1;
        
        inputDir.normalize();

        const moveDir = new THREE.Vector3();
        if (inputDir.lengthSq() > 0 && this.gameRef) {
            const camAngle = this.gameRef.cameraAngleX || 0;
            moveDir.x = inputDir.x * Math.cos(camAngle) + inputDir.z * Math.sin(camAngle);
            moveDir.z = inputDir.z * Math.cos(camAngle) - inputDir.x * Math.sin(camAngle);
            moveDir.normalize();
        }

        const currentSpeed = this.moveState.sprint ? this.speed * 1.6 : this.speed;
        this.root.position.addScaledVector(moveDir, currentSpeed * dt);

        if (moveDir.lengthSq() > 0) {
            const angle = Math.atan2(moveDir.x, moveDir.z);
            this.root.rotation.y = angle;
        }

        if (this.gameRef && this.gameRef.world) {
            const terrainHeight = this.gameRef.world.getHeightAt(this.root.position.x, this.root.position.z);
            this.root.position.y = terrainHeight + 1.0;
        }

        if (this.mp < this.maxMp) {
            this.mp = Math.min(this.maxMp, this.mp + dt * 5);
        }
    }
}