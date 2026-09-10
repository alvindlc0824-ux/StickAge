import * as THREE from 'three';

export class Terrain {
    constructor(scene, size = 300, segments = 120) {
        this.scene = scene;
        this.size = size;
        this.segments = segments;
        this.mesh = null;
        this.geometry = null;

        this.initTerrain();
        this.addDecorations();
    }

    // Procedural elevation calculation based on sine wave heightmaps
    getHeightAt(x, z) {
        // Keep central village (radius 30) mostly flat
        const distFromCenter = Math.sqrt(x * x + z * z);
        if (distFromCenter < 30) {
            return 0;
        }

        // Generate smooth rolling hills in the wilderness and mountains near edges
        let height = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 2.5;
        height += Math.sin(x * 0.02 + z * 0.02) * 4.0;

        // Steep cliffs towards map edges
        const edgeDist = Math.max(Math.abs(x), Math.abs(z));
        if (edgeDist > 120) {
            const cliffFactor = (edgeDist - 120) / 30;
            height += Math.pow(cliffFactor, 2) * 8.0;
        }

        return height;
    }

    initTerrain() {
        this.geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
        this.geometry.rotateX(-Math.PI / 2);

        const posAttr = this.geometry.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            const x = posAttr.getX(i);
            const z = posAttr.getZ(i);
            const y = this.getHeightAt(x, z);
            posAttr.setY(i, y);
        }

        this.geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            roughness: 0.85,
            flatShading: true
        });

        this.mesh = new THREE.Mesh(this.geometry, material);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
    }

    addDecorations() {
        // Instanced Rocks across hilly areas
        const rockGeo = new THREE.DodecahedronGeometry(0.8, 1);
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
        const rockCount = 60;
        const instancedRocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);

        const dummy = new THREE.Object3D();
        for (let i = 0; i < rockCount; i++) {
            const x = (Math.random() - 0.5) * 220;
            const z = (Math.random() - 0.5) * 220;

            // Skip placing rocks in the village center
            if (Math.sqrt(x * x + z * z) < 35) continue;

            const y = this.getHeightAt(x, z);
            const scale = 0.6 + Math.random() * 1.2;

            dummy.position.set(x, y + scale * 0.4, z);
            dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            dummy.scale.set(scale, scale, scale);
            dummy.updateMatrix();

            instancedRocks.setMatrixAt(i, dummy.matrix);
        }

        instancedRocks.castShadow = true;
        instancedRocks.receiveShadow = true;
        this.scene.add(instancedRocks);
    }
}