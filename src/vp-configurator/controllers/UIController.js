export class UIController {
    constructor(stateManager, garmentConfig) {
        this.stateManager = stateManager;
        this.garmentConfig = garmentConfig;
        this.init();
    }

    init() {
        // Gender Toggle
        document.querySelectorAll('[name="gender"]').forEach(input => {
            input.onchange = (e) => this.stateManager.update('gender', e.target.value);
        });

        // Mannequin Visibility
        const mannequinToggle = document.getElementById('toggle-mannequin');
        if (mannequinToggle) {
            mannequinToggle.onchange = (e) => this.stateManager.update('mannequinVisible', e.target.checked);
        }

        // Garment Selection
        ['top', 'bottom', 'jacket', 'comboset'].forEach(cat => {
            const container = document.getElementById(`${cat}-list`);
            if (container && this.garmentConfig[cat]) {
                this.garmentConfig[cat].forEach(item => {
                    const btn = document.createElement('button');
                    btn.className = "w-16 h-16 rounded-lg border-2 border-white/10 overflow-hidden hover:border-indigo-500 transition-all flex-shrink-0 bg-white/5";
                    btn.innerHTML = `<img src="${item.thumb}" class="w-full h-full object-cover" alt="${item.name}">`;
                    btn.onclick = () => this.stateManager.update(`garments.${cat}`, item.id);
                    container.appendChild(btn);
                });
            }
        });

        // Color Pickers
        ['top', 'bottom', 'jacket', 'mannequin'].forEach(cat => {
            const picker = document.getElementById(`color-${cat}`);
            if (picker) {
                picker.oninput = (e) => this.stateManager.update(`colors.${cat}`, e.target.value);
            }
        });

        // Environment
        const hdrSelect = document.getElementById('hdr-select');
        if (hdrSelect) {
            hdrSelect.onchange = (e) => this.stateManager.update('environment.hdr', e.target.value);
        }

        const intensitySlider = document.getElementById('hdr-intensity');
        if (intensitySlider) {
            intensitySlider.oninput = (e) => this.stateManager.update('environment.intensity', parseFloat(e.target.value));
        }

        const bgColorPicker = document.getElementById('bg-color');
        if (bgColorPicker) {
            bgColorPicker.oninput = (e) => this.stateManager.update('environment.bgColor', e.target.value);
        }

        // Performance
        const perfToggle = document.getElementById('toggle-performance');
        if (perfToggle) {
            perfToggle.onchange = (e) => this.stateManager.update('performance', e.target.checked);
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.classList.add('hidden'), 500);
        }
    }
}
