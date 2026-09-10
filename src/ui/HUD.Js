import * as THREE from 'three';

export class HUD {
    constructor() {
        this.createUI();
    }

    createUI() {
        const hudContainer = document.createElement('div');
        hudContainer.id = 'game-hud';
        hudContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: white;
            box-sizing: border-box;
            overflow: hidden;
        `;

        // Vitals Bar Container (Top Left)
        const vitals = document.createElement('div');
        vitals.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            width: 280px;
            background: rgba(15, 23, 42, 0.85);
            padding: 15px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(4px);
        `;

        vitals.innerHTML = `
            <div id="hud-level" style="font-weight: bold; margin-bottom: 8px; color: #38bdf8; font-size: 15px;">Level 1 Adventurer</div>
            <div style="font-size: 12px; margin-bottom: 2px;">HP</div>
            <div style="background: #334155; height: 12px; border-radius: 6px; overflow: hidden; margin-bottom: 8px;">
                <div id="hp-bar" style="background: #ef4444; width: 100%; height: 100%; transition: width 0.1s;"></div>
            </div>
            <div style="font-size: 12px; margin-bottom: 2px;">MP</div>
            <div style="background: #334155; height: 12px; border-radius: 6px; overflow: hidden; margin-bottom: 8px;">
                <div id="mp-bar" style="background: #3b82f6; width: 100%; height: 100%; transition: width 0.1s;"></div>
            </div>
            <div style="font-size: 12px; margin-bottom: 2px;">EXP</div>
            <div style="background: #334155; height: 10px; border-radius: 5px; overflow: hidden;">
                <div id="exp-bar" style="background: #eab308; width: 0%; height: 100%; transition: width 0.2s;"></div>
            </div>
        `;
        hudContainer.appendChild(vitals);

        // Quest Tracker Box (Top Right)
        const questTracker = document.createElement('div');
        questTracker.id = 'quest-tracker-hud';
        questTracker.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(15, 23, 42, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 12px;
            color: #f8fafc;
            font-family: sans-serif;
            font-size: 13px;
            width: 220px;
            backdrop-filter: blur(4px);
            display: none;
            pointer-events: auto;
        `;
        hudContainer.appendChild(questTracker);

        // Skill Hotbar (Bottom Center)
        const skillBar = document.createElement('div');
        skillBar.id = 'skill-hotbar';
        skillBar.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
            pointer-events: auto;
        `;
        skillBar.innerHTML = `
            <div style="background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; width: 50px; height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #f8fafc; font-size: 18px; position: relative; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5);">
                <span style="position: absolute; top: 3px; left: 6px; font-size: 10px; font-weight: bold; color: #38bdf8;">1</span>
                🔥
            </div>
            <div style="background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; width: 50px; height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #f8fafc; font-size: 18px; position: relative; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5);">
                <span style="position: absolute; top: 3px; left: 6px; font-size: 10px; font-weight: bold; color: #38bdf8;">2</span>
                💚
            </div>
        `;
        hudContainer.appendChild(skillBar);

        // Interaction Prompt Box (Bottom Center, above hotbar)
        const interactionPrompt = document.createElement('div');
        interactionPrompt.id = 'interaction-prompt';
        interactionPrompt.style.cssText = `
            position: absolute;
            bottom: 90px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(15, 23, 42, 0.9);
            border: 1px solid #38bdf8;
            padding: 8px 16px;
            border-radius: 6px;
            color: #38bdf8;
            font-weight: bold;
            font-size: 14px;
            display: none;
            pointer-events: none;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
        `;
        interactionPrompt.innerText = 'Press [E] to Talk';
        hudContainer.appendChild(interactionPrompt);

        // Controls Hint (Bottom Left)
        const hints = document.createElement('div');
        hints.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(15, 23, 42, 0.85);
            padding: 10px 15px;
            border-radius: 6px;
            font-size: 13px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;
        hints.innerHTML = `
            <b>[WASD]</b> Move | <b>[Shift]</b> Sprint<br>
            <b>[F]</b> Slash Attack | <b>[1]</b> Fireball | <b>[2]</b> Heal<br>
            <b>[K]</b> Skill Tree | <b>[I]</b> Inventory | <b>[E]</b> Interact
        `;
        hudContainer.appendChild(hints);

        // Death Screen Overlay
        const deathScreen = document.createElement('div');
        deathScreen.id = 'death-screen';
        deathScreen.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(239, 68, 68, 0.25);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.5s ease;
        `;
        deathScreen.innerHTML = `
            <h1 style="font-size: 48px; color: #ef4444; margin: 0 0 10px 0; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">YOU DIED</h1>
            <p style="font-size: 18px; margin: 0; color: #f8fafc;">Respawning at checkpoint...</p>
        `;
        hudContainer.appendChild(deathScreen);

        // Skill Tree Modal
        const skillTreeModal = document.createElement('div');
        skillTreeModal.id = 'skill-tree-modal';
        skillTreeModal.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 420px;
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.15);
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
            display: none;
            pointer-events: auto;
        `;
        skillTreeModal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 20px; color: #38bdf8;">Skill Tree</h2>
                <span id="skill-points-display" style="background: #334155; padding: 4px 10px; border-radius: 12px; font-size: 13px; color: #eab308; font-weight: bold;">SP: 0</span>
            </div>
            <div id="skill-list" style="display: flex; flex-direction: column; gap: 12px;"></div>
        `;
        hudContainer.appendChild(skillTreeModal);

        // Floating Text Layer
        const floatLayer = document.createElement('div');
        floatLayer.id = 'floating-text-layer';
        floatLayer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        `;
        hudContainer.appendChild(floatLayer);

        document.body.appendChild(hudContainer);
    }

    updateVitals(hp, maxHp, mp, maxMp, exp, maxExp, level, attackPower) {
        const hpBar = document.getElementById('hp-bar');
        const mpBar = document.getElementById('mp-bar');
        const expBar = document.getElementById('exp-bar');
        const levelLabel = document.getElementById('hud-level');

        if (hpBar) hpBar.style.width = `${Math.max(0, Math.min(100, (hp / maxHp) * 100))}%`;
        if (mpBar) mpBar.style.width = `${Math.max(0, Math.min(100, (mp / maxMp) * 100))}%`;
        if (expBar) expBar.style.width = `${Math.max(0, Math.min(100, (exp / maxExp) * 100))}%`;
        if (levelLabel) levelLabel.innerText = `Level ${level} Adventurer (ATK: ${attackPower})`;
    }

    updateQuestTracker(questSystem) {
        const questTracker = document.getElementById('quest-tracker-hud');
        if (!questTracker) return;

        if (!questSystem || questSystem.questState === 'NONE' || !questSystem.currentQuest) {
            questTracker.style.display = 'none';
            return;
        }

        questTracker.style.display = 'block';
        const q = questSystem.currentQuest;
        let statusText = '';

        if (questSystem.questState === 'ACTIVE') {
            statusText = `Progress: ${q.currentKills} / ${q.targetKills}`;
        } else if (questSystem.questState === 'READY_TO_COMPLETE') {
            statusText = 'Ready to Turn In!';
        } else if (questSystem.questState === 'COMPLETED') {
            statusText = 'Completed!';
        }

        questTracker.innerHTML = `
            <div style="font-weight: bold; color: #38bdf8; margin-bottom: 4px;">Quest: ${q.title}</div>
            <div style="color: #cbd5e1; font-size: 11px; margin-bottom: 6px;">${q.description}</div>
            <div style="color: #eab308; font-weight: bold; font-size: 12px;">${statusText}</div>
        `;
    }

    showInteractionPrompt(show, text = 'Press [E] to Talk') {
        const prompt = document.getElementById('interaction-prompt');
        if (prompt) {
            prompt.innerText = text;
            prompt.style.display = show ? 'block' : 'none';
        }
    }

    showFloatingText(text, screenX, screenY, color = '#ffffff') {
        const layer = document.getElementById('floating-text-layer');
        if (!layer) return;

        const el = document.createElement('div');
        el.innerText = text;
        el.style.cssText = `
            position: absolute;
            left: ${screenX}px;
            top: ${screenY}px;
            color: ${color};
            font-weight: bold;
            font-size: 16px;
            text-shadow: 0 1px 3px rgba(0,0,0,0.8);
            transform: translate(-50%, -50%);
            animation: floatUp 0.8s ease-out forwards;
        `;

        if (!document.getElementById('float-anim-style')) {
            const style = document.createElement('style');
            style.id = 'float-anim-style';
            style.innerHTML = `
                @keyframes floatUp {
                    0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -100px) scale(1.1); }
                }
            `;
            document.head.appendChild(style);
        }

        layer.appendChild(el);
        setTimeout(() => el.remove(), 800);
    }

    showDeathScreen(show) {
        const deathScreen = document.getElementById('death-screen');
        if (deathScreen) {
            deathScreen.style.opacity = show ? '1' : '0';
        }
    }

    toggleInventory() {
        if (this.inventory && typeof this.inventory.toggle === 'function') {
            this.inventory.toggle();
        }
    }

    toggleSkillTree() {
        const modal = document.getElementById('skill-tree-modal');
        if (modal) {
            const isVisible = modal.style.display === 'block';
            modal.style.display = isVisible ? 'none' : 'block';
        }
    }

    updateSkillTreeUI(skillTree, onUpgradeCallback) {
        const pointsDisplay = document.getElementById('skill-points-display');
        const listContainer = document.getElementById('skill-list');
        if (!pointsDisplay || !listContainer) return;

        pointsDisplay.innerText = `SP: ${skillTree.points}`;
        listContainer.innerHTML = '';

        for (const [key, skill] of Object.entries(skillTree.skills)) {
            const row = document.createElement('div');
            row.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #1e293b;
                padding: 10px 14px;
                border-radius: 6px;
                border: 1px solid rgba(255,255,255,0.05);
            `;
            row.innerHTML = `
                <div>
                    <div style="font-weight: bold; font-size: 14px; color: #f8fafc;">${skill.name} (Lvl ${skill.level}/${skill.maxLevel})</div>
                    <div style="font-size: 11px; color: #94a3b8;">${skill.description}</div>
                </div>
            `;

            const btn = document.createElement('button');
            btn.innerText = 'Upgrade';
            btn.style.cssText = `
                background: ${skillTree.points > 0 && skill.level < skill.maxLevel ? '#38bdf8' : '#475569'};
                color: #0f172a;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                font-weight: bold;
                cursor: ${skillTree.points > 0 && skill.level < skill.maxLevel ? 'pointer' : 'not-allowed'};
            `;
            
            btn.onclick = () => {
                if (onUpgradeCallback) onUpgradeCallback(key);
            };

            row.appendChild(btn);
            listContainer.appendChild(row);
        }
    }
}