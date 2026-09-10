import * as THREE from 'three';

export class TargetSystem {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.enemies = [];
  }

  registerEnemy(enemy) {
    this.enemies.push(enemy);
  }

  findTargetInFront(origin, forwardDirection, maxDistance = 6.0) {
    let bestTarget = null;
    let closestDistance = maxDistance;

    const flatOrigin = new THREE.Vector3(origin.x, 0, origin.z);
    const flatForward = new THREE.Vector3(forwardDirection.x, 0, forwardDirection.z).normalize();

    // Clean up dead/destroyed references
    this.enemies = this.enemies.filter(e => e && !e.isDead);

    for (const enemy of this.enemies) {
      const enemyPos = new THREE.Vector3(enemy.group.position.x, 0, enemy.group.position.z);
      const toTarget = new THREE.Vector3().subVectors(enemyPos, flatOrigin);
      const distance = toTarget.length();

      if (distance <= maxDistance) {
        toTarget.normalize();
        const dot = flatForward.dot(toTarget);

        if (dot > 0.3 && distance < closestDistance) {
          closestDistance = distance;
          bestTarget = enemy;
        }
      }
    }

    return bestTarget;
  }
}