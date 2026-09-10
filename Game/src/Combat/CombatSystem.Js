import * as THREE from 'three';
import { DamageSystem } from './DamageSystem.js';

export class CombatSystem {
  constructor(scene, camera, player, hud, audio) {
    this.scene = scene;
    this.camera = camera;
    this.player = player;
    this.hud = hud;
    this.audio = audio;

    this.enemies = [];
    this.damageSystem = new DamageSystem(scene);

    // Skill definitions & cooldown timers
    this.skills = {
      '1': { name: 'Slash', cooldown: 0.5, currentCd: 0, range: 3.0, damage: 35, cost: 0 },
      '2': { name: 'Fireball', cooldown: 3.0, currentCd: 0, range: 15.0, damage: 80, cost: 20 },
      '3': { name: 'Heal', cooldown: 8.0, currentCd: 0, range: 0, damage: -50, cost: 30 },
      '4': { name: 'Sprint', cooldown: 10.0, currentCd: 0, range: 0, damage: 0, cost: 15 }
    };
  }

  registerEnemy(enemy) {
    if (!this.enemies.includes(enemy)) {
      this.enemies.push(enemy);
    }
  }

  removeEnemy(enemy) {
    const index = this.enemies.indexOf(enemy);
    if (index !== -1) {
      this.enemies.splice(index, 1);
    }
  }

  getEnemyPosition(enemy) {
    if (enemy.group) return enemy.group.position;
    if (enemy.mesh) return enemy.mesh.position;
    return enemy.spawnPosition || new THREE.Vector3();
  }

  playSound(soundName) {
    if (this.audio) {
      if (typeof this.audio.play === 'function') {
        this.audio.play(soundName);
      } else if (typeof this.audio.playSound === 'function') {
        this.audio.playSound(soundName);
      }
    }
  }

  useSkill(skillKey) {
    const skill = this.skills[skillKey];
    if (!skill || skill.currentCd > 0) return;

    // Check Mana requirement
    if (this.player.mp < skill.cost) {
      if (this.hud && typeof this.hud.showPrompt === 'function') {
        this.hud.showPrompt('Not enough Mana!');
      }
      return;
    }

    // Deduct Mana
    this.player.mp -= skill.cost;
    skill.currentCd = skill.cooldown;

    const playerPos = this.player.root.position;

    // Skill 1: Basic Melee Slash
    if (skillKey === '1') {
      this.playSound('attack');

      this.enemies.forEach(enemy => {
        if (enemy.isDead) return;
        const enemyPos = this.getEnemyPosition(enemy);
        const distance = playerPos.distanceTo(enemyPos);

        if (distance <= skill.range) {
          const isCrit = Math.random() < 0.2;
          const finalDamage = isCrit ? skill.damage * 1.5 : skill.damage;
          enemy.takeDamage(finalDamage, isCrit);
        }
      });
    }

    // Skill 2: Targeted Ranged Fireball
    else if (skillKey === '2') {
      this.playSound('fireball');

      let closestEnemy = null;
      let minDistance = skill.range;

      this.enemies.forEach(enemy => {
        if (enemy.isDead) return;
        const enemyPos = this.getEnemyPosition(enemy);
        const distance = playerPos.distanceTo(enemyPos);

        if (distance < minDistance) {
          minDistance = distance;
          closestEnemy = enemy;
        }
      });

      if (closestEnemy) {
        const isCrit = Math.random() < 0.3;
        const finalDamage = isCrit ? skill.damage * 1.8 : skill.damage;
        closestEnemy.takeDamage(finalDamage, isCrit);
      }
    }

    // Skill 3: Self Heal
    else if (skillKey === '3') {
      this.playSound('heal');
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 50);
      this.damageSystem.spawnDamageNumber(
        playerPos.clone().add(new THREE.Vector3(0, 2, 0)),
        50,
        false,
        '#4caf50'
      );
    }

    // Skill 4: Speed Sprint Boost
    else if (skillKey === '4') {
      this.player.applySpeedBoost(1.8, 4.0);
    }
  }

  update(dt) {
    this.damageSystem.update(dt);

    // Update Skill Cooldowns & UI overlays
    Object.keys(this.skills).forEach(key => {
      const skill = this.skills[key];
      if (skill.currentCd > 0) {
        skill.currentCd = Math.max(0, skill.currentCd - dt);
        if (this.hud && typeof this.hud.updateCooldown === 'function') {
          this.hud.updateCooldown(key, skill.currentCd / skill.cooldown);
        }
      }
    });
  }
}