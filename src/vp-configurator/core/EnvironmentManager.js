import * as THREE from 'three';
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

export class EnvironmentManager {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.pmremGenerator = new THREE.PMREMGenerator(renderer);
        this.pmremGenerator.compileEquirectangularShader();
        
        this.hdrIntensity = 0.5;
        this.isVisible = true;
        this.currentHDR = null;
    }

    async loadHDR(url) {
        console.log("EnvironmentManager: Loading HDR from", url);
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                console.warn("EnvironmentManager: HDR load timed out after 15s");
                resolve(); // Resolve anyway to not block app
            }, 15000);

            const loader = new RGBELoader();
            loader.load(url, (texture) => {
                clearTimeout(timeout);
                console.log("EnvironmentManager: HDR loaded successfully");
                const envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
                this.scene.environment = envMap;
                if (this.isVisible) this.scene.background = envMap;
                
                texture.dispose();
                resolve();
            }, (xhr) => {
                if (xhr.lengthComputable) {
                    const percentComplete = xhr.loaded / xhr.total * 100;
                    console.log(`EnvironmentManager: HDR loading progress: ${Math.round(percentComplete)}%`);
                }
            }, (err) => {
                clearTimeout(timeout);
                console.error("EnvironmentManager: HDR load error", err);
                reject(err);
            });
        });
    }

    setIntensity(value) {
        // UI 1-10 mapped to 0-5
        this.hdrIntensity = value / 2;
        this.scene.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.envMapIntensity = this.hdrIntensity;
            }
        });
    }

    toggleVisibility(visible) {
        this.isVisible = visible;
        this.scene.background = visible ? this.scene.environment : new THREE.Color(0x111111);
    }

    setBackgroundColor(color) {
        this.scene.background = new THREE.Color(color);
        this.isVisible = false;
    }
}
