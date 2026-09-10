// VP Engine v1.0.2
import * as THREE from 'three';
import { SceneManager } from '@/vp-configurator/core/SceneManager.js';
import { CameraManager } from '@/vp-configurator/core/CameraManager.js';
import { EnvironmentManager } from '@/vp-configurator/core/EnvironmentManager.js';
import { ModelLoader } from '@/vp-configurator/core/ModelLoader.js';
import { StateManager } from '@/vp-configurator/core/StateManager.js';

import { MannequinController } from '@/vp-configurator/controllers/MannequinController.js';
import { GarmentController } from '@/vp-configurator/controllers/GarmentController.js';
import { ColorController } from '@/vp-configurator/controllers/ColorController.js';
import { ExportController } from '@/vp-configurator/controllers/ExportController.js';
import { UIController } from '@/vp-configurator/controllers/UIController.js';

import { URLUtils } from '@/vp-configurator/utils/URLUtils.js';
import garmentConfig from '@/vp-configurator/config/garmentConfig.json';

window.THREE = THREE;
console.log("THREE.js loaded:", THREE.REVISION);

async function init() {
    console.log("Starting VP Engine initialization...");
    try {
        // 1. Core Systems
        const stateManager = new StateManager();
        const sceneManager = new SceneManager('canvas-container');
        const cameraManager = new CameraManager(sceneManager.renderer);
        const envManager = new EnvironmentManager(sceneManager.scene, sceneManager.renderer);
        const modelLoader = new ModelLoader();
        console.log("Core systems initialized.");

        // 2. Load Config
        console.log("Garment config loaded via import.");

        // 3. Controllers
        const mannequinCtrl = new MannequinController(sceneManager.scene, modelLoader, cameraManager);
        const garmentCtrl = new GarmentController(sceneManager.scene, modelLoader);
        const colorCtrl = new ColorController(sceneManager.scene);
        const exportCtrl = new ExportController(sceneManager, cameraManager);
        const uiCtrl = new UIController(stateManager, garmentConfig);
        console.log("Controllers initialized.");

        // 4. State Subscriptions
        stateManager.subscribe(async (state) => {
            try {
                // Handle Gender change
                if (state.gender !== mannequinCtrl.currentGender) {
                    await mannequinCtrl.loadMannequin(state.gender);
                }

                // Handle Mannequin Visibility
                mannequinCtrl.toggleVisibility(state.mannequinVisible);

                // Handle Garments
                const categories = ['top', 'bottom', 'jacket', 'comboset'];
                for (const cat of categories) {
                    if (state.garments[cat] && state.garments[cat] !== garmentCtrl.garments[cat]?.userData?.id) {
                        await garmentCtrl.loadGarment(cat, state.garments[cat], garmentConfig);
                        if (garmentCtrl.garments[cat]) {
                            garmentCtrl.garments[cat].userData.id = state.garments[cat];
                        }
                    }
                }

                // Handle Colors
                ['top', 'bottom', 'jacket', 'mannequin'].forEach(cat => {
                    colorCtrl.applyColor(cat, state.colors[cat]);
                });

                // Handle Environment
                if (state.environment.hdr !== envManager.currentHDR) {
                    const hdrUrl = `https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/equirectangular/${state.environment.hdr}`;
                    await envManager.loadHDR(hdrUrl);
                    envManager.currentHDR = state.environment.hdr;
                }
                envManager.setIntensity(state.environment.intensity);
                sceneManager.setBackgroundColor(state.environment.bgColor);

                // Handle Performance
                if (state.performance !== sceneManager.isPerformanceMode) {
                    sceneManager.togglePerformanceMode();
                }
            } catch (err) {
                console.error("State update failed:", err);
            }
        });

        // 5. Special UI Actions
        document.getElementById('btn-export-png').onclick = () => {
            document.getElementById('export-modal').classList.remove('hidden');
            document.getElementById('export-modal').classList.add('flex');
        };

        document.getElementById('btn-export-cancel').onclick = () => {
            document.getElementById('export-modal').classList.add('hidden');
            document.getElementById('export-modal').classList.remove('flex');
        };

        document.getElementById('btn-export-confirm').onclick = () => {
            const res = document.getElementById('export-res').value.split('x');
            const transparent = document.getElementById('export-transparent').checked;
            exportCtrl.exportPNG(parseInt(res[0]), parseInt(res[1]), transparent);
            document.getElementById('export-modal').classList.add('hidden');
            document.getElementById('export-modal').classList.remove('flex');
        };

        document.getElementById('btn-export-mp4').onclick = () => {
            exportCtrl.exportTurntable(5);
        };

        document.getElementById('btn-share').onclick = () => {
            const url = URLUtils.encodeState(stateManager.getState());
            navigator.clipboard.writeText(url);
            
            // Show QR Code in a simple window
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
            const qrWindow = window.open('', 'QR Code', 'width=300,height=350');
            qrWindow.document.write(`
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;font-family:sans-serif;background:#111;color:#fff;">
                    <img src="${qrUrl}" alt="QR Code" style="border:10px solid #fff;border-radius:10px;">
                    <p style="font-size:14px;margin-top:20px;font-weight:bold;">Scan to view on mobile</p>
                    <button onclick="window.close()" style="margin-top:20px;padding:10px 20px;background:#6366f1;color:#fff;border:none;border-radius:5px;cursor:pointer;">Close</button>
                </div>
            `);
            
            alert('Configuration URL copied to clipboard!');
        };

        document.getElementById('btn-save-preset').onclick = () => {
            const preset = stateManager.getState();
            const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `vp-preset-${Date.now()}.json`;
            link.href = url;
            link.click();
        };
        
        // 6. Initial Load
        console.log("Loading initial environment...");
        const initialHDR = 'venice_sunset_1k.hdr';
        const hdrUrl = `https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/equirectangular/${initialHDR}`;
        await envManager.loadHDR(hdrUrl);
        envManager.currentHDR = initialHDR;
        
        console.log("Checking initial state...");
        const urlState = URLUtils.decodeState();
        if (urlState) {
            console.log("Applying URL state...");
            Object.keys(urlState).forEach(key => {
                if (urlState[key] && typeof urlState[key] === 'object') {
                    Object.keys(urlState[key]).forEach(subKey => {
                        stateManager.update(`${key}.${subKey}`, urlState[key][subKey]);
                    });
                } else if (urlState[key] !== undefined) {
                    stateManager.update(key, urlState[key]);
                }
            });
        } else {
            console.log("Loading default mannequin...");
            const mannequinTimeout = setTimeout(() => {
                console.warn("Initial mannequin load timed out");
                uiCtrl.hideLoading();
            }, 10000);
            await mannequinCtrl.loadMannequin('male');
            clearTimeout(mannequinTimeout);
        }

        uiCtrl.hideLoading();
        console.log("Initialization complete.");

        // 7. Animation Loop
        function animate() {
            requestAnimationFrame(animate);
            cameraManager.update();
            sceneManager.render(cameraManager.camera);
        }
        animate();
    } catch (err) {
        console.error("Initialization error:", err);
        // Show error on screen if possible
        const loadingText = document.querySelector('#loading-overlay p');
        if (loadingText) {
            loadingText.innerText = "Error: " + err.message;
            loadingText.style.color = "#ff4444";
        }
    }
}

init().catch(err => {
    console.error("Initialization failed:", err);
});
