import * as THREE from 'three';
import { SceneManager } from './core/SceneManager.js';
import { EnvironmentManager } from './core/EnvironmentManager.js';
import { ModelLoader } from './core/ModelLoader.js';
import { StateManager } from './core/StateManager.js';

import { MannequinController } from './controllers/MannequinController.js';
import { GarmentController } from './controllers/GarmentController.js';
import { ColorController } from './controllers/ColorController.js';
import { ExportController } from './controllers/ExportController.js';
import { UIController } from './controllers/UIController.js';

import { URLUtils } from './utils/URLUtils.js';
import { createIcons, Settings, User, Layers, Shirt, Palette, Image, Video, Download, Share2, Save, FolderOpen, ShoppingBag, RotateCw, Sun, Moon, Eye, EyeOff, Grid, Smartphone, Monitor, Box, Camera, Trash2, RefreshCw, Maximize, Zap, Sparkles, Upload, Settings2, Columns2, Scissors } from 'lucide';

import defaultGarmentConfig from './config/garmentConfig.json';

console.log("VP Configurator main.js loaded.");

window.createIcons = createIcons;
window.LucideIcons = { Settings, User, Layers, Shirt, Palette, Image, Video, Download, Share2, Save, FolderOpen, ShoppingBag, RotateCw, Sun, Moon, Eye, EyeOff, Grid, Smartphone, Monitor, Box, Camera, Trash2, RefreshCw, Maximize, Zap, Sparkles, Upload, Settings2, Columns2, Scissors };

window.THREE = THREE;
window.URLUtils = URLUtils;

