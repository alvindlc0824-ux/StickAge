export class Equipment {
  constructor(player, hud) {
    this.player = player;
    this.hud = hud;

    this.slots = {
      weapon: null,
      armor: null,
      ring: null
    };

    this.stats = {
      attackBonus: 0,
      defenseBonus: 0,
      hpBonus: 0
    };
  }

  equip(item) {
    if (!item || !item.slot) return false;

    // Un-equip existing item if slot is occupied
    const slotKey = item.slot;
    if (this.slots[slotKey]) {
      this.unequip(slotKey);
    }

    this.slots[slotKey] = item;
    this.recalculateStats();
    return true;
  }

  unequip(slotKey) {
    const unequippedItem = this.slots[slotKey];
    if (unequippedItem) {
      this.slots[slotKey] = null;
      this.recalculateStats();
      return unequippedItem;
    }
    return null;
  }

  recalculateStats() {
    this.stats.attackBonus = 0;
    this.stats.defenseBonus = 0;
    this.stats.hpBonus = 0;

    Object.values(this.slots).forEach(item => {
      if (item) {
        this.stats.attackBonus += item.atk || 0;
        this.stats.defenseBonus += item.def || 0;
        this.stats.hpBonus += item.hp || 0;
      }
    });

    // Apply HP bonus to player max HP
    const baseHp = 100;
    this.player.maxHp = baseHp + this.stats.hpBonus;
    this.player.hp = Math.min(this.player.hp, this.player.maxHp);

    if (this.hud && typeof this.hud.updateEquipmentUI === 'function') {
      this.hud.updateEquipmentUI(this.slots, this.stats);
    }
  }
}