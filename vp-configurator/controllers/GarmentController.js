export class GarmentController {
    constructor(scene, loader) {
        this.scene = scene;
        this.loader = loader;
        this.parent = scene; // Default to scene
        this.garments = {
            top: null,
            bottom: null,
            jacket: null,
            dress: null,
            comboset: null
        };
        this.time = 0;
    }

    setParent(parent) {
        this.parent = parent || this.scene;
    }

    async loadMixGarment(category, garmentId, config, fadeEnabled = true) {
        // 1. Remove previous garment in category
        if (this.garments[category]) {
            if (fadeEnabled) {
                await this.animateFadeOut(this.garments[category]);
            }
            this.parent.remove(this.garments[category]);
            this.garments[category] = null;
        }

        if (!garmentId) return;

        // 2. Load new garment
        const garmentData = config[category].find(g => g.id === garmentId);
        if (!garmentData) return;

        // Auto-map URL if it's missing or pointing to external placeholder
        let url = garmentData.url || garmentData.url_glb;
        if (!url || url.includes('githubusercontent.com') || url.includes('khronos.org')) {
            url = `/assets/models/${garmentId}.glb`;
            console.log(`GarmentController: Auto-mapping ${garmentId} to ${url}`);
        }

        const model = await this.loader.load(url);
        if (model) {
            this.prepareModel(model, category, fadeEnabled);
            this.parent.add(model);
            this.garments[category] = model;
            
            if (fadeEnabled) {
                this.animateFadeIn(model);
            }
        }
    }

    async loadDressCombo(comboId, config, fadeEnabled = false) {
        if (!comboId) {
            await this.clearGarments(fadeEnabled);
            return;
        }

        // 1. Identify dress or comboset data
        let comboData = config.dress?.find(c => c.id === comboId);
        let category = 'dress';
        
        if (!comboData && config.comboset) {
            comboData = config.comboset.find(c => c.id === comboId);
            category = 'comboset';
        }
        
        if (!comboData) {
            console.warn(`GarmentController: comboId not found in config: ${comboId}`);
            return;
        }

        // Auto-map URL if it's missing or pointing to external placeholder
        let url = comboData.url || comboData.url_glb;
        if (!url || url.includes('githubusercontent.com') || url.includes('khronos.org')) {
            url = `/assets/models/${comboId}.glb`;
            console.log(`GarmentController: Auto-mapping combo ${comboId} to ${url}`);
        }

        // 2. Load the new dress model FIRST so replacement is immediate and smooth
        const model = await this.loader.load(url);
        if (model) {
            model.userData.id = comboId;
            this.prepareModel(model, category, fadeEnabled);

            // Collect existing dress/garments to remove
            const oldGarments = [];
            ['dress', 'comboset', 'top', 'bottom', 'jacket'].forEach(cat => {
                if (this.garments[cat] && this.garments[cat] !== model) {
                    oldGarments.push(this.garments[cat]);
                    this.garments[cat] = null;
                }
            });

            // Add the new dress to the mannequin / person
            this.parent.add(model);
            this.garments[category] = model;
            if (category === 'dress') {
                this.garments.comboset = model;
            } else {
                this.garments.dress = model;
            }

            // Remove and dispose old dress/garment meshes cleanly
            oldGarments.forEach(oldModel => {
                if (oldModel.parent) {
                    oldModel.parent.remove(oldModel);
                } else {
                    this.parent.remove(oldModel);
                }
                this.disposeObject(oldModel);
            });
            
            if (fadeEnabled) {
                this.animateFadeIn(model);
            }
        } else {
            console.error(`GarmentController: Failed to load dress model: ${url}`);
        }
    }

    disposeObject(obj) {
        if (!obj) return;
        obj.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    }

    async clearGarments(fadeEnabled = true) {
        const categories = Object.keys(this.garments);
        const fadePromises = [];

        categories.forEach(cat => {
            if (this.garments[cat]) {
                if (fadeEnabled) {
                    fadePromises.push(this.animateFadeOut(this.garments[cat]));
                } else {
                    this.parent.remove(this.garments[cat]);
                    this.garments[cat] = null;
                }
            }
        });

        if (fadePromises.length > 0) {
            await Promise.all(fadePromises);
            categories.forEach(cat => {
                if (this.garments[cat]) {
                    this.parent.remove(this.garments[cat]);
                    this.garments[cat] = null;
                }
            });
        }
    }

    prepareModel(model, category, fadeEnabled) {
        if (this.parent === this.scene) {
            model.scale.set(0.01, 0.01, 0.01);
        } else {
            model.scale.set(1, 1, 1);
        }
        model.position.set(0, 0, 0);

        model.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.userData.category = category;
                
                if (child.material) {
                    child.material = child.material.clone();
                    child.material.transparent = true;
                    child.material.opacity = fadeEnabled ? 0 : 1;
                }
            }
        });
    }

    animateFadeIn(model) {
        let opacity = 0;
        const animate = () => {
            if (opacity < 1) {
                opacity += 0.05;
                model.traverse(child => {
                    if (child.isMesh && child.material) {
                        child.material.opacity = opacity;
                    }
                });
                requestAnimationFrame(animate);
            }
        };
        animate();
    }

    async animateFadeOut(model) {
        return new Promise(resolve => {
            let opacity = 1;
            const animate = () => {
                if (opacity > 0) {
                    opacity -= 0.05;
                    model.traverse(child => {
                        if (child.isMesh && child.material) {
                            child.material.opacity = opacity;
                        }
                    });
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            animate();
        });
    }

    update(deltaTime) {
        this.time += deltaTime;
        // Keep garments solidly aligned with mannequin pose and body shape
    }
}