async function init() {
    console.log("Initializing VP Configurator...");
    try {
        // 1. Core Systems
        const stateManager = new StateManager();
        const sceneManager = new SceneManager('canvas-container');
        const envManager = new EnvironmentManager(sceneManager.scene, sceneManager.renderer);
        const modelLoader = new ModelLoader();

        console.log("Core systems initialized.");

        // 2. Load Config
        let garmentConfig = defaultGarmentConfig;
        try {
            const configUrl = './vp-configurator/config/garmentConfig.json';
            console.log(`Fetching config from: ${configUrl}`);
            const configResponse = await fetch(configUrl);
            if (configResponse.ok) {
                garmentConfig = await configResponse.json();
            }
        } catch (e) {
            console.warn("Fetch config warning, using bundled garmentConfig fallback:", e);
        }
        console.log("Config loaded:", garmentConfig);

        // 3. Controllers
        const mannequinCtrl = new MannequinController(sceneManager.scene, modelLoader, sceneManager);
        const garmentCtrl = new GarmentController(sceneManager.scene, modelLoader);
        const colorCtrl = new ColorController(sceneManager.scene);
        const exportCtrl = new ExportController(sceneManager);
        const uiCtrl = new UIController(stateManager, garmentConfig, exportCtrl);

        console.log("Controllers initialized.");

        // Initialize Lucide Icons
        createIcons({
            icons: window.LucideIcons
        });

    let lastTime = performance.now();

    // 4. State Subscriptions
    stateManager.subscribe(async (state) => {
        try {
            // Handle Gender change
            if (state.gender !== mannequinCtrl.currentGender) {
                mannequinCtrl.currentGender = state.gender;
                // Clear all garments before switching gender
                await garmentCtrl.clearGarments(state.fadeEnabled);
                await mannequinCtrl.loadMannequin(state.gender);
                // Set garment parent to mannequin root
                if (mannequinCtrl.currentMannequin) {
                    garmentCtrl.setParent(mannequinCtrl.currentMannequin);
                }
            }

            // Handle Mannequin Visibility
            if (mannequinCtrl.currentMannequin) {
                mannequinCtrl.currentMannequin.traverse(child => {
                    if (child.isMesh && child.userData.category === 'mannequin') {
                        child.visible = state.mannequinVisible;
                    }
                });
            }

            // Handle Mode Switching & Garment Loading
            if (state.mode === 'mix') {
                // Remove combo if exists
                if (garmentCtrl.garments.dress) {
                    await garmentCtrl.clearGarments(state.fadeEnabled);
                }

                // Handle Mix Garments
                const categories = ['top', 'bottom', 'jacket'];
                for (const cat of categories) {
                    const currentId = garmentCtrl.garments[cat]?.userData?.id;
                    if (state.mix[cat] !== currentId) {
                        await garmentCtrl.loadMixGarment(cat, state.mix[cat], garmentConfig, state.fadeEnabled);
                        if (garmentCtrl.garments[cat]) {
                            garmentCtrl.garments[cat].userData.id = state.mix[cat];
                        }
                    }
                    colorCtrl.applyColor(cat, state.colors[cat]);
                }
            } else if (state.mode === 'dress') {
                // Handle Dress Combo
                const currentComboId = garmentCtrl.garments.dress?.userData?.id || garmentCtrl.garments.comboset?.userData?.id;
                if (state.dress.comboId !== currentComboId) {
                    await garmentCtrl.loadDressCombo(state.dress.comboId, garmentConfig, state.fadeEnabled);
                    if (garmentCtrl.garments.dress) {
                        garmentCtrl.garments.dress.userData.id = state.dress.comboId;
                    }
                    if (garmentCtrl.garments.comboset) {
                        garmentCtrl.garments.comboset.userData.id = state.dress.comboId;
                    }
                }
                colorCtrl.applyColor('dress', state.colors.dress);
                colorCtrl.applyColor('comboset', state.colors.dress);
            }

            // Handle Colors
            colorCtrl.applyColor('mannequin', state.colors.mannequin);
            
            // Handle Background Color
            sceneManager.setBackgroundColor(state.colors.background);

            // Handle Environment
            if (state.environment.hdr !== envManager.currentHdr) {
                await envManager.loadHDR(state.environment.hdr);
                envManager.currentHdr = state.environment.hdr;
            }
            envManager.setIntensity(state.environment.intensity);
            envManager.toggleVisibility(state.environment.visible);

            // Handle Performance
            if (state.performance !== sceneManager.isPerformanceMode) {
                sceneManager.togglePerformanceMode();
            }

            // Handle Shadows
            sceneManager.setShadows(state.shadowsEnabled);
            sceneManager.setShadowIntensity(state.shadowIntensity);

            // Handle HDR Rotation
            envManager.setRotation(state.environment.rotation);
            sceneManager.rotateLights(state.environment.rotation);

            // Handle Grid
            sceneManager.setGridVisibility(state.gridVisible);

            // Handle 360 Background
            if (state.environment.bg360Url) {
                envManager.load360Background(state.environment.bg360Url);
            }
        } catch (err) {
            console.warn("main.js: Handled error in state subscriber:", err);
        }
    });

    // 5. Special UI Actions
    window.addEventListener('export-png', (e) => {
        const { width, height, transparent } = e.detail;
        exportCtrl.exportPNG(width, height, transparent);
    });

    window.addEventListener('export-ecomm', () => {
        exportCtrl.exportEComm(stateManager.getState());
    });

    window.addEventListener('toggle-spin', () => {
        const isSpinning = sceneManager.toggleAutoSpin();
        const btn = document.getElementById('btn-spin');
        if (btn) {
            btn.innerHTML = `
                <i data-lucide="rotate-cw" class="w-3 h-3"></i>
                <span>Auto Spin: ${isSpinning ? 'ON' : 'OFF'}</span>
            `;
            if (window.createIcons) {
                window.createIcons({ icons: window.LucideIcons });
            }
        }
    });

    window.addEventListener('export-turntable', () => {
        exportCtrl.exportTurntable();
    });

    window.addEventListener('start-ar', () => {
        sceneManager.startAR();
    });

    window.addEventListener('start-vr', () => {
        sceneManager.startVR();
    });

    window.addEventListener('reset-camera', () => {
        sceneManager.focusMannequin();
    });

    window.addEventListener('load-360-preset', (e) => {
        stateManager.update('environment.bg360Url', e.detail);
    });

    // XR Cycling Logic
    let currentGarmentCatIndex = 0;
    const garmentCategories = ['top', 'bottom', 'jacket', 'dress', 'comboset'];
    
    window.addEventListener('xr-cycle-garment', () => {
        const currentState = stateManager.getState();
        if (currentState.mode === 'mix') {
            let attempts = 0;
            while (attempts < garmentCategories.length) {
                const cat = garmentCategories[currentGarmentCatIndex];
                if (['top', 'bottom', 'jacket'].includes(cat)) {
                    const items = garmentConfig[cat];
                    if (items && items.length > 0) {
                        const currentId = currentState.mix[cat];
                        const currentIndex = items.findIndex(i => i.id === currentId);
                        const nextIndex = (currentIndex + 1) % items.length;
                        stateManager.update(`mix.${cat}`, items[nextIndex].id);
                        
                        if (nextIndex === 0) {
                            currentGarmentCatIndex = (currentGarmentCatIndex + 1) % garmentCategories.length;
                        }
                        break;
                    }
                }
                currentGarmentCatIndex = (currentGarmentCatIndex + 1) % garmentCategories.length;
                attempts++;
            }
        } else {
            const items = [...garmentConfig.dress, ...garmentConfig.comboset];
            if (items.length > 0) {
                const currentId = currentState.dress.comboId;
                const currentIndex = items.findIndex(i => i.id === currentId);
                const nextIndex = (currentIndex + 1) % items.length;
                stateManager.update('dress.comboId', items[nextIndex].id);
            }
        }
    });

    const presetColors = ['#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000'];
    let currentColorIndex = 0;
    window.addEventListener('xr-cycle-color', () => {
        const state = stateManager.getState();
        currentColorIndex = (currentColorIndex + 1) % presetColors.length;
        const color = presetColors[currentColorIndex];
        
        if (state.mode === 'mix') {
            const cat = garmentCategories[currentGarmentCatIndex]; 
            if (['top', 'bottom', 'jacket'].includes(cat)) {
                stateManager.update(`colors.${cat}`, color);
            }
        } else {
            stateManager.update('colors.dress', color);
        }
    });

    // 6. Initial Load
    console.log("Loading initial environment...");
    try {
        await envManager.loadHDR('venice_sunset');
    } catch (e) {
        console.warn("Initial HDR load warning:", e);
    }
    console.log("Environment loaded.");
    
    // Check URL for initial state
    console.log("Checking URL state...");
    const urlState = URLUtils.decodeState();
    if (urlState) {
        console.log("URL state found:", urlState);
        // Load mannequin first if gender is in URL
        if (urlState.gender) {
            console.log(`Loading mannequin for gender: ${urlState.gender}`);
            mannequinCtrl.currentGender = urlState.gender;
            await mannequinCtrl.loadMannequin(urlState.gender);
            if (mannequinCtrl.currentMannequin) {
                garmentCtrl.setParent(mannequinCtrl.currentMannequin);
            }
        }

        Object.keys(urlState).forEach(key => {
            if (typeof urlState[key] === 'object' && urlState[key] !== null) {
                Object.keys(urlState[key]).forEach(subKey => {
                    stateManager.update(`${key}.${subKey}`, urlState[key][subKey]);
                });
            } else {
                stateManager.update(key, urlState[key]);
            }
        });
    } else {
        console.log("No URL state, loading default mannequin (male)...");
        mannequinCtrl.currentGender = 'male';
        await mannequinCtrl.loadMannequin('male');
        if (mannequinCtrl.currentMannequin) {
            garmentCtrl.setParent(mannequinCtrl.currentMannequin);
        }
    }

    console.log("Hiding loading overlay...");
    uiCtrl.hideLoading();
    console.log("Initialization complete.");

    // 7. Animation Loop
    sceneManager.renderer.setAnimationLoop((time) => {
        const deltaTime = (time - lastTime) / 1000;
        lastTime = time;

        garmentCtrl.update(deltaTime);
        sceneManager.update();
        sceneManager.render();
    });
    } catch (error) {
        console.error("Critical initialization error:", error);
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            const errorMsg = error instanceof Error ? error.message : (typeof error === 'object' ? JSON.stringify(error) : String(error));
            overlay.innerHTML = `
                <div class="text-center p-8">
                    <p class="text-red-500 font-bold mb-2">Engine Error</p>
                    <p class="text-xs opacity-50">${errorMsg || 'Failed to initialize engine'}</p>
                    <button onclick="window.location.reload()" class="mt-4 bg-zinc-800 px-4 py-2 rounded text-xs">Retry</button>
                </div>
            `;
        }
    }
}

console.log("main.js: Calling init()...");
init().then(() => {
    console.log("main.js: init() finished.");
}).catch(err => {
    console.error("main.js: init() failed:", err);
});
