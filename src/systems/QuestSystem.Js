export class QuestSystem {
    constructor(gameRef) {
        this.gameRef = gameRef;
        this.questState = 'NONE'; // 'NONE', 'ACTIVE', 'READY_TO_COMPLETE', 'COMPLETED'
        this.currentQuest = {
            title: 'Goblin Slayer',
            description: 'Defeat 5 enemies in the open world.',
            targetKills: 5,
            currentKills: 0
        };
    }

    acceptQuest() {
        if (this.questState === 'NONE') {
            this.questState = 'ACTIVE';
            this.currentQuest.currentKills = 0;
        }
    }

    addKill() {
        if (this.questState === 'ACTIVE') {
            this.currentQuest.currentKills += 1;
            if (this.currentQuest.currentKills >= this.currentQuest.targetKills) {
                this.questState = 'READY_TO_COMPLETE';
            }
        }
    }

    completeQuest() {
        if (this.questState === 'READY_TO_COMPLETE') {
            this.questState = 'COMPLETED';
            if (this.gameRef && this.gameRef.player && typeof this.gameRef.player.addExp === 'function') {
                this.gameRef.player.addExp(100);
            }
            // Give skill points or rewards if needed
            if (this.gameRef && this.gameRef.skillTree) {
                this.gameRef.skillTree.addPoints(1);
            }
        }
    }

    update() {
        // Left blank or used for time-based quest tracking if needed
    }
}