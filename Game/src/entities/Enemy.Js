import * as THREE from 'three';
import { HealthBar } from '../ui/HealthBar.js';
import { Loot } from './Loot.js';

export class Enemy {
  constructor(scene, position, player, damageSystem, lootList, progression) {
    this.scene = scene;
    this.player = player;
    this.damageSystem = damageSystem;
    this.lootList = lootList;
    this.progression = progression;
    this.spawnPosition = position.clone();

    this.maxHp = 100;
    this.hp = 100;
    this.isDead = false;
    this.xpReward = 45;
    this.deathTimer = 0;

    this.moveSpeed = 3.0;
    this.aggroRange = 12.0;
    this.attackRange = 2.0;
    this.attackCooldown = 0;
    this.attackRate = 1.2;
    this.damage = 10;

    this.state = 'Idle';
    this.stateTimer = 0;
    this.patrolTarget = null;

    this.createMesh(position);
    this.healthBar = new HealthBar(scene);
  }

  createMesh(position) {
    this.group = new THREE.Group();
    const bodyGeo = new THREE.CapsuleGeometry(0.45, 1.0, 8, 16);
    this.material = new THREE.MeshStandardMaterial({ color: 0x8e24aa, roughness: 0.5 });

    this.mesh = new THREE.Mesh(bodyGeo, this.material);
    this.mesh.position.y = 0.95;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    this.group.add(this.mesh);
    this.group.position.copy(position);
    this.scene.add(this.group);
  }

  takeDamage(amount, isCrit = false) {
    if (this.isDead) return;

    this.hp = Math.max(0, this.hp - amount);

    if (this.damageSystem && typeof this.damageSystem.spawnDamageNumber === 'function') {
      this.damageSystem.spawnDamageNumber(
        this.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)),
        amount,
        isCrit
      );
    }

    if (this.state === 'Idle' || this.state === 'Patrol') {
      this.state = 'Chase';
    }

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    this.state = 'Dead';
    this.material.color.setHex(0x333333);
    this.healthBar.destroy();

    // Award XP to the player immediately on kill
    if (this.progression && typeof this.progression.addXp === 'function') {
      this.progression.addXp(this.xpReward);
    }

    // Push loot with a rarity-tiered random chance between a potion and weapons
    if (this.lootList) {
      let dropItem;
      const roll = Math.random();

      if (roll < 0.6) {
        dropItem = { name: 'Health Potion', type: 'potion', value: 40 };
      } else {
        const weaponRoll = Math.random();
        if (weaponRoll < 0.60) {
          dropItem = { name: 'Iron Sword', type: 'weapon', atkBonus: 5, rarity: 'Common' };
        } else if (weaponRoll < 0.90) {
          dropItem = { name: 'Steel Blade', type: 'weapon', atkBonus: 10, rarity: 'Rare' };
        } else {
          dropItem = { name: 'Battle Axe', type: 'weapon', atkBonus: 15, rarity: 'Epic' };
        }
      }

      this.lootList.push(new Loot(this.scene, this.group.position.clone(), dropItem));
    }
  }

  update(dt) {
    if (this.isDead) {
      this.deathTimer += dt;
      return;
    }

    this.healthBar.update(this.group.position, this.hp, this.maxHp);
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    if (this.player.isDead) {
      this.state = 'Return';
    }

    const playerPos = this.player.root.position;
    const distToPlayer = this.group.position.distanceTo(playerPos);
    const distToSpawn = this.group.position.distanceTo(this.spawnPosition);

    switch (this.state) {
      case 'Idle':
        this.stateTimer += dt;
        if (distToPlayer <= this.aggroRange && !this.player.isDead) {
          this.state = 'Chase';
        } else if (this.stateTimer > 3.0) {
          this.state = 'Patrol';
          this.stateTimer = 0;
          this.patrolTarget = this.spawnPosition.clone().add(new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            0,
            (Math.random() - 0.5) * 10
          ));
        }
        break;

      case 'Patrol':
        if (distToPlayer <= this.aggroRange && !this.player.isDead) {
          this.state = 'Chase';
        } else if (this.patrolTarget) {
          this.moveTowards(this.patrolTarget, this.moveSpeed * 0.5, dt);
          if (this.group.position.distanceTo(this.patrolTarget) < 0.5) {
            this.state = 'Idle';
            this.stateTimer = 0;
          }
        }
        break;

      case 'Chase':
        if (distToSpawn > 25.0 || this.player.isDead) {
          this.state = 'Return';
        } else if (distToPlayer <= this.attackRange) {
          this.state = 'Attack';
        } else {
          this.moveTowards(playerPos, this.moveSpeed, dt);
        }
        break;

      case 'Attack':
        if (distToPlayer > this.attackRange + 0.5 || this.player.isDead) {
          this.state = 'Chase';
        } else {
          this.lookAt(playerPos);
          if (this.attackCooldown <= 0) {
            this.attackCooldown = this.attackRate;
            this.player.takeDamage(this.damage);

            if (this.damageSystem && typeof this.damageSystem.spawnDamageNumber === 'function') {
              this.damageSystem.spawnDamageNumber(
                playerPos.clone().add(new THREE.Vector3(0, 1.0, 0)),
                this.damage,
                false
              );
            }
          }
        }
        break;

      case 'Return':
        this.moveTowards(this.spawnPosition, this.moveSpeed * 1.2, dt);
        if (distToSpawn < 0.5) {
          this.hp = this.maxHp;
          this.state = 'Idle';
        }
        break;
    }
  }

  moveTowards(targetPos, speed, dt) {
    const dir = new THREE.Vector3().subVectors(targetPos, this.group.position);
    dir.y = 0;
    if (dir.lengthSq() > 0) {
      dir.normalize();
      this.group.position.addScaledVector(dir, speed * dt);
      this.lookAt(targetPos);
    }
  }

  lookAt(targetPos) {
    const angle = Math.atan2(
      targetPos.x - this.group.position.x,
      targetPos.z - this.group.position.z
    );
    this.group.rotation.y = angle;
  }

  destroy() {
    this.healthBar.destroy();
    this.scene.remove(this.group);
  }
}