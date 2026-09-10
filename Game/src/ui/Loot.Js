import * as THREE from 'three';

export class Loot {
  constructor(scene, position) {
    this.scene = scene;
    this.position = position.clone();
    this.isPickedUp = false;

    this.item = this.generateRandomGear();
    this.createMesh(position);
  }

  generateRandomGear() {
    const gearTypes = [
      { name: 'Iron Sword', slot: 'weapon', atk: 15, def: 0, hp: 0, color: 0x2196f3, rarity: 'Rare' },
      { name: 'Flame Blade', slot: 'weapon', atk: 35, def: 0, hp: 0, color: 0x9c27b0, rarity: 'Epic' },
      { name: 'Steel Plate', slot: 'armor', atk: 0, def: 12, hp: 40, color: 0x2196f3, rarity: 'Rare' },
      { name: 'Dragon Armor', slot: 'armor', atk: 5, def: 25, hp: 100, color: 0xffd700, rarity: 'Legendary' },
      { name: 'Band of Life', slot: 'ring', atk: 5, def: 5, hp: 30, color: 0x4caf50, rarity: 'Common' }
    ];

    return gearTypes[Math.floor(Math.random() * gearTypes.length)];
  }

  createMesh(position) {
    this.group = new THREE.Group();

    const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const mat = new THREE.MeshStandardMaterial({ color: this.item.color, roughness: 0.3 });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.y = 0.5;
    this.mesh.castShadow = true;

    this.group.add(this.mesh);
    this.group.position.copy(position);
    this.scene.add(this.group);
  }

  update(dt) {
    if (this.mesh) {
      this.mesh.rotation.y += 1.5 * dt;
      this.mesh.position.y = 0.5 + Math.sin(Date.now() * 0.005) * 0.1;
    }
  }

  destroy() {
    this.isPickedUp = true;
    this.scene.remove(this.group);
  }
}