export class MannequinController {
    constructor(scene, loader, sceneManager) {
        this.scene = scene;
        this.loader = loader;
        this.sceneManager = sceneManager;
        this.currentMannequin = null;
    }

    async loadMannequin(gender) {
        console.log(`MannequinController: Loading ${gender} mannequin...`);
        if (this.currentMannequin) {
            this.scene.remove(this.currentMannequin);
        }
        
        // Local mannequin URLs
        const url = gender === 'male' 
            ? '/assets/mannequins/male_mannequin.glb' 
            : '/assets/mannequins/female_mannequin.glb';

        const model = await this.loader.load(url);
        if (model) {
            console.log(`MannequinController: ${gender} mannequin loaded.`);
            // Scale cm models to standard meters (1 unit = 1 meter)
            model.scale.set(0.01, 0.01, 0.01);
            model.position.set(0, 0, 0);
            model.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.userData.category = 'mannequin';
                }
            });
            this.scene.add(model);
            this.currentMannequin = model;
            this.sceneManager.currentMannequin = model;
            
            // Auto fit camera to properly frame the mannequin in viewport
            this.sceneManager.fitCameraToMannequin(model);
        } else {
            console.error(`MannequinController: Failed to load ${gender} mannequin.`);
        }
    }
}
