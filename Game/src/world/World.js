import * as THREE from 'three';
import { Terrain } from './Terrain.js';
import { Water } from './Water.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.terrain = new Terrain(this.scene);
        
        // Scaled and positioned water so it stays within the lake basin and doesn't drown the boss
        this.water = new Water(this.scene, 50, new THREE.Vector3(0, -0.8, -50));
        
        this.questgiver = null;
        this.initWorld();
        this.initQuestgiver();
    }

    update(dt) {
        if (this.water) this.water.update(dt);

        // Animate floating quest marker bobbing up and down
        if (this.questgiver && this.questgiver.marker) {
            this.questgiver.marker.position.y = 2.6 + Math.sin(Date.now() * 0.004) * 0.2;
            this.questgiver.marker.rotation.y += dt * 2;
        }
    }

    isSwimming(position) {
        return this.water ? this.water.isPositionInWater(position) : false;
    }

    getHeightAt(x, z) {
        return this.terrain ? this.terrain.getHeightAt(x, z) : 0;
    }

    initWorld() {
        // Zone 1: Safe Village (Center)
        this.createVillageZone(new THREE.Vector3(0, 0, 0));

        // Zone 2: Wilderness / Forest
        this.createForestZone(new THREE.Vector3(0, 0, -40));

        // Zone 3: Boss Arena (Shifted further north out of water reach)
        this.createBossArenaZone(new THREE.Vector3(0, 0, -130));
    }

    initQuestgiver() {
        const group = new THREE.Group();
        
        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xa855f7 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1;
        body.castShadow = true;
        group.add(body);

        const markerGeo = new THREE.ConeGeometry(0.3, 0.8, 4);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.set(0, 2.6, 0);
        group.add(marker);

        const qx = 4;
        const qz = -6;
        const qy = this.getHeightAt(qx, qz);
        group.position.set(qx, qy, qz);
        
        this.scene.add(group);
        this.questgiver = { mesh: group, marker: marker };
    }

    createVillageZone(position) {
        const villageGeo = new THREE.CylinderGeometry(25, 25, 0.2, 32);
        const villageMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
        const villageFloor = new THREE.Mesh(villageGeo, villageMat);
        villageFloor.position.copy(position).add(new THREE.Vector3(0, 0.1, 0));
        villageFloor.receiveShadow = true;
        this.scene.add(villageFloor);

        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + 0.5;
            const x = position.x + Math.cos(angle) * 16;
            const z = position.z + Math.sin(angle) * 16;
            const houseGroup = new THREE.Group();

            const baseGeo = new THREE.BoxGeometry(4, 3, 4);
            const baseMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
            const base = new THREE.Mesh(baseGeo, baseMat);
            base.position.y = 1.5;
            houseGroup.add(base);

            const roofGeo = new THREE.ConeGeometry(3.5, 2, 4);
            const roofMat = new THREE.MeshStandardMaterial({ color: 0x991b1b });
            const roof = new THREE.Mesh(roofGeo, roofMat);
            roof.position.y = 4;
            roof.rotation.y = Math.PI / 4;
            houseGroup.add(roof);

            houseGroup.position.set(x, this.getHeightAt(x, z), z);
            this.scene.add(houseGroup);
        }
    }

    createForestZone(position) {
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 2, 6);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3f2e21 });
        const leavesGeo = new THREE.ConeGeometry(2, 4, 6);
        const leavesMat = new THREE.MeshStandardMaterial({ color: 0x14532d });

        for (let i = 0; i < 45; i++) {
            const tree = new THREE.Group();
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.y = 1;
            tree.add(trunk);

            const leaves = new THREE.Mesh(leavesGeo, leavesMat);
            leaves.position.y = 3.5;
            tree.add(leaves);

            const angle = Math.random() * Math.PI * 2;
            const radius = 10 + Math.random() * 40;
            const x = position.x + Math.cos(angle) * radius;
            const z = position.z + Math.sin(angle) * radius;
            const y = this.getHeightAt(x, z);

            tree.position.set(x, y, z);
            this.scene.add(tree);
        }
    }

    createBossArenaZone(position) {
        const yOffset = this.getHeightAt(position.x, position.z);
        const arenaGeo = new THREE.CylinderGeometry(30, 30, 0.3, 32);
        const arenaMat = new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.4 });
        const arenaFloor = new THREE.Mesh(arenaGeo, arenaMat);
        arenaFloor.position.set(position.x, yOffset + 0.15, position.z);
        arenaFloor.receiveShadow = true;
        this.scene.add(arenaFloor);

        const pillarGeo = new THREE.CylinderGeometry(1, 1.2, 10, 8);
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b });

        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = position.x + Math.cos(angle) * 28;
            const z = position.z + Math.sin(angle) * 28;
            const pY = this.getHeightAt(x, z);

            const pillar = new THREE.Mesh(pillarGeo, pillarMat);
            pillar.position.set(x, pY + 5, z);
            pillar.castShadow = true;
            this.scene.add(pillar);
        }
    }
}