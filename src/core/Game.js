import * as THREE from 'three';
import { Player } from '../player/Player.js';
import { World } from '../world/World.js';
import { EnemyManager } from '../systems/EnemyManager.js';
import { HUD } from '../ui/HUD.js';
import { Inventory } from '../systems/Inventory.js';
import { QuestSystem } from '../systems/QuestSystem.js';
import { SkillTree } from '../systems/SkillTree.js';
import { ParticleManager } from '../systems/ParticleManager.js';

export class Game {
    constructor() {
        this.container = document.body;
        this.clock = new THREE.Clock();

        // Camera rotation angles
        this.cameraAngleX = 0;
        this.cameraAngleY = 0;
        this.isPointerLocked = false;

        this.initScene();
        this.initSystems();
        this.initEventListeners();

        // Start loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f172a);
        this.scene.fog = new THREE.FogExp2(0x0f172a, 0.015);

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(30, 50, 30);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 150;
        const d = 40;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
        this.scene.add(dirLight);
    }

    initSystems() {
        // World / Terrain
        this.world = new World(this.scene);

        // Particle Manager
        this.particleManager = new ParticleManager(this.scene);

        // Loot Tracker Array (Must be initialized BEFORE EnemyManager so drops register correctly)
        this.lootList = [];

        // Player & link gameRef for camera orientation
        this.player = new Player(this.scene, this.camera);
        this.player.gameRef = this;

        // Inventory & Skill Tree (Passes player so inventory actions work correctly)
        this.inventory = new Inventory(this.player);
        this.skillTree = new SkillTree();

        // Quest System
        this.questSystem = new QuestSystem(this);

        // Enemy Manager
        this.enemyManager = new EnemyManager(this.scene, this.world, this);

        // HUD UI Layer
        this.hud = new HUD();
        this.hud.inventory = this.inventory;

        this.hud.updateSkillTreeUI(this.skillTree, (key) => {
            const success = this.skillTree.upgradeSkill(key);
            if (success) {
                this.hud.updateSkillTreeUI(this.skillTree, (k) => {
                    this.skillTree.upgradeSkill(k);
                    this.hud.updateSkillTreeUI(this.skillTree, arguments[0]);
                });
            }
        });
    }

    initEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Click canvas to request Pointer Lock (360 mouse look)
        this.renderer.domElement.addEventListener('click', () => {
            if (!this.isPointerLocked) {
                this.renderer.domElement.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
        });

        // Handle mouse movement for 360 view when locked
        window.addEventListener('mousemove', (e) => {
            if (!this.isPointerLocked) return;

            const sensitivity = 0.003;
            this.cameraAngleX -= e.movementX * sensitivity;
            this.cameraAngleY += e.movementY * sensitivity;

            // Clamp vertical look angle to avoid flipping upside down
            const maxLook = Math.PI / 2 - 0.05;
            this.cameraAngleY = Math.max(-maxLook, Math.min(maxLook, this.cameraAngleY));
        });

        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (key === 'i') {
                if (this.hud && typeof this.hud.toggleInventory === 'function') {
                    this.hud.toggleInventory();
                } else if (this.inventory && typeof this.inventory.toggle === 'function') {
                    this.inventory.toggle();
                }
            } else if (key === 'k') {
                this.hud.toggleSkillTree();
                this.hud.updateSkillTreeUI(this.skillTree, (skillKey) => {
                    if (this.skillTree.upgradeSkill(skillKey)) {
                        this.hud.updateSkillTreeUI(this.skillTree, arguments.callee);
                    }
                });
            } else if (key === 'e' || key === 'f') {
                this.handleInteraction();
            } else if (key === '1') {
                this.castFireball();
            } else if (key === '2') {
                this.castHeal();
            }
        });
    }

    handleInteraction() {
        if (!this.player || !this.player.root) return;

        // Check proximity to Loot first so pressing [E] or [F] picks it up manually
        if (this.lootList && this.lootList.length > 0) {
            for (let i = this.lootList.length - 1; i >= 0; i--) {
                const loot = this.lootList[i];
                const lootPos = new THREE.Vector3();
                if (loot && loot.group && typeof loot.group.getWorldPosition === 'function') {
                    loot.group.getWorldPosition(lootPos);
                } else if (loot && loot.mesh && typeof loot.mesh.getWorldPosition === 'function') {
                    loot.mesh.getWorldPosition(lootPos);
                } else if (loot && loot.group) {
                    lootPos.copy(loot.group.position);
                } else {
                    continue;
                }

                if (this.player.root.position.distanceTo(lootPos) < 3.5) {
                    // Force a valid item structure so it never fails to add
                    const itemToAdd = loot.item && loot.item.type ? loot.item : { name: 'Health Potion', type: 'potion', value: 40 };

                    const added = this.inventory.addItem(itemToAdd);
                    if (added) {
                        this.spawnFloatingTextAtWorldPos(`+1 ${itemToAdd.name || 'Item'}`, this.player.root.position.clone().add(new THREE.Vector3(0, 2, 0)), '#00e676');
                        if (loot && typeof loot.destroy === 'function') {
                            loot.destroy();
                        }
                        this.lootList.splice(i, 1);
                        return;
                    } else {
                        this.spawnFloatingTextAtWorldPos("Inventory Full!", this.player.root.position.clone().add(new THREE.Vector3(0, 2, 0)), '#ef4444');
                        return;
                    }
                }
            }
        }

        // Default NPC Quest Interaction
        const npcPos = this.world && this.world.questgiver && this.world.questgiver.mesh ?
            this.world.questgiver.mesh.position : new THREE.Vector3(4, 0, -6);
        const distToNPC = this.player.root.position.distanceTo(npcPos);

        if (distToNPC < 4.0) {
            if (this.questSystem.questState === 'NONE') {
                this.questSystem.acceptQuest();
                this.spawnFloatingTextAtWorldPos("Quest Accepted: Goblin Slayer", this.player.root.position.clone().add(new THREE.Vector3(0, 2.5, 0)), '#38bdf8');
            } else if (this.questSystem.questState === 'READY_TO_COMPLETE') {
                this.questSystem.completeQuest();
                this.spawnFloatingTextAtWorldPos("Quest Completed! +100 EXP", this.player.root.position.clone().add(new THREE.Vector3(0, 2.5, 0)), '#22c55e');
            }
        }
    }

    castFireball() {
        if (!this.player || !this.player.root) return;
        if (this.player.mp < 20) {
            this.spawnFloatingTextAtWorldPos("Not enough MP!", this.player.root.position.clone().add(new THREE.Vector3(0, 2, 0)), '#3b82f6');
            return;
        }
        this.player.mp -= 20;

        const pos = this.player.root.position.clone().add(new THREE.Vector3(0, 1.5, 0));
        if (this.particleManager) {
            this.particleManager.spawnBurst(pos, 0xf97316, 35);
        }
        this.spawnFloatingTextAtWorldPos("Fireball Cast!", pos, '#f97316');

        const bonusDmg = this.skillTree.getFireballBonusDamage();
        const fbDamage = 50 + bonusDmg;

        if (this.enemyManager.boss && this.enemyManager.boss.mesh) {
            if (this.enemyManager.boss.mesh.position.distanceTo(pos) < 10) {
                this.enemyManager.boss.hp -= fbDamage;
                if (this.particleManager) {
                    this.particleManager.spawnBurst(this.enemyManager.boss.mesh.position, 0xf97316, 30);
                }
                this.spawnFloatingTextAtWorldPos(`-${fbDamage}`, this.enemyManager.boss.mesh.position.clone().add(new THREE.Vector3(0, 3, 0)), '#f97316');
            }
        }
    }

    castHeal() {
        if (!this.player || !this.player.root) return;
        if (this.player.mp < 15) {
            this.spawnFloatingTextAtWorldPos("Not enough MP!", this.player.root.position.clone().add(new THREE.Vector3(0, 2, 0)), '#3b82f6');
            return;
        }
        this.player.mp -= 15;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 40);

        if (this.particleManager) {
            this.particleManager.spawnBurst(this.player.root.position.clone().add(new THREE.Vector3(0, 1, 0)), '#22c55e', 30);
        }
        this.spawnFloatingTextAtWorldPos("+40 HP", this.player.root.position.clone().add(new THREE.Vector3(0, 2.5, 0)), '#22c55e');
    }

    spawnFloatingTextAtWorldPos(text, worldPos, color) {
        const vector = worldPos.clone();
        vector.project(this.camera);

        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;

        if (this.hud && typeof this.hud.showFloatingText === 'function') {
            this.hud.showFloatingText(text, x, y, color);
        }
    }

    animate() {
        requestAnimationFrame(this.animate);

        const dt = this.clock.getDelta();

        // Update systems
        if (this.world) this.world.update(dt);
        if (this.player) this.player.update(dt);
        if (this.enemyManager) this.enemyManager.update(dt, this.player);
        if (this.particleManager) this.particleManager.update(dt);
        if (this.questSystem) this.questSystem.update();

        // Update active loot drops animation
        if (this.lootList) {
            for (let i = this.lootList.length - 1; i >= 0; i--) {
                const loot = this.lootList[i];
                if (loot && !loot.isPickedUp) {
                    if (typeof loot.update === 'function') loot.update(dt);
                }
            }
        }

        // Position camera smoothly orbiting or following player using 360 angles
        if (this.player && this.player.root) {
            const playerPos = this.player.root.position.clone().add(new THREE.Vector3(0, 1.5, 0));
            const distance = 8;

            const offsetX = distance * Math.sin(this.cameraAngleX) * Math.cos(this.cameraAngleY);
            const offsetY = distance * Math.sin(this.cameraAngleY);
            const offsetZ = distance * Math.cos(this.cameraAngleX) * Math.cos(this.cameraAngleY);

            this.camera.position.set(playerPos.x + offsetX, playerPos.y + offsetY, playerPos.z + offsetZ);
            this.camera.lookAt(playerPos);
        }

        // Update HUD Vitals
        if (this.hud && this.player) {
            const maxHpBonus = this.skillTree.getMaxHpBonus();
            const currentMaxHp = this.player.maxHp + maxHpBonus;

            // Dynamically evaluate total attack power from base player stats, equipped weapons, and skills
            const baseAtk = this.player.attackPower !== undefined ? this.player.attackPower : (this.player.atk !== undefined ? this.player.atk : 10);
            const weaponBonus = this.player.equippedWeapon ? (this.player.equippedWeapon.atkBonus || this.player.equippedWeapon.atk || this.player.equippedWeapon.damage || 0) : 0;
            const skillAtk = typeof this.skillTree.getFireballBonusDamage === 'function' ? (this.skillTree.getFireballBonusDamage() || 0) : 0;
            const currentAtk = baseAtk + weaponBonus + skillAtk;

            // Also keep player's active attack property synced so combat script picks it up
            this.player.totalAtk = currentAtk;

            this.hud.updateVitals(
                this.player.hp,
                currentMaxHp,
                this.player.mp,
                this.player.maxMp,
                this.player.exp,
                this.player.maxExp,
                this.player.level,
                currentAtk
            );
            this.hud.updateQuestTracker(this.questSystem);

            if (this.player.root) {
                const npcPos = this.world && this.world.questgiver && this.world.questgiver.mesh ?
                    this.world.questgiver.mesh.position : new THREE.Vector3(4, 0, -6);
                const distToNPC = this.player.root.position.distanceTo(npcPos);

                // Check if near loot to display interact/loot prompt
                let nearLoot = false;
                if (this.lootList) {
                    for (const loot of this.lootList) {
                        const lootPos = new THREE.Vector3();
                        if (loot.group && typeof loot.group.getWorldPosition === 'function') {
                            loot.group.getWorldPosition(lootPos);
                        } else if (loot.mesh && typeof loot.mesh.getWorldPosition === 'function') {
                            loot.mesh.getWorldPosition(lootPos);
                        } else if (loot.group) {
                            lootPos.copy(loot.group.position);
                        }

                        if (lootPos && this.player.root.position.distanceTo(lootPos) < 3.5) {
                            nearLoot = true;
                            break;
                        }
                    }
                }

                if (nearLoot) {
                    this.hud.showInteractionPrompt(true, 'Press [F] to Loot');
                } else if (distToNPC < 4.0) {
                    const promptText = this.questSystem.questState === 'NONE' ? 'Press [E] to Accept Quest' :
                        this.questSystem.questState === 'READY_TO_COMPLETE' ? 'Press [E] to Turn In Quest' : '';
                    this.hud.showInteractionPrompt(promptText !== '', promptText);
                } else {
                    this.hud.showInteractionPrompt(false);
                }
            }
        }

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}