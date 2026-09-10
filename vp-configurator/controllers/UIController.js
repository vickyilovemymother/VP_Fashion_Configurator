import { URLUtils } from '../utils/URLUtils.js';

export class UIController {
    constructor(stateManager, garmentConfig, exportController) {
        this.stateManager = stateManager;
        this.config = garmentConfig;
        this.exportCtrl = exportController;
        
        this.initElements();
        this.setupEvents();
        this.renderGarmentLists();
        this.renderColorList();
    }

    initElements() {
        try {
            console.log("Initializing UI elements...");
            this.btnMale = document.getElementById('btn-male');
            this.btnFemale = document.getElementById('btn-female');
            this.btnModeMix = document.getElementById('btn-mode-mix');
            this.btnModeDress = document.getElementById('btn-mode-dress');
            this.carousels = {
                top: document.getElementById('top-carousel'),
                bottom: document.getElementById('bottom-carousel'),
                jacket: document.getElementById('jacket-carousel'),
                dress: document.getElementById('dress-carousel'),
                comboset: document.getElementById('comboset-carousel')
            };
            this.colorSection = document.getElementById('color-section');
            this.loadingOverlay = document.getElementById('loading-overlay');
            
            this.toggleUIBtn = document.getElementById('toggle-ui');
            this.uiPanel = document.getElementById('ui-panel');
            
            this.btnExportDirect = document.getElementById('btn-export-direct');
            this.btnExportCustom = document.getElementById('btn-export-custom');
            this.exportModal = document.getElementById('export-modal');
            this.btnExportCancel = document.getElementById('btn-export-cancel');
            this.btnExportConfirm = document.getElementById('btn-export-confirm');
            
            this.exportWidth = document.getElementById('export-width');
            this.exportHeight = document.getElementById('export-height');
            this.exportTransparent = document.getElementById('export-transparent');
            this.frameOverlay = document.getElementById('frame-overlay');

            // New Elements
            this.hdrSelect = document.getElementById('hdr-select');
            this.hdrIntensity = document.getElementById('hdr-intensity');
            this.hdrToggle = document.getElementById('hdr-toggle');
            this.btnMannequinToggle = document.getElementById('btn-mannequin-toggle');
            this.bgColorPicker = document.getElementById('bg-color-picker');
            this.btnSpin = document.getElementById('btn-spin');
            this.btnShare = document.getElementById('btn-share');
            this.btnSavePreset = document.getElementById('btn-save-preset');
            this.btnEcommerce = document.getElementById('btn-ecommerce');
            this.btnExportTurntable = document.getElementById('btn-export-turntable');
            this.fadeToggle = document.getElementById('fade-toggle');
            
            // New Elements
            this.shadowToggle = document.getElementById('shadow-toggle');
            this.shadowIntensity = document.getElementById('shadow-intensity');
            this.hdrRotation = document.getElementById('hdr-rotation');
            this.gridToggle = document.getElementById('grid-toggle');
            this.btnAR = document.getElementById('btn-ar');
            this.btnVR = document.getElementById('btn-vr');
            this.btnResetCamera = document.getElementById('btn-reset-camera');
            this.btnRandomize = document.getElementById('btn-randomize');
            this.btnOpenPreset = document.getElementById('btn-open-preset');
            this.bg360Input = document.getElementById('bg360-input');
            console.log("UI elements initialized.");
        } catch (error) {
            console.error("Error in UIController.initElements:", error);
            throw error;
        }
    }

