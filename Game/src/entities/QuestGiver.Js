import * as THREE from 'three';

export class QuestGiver {
  constructor(scene, position, player, hud) {
    this.scene = scene;
    this.position = position;
    this.player = player;
    this.hud = hud;

    this.interactionRadius = 3.5;
    this.isPlayerNear = false;
    this.hasActiveQuest = false;
    this.isQuestCompleted = false;

    this.initMesh();
    this.initQuestMarker();
  }

  initMesh() {
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    // NPC Body (Yellow Capsule Mesh)
    const bodyGeo = new THREE.CapsuleGeometry(0.5, 1.2, 4, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.4,
      metalness: 0.1
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 1.1;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    this.group.add(bodyMesh);

    // NPC Head
    const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.y = 2.1;
    headMesh.castShadow = true;
    this.group.add(headMesh);

    // Base Shadow / Ring Indicator
    const ringGeo = new THREE.RingGeometry(0.6, 0.8, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.02;
    this.group.add(ringMesh);

    this.scene.add(this.group);
  }

  initQuestMarker() {
    // Overhead Exclamation Mark (!)
    const markerGroup = new THREE.Group();
    
    const topGeo = new THREE.CylinderGeometry(0.08, 0.03, 0.6, 8);
    const bottomGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });

    const topMesh = new THREE.Mesh(topGeo, markerMat);
    topMesh.position.y = 0.35;

    const bottomMesh = new THREE.Mesh(bottomGeo, markerMat);
    bottomMesh.position.y = 0.0;

    markerGroup.add(topMesh);
    markerGroup.add(bottomMesh);
    markerGroup.position.y = 3.0;

    this.marker = markerGroup;
    this.group.add(this.marker);
  }

  update(dt) {
    if (!this.player || !this.player.root) return;

    // Bobbing and rotating animation for the overhead marker
    if (this.marker) {
      this.marker.rotation.y += dt * 1.5;
      this.marker.position.y = 3.0 + Math.sin(Date.now() * 0.003) * 0.15;
    }

    // Distance calculation to trigger player interactions
    const dist = this.group.position.distanceTo(this.player.root.position);

    if (dist < this.interactionRadius) {
      if (!this.isPlayerNear) {
        this.isPlayerNear = true;
        if (this.hud && typeof this.hud.showPrompt === 'function') {
          this.hud.showPrompt("Press [E] to talk to Quest Giver");
        }
      }
    } else {
      this.isPlayerNear = false;
    }
  }

  interact() {
    if (!this.isPlayerNear) return;

    if (!this.hasActiveQuest) {
      this.hasActiveQuest = true;
      if (this.hud && typeof this.hud.showPrompt === 'function') {
        this.hud.showPrompt("Quest Accepted: Defeat the Boss!");
      }
    } else if (this.isQuestCompleted) {
      if (this.hud && typeof this.hud.showPrompt === 'function') {
        this.hud.showPrompt("Quest Complete! Reward Received!");
      }
    } else {
      if (this.hud && typeof this.hud.showPrompt === 'function') {
        this.hud.showPrompt("Objective: Slay the Boss in the arena.");
      }
    }
  }
}