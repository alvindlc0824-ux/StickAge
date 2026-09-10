export class SkillTree {
    constructor() {
        this.points = 0; // Renamed from skillPoints to match HUD.js
        this.skills = {
            fireballBoost: { name: 'Pyromancy Mastery', level: 0, maxLevel: 5, description: 'Increases Fireball damage by +15 per level.', cost: 1 },
            maxHpBoost: { name: 'Vitality', level: 0, maxLevel: 5, description: 'Increases Max HP by +20 per level.', cost: 1 },
            manaRegen: { name: 'Meditation', level: 0, maxLevel: 3, description: 'Reduces skill cooldowns / Mana costs.', cost: 2 }
        };
    }

    addPoints(amount) {
        this.points += amount;
    }

    upgradeSkill(skillKey) {
        const skill = this.skills[skillKey];
        if (!skill) return false;

        if (skill.level < skill.maxLevel && this.points >= skill.cost) {
            this.points -= skill.cost;
            skill.level += 1;
            return true;
        }
        return false;
    }

    getFireballBonusDamage() {
        return (this.skills.fireballBoost?.level || 0) * 15;
    }

    getMaxHpBonus() {
        return (this.skills.maxHpBoost?.level || 0) * 20;
    }
}