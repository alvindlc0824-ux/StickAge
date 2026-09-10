import * as THREE from 'three';

export class NPC {
  constructor(scene, position, name = "Quest Giver Elder") {
    this.scene = scene;
    this.position = position;
    this.name = name;

    this.createMesh(position);
  }

  createMesh(position) {
    this.group = new THREE.Group();

    // Distinct Gold/Yellow mesh for NPC Quest Giver
    const bodyGeo = new THREE.CapsuleGeometry(0.5, 1.2, 8, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffb300, roughness: 0.4 });
    const mesh = new THREE.Mesh(bodyGeo, bodyMat);
    mesh.position.y = 1.1;
    mesh.castShadow = true;

    // Quest indicator exclamation mark float
    const markGeo = new THREE.OctahedronGeometry(0.3);
    const markMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    this.indicator = new THREE.Mesh(markGeo, markMat);
    this.indicator.position.y = 2.8;

    this.group.add(mesh);
    this.group.add(this.indicator);
    this.group.position.copy(position);

    this.scene.add(this.group);
  }

  update(dt) {
    if (this.indicator) {
      this.indicator.rotation.y += 2.0 * dt;
      this.indicator.position.y = 2.8 + Math.sin(Date.now() * 0.004) * 0.1;
    }
  }
}