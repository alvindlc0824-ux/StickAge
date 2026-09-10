import * as THREE from 'three';
import { Enemy } from '../entities/Enemy.js';
import { BossEnemy } from '../entities/BossEnemy.js';

export class EnemyManager {
    constructor(scene, world, game) {
        this.scene = scene;
        this.world = world;
        this.game = game;
        this.damageSystem = game.damageSystem;
        this.progression = game.progression;
        this.lootList = game.lootList;

        this.enemies = [];
        this.boss = null;

        this.spawnTimer = 0;
        this.maxEnemies = 5;

        this.initInitialEnemies();
    }

    initInitialEnemies() {
        for (let i = 0; i < this.maxEnemies; i++) {
            this.spawnEnemy();
        }

        const bossPos = new THREE.Vector3(15, 0, -25);
        this.boss = new BossEnemy(this.scene, bossPos, this.game.player, this.damageSystem, this.lootList, this.progression);
    }

    spawnEnemy() {
        const angle = Math.random() * Math.PI * 2;
        const radius = 8 + Math.random() * 15;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        const spawnPos = new THREE.Vector3(x, 0, z);

        const enemy = new Enemy(this.scene, spawnPos, this.game.player, this.damageSystem, this.lootList, this.progression);
        this.enemies.push(enemy);
    }

    update(dt, player) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy.isDead) {
                // Notify quest system when a regular enemy dies
                if (this.game && this.game.questSystem && typeof this.game.questSystem.addKill === 'function') {
                    this.game.questSystem.addKill();
                }

                enemy.destroy();
                this.enemies.splice(i, 1);
                this.spawnEnemy();
            } else {
                enemy.update(dt);
            }
        }

        if (this.boss) {
            if (this.boss.isDead) {
                // Optionally count boss kills as well if active
                if (this.game && this.game.questSystem && typeof this.game.questSystem.addKill === 'function') {
                    this.game.questSystem.addKill();
                }

                this.boss.destroy();
                this.boss = null;
            } else {
                this.boss.update(dt);
            }
        }

        if (this.game && this.game.lootList) {
            for (let i = this.game.lootList.length - 1; i >= 0; i--) {
                const loot = this.game.lootList[i];
                loot.update(dt);

                if (player && player.root && !loot.isPickedUp && loot.group) {
                    const dist = player.root.position.distanceTo(loot.group.position);
                    if (dist < 1.5) {
                        if (this.game.inventory && typeof this.game.inventory.addItem === 'function') {
                            const added = this.game.inventory.addItem(loot.item);
                            if (added) {
                                loot.destroy();
                                this.game.lootList.splice(i, 1);
                            }
                        } else {
                            loot.destroy();
                            this.game.lootList.splice(i, 1);
                        }
                    }
                }
            }
        }
    }
}