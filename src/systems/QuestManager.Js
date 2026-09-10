export class QuestManager {
  constructor(hud, progression) {
    this.hud = hud;
    this.progression = progression;

    this.activeQuest = null;
    this.questState = 'NOT_STARTED'; // 'NOT_STARTED', 'IN_PROGRESS', 'READY_TO_CLAIM', 'COMPLETED'
  }

  startQuest() {
    this.activeQuest = {
      title: "Defeat the Forest Guardian",
      description: "Slay 3 Minions and defeat the Forest Guardian to restore peace.",
      targetMinions: 3,
      currentMinions: 0,
      bossKilled: false,
      rewardXp: 500,
      rewardGold: 100
    };

    this.questState = 'IN_PROGRESS';
    this.updateHUD();
  }

  onEnemyKilled(isBoss = false) {
    if (this.questState !== 'IN_PROGRESS' || !this.activeQuest) return;

    if (isBoss) {
      this.activeQuest.bossKilled = true;
    } else if (this.activeQuest.currentMinions < this.activeQuest.targetMinions) {
      this.activeQuest.currentMinions += 1;
    }

    if (this.activeQuest.currentMinions >= this.activeQuest.targetMinions && this.activeQuest.bossKilled) {
      this.questState = 'READY_TO_CLAIM';
    }

    this.updateHUD();
  }

  claimReward() {
    if (this.questState !== 'READY_TO_CLAIM') return;

    this.questState = 'COMPLETED';
    if (this.progression) {
      this.progression.addXp(this.activeQuest.rewardXp);
    }
    if (this.hud) {
      this.hud.addItem({ type: 'gold', amount: this.activeQuest.rewardGold });
      this.hud.showPrompt(`★ Quest Completed! +${this.activeQuest.rewardXp} XP, +${this.activeQuest.rewardGold} Gold ★`);
    }

    this.updateHUD();
  }

  updateHUD() {
    if (this.hud && typeof this.hud.updateQuestTracker === 'function') {
      this.hud.updateQuestTracker(this.activeQuest, this.questState);
    }
  }
}