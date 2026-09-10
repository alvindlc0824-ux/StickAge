import * as THREE from 'three';

export class NPCManager {
    constructor(scene, player, questSystem) {
        this.scene = scene;
        this.player = player;
        this.questSystem = questSystem;
        this.npcs = [];
        this.interactionPressedLastFrame = false;

        this.createNPCs();
    }

    createNPCs() {
        const geometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
        const material = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.position.set(5, 1, 5);
        mesh.castShadow = true;
        this.scene.add(mesh);

        this.npcs.push({
            mesh: mesh,
            name: 'Village Elder',
            dialogue: 'Brave adventurer! The surrounding fields are overrun with monsters. Defeat them and bring peace back to our village!',
            interactionRange: 3.5
        });
    }

    update(dt, gameRef) {
        if (!this.player || !this.player.root) return;

        const playerPos = this.player.root.position;
        let nearAnyNPC = false;

        for (const npc of this.npcs) {
            const dist = npc.mesh.position.distanceTo(playerPos);

            if (dist <= npc.interactionRange) {
                nearAnyNPC = true;

                if (gameRef && gameRef.hud) {
                    let promptText = 'Press [E] to Talk';
                    if (this.questSystem.questState === 'ACTIVE') {
                        promptText = 'Press [E] (Quest in Progress)';
                    } else if (this.questSystem.questState === 'READY_TO_COMPLETE') {
                        promptText = 'Press [E] to Complete Quest!';
                    } else if (this.questSystem.questState === 'COMPLETED') {
                        promptText = 'Village Elder: "Thank you for saving us!"';
                    }
                    gameRef.hud.showInteractionPrompt(true, promptText);
                }

                if (gameRef && typeof gameRef.isKeyPressed === 'function' && gameRef.isKeyPressed('e')) {
                    if (!this.interactionPressedLastFrame) {
                        this.interact(npc, gameRef);
                        this.interactionPressedLastFrame = true;
                    }
                } else {
                    this.interactionPressedLastFrame = false;
                }
            }
        }

        if (!nearAnyNPC && gameRef && gameRef.hud) {
            gameRef.hud.showInteractionPrompt(false);
        }
    }

    interact(npc, gameRef) {
        if (!this.questSystem) return;

        if (this.questSystem.questState === 'NONE') {
            this.questSystem.startQuest({
                title: 'Clear the Slimes',
                description: 'Defeat 5 enemies in the field.',
                targetKills: 5,
                currentKills: 0
            });
            if (gameRef && gameRef.spawnFloatingTextAtWorldPos) {
                gameRef.spawnFloatingTextAtWorldPos('Quest Accepted!', npc.mesh.position.clone().add(new THREE.Vector3(0, 2, 0)), '#38bdf8');
            }
        } else if (this.questSystem.questState === 'READY_TO_COMPLETE') {
            this.questSystem.completeQuest();
            if (gameRef && gameRef.spawnFloatingTextAtWorldPos) {
                gameRef.spawnFloatingTextAtWorldPos('Quest Completed! +50 Gold', npc.mesh.position.clone().add(new THREE.Vector3(0, 2, 0)), '#eab308');
            }
        } else {
            if (gameRef && gameRef.spawnFloatingTextAtWorldPos) {
                gameRef.spawnFloatingTextAtWorldPos('Keep fighting!', npc.mesh.position.clone().add(new THREE.Vector3(0, 2, 0)), '#ef4444');
            }
        }
    }
}