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
        console.log("ModelLoader: Loading model from", url);
        try {
            const gltf = await new Promise((resolve, reject) => {
                this.loader.load(url, (data) => {
                    console.log("ModelLoader: Model loaded successfully", url);
                    resolve(data);
                }, (xhr) => {
                    if (xhr.lengthComputable) {
                        const percent = xhr.loaded / xhr.total * 100;
                        console.log(`ModelLoader: Progress ${Math.round(percent)}% for ${url}`);
                    }
                }, (err) => {
                    console.error("ModelLoader: Error loading", url, err);
                    reject(err);
                });
            });
            return gltf.scene;
        } catch (error) {
            console.error(`Error loading model from ${url}:`, error);
            return null;
        }
    }
}
