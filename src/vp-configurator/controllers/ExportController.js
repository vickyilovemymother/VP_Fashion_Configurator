import * as THREE from 'three';

export class ExportController {
    constructor(sceneManager, cameraManager) {
        this.sceneManager = sceneManager;
        this.cameraManager = cameraManager;
    }

    exportPNG(width, height, transparent) {
        const originalSize = new THREE.Vector2();
        this.sceneManager.renderer.getSize(originalSize);
        
        this.sceneManager.renderer.setSize(width, height);
        this.cameraManager.onWindowResize(); // Update aspect
        
        if (transparent) {
            this.sceneManager.renderer.setClearAlpha(0);
        }
        
        this.sceneManager.render(this.cameraManager.camera);
        
        const dataURL = this.sceneManager.renderer.domElement.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `vp-export-${Date.now()}.png`;
        link.href = dataURL;
        link.click();
        
        // Restore
        this.sceneManager.renderer.setSize(originalSize.x, originalSize.y);
        this.sceneManager.renderer.setClearAlpha(1);
        this.cameraManager.onWindowResize();
    }

    exportTurntable(duration) {
        console.log(`Exporting turntable for ${duration}s...`);
        alert("Turntable export started. This would typically use a library like CCapture.js or MediaRecorder API.");
    }
}
