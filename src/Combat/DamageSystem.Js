import * as THREE from 'three';

export class DamageSystem {
  constructor(scene) {
    this.scene = scene;
    this.floatingTexts = [];
  }

  spawnDamageNumber(position, amount, isCritical = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.font = `Bold ${isCritical ? '36px' : '28px'} Arial`;
    ctx.fillStyle = isCritical ? '#ff1744' : '#ffc107';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText(amount.toString(), 64, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);

    sprite.position.copy(position).add(new THREE.Vector3((Math.random() - 0.5) * 0.5, 1.5, (Math.random() - 0.5) * 0.5));
    sprite.scale.set(1.5, 0.75, 1);

    this.scene.add(sprite);

    this.floatingTexts.push({
      sprite,
      life: 1.0,
      velocity: new THREE.Vector3(0, 1.5, 0)
    });
  }

  update(dt) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const text = this.floatingTexts[i];
      text.life -= dt;
      text.sprite.position.addScaledVector(text.velocity, dt);
      text.sprite.material.opacity = Math.max(0, text.life);

      if (text.life <= 0) {
        this.scene.remove(text.sprite);
        text.sprite.material.map.dispose();
        text.sprite.material.dispose();
        this.floatingTexts.splice(i, 1);
      }
    }
  }
}