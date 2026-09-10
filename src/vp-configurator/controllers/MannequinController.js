export class MannequinController {
    constructor(scene, loader, cameraManager) {
        this.scene = scene;
        this.loader = loader;
        this.cameraManager = cameraManager;
        this.currentMannequin = null;
        this.currentGender = null;
    }

    async loadMannequin(gender) {
        if (this.currentMannequin) {
            this.scene.remove(this.currentMannequin);
        }

        // Local mannequin URLs
        const url = gender === 'male' 
            ? '/assets/mannequins/male_mannequin.glb' 
            : '/assets/mannequins/female_mannequin.glb';

        const model = await this.loader.load(url);
        if (model) {
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
            this.currentGender = gender;
            
            // Auto-fit camera
            if (this.cameraManager.autoFit) {
                this.cameraManager.autoFit(model);
            } else if (this.cameraManager.fitCameraToMannequin) {
                this.cameraManager.fitCameraToMannequin(model);
            }
        }
    }

    toggleVisibility(visible) {
        if (this.currentMannequin) {
            this.currentMannequin.visible = visible;
        }
    }
}
