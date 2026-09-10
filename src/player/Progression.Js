export class Progression {
  constructor(player, hud, audio) {
    this.player = player;
    this.hud = hud;
    this.audio = audio;

    this.level = 1;
    this.currentXp = 0;
    this.maxXp = 100;

    this.updateUI();
  }

  addXp(amount) {
    this.currentXp += amount;

    while (this.currentXp >= this.maxXp) {
      this.currentXp -= this.maxXp;
      this.levelUp();
    }

    this.updateUI();
  }

  levelUp() {
    this.level += 1;
    this.maxXp = Math.floor(this.maxXp * 1.5);

    // Stat bonuses on Level Up
    this.player.maxHp += 25;
    this.player.hp = this.player.maxHp;
    this.player.maxMp += 15;
    this.player.mp = this.player.maxMp;

    if (this.audio) this.audio.playLevelUp();
    if (this.hud) {
      this.hud.showPrompt(`★ LEVEL UP! Reached Level ${this.level} ★`);
    }
  }

  updateUI() {
    if (this.hud && typeof this.hud.updateXp === 'function') {
      this.hud.updateXp(this.currentXp, this.maxXp, this.level);
    }
  }
}