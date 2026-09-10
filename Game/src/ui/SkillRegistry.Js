import { MageSkills } from './MageSkills.js';
// Import additional job skill files here as you build them (e.g., WarriorSkills.js)

export class SkillRegistry {
    constructor() {
        this.skills = new Map();
        this.loadAllSkills();
    }

    loadAllSkills() {
        // Register Mage skills
        for (const [id, skillData] of Object.entries(MageSkills)) {
            this.skills.set(id, { ...skillData, job: 'Mage' });
        }

        // Future jobs can be registered seamlessly like this:
        // for (const [id, skillData] of Object.entries(WarriorSkills)) {
        //     this.skills.set(id, { ...skillData, job: 'Warrior' });
        // }
    }

    getSkill(skillId) {
        return this.skills.get(skillId) || null;
    }

    getSkillsByJob(jobName) {
        const jobSkills = {};
        for (const [id, skill] of this.skills.entries()) {
            if (skill.job === jobName) {
                jobSkills[id] = skill;
            }
        }
        return jobSkills;
    }
}