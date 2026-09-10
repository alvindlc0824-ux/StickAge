import * as THREE from 'three';

export class Projectile {
  constructor(scene, position, direction, damage, enemies, damageSystem) {
    this.scene = scene;
    this.damage = damage;
    this.enemies = enemies;
    this.damageSystem = damageSystem;
    this.speed = 18;
    this.lifetime = 3.0;
    this.isDead = false;

    this.direction = direction.clone().normalize();

    // Fireball Mesh
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff5722 })
    );
    this.mesh.position.copy(position).add(new THREE.Vector3(0, 1.2, 0));
    this.scene.add(this.mesh);

    // Light effect
    this.light = new THREE.PointLight(0xff5722, 2, 8);
    this.mesh.add(this.light);
  }

  update(dt) {
    if (this.isDead) return;

    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.destroy();
      return;
    }

    // Move forward
    this.mesh.position.addScaledVector(this.direction, this.speed * dt);

    // Hit detection against enemies
    for (const enemy of this.enemies) {
      if (!enemy.isDead && enemy.group.position.distanceTo(this.mesh.position) < 1.2) {
        this.explode(enemy);
        break;
      }
    }
  }

  explode(hitTarget) {
    const explosionRadius = 4.0;

    // Deal AoE Damage to all nearby enemies
    for (const enemy of this.enemies) {
      if (!enemy.isDead) {
        const dist = enemy.group.position.distanceTo(this.mesh.position);
        if (dist <= explosionRadius) {
          const isCrit = Math.random() < 0.2;
          const aoeDamage = Math.floor(this.damage * (1 - dist / (explosionRadius * 1.5)));
          enemy.takeDamage(aoeDamage, isCrit);
        }
      }
    }

    this.destroy();
  }

  destroy() {
    this.isDead = true;
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}