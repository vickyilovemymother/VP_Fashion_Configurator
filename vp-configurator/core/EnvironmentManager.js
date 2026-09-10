import * as THREE from 'three';
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export class EnvironmentManager {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.pmremGenerator = new THREE.PMREMGenerator(renderer);
        this.pmremGenerator.compileEquirectangularShader();
        
        this.hdrIntensity = 0.5;
        this.isVisible = true;

        // Initialize built-in procedural studio lighting environment
        this.setupDefaultEnvironment();
    }

    setupDefaultEnvironment() {
        try {
            const roomEnvironment = new RoomEnvironment();
            this.defaultEnvMap = this.pmremGenerator.fromScene(roomEnvironment).texture;
            this.scene.environment = this.defaultEnvMap;
            roomEnvironment.dispose();
        } catch (e) {
            console.warn("EnvironmentManager: Default RoomEnvironment fallback initialized with warning:", e);
        }
    }

    async loadHDR(hdrName) {
        console.log(`EnvironmentManager: Loading HDR ${hdrName}`);
        const hdrs = {
            'venice_sunset': 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/equirectangular/venice_sunset_1k.hdr',
            'royal_esplanade': 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/equirectangular/quarry_01_1k.hdr',
            'pedestrian_overpass': 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/equirectangular/pedestrian_overpass_1k.hdr'
        };
        const url = hdrs[hdrName] || hdrs['venice_sunset'];

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.warn(`EnvironmentManager: HDR ${hdrName} load timed out after 10s. Using studio environment.`);
                if (this.defaultEnvMap) {
                    this.scene.environment = this.defaultEnvMap;
                }
                resolve();
            }, 10000);

            try {
                new RGBELoader().load(url, (texture) => {
                    clearTimeout(timeout);
                    console.log(`EnvironmentManager: HDR ${hdrName} loaded successfully.`);
                    texture.mapping = THREE.EquirectangularReflectionMapping;
                    const envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
                    this.scene.environment = envMap;
                    if (this.isVisible) this.scene.background = envMap;
                    
                    this.currentTexture = texture;
                    resolve();
                }, undefined, () => {
                    clearTimeout(timeout);
                    console.warn(`EnvironmentManager: Unable to load remote HDR (${hdrName}). Using studio environment.`);
                    if (this.defaultEnvMap) {
                        this.scene.environment = this.defaultEnvMap;
                    }
                    // Resolve safely so the app never crashes or rejects with an Event
                    resolve();
                });
            } catch (err) {
                clearTimeout(timeout);
                console.warn("EnvironmentManager: Synchronous HDR error handled:", err);
                resolve();
            }
        });
    }

    setRotation(angle) {
        if (this.currentTexture) {
            this.currentTexture.rotation = (angle * Math.PI) / 180;
            this.currentTexture.needsUpdate = true;
            
            if (this.isVisible) {
                this.scene.background = this.currentTexture;
            }
        }
    }

    async load360Background(url) {
        return new Promise((resolve) => {
            new THREE.TextureLoader().load(url, (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                this.scene.background = texture;
                this.currentTexture = texture;
                this.isVisible = true;
                resolve();
            }, undefined, (err) => {
                console.warn("EnvironmentManager: 360 background load failed:", err);
                resolve();
            });
        });
    }

    setIntensity(value) {
        this.hdrIntensity = value / 2;
        this.scene.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.envMapIntensity = this.hdrIntensity;
            }
        });
    }

    toggleVisibility(visible) {
        this.isVisible = visible;
        if (visible) {
            this.scene.background = this.scene.environment;
        }
    }

    setBackgroundColor(color) {
        this.scene.background = new THREE.Color(color);
        this.isVisible = false;
    }
}
