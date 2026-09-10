export class ColorController {
    constructor(scene) {
        this.scene = scene;
    }

    applyColor(category, hex) {
        this.scene.traverse(child => {
            // Check for garment category or mannequin
            const isTarget = (child.userData.category === category) || 
                           (category === 'mannequin' && child.userData.isMannequin);

            if (child.isMesh && isTarget) {
                if (child.material) {
                    // Clone material to avoid affecting other instances if any
                    if (!child.userData.originalMaterial) {
                        child.userData.originalMaterial = child.material.clone();
                    }
                    
                    // Preserve transparency if it was set by GarmentController
                    const isTransparent = child.material.transparent;
                    const currentOpacity = child.material.opacity;

                    child.material = child.userData.originalMaterial.clone();
                    child.material.color.set(hex);
                    
                    if (isTransparent) {
                        child.material.transparent = true;
                        child.material.opacity = currentOpacity;
                    }
                }
            }
        });
    }
}
