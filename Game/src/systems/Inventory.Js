export class Inventory {
    constructor(player) {
        this.player = player;
        this.capacity = 12;
        this.items = new Array(this.capacity).fill(null);
        this.isOpen = false;
        this.selectedEquippedWeapon = null;

        this.initUI();
    }

    initUI() {
        this.container = document.createElement('div');
        this.container.id = 'inventory-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 380px;
            background: rgba(15, 23, 42, 0.95);
            border: 2px solid #334155;
            border-radius: 12px;
            padding: 20px;
            color: #f8fafc;
            font-family: sans-serif;
            z-index: 1000;
            display: none;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        `;

        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;';
        
        const title = document.createElement('h3');
        title.innerText = 'Inventory (Press I)';
        title.style.cssText = 'margin: 0; font-size: 18px; color: #38bdf8;';
        header.appendChild(title);

        const slotCount = document.createElement('span');
        slotCount.id = 'inventory-count';
        slotCount.innerText = 'Bag Slots: 0/12';
        slotCount.style.cssText = 'font-size: 12px; color: #94a3b8;';
        header.appendChild(slotCount);

        this.container.appendChild(header);

        this.gridElement = document.createElement('div');
        this.gridElement.style.cssText = `
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
        `;

        for (let i = 0; i < this.capacity; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.index = i;
            slot.style.cssText = `
                height: 70px;
                background: #1e293b;
                border: 2px solid #475569;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 11px;
                text-align: center;
                padding: 4px;
                box-sizing: border-box;
                overflow: hidden;
            `;

            slot.addEventListener('click', () => this.useItem(i));
            this.gridElement.appendChild(slot);
        }

        this.container.appendChild(this.gridElement);
        document.body.appendChild(this.container);
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.container.style.display = this.isOpen ? 'block' : 'none';
        if (this.isOpen) {
            this.render();
        }
    }

    addItem(item) {
        // Ensure array length matches capacity
        if (!this.items || this.items.length !== this.capacity) {
            this.items = new Array(this.capacity).fill(null);
        }

        const emptyIndex = this.items.findIndex(slot => slot === null);
        if (emptyIndex !== -1) {
            this.items[emptyIndex] = item;
            this.render();
            return true;
        }
        return false;
    }

    useItem(index) {
        const item = this.items[index];
        if (!item) return;

        // Fallback safety to ensure weapon properties exist so stats never evaluate to NaN
        if (item.type === 'weapon') {
            if (item.atkBonus === undefined && item.atk === undefined && item.damage === undefined) {
                item.atkBonus = item.value || item.power || 10;
            }
        }

        if (item.type === 'potion') {
            if (this.player && typeof this.player.hp === 'number') {
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + (item.value || 40));
                this.items[index] = null;
            }
        } else if (item.type === 'weapon') {
            const weaponAtkValue = item.atkBonus || item.atk || item.damage || 10;

            if (this.selectedEquippedWeapon) {
                const oldWeaponAtk = this.selectedEquippedWeapon.atkBonus || this.selectedEquippedWeapon.atk || this.selectedEquippedWeapon.damage || 10;
                this.items[index] = this.selectedEquippedWeapon;
                if (this.player.atk !== undefined) {
                    this.player.atk -= oldWeaponAtk;
                }
            } else {
                this.items[index] = null;
            }
            
            this.selectedEquippedWeapon = item;
            this.player.equippedWeapon = item; // Keep player reference in sync with Game.js

            if (this.player.atk !== undefined) {
                this.player.atk += weaponAtkValue;
            }
        }

        this.render();
    }

    render() {
        if (!this.gridElement) return;
        const slots = this.gridElement.children;
        let filledCount = 0;

        for (let i = 0; i < this.capacity; i++) {
            const slotEl = slots[i];
            if (!slotEl) continue;
            
            const item = this.items[i];
            slotEl.innerHTML = '';

            if (item) {
                filledCount++;
                slotEl.style.borderColor = item.type === 'weapon' ? '#3b82f6' : '#22c55e';
                
                const nameSpan = document.createElement('span');
                nameSpan.innerText = item.name || item.type || 'Item';
                nameSpan.style.cssText = 'font-weight: bold; color: #fff; font-size: 10px; line-height: 1.2; word-break: break-word;';
                slotEl.appendChild(nameSpan);

                const statVal = item.atkBonus || item.atk || item.damage || item.value || 5;
                const statSpan = document.createElement('span');
                statSpan.innerText = item.type === 'weapon' ? `+${statVal} ATK` : `+${statVal} HP`;
                statSpan.style.cssText = 'color: #94a3b8; font-size: 9px; margin-top: 4px;';
                slotEl.appendChild(statSpan);
            } else {
                slotEl.style.borderColor = '#475569';
            }
        }

        const countEl = document.getElementById('inventory-count');
        if (countEl) {
            countEl.innerText = `Bag Slots: ${filledCount}/${this.capacity}`;
        }
    }
}