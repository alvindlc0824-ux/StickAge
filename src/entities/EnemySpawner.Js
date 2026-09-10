import { Enemy } from './Enemy.js';

export class EnemySpawner {
  constructor(scene, player, damageSystem, combatSystem, lootList, progression) {
    this.scene = scene;
    this.player = player;
    this.damageSystem = damageSystem;
    this.combatSystem = combatSystem;
    this.lootList = lootList;
    this.progression = progression;

    this.spawnPoints = [];
    this.enemies = [];
    this.respawnQueue = [];
    this.respawnDelay = 5.0; // Respawns enemy 5 seconds after death
  }

  addSpawnPoint(pos) {
    this.spawnPoints.push(pos);
    this.spawnEnemy(pos);
  }

  spawnEnemy(pos) {
    // Correctly pass this.progression to Enemy constructor
    const enemy = new Enemy(
      this.scene, 
      pos, 
      this.player, 
      this.damageSystem, 
      this.lootList, 
      this.progression
    );
    this.enemies.push(enemy);

    if (this.combatSystem && typeof this.combatSystem.registerEnemy === 'function') {
      this.combatSystem.registerEnemy(enemy);
    }
  }

  update(dt) {
    // Process active enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt);

      // Handle dead enemy cleanup and queue respawn
      if (enemy.isDead && enemy.deathTimer >= 2.0) {
        this.respawnQueue.push({
          position: enemy.spawnPosition.clone(),
          timer: this.respawnDelay
        });

        if (this.combatSystem && typeof this.combatSystem.removeEnemy === 'function') {
          this.combatSystem.removeEnemy(enemy);
        }

        enemy.destroy();
        this.enemies.splice(i, 1);
      }
    }

    // Process respawn queue
    for (let i = this.respawnQueue.length - 1; i >= 0; i--) {
      const respawn = this.respawnQueue[i];
      respawn.timer -= dt;

      if (respawn.timer <= 0) {
        this.spawnEnemy(respawn.position);
        this.respawnQueue.splice(i, 1);
      }
    }
  }
}