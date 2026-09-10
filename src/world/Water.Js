import * as THREE from 'three';

export class Water {
    constructor(scene, size = 120, position = new THREE.Vector3(0, -1.2, -40)) {
        this.scene = scene;
        this.size = size;
        this.waterLevel = position.y;

        this.initWater(position);
    }

    initWater(position) {
        const geometry = new THREE.PlaneGeometry(this.size, this.size, 64, 64);
        geometry.rotateX(-Math.PI / 2);

        // Custom Shader Material for Animated Waves and Translucency
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0x0284c7) }
            },
            vertexShader: `
                uniform float uTime;
                varying vec2 vUv;
                varying float vElevation;

                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    float elevation = sin(pos.x * 0.3 + uTime * 2.0) * cos(pos.z * 0.3 + uTime * 1.5) * 0.3;
                    pos.y += elevation;
                    vElevation = elevation;

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                varying float vElevation;

                void main() {
                    vec3 color = uColor + vElevation * 0.2;
                    gl_FragColor = vec4(color, 0.75);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });

        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.copy(position);
        this.scene.add(this.mesh);
    }

    update(dt) {
        if (this.material) {
            this.material.uniforms.uTime.value += dt;
        }
    }

    isPositionInWater(pos) {
        const halfSize = this.size / 2;
        const waterPos = this.mesh.position;

        const inBounds = Math.abs(pos.x - waterPos.x) < halfSize && Math.abs(pos.z - waterPos.z) < halfSize;
        return inBounds && pos.y <= this.waterLevel + 0.5;
    }
}