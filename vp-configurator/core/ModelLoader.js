import * as THREE from 'three';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

export class ModelLoader {
    constructor() {
        this.loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        this.loader.setDRACOLoader(dracoLoader);
    }

    async load(url) {
        console.log(`ModelLoader: Loading model from ${url}`);
        try {
            const gltf = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    console.warn(`ModelLoader: Load timed out for ${url}`);
                    reject(new Error(`Model Load Timeout: ${url}`));
                }, 30000);

                this.loader.load(url, (data) => {
                    clearTimeout(timeout);
                    console.log(`ModelLoader: Successfully loaded ${url}`);
                    
                    // Log model size for debugging
                    const box = new THREE.Box3().setFromObject(data.scene);
                    const size = box.getSize(new THREE.Vector3());
                    console.log(`ModelLoader: Model size for ${url}:`, {
                        width: size.x.toFixed(2),
                        height: size.y.toFixed(2),
                        depth: size.z.toFixed(2)
                    });
                    
                    resolve(data);
                }, undefined, (error) => {
                    clearTimeout(timeout);
                    console.error(`ModelLoader: Error loading ${url}:`, error);
                    reject(error);
                });
            });
            return gltf.scene;
        } catch (error) {
            console.error(`ModelLoader: Critical error loading model from ${url}:`, error);
            return null;
        }
    }
}
