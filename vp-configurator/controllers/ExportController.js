import * as THREE from 'three';

export class ExportController {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.modal = document.getElementById('export-modal');
    }

    async getCaptureBase64(width = 1024, height = 1024, transparent = true, hideMannequin = false) {
        const originalSize = new THREE.Vector2();
        this.sceneManager.renderer.getSize(originalSize);
        
        this.sceneManager.renderer.setSize(width, height);
        this.sceneManager.camera.aspect = width / height;
        this.sceneManager.camera.updateProjectionMatrix();

        const originalBg = this.sceneManager.scene.background;
        if (transparent) {
            this.sceneManager.scene.background = null;
        }

        // Handle mannequin visibility
        const hiddenMannequins = [];
        if (hideMannequin) {
            this.sceneManager.scene.traverse(child => {
                if (child.userData && child.userData.category === 'mannequin' && child.visible) {
                    child.visible = false;
                    hiddenMannequins.push(child);
                }
            });
        }

        this.sceneManager.render();

        const dataURL = this.sceneManager.renderer.domElement.toDataURL('image/png');
        
        // Restore visibility
        hiddenMannequins.forEach(m => m.visible = true);

        this.sceneManager.scene.background = originalBg;
        this.sceneManager.renderer.setSize(originalSize.x, originalSize.y);
        this.sceneManager.camera.aspect = originalSize.x / originalSize.y;
        this.sceneManager.camera.updateProjectionMatrix();
        
        return dataURL;
    }

    async exportPNG(width = 1920, height = 1080, transparent = false) {
        this.modal.style.display = 'flex';
        await new Promise(r => setTimeout(r, 100));

        const originalSize = new THREE.Vector2();
        this.sceneManager.renderer.getSize(originalSize);
        
        this.sceneManager.renderer.setSize(width, height);
        this.sceneManager.camera.aspect = width / height;
        this.sceneManager.camera.updateProjectionMatrix();

        const originalBg = this.sceneManager.scene.background;
        if (transparent) {
            this.sceneManager.scene.background = null;
        }

        this.sceneManager.render();

        const dataURL = this.sceneManager.renderer.domElement.toDataURL('image/png');
        
        const link = document.createElement('a');
        link.download = `vp-config-export-${Date.now()}.png`;
        link.href = dataURL;
        link.click();

        this.sceneManager.scene.background = originalBg;
        this.sceneManager.renderer.setSize(originalSize.x, originalSize.y);
        this.sceneManager.camera.aspect = originalSize.x / originalSize.y;
        this.sceneManager.camera.updateProjectionMatrix();
        
        this.modal.style.display = 'none';
    }

    async exportTurntable() {
        console.log("Turntable export initiated...");
        
        // Ensure starting from front view (Shortcut 2)
        this.sceneManager.setCameraView('2');
        await new Promise(r => setTimeout(r, 500)); // Wait for camera to settle

        const frames = 120; // More frames for smoother 360
        const originalAutoRotate = this.sceneManager.controls.autoRotate;
        this.sceneManager.controls.autoRotate = false;

        const stream = this.sceneManager.renderer.domElement.captureStream(30);
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        const chunks = [];

        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vp-turntable-${Date.now()}.webm`;
            a.click();
            this.sceneManager.controls.autoRotate = originalAutoRotate;
            alert("Turntable video saved!");
        };

        recorder.start();
        
        const angleStep = (Math.PI * 2) / frames;
        const initialPos = this.sceneManager.camera.position.clone();
        const radius = initialPos.length();
        
        for (let i = 0; i <= frames; i++) {
            const angle = i * angleStep;
            this.sceneManager.camera.position.x = Math.sin(angle) * radius;
            this.sceneManager.camera.position.z = Math.cos(angle) * radius;
            this.sceneManager.camera.lookAt(this.sceneManager.controls.target);
            
            this.sceneManager.render();
            await new Promise(r => requestAnimationFrame(r));
        }

        recorder.stop();
    }

    exportEComm(state) {
        const data = {
            sku: "VP_CONFIG_001",
            timestamp: new Date().toISOString(),
            configuration: state,
            assets: {
                mannequin: state.gender,
                garments: state.garments,
                colors: state.colors
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ecomm-export-${Date.now()}.json`;
        a.click();
        alert("eCommerce Data Package Exported!");
    }
}
