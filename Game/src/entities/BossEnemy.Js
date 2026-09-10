import * as THREE from 'three';
import { HealthBar } from '../ui/HealthBar.js';
import { Loot } from './Loot.js';

export class BossEnemy {
  constructor(scene, position, player, damageSystem, lootList, progression) {
    this.scene = scene;
    this.player = player;
    this.damageSystem = damageSystem;
    this.lootList = lootList;
    this.progression = progression;
    this.spawnPosition = position.clone();

    this.maxHp = 1000;
    this.hp = 1000;
    this.isDead = false;
    this.isEnraged = false;
    this.xpReward = 300;

    this.moveSpeed = 2.5;
    this.aggroRange = 22.0;
    this.attackRange = 4.5;
    this.attackCooldown = 0;
    this.attackRate = 2.0;

    this.state = 'Idle';
    this.aoeTimer = 0;
    this.isCastingAoE = false;
    this.aoeMesh = null;

    this.createMesh(position);
    this.healthBar = new HealthBar(scene);
  }

  createMesh(position) {
    this.group = new THREE.Group();
    
    // Boss Mesh
    const bodyGeo = new THREE.CapsuleGeometry(1.2, 2.5, 8, 16);
    this.material = new THREE.MeshStandardMaterial({ color: 0xb71c1c, roughness: 0.3 });

    this.mesh = new THREE.Mesh(bodyGeo, this.material);
    this.mesh.position.y = 2.4;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Direct reference for Raycaster target checks
    this.mesh.userData.entity = this;

    this.group.add(this.mesh);
    this.group.position.copy(position);
    this.scene.add(this.group);
  }

  takeDamage(amount, isCrit = false) {
    if (this.isDead) return;

    this.hp = Math.max(0, this.hp - amount);

    // Update floating health bar UI overhead
    if (this.healthBar) {
      const hpPos = this.group.position.clone().add(new THREE.Vector3(0, 4.2, 0));
      this.healthBar.update(hpPos, this.hp, this.maxHp);
    }

    // Spawn damage numbers
    if (this.damageSystem && typeof this.damageSystem.spawnDamageNumber === 'function') {
      this.damageSystem.spawnDamageNumber(
        this.group.position.clone().add(new THREE.Vector3(0, 4.5, 0)),
        amount,
        isCrit
      );
    }

    // Phase shift at 50% HP
    if (!this.isEnraged && this.hp <= this.maxHp * 0.5) {
      this.isEnraged = true;
      this.attackRate = 1.2;
      this.material.color.setHex(0xff0000);
    }

    if (this.state === 'Idle') this.state = 'Chase';
    if (this.hp <= 0) this.die();
  }

  die() {
    this.isDead = true;
    this.state = 'Dead';
    this.material.color.setHex(0x222222);

    if (this.aoeMesh) this.clearAoEMesh();
    if (this.healthBar) this.healthBar.destroy();

    if (this.progression && typeof this.progression.addXp === 'function') {
      this.progression.addXp(this.xpReward);
    }

    // Drop items compatible with Inventory.js ('potion' and 'weapon')
    if (this.lootList) {
      const bossItem1 = { name: 'Health Potion', type: 'potion', value: 40 };
      const bossItem2 = { name: 'Iron Sword', type: 'weapon', atkBonus: 15 };
      this.lootList.push(new Loot(this.scene, this.group.position.clone(), bossItem1));
      this.lootList.push(new Loot(this.scene, this.group.position.clone().add(new THREE.Vector3(1, 0, 1)), bossItem2));
    }
  }

  triggerAoEAttack() {
    this.isCastingAoE = true;
    this.aoeTimer = 1.5;

    const ringGeo = new THREE.RingGeometry(0.1, 5.0, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    this.aoeMesh = new THREE.Mesh(ringGeo, ringMat);
    this.aoeMesh.rotation.x = -Math.PI / 2;
    this.aoeMesh.position.copy(this.group.position);
    this.aoeMesh.position.y = 0.05;
    this.scene.add(this.aoeMesh);
  }

  clearAoEMesh() {
    if (this.aoeMesh) {
      this.scene.remove(this.aoeMesh);
      if (this.aoeMesh.geometry) this.aoeMesh.geometry.dispose();
      if (this.aoeMesh.material) this.aoeMesh.material.dispose();
      this.aoeMesh = null;
    }
  }

  resolveAoE() {
    this.clearAoEMesh();

    if (this.player && this.player.root) {
      const distToPlayer = this.group.position.distanceTo(this.player.root.position);
      if (distToPlayer <= 5.0) {
        this.player.takeDamage(45);
      }
    }

    this.isCastingAoE = false;
  }

  update(dt) {
    if (this.isDead || !this.player || !this.player.root) return;

    // Always update Health Bar position above Boss mesh
    if (this.healthBar) {
      const hpPos = this.group.position.clone().add(new THREE.Vector3(0, 4.2, 0));
      this.healthBar.update(hpPos, this.hp, this.maxHp);
    }

    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    if (this.isCastingAoE) {
      this.aoeTimer -= dt;
      if (this.aoeTimer <= 0) this.resolveAoE();
      return;
    }

    const playerPos = this.player.root.position;
    const distToPlayer = this.group.position.distanceTo(playerPos);

    if (distToPlayer <= this.aggroRange && !this.player.isDead) {
      if (distToPlayer <= this.attackRange) {
        if (this.attackCooldown <= 0) {
          this.attackCooldown = this.attackRate;
          Math.random() < 0.4 ? this.triggerAoEAttack() : this.player.takeDamage(20);
        }
      } else {
        const dir = new THREE.Vector3().subVectors(playerPos, this.group.position);
        dir.y = 0;
        if (dir.lengthSq() > 0.001) {
          dir.normalize();
          this.group.position.addScaledVector(dir, this.moveSpeed * dt);
          this.group.rotation.y = Math.atan2(dir.x, dir.z);
        }
      }
    }
  }

  destroy() {
    this.clearAoEMesh();
    if (this.healthBar) this.healthBar.destroy();
    this.scene.remove(this.group);
  }
}