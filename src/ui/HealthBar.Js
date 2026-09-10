import * as THREE from 'three';

export class HealthBar {
  constructor(scene) {
    this.scene = scene;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 128;
    this.canvas.height = 16;
    this.ctx = this.canvas.getContext('2d');

    this.texture = new THREE.CanvasTexture(this.canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: this.texture, transparent: true });
    this.sprite = new THREE.Sprite(spriteMaterial);
    this.sprite.scale.set(1.6, 0.2, 1);
    
    this.scene.add(this.sprite);
  }

  update(position, currentHp, maxHp) {
    if (currentHp <= 0) {
      this.sprite.visible = false;
      return;
    }

    this.sprite.visible = true;
    this.sprite.position.copy(position).add(new THREE.Vector3(0, 2.2, 0));

    const pct = Math.max(0, currentHp / maxHp);
    this.ctx.clearRect(0, 0, 128, 16);

    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, 128, 16);

    // Health Fill
    this.ctx.fillStyle = pct > 0.5 ? '#2e7d32' : pct > 0.2 ? '#f57f17' : '#c62828';
    this.ctx.fillRect(2, 2, Math.floor(124 * pct), 12);

    // Border
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(1, 1, 126, 14);

    this.texture.needsUpdate = true;
  }

  destroy() {
    this.scene.remove(this.sprite);
    this.texture.dispose();
    this.sprite.material.dispose();
  }
}