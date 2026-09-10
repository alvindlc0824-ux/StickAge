import * as THREE from 'three';

export const MageSkills = {
    fireball: {
        name: 'Fireball',
        mpCost: 20,
        cooldown: 2.0,
        range: 10,
        description: 'Launches an AOE fireball explosion dealing heavy fire damage.',
        execute: (game, caster) => {
            if (!caster || !caster.root) return;
            const pos = caster.root.position.clone().add(new THREE.Vector3(0, 1.5, 0));
            
            if (game.particleManager) {
                game.particleManager.spawnBurst(pos, 0xf97316, 35);
            }

            const bonusDmg = game.skillTree && typeof game.skillTree.getFireballBonusDamage === 'function' 
                ? game.skillTree.getFireballBonusDamage() 
                : 0;
            const fbDamage = 50 + bonusDmg;

            // Damage regular enemies in range
            if (game.enemyManager && game.enemyManager.enemies) {
                for (const enemy of game.enemyManager.enemies) {
                    const enemyPos = enemy.mesh ? enemy.mesh.position : (enemy.group ? enemy.group.position : null);
                    if (enemyPos && enemyPos.distanceTo(pos) < 10) {
                        enemy.hp -= fbDamage;
                        if (game.particleManager) {
                            game.particleManager.spawnBurst(enemyPos, 0xf97316, 30);
                        }
                        if (game.damageSystem) {
                            game.damageSystem.spawnDamageNumber(enemyPos.clone().add(new THREE.Vector3(0, 2, 0)), fbDamage, true);
                        }
                    }
                }
            }

            // Damage boss if in range
            if (game.enemyManager && game.enemyManager.boss && game.enemyManager.boss.mesh) {
                const bossPos = game.enemyManager.boss.mesh.position;
                if (bossPos.distanceTo(pos) < 10) {
                    game.enemyManager.boss.hp -= fbDamage;
                    if (game.particleManager) {
                        game.particleManager.spawnBurst(bossPos, 0xf97316, 30);
                    }
                    if (game.damageSystem) {
                        game.damageSystem.spawnDamageNumber(bossPos.clone().add(new THREE.Vector3(0, 3, 0)), fbDamage, true);
                    }
                }
            }
        }
    }
};