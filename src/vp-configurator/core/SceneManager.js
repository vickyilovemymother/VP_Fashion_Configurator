import * as THREE from 'three';

export class SceneManager {
    constructor(containerId) {
        console.log("Initializing SceneManager for container:", containerId);
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.backgroundColor = new THREE.Color(0x0a0a0a);
        this.scene.background = this.backgroundColor;
        
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
            powerPreference: "high-performance"
        });
        
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        this.container.appendChild(this.renderer.domElement);
        
        this.isPerformanceMode = false;
        this.setupLights();
        this.setupGround();
        
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setBackgroundColor(hex) {
        this.backgroundColor.set(hex);
        this.scene.background = this.backgroundColor;
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.bias = -0.0001;
        this.scene.add(directionalLight);
        this.mainLight = directionalLight;

        // Fill light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);
    }

    setupGround() {
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    togglePerformanceMode() {
        this.isPerformanceMode = !this.isPerformanceMode;
        this.renderer.shadowMap.enabled = !this.isPerformanceMode;
        this.renderer.setPixelRatio(this.isPerformanceMode ? 1 : Math.min(window.devicePixelRatio, 2));
        
        this.scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = !this.isPerformanceMode;
                child.receiveShadow = !this.isPerformanceMode;
            }
        });
        
        return this.isPerformanceMode;
    }

    onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render(camera) {
        this.renderer.render(this.scene, camera);
    }
}
