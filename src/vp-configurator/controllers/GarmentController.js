export class GarmentController {
    constructor(scene, loader) {
        this.scene = scene;
        this.loader = loader;
        this.garments = {
            top: null,
            bottom: null,
            jacket: null,
            comboset: null
        };
    }

    async loadGarment(category, id, config) {
        // Find garment in config
        const garmentData = config[category]?.find(g => g.id === id);
        if (!garmentData) return;

        // Remove existing
        if (this.garments[category]) {
            this.scene.remove(this.garments[category]);
        }

        // Auto-map URL if it's missing or pointing to external placeholder
        let url = garmentData.url || garmentData.url_glb;
        if (!url || url.includes('githubusercontent.com') || url.includes('khronos.org')) {
            url = `/assets/models/${id}.glb`;
            console.log(`GarmentController: Auto-mapping ${id} to ${url}`);
        }

        const model = await this.loader.load(url);
        if (model) {
            model.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.userData.category = category;
                }
            });
            this.scene.add(model);
            this.garments[category] = model;
        }
    }
}
