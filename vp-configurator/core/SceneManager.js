import * as THREE from 'three';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

export class SceneManager {
    constructor(containerId) {
        console.log(`SceneManager: Initializing with container ${containerId}`);
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container #${containerId} not found!`);
        }
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505);
        
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true // Required for exports
        });
        this.renderer.xr.enabled = true;
        
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
        this.setupGrid();
        this.setupCamera();
        this.setupXR();
        
        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    setupXR() {
        this.controller1 = this.renderer.xr.getController(0);
        this.controller1.addEventListener('selectstart', () => {
            window.dispatchEvent(new CustomEvent('xr-cycle-garment'));
        });
        this.controller1.addEventListener('squeezestart', () => {
            window.dispatchEvent(new CustomEvent('reset-camera'));
        });
        this.scene.add(this.controller1);

        this.controller2 = this.renderer.xr.getController(1);
        this.controller2.addEventListener('selectstart', () => {
            window.dispatchEvent(new CustomEvent('xr-cycle-color'));
        });
        this.controller2.addEventListener('squeezestart', () => {
            window.dispatchEvent(new CustomEvent('reset-camera'));
        });
        this.scene.add(this.controller2);

        const controllerModelFactory = new XRControllerModelFactory();

        this.controllerGrip1 = this.renderer.xr.getControllerGrip(0);
        this.controllerGrip1.add(controllerModelFactory.createControllerModel(this.controllerGrip1));
        this.scene.add(this.controllerGrip1);

        this.controllerGrip2 = this.renderer.xr.getControllerGrip(1);
        this.controllerGrip2.add(controllerModelFactory.createControllerModel(this.controllerGrip2));
        this.scene.add(this.controllerGrip2);

        this.setupXRUI();
    }

    setupXRUI() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#6366f1';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('XR CONTROLS', 256, 60);
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText('Left Trigger: Swap Garment', 256, 120);
        ctx.fillText('Right Trigger: Change Color', 256, 170);
        ctx.fillText('Squeeze: Reset View', 256, 220);

        const texture = new THREE.CanvasTexture(canvas);
        const geometry = new THREE.PlaneGeometry(0.5, 0.25);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
        const panel = new THREE.Mesh(geometry, material);
        panel.position.set(0, 1.5, -1); // In front of user
        this.scene.add(panel);
        this.xrPanel = panel;
        
        // Hide panel initially, show only in XR
        this.xrPanel.visible = false;
        
        this.renderer.xr.addEventListener('sessionstart', () => {
            this.xrPanel.visible = true;
            // Position panel in front of user's initial XR position
            const headPosition = new THREE.Vector3();
            const headRotation = new THREE.Quaternion();
            this.camera.getWorldPosition(headPosition);
            this.camera.getWorldQuaternion(headRotation);
            
            const offset = new THREE.Vector3(0, 0, -1).applyQuaternion(headRotation);
            this.xrPanel.position.copy(headPosition).add(offset);
            this.xrPanel.position.y = 1.5; // Keep at eye level
        });
        this.renderer.xr.addEventListener('sessionend', () => {
            this.xrPanel.visible = false;
        });
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 1.2, 3);
        
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.target.set(0, 1, 0);
        this.controls.maxPolarAngle = Math.PI / 1.8;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 10;
        
        this.isAutoSpin = false;

        // XR Group for positioning in AR/VR
        this.xrGroup = new THREE.Group();
        this.scene.add(this.xrGroup);
    }

    async startAR() {
        if ('xr' in navigator) {
            try {
                const session = await navigator.xr.requestSession('immersive-ar', {
                    requiredFeatures: ['hit-test', 'local-floor']
                });
                this.renderer.xr.setReferenceSpaceType('local-floor');
                await this.renderer.xr.setSession(session);
            } catch (e) {
                alert("AR not supported on this device or browser: " + e.message);
            }
        } else {
            alert("WebXR AR not supported");
        }
    }

    async startVR() {
        if ('xr' in navigator) {
            try {
                const session = await navigator.xr.requestSession('immersive-vr', {
                    optionalFeatures: ['local-floor', 'bounded-floor']
                });
                await this.renderer.xr.setSession(session);
            } catch (e) {
                alert("VR not supported on this device or browser: " + e.message);
            }
        } else {
            alert("WebXR VR not supported");
        }
    }

    handleKeyDown(e) {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
            return;
        }

        const key = e.key;
        if (key === 'f' || key === 'F') {
            e.preventDefault();
            this.focusMannequin();
            return;
        }

        if (['0', '2', '4', '5', '6', '8'].includes(key)) {
            this.setCameraView(key);
        }
    }

    focusMannequin() {
        if (this.currentMannequin) {
            this.fitCameraToMannequin(this.currentMannequin);
        } else {
            const mannequin = this.scene.children.find(child => child.userData?.category === 'mannequin' || child.name?.includes('mannequin'));
            if (mannequin) {
                this.fitCameraToMannequin(mannequin);
            } else if (this.fittedDistance && this.fittedTarget) {
                this.camera.position.set(0, this.fittedTarget.y, this.fittedDistance);
                this.controls.target.copy(this.fittedTarget);
                this.controls.update();
            }
        }
    }

    setCameraView(viewKey) {
        const distance = this.fittedDistance || 3;
        const height = this.fittedTarget ? this.fittedTarget.y : 1.0;
        const target = this.fittedTarget ? this.fittedTarget.clone() : new THREE.Vector3(0, height, 0);

        switch (viewKey) {
            case '2': // Front
                this.camera.position.set(0, height, distance);
                break;
            case '8': // Back
                this.camera.position.set(0, height, -distance);
                break;
            case '4': // Left
                this.camera.position.set(-distance, height, 0);
                break;
            case '6': // Right
                this.camera.position.set(distance, height, 0);
                break;
            case '5': // Top
                this.camera.position.set(0, distance + height, 0.01);
                break;
            case '0': // Bottom
                this.camera.position.set(0, -distance + height, 0.01);
                break;
        }

        this.controls.target.copy(target);
        this.controls.update();
    }

    fitCameraToMannequin(object) {
        const mannequin = object || this.currentMannequin;
        if (!mannequin) return;

        this.currentMannequin = mannequin;
        mannequin.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(mannequin);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const fovRad = this.camera.fov * (Math.PI / 180);
        
        // Take desktop right UI panel (width ~340px) into account for visual framing
        const isDesktop = window.innerWidth > 800;
        const effectiveWidth = isDesktop ? Math.max(window.innerWidth - 360, window.innerWidth * 0.6) : window.innerWidth;
        const effectiveAspect = effectiveWidth / window.innerHeight;

        // Calculate distance required to fit full vertical height (head to toe)
        const distanceV = (size.y / 2) / Math.tan(fovRad / 2);
        // Calculate distance required to fit full width (arms/shoulders)
        const distanceH = (size.x / 2) / (Math.tan(fovRad / 2) * effectiveAspect);

        // Generous framing padding (1.30) so the entire figure from feet to head is comfortably framed
        const paddingFactor = 1.30;
        const distance = Math.max(distanceV, distanceH) * paddingFactor;

        // Target center of mannequin body (around mid-torso)
        const targetY = size.y > 0 ? (box.min.y + size.y * 0.52) : center.y;
        const targetX = 0;
        const targetZ = 0;

        this.fittedDistance = distance;
        this.fittedTarget = new THREE.Vector3(targetX, targetY, targetZ);

        // Adjust OrbitControls boundaries to match model scale
        this.controls.minDistance = Math.max(0.4, distance * 0.2);
        this.controls.maxDistance = Math.max(10, distance * 3.5);

        // Position camera in front view
        this.camera.position.set(targetX, targetY, distance);
        this.controls.target.copy(this.fittedTarget);
        this.controls.update();
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(3, 5, 4);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 20;
        directionalLight.shadow.camera.top = 2.5;
        directionalLight.shadow.camera.bottom = -0.5;
        directionalLight.shadow.camera.left = -2.0;
        directionalLight.shadow.camera.right = 2.0;
        directionalLight.shadow.bias = -0.0005;
        this.scene.add(directionalLight);
        this.mainLight = directionalLight;

        const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
        fillLight.position.set(-3, 3, -2);
        this.scene.add(fillLight);
    }

    setShadows(enabled) {
        this.renderer.shadowMap.enabled = enabled;
        this.scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = enabled;
                child.receiveShadow = enabled;
            }
        });
        this.renderer.shadowMap.needsUpdate = true;
    }

    setShadowIntensity(intensity) {
        if (this.mainLight) {
            this.mainLight.intensity = intensity;
        }
    }

    setupGround() {
        const groundGeometry = new THREE.PlaneGeometry(10, 10);
        const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    setupGrid() {
        this.grid = new THREE.GridHelper(6, 12, 0x444444, 0x222222);
        this.grid.position.y = 0.001;
        this.scene.add(this.grid);
    }

    setGridVisibility(visible) {
        if (this.grid) {
            this.grid.visible = visible;
        }
    }

    rotateLights(angle) {
        if (this.mainLight) {
            const rad = (angle * Math.PI) / 180;
            const radius = 5;
            this.mainLight.position.x = Math.sin(rad) * radius;
            this.mainLight.position.z = Math.cos(rad) * radius;
            this.mainLight.lookAt(0, 1.0, 0);
        }
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

    toggleAutoSpin() {
        this.isAutoSpin = !this.isAutoSpin;
        this.controls.autoRotate = this.isAutoSpin;
        this.controls.autoRotateSpeed = 2.0;
        return this.isAutoSpin;
    }

    setBackgroundColor(color) {
        this.scene.background = new THREE.Color(color);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update() {
        this.controls.update();
    }

    render() {
        if (this.xrPanel && this.xrPanel.visible) {
            this.xrPanel.quaternion.copy(this.camera.quaternion);
        }
        this.renderer.render(this.scene, this.camera);
    }
}
