import * as THREE from 'three';

export class ColorController {
    constructor(scene) {
        this.scene = scene;
    }

    applyColor(category, color) {
        const threeColor = new THREE.Color(color);
        this.scene.traverse(child => {
            if (child.isMesh && child.material) {
                if (category === 'mannequin' && child.userData.isMannequin) {
                    child.material.color.copy(threeColor);
                } else if (child.userData.category === category) {
                    child.material.color.copy(threeColor);
                }
            }
        });
    }
}