    setupEvents() {
        if (this.btnMale) this.btnMale.onclick = () => this.handleGenderChange('male');
        if (this.btnFemale) this.btnFemale.onclick = () => this.handleGenderChange('female');
        if (this.btnModeMix) this.btnModeMix.onclick = () => this.handleModeChange('mix');
        if (this.btnModeDress) this.btnModeDress.onclick = () => this.handleModeChange('dress');

        this.stateManager.subscribe(state => {
            if (state.gender && this.currentRenderedGender !== state.gender) {
                this.currentRenderedGender = state.gender;
                if (this.btnMale) this.btnMale.classList.toggle('active', state.gender === 'male');
                if (this.btnFemale) this.btnFemale.classList.toggle('active', state.gender === 'female');
                this.renderGarmentLists();
            }
        });
        
        if (this.fadeToggle) {
            this.fadeToggle.onchange = (e) => {
                this.stateManager.update('fadeEnabled', e.target.checked);
            };
        }

        if (this.shadowToggle) {
            this.shadowToggle.onchange = (e) => {
                this.stateManager.update('shadowsEnabled', e.target.checked);
            };
        }

        if (this.shadowIntensity) {
            this.shadowIntensity.oninput = (e) => {
                this.stateManager.update('shadowIntensity', parseFloat(e.target.value));
            };
        }

        if (this.hdrRotation) {
            this.hdrRotation.oninput = (e) => {
                this.stateManager.update('environment.rotation', parseFloat(e.target.value));
            };
        }

        if (this.gridToggle) {
            this.gridToggle.onchange = (e) => {
                this.stateManager.update('gridVisible', e.target.checked);
            };
        }

        if (this.btnAR) {
            this.btnAR.onclick = () => {
                window.dispatchEvent(new CustomEvent('start-ar'));
            };
        }

        if (this.btnVR) {
            this.btnVR.onclick = () => {
                window.dispatchEvent(new CustomEvent('start-vr'));
            };
        }

        if (this.btnResetCamera) {
            this.btnResetCamera.onclick = () => {
                window.dispatchEvent(new CustomEvent('reset-camera'));
            };
        }

        if (this.btnRandomize) {
            this.btnRandomize.onclick = () => {
                this.handleRandomize();
            };
        }

        if (this.btnOpenPreset) {
            this.btnOpenPreset.onclick = () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            try {
                                const preset = JSON.parse(event.target.result);
                                Object.keys(preset).forEach(key => {
                                    if (typeof preset[key] === 'object' && preset[key] !== null) {
                                        Object.keys(preset[key]).forEach(subKey => {
                                            this.stateManager.update(`${key}.${subKey}`, preset[key][subKey]);
                                        });
                                    } else {
                                        this.stateManager.update(key, preset[key]);
                                    }
                                });
                                alert("Preset Loaded!");
                            } catch {
                                alert("Invalid Preset File");
                            }
                        };
                        reader.readAsText(file);
                    }
                };
                input.click();
            };
        }

        if (this.bg360Input) {
            this.bg360Input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const url = URL.createObjectURL(file);
                    this.stateManager.update('environment.bg360Url', url);
                }
            };
        }
        
        if (this.toggleUIBtn) {
            this.toggleUIBtn.onclick = () => {
                const isHidden = this.uiPanel.classList.toggle('hidden-panel');
                this.toggleUIBtn.innerHTML = `
                    <i data-lucide="settings" class="w-4 h-4"></i>
                    <span>${isHidden ? 'Show Properties' : 'Hide Properties'}</span>
                `;
                if (window.createIcons) {
                    window.createIcons({ icons: window.LucideIcons });
                }
            };
        }

        if (this.btnExportDirect) {
            this.btnExportDirect.onclick = () => {
                window.dispatchEvent(new CustomEvent('export-png', { 
                    detail: { width: 1920, height: 1080, transparent: true } 
                }));
            };
        }

        if (this.btnExportCustom) {
            this.btnExportCustom.onclick = () => {
                this.exportModal.style.display = 'flex';
                this.updateFrameOverlay();
            };
        }

        if (this.btnExportCancel) {
            this.btnExportCancel.onclick = () => {
                this.exportModal.style.display = 'none';
                this.frameOverlay.style.display = 'none';
            };
        }

        if (this.btnExportConfirm) {
            this.btnExportConfirm.onclick = () => {
                window.dispatchEvent(new CustomEvent('export-png', { 
                    detail: { 
                        width: parseInt(this.exportWidth.value), 
                        height: parseInt(this.exportHeight.value), 
                        transparent: this.exportTransparent.checked 
                    } 
                }));
                this.exportModal.style.display = 'none';
                this.frameOverlay.style.display = 'none';
            };
        }

        if (this.exportWidth && this.exportHeight) {
            [this.exportWidth, this.exportHeight].forEach(el => {
                el.oninput = () => this.updateFrameOverlay();
            });
        }

        // Restored & New Events
        if (this.hdrSelect) {
            this.hdrSelect.onchange = (e) => {
                this.stateManager.update('environment.hdr', e.target.value);
            };
        }
        if (this.hdrIntensity) {
            this.hdrIntensity.oninput = (e) => {
                this.stateManager.update('environment.intensity', parseInt(e.target.value));
            };
        }
        if (this.hdrToggle) {
            this.hdrToggle.onchange = (e) => {
                this.stateManager.update('environment.visible', e.target.checked);
            };
        }
        if (this.btnMannequinToggle) {
            this.btnMannequinToggle.onclick = () => {
                const visible = !this.stateManager.getState().mannequinVisible;
                this.stateManager.update('mannequinVisible', visible);
                this.btnMannequinToggle.innerHTML = `
                    <i data-lucide="${visible ? 'eye' : 'eye-off'}" class="w-3 h-3"></i>
                    <span>${visible ? 'ON' : 'OFF'}</span>
                `;
                if (window.createIcons) {
                    window.createIcons({ icons: window.LucideIcons });
                }
            };
        }
        if (this.bgColorPicker) {
            this.bgColorPicker.oninput = (e) => {
                this.stateManager.update('colors.background', e.target.value);
            };
        }
        if (this.btnSpin) {
            this.btnSpin.onclick = () => {
                window.dispatchEvent(new CustomEvent('toggle-spin'));
            };
        }
        if (this.btnShare) {
            this.btnShare.onclick = () => {
                const state = this.stateManager.getState();
                const url = URLUtils.encodeState(state);
                navigator.clipboard.writeText(url).then(() => {
                    alert('Share link copied to clipboard!');
                });
            };
        }
        if (this.btnSavePreset) {
            this.btnSavePreset.onclick = () => {
                const state = this.stateManager.getState();
                const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `vp-preset-${Date.now()}.json`;
                a.click();
            };
        }
        if (this.btnEcommerce) {
            this.btnEcommerce.onclick = () => {
                window.dispatchEvent(new CustomEvent('export-ecomm'));
            };
        }
        if (this.btnExportTurntable) {
            this.btnExportTurntable.onclick = () => {
                alert('Turntable MP4 export initiated. Capturing frames...');
                window.dispatchEvent(new CustomEvent('export-turntable'));
            };
        }
    }

    updateFrameOverlay() {
        const w = parseInt(this.exportWidth.value);
        const h = parseInt(this.exportHeight.value);
        const aspect = w / h;
        
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const screenAspect = screenW / screenH;
        
        let frameW, frameH;
        if (aspect > screenAspect) {
            frameW = screenW * 0.8;
            frameH = frameW / aspect;
        } else {
            frameH = screenH * 0.8;
            frameW = frameH * aspect;
        }
        
        this.frameOverlay.style.width = `${frameW}px`;
        this.frameOverlay.style.height = `${frameH}px`;
        this.frameOverlay.style.left = `${(screenW - frameW) / 2}px`;
        this.frameOverlay.style.top = `${(screenH - frameH) / 2}px`;
        this.frameOverlay.style.display = 'block';
    }

    handleRandomize() {
        const state = this.stateManager.getState();
        // Only change the garments color. Do not change the garment itself.
        const garmentCategories = state.mode === 'mix' 
            ? ['top', 'bottom', 'jacket'] 
            : ['dress'];

        garmentCategories.forEach(cat => {
            const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
            this.stateManager.update(`colors.${cat}`, randomColor);
            const colorInput = document.getElementById(`color-${cat}`);
            if (colorInput) {
                colorInput.value = randomColor;
            }
        });
    }

    handleModeChange(mode) {
        this.btnModeMix.classList.toggle('active', mode === 'mix');
        this.btnModeDress.classList.toggle('active', mode === 'dress');
        this.stateManager.update('mode', mode);
        this.renderGarmentLists();
        this.renderColorList();
        if (window.createIcons) {
            window.createIcons({ icons: window.LucideIcons });
        }
    }

    handleGenderChange(gender) {
        if (this.btnMale) this.btnMale.classList.toggle('active', gender === 'male');
        if (this.btnFemale) this.btnFemale.classList.toggle('active', gender === 'female');
        this.currentRenderedGender = gender;
        this.stateManager.update('gender', gender);
        // Clear previous gender garments from state
        if (this.stateManager.getState().mode === 'mix') {
            this.stateManager.update('mix.top', null);
            this.stateManager.update('mix.bottom', null);
            this.stateManager.update('mix.jacket', null);
        } else {
            this.stateManager.update('dress.comboId', null);
        }
        this.renderGarmentLists();
    }

    renderGarmentLists() {
        const state = this.stateManager.getState();
        const currentGender = state.gender || 'male';
        this.currentRenderedGender = currentGender;

        Object.keys(this.carousels).forEach(category => {
            const container = this.carousels[category];
            if (!container) return;
            
            const parentGroup = container.closest('.control-group');
            if (!parentGroup) return;

            // Filter items by gender
            const items = (this.config[category] || []).filter(item => {
                if (item.gender) return item.gender === currentGender;
                if (item.id.startsWith('WM_')) return currentGender === 'female';
                if (item.id.startsWith('M_')) return currentGender === 'male';
                return true;
            });
            
            // Show/Hide based on mode and availability of items for this gender
            if (state.mode === 'mix') {
                if (['top', 'bottom', 'jacket'].includes(category) && items.length > 0) {
                    parentGroup.style.display = 'block';
                } else {
                    parentGroup.style.display = 'none';
                }
            } else {
                if (['dress', 'comboset'].includes(category) && items.length > 0) {
                    parentGroup.style.display = 'block';
                } else {
                    parentGroup.style.display = 'none';
                }
            }

            container.innerHTML = '';
            items.forEach(item => {
                const div = document.createElement('div');
                const isSelected = (state.mode === 'mix' && state.mix[category] === item.id) ||
                                   (state.mode === 'dress' && state.dress.comboId === item.id);
                div.className = `carousel-item flex flex-col items-center justify-center p-1 gap-1 ${isSelected ? 'active' : ''}`;
                div.title = item.name;
                
                // Use thumbnail from config or model path
                const thumbUrl = item.thumbnail || item.thumb || `/assets/models/${item.id}.png`;
                div.innerHTML = `
                    <div class="w-full h-full overflow-hidden rounded-lg relative group bg-zinc-800 flex items-center justify-center">
                        <img src="${thumbUrl}" class="w-full h-full object-cover" alt="${item.name}" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'80\\' height=\\'80\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23666\\' stroke-width=\\'1.5\\'><path d=\\'M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z\\'/></svg>';">
                        <div class="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-[2px] text-[9px] px-1 py-0.5 truncate text-center text-zinc-300 font-medium">
                            ${item.name}
                        </div>
                    </div>
                `;
                
                div.onclick = () => {
                    if (state.mode === 'mix') {
                        const carouselItems = container.querySelectorAll('.carousel-item');
                        carouselItems.forEach(i => i.classList.remove('active'));
                        div.classList.add('active');
                        this.stateManager.update(`mix.${category}`, item.id);
                    } else {
                        ['dress', 'comboset'].forEach(cat => {
                            const c = this.carousels[cat];
                            if (c) {
                                c.querySelectorAll('.carousel-item').forEach(i => i.classList.remove('active'));
                            }
                        });
                        div.classList.add('active');
                        this.stateManager.update('dress.comboId', item.id);
                    }
                };
                container.appendChild(div);
            });
        });

        if (window.createIcons) {
            window.createIcons({ icons: window.LucideIcons });
        }
    }

    renderColorList() {
        const state = this.stateManager.getState();
        let categories = ['mannequin'];
        if (state.mode === 'mix') {
            categories = ['top', 'bottom', 'jacket', ...categories];
        } else {
            categories = ['dress', ...categories];
        }

        this.colorSection.innerHTML = '';
        
        categories.forEach(cat => {
            const currentColor = (state.colors && state.colors[cat]) || '#ffffff';
            const row = document.createElement('div');
            row.className = 'color-row';
            row.innerHTML = `
                <span class="capitalize">${cat}</span>
                <div class="color-picker-wrapper">
                    <input type="text" class="pantone-input" placeholder="Pantone" id="pantone-${cat}">
                    <input type="color" class="color-input" id="color-${cat}" value="${currentColor}">
                </div>
            `;
            
            const colorInput = row.querySelector(`#color-${cat}`);
            const pantoneInput = row.querySelector(`#pantone-${cat}`);
            
            colorInput.oninput = (e) => {
                this.stateManager.update(`colors.${cat}`, e.target.value);
            };
            
            pantoneInput.onchange = (e) => {
                // Simple Pantone simulation: just treat it as a label or try to map it
                console.log(`Pantone for ${cat}: ${e.target.value}`);
            };
            
            this.colorSection.appendChild(row);
        });
    }

    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.opacity = '0';
            setTimeout(() => this.loadingOverlay.style.display = 'none', 500);
        }
    }
}
