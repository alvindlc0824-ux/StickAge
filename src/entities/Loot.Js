import * as THREE from 'three';

export class Loot {
    constructor(scene, position, item = null) {
        this.scene = scene;
        this.item = item || { name: 'Health Potion', type: 'potion', value: 40 };
        this.isPickedUp = false;

        this.createMesh(position);
    }

    createMesh(position) {
        this.group = new THREE.Group();

        const geo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const mat = new THREE.MeshStandardMaterial({ 
            color: 0x00ff88, 
            emissive: 0x00ff88, 
            emissiveIntensity: 0.5,
            roughness: 0.2 
        });

        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.y = 0.2;
        this.mesh.castShadow = true;

        this.group.add(this.mesh);
        this.group.position.copy(position);
        this.scene.add(this.group);
    }

    update(dt) {
        if (this.isPickedUp || !this.group) return;
        this.group.rotation.y += dt * 1.5;
        this.mesh.position.y = 0.2 + Math.sin(Date.now() * 0.003) * 0.15;
    }

    destroy() {
        this.isPickedUp = true;
        if (this.group) {
            this.scene.remove(this.group);
            if (this.mesh) {
                if (this.mesh.geometry) this.mesh.geometry.dispose();
                if (this.mesh.material) this.mesh.material.dispose();
            }
            this.group = null;
            this.mesh = null;
        }
    }
}