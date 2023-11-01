import {
    Mesh,
    Color,
    MeshStandardMaterial,
    EquirectangularReflectionMapping,
} from 'three';
import Experience from '@/Experience.js';
import { sceneParams, backgroundOptionsList } from '@/parameters/ui.js';
import { constructList } from '@/utils/functions';

import { ENV_BACKGROUND_COLOR, ENV_BACKGROUND_TEXTURE } from '@/constants';

export default class Environment {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.debug = this.experience.debug;

        this.environmentMap = {};
        this.environmentMap.texture = this.resources.items.default;

        this.setEnvironmentMap();

        // Debug Folder
        if (this.debug.active) {
            this.debugFolder = this.debug.pane.addFolder({
                title: 'environment',
            });

            this.debugFolder
                .addBinding(this.environmentMap, 'intensity', {
                    min: 0,
                    max: 4,
                    step: 0.1,
                })
                .on('change', this.updateMaterials);

            this.backgroundOptionsList = this.debugFolder
                .addBlade({
                    view: 'list',
                    label: 'background',
                    options: constructList(backgroundOptionsList),
                    value: ENV_BACKGROUND_COLOR,
                })
                .on('change', e => {
                    this.switchBackgroundType(e.value);
                    this.updateMaterials();
                });

            this.backgroundColorToggle = this.debugFolder
                .addBinding(this.scene, 'background', {
                    label: 'Background Color',
                    color: { type: 'float' },
                })
                .on('change', e => {
                    sceneParams.backgroundColor = e.value;
                    this.scene.background = e.value;
                    this.updateMaterials();
                });

            this.debugFolder
                .addButton({ title: 'update hdr' })
                .on('click', () => {
                    this.resources.inputButton.click();
                });
        }

        this.resources.on('updateHdr', url => {
            this.updateEnvironmentMap(url);
        });
    }

    setEnvironmentMap() {
        this.environmentMap.intensity = sceneParams.envMapIntensity;
        this.environmentMap.texture.mapping = EquirectangularReflectionMapping;

        this.scene.background = new Color(sceneParams.backgroundColor);
        this.scene.environment = this.environmentMap.texture;

        this.updateMaterials();
    }

    updateEnvironmentMap = hdrName => {
        const self = this;

        this.resources.loaders.rgbeLoader.load(hdrName, texture => {
            self.environmentMap.texture = texture;
            self.setEnvironmentMap();
        });
    };

    updateMaterials = () => {
        this.scene.traverse(child => {
            if (
                child instanceof Mesh &&
                child.material instanceof MeshStandardMaterial
            ) {
                child.material.envMap = this.environmentMap.texture;
                child.material.envMapIntensity = this.environmentMap.intensity;
                child.material.needsUpdate = true;
            }
        });
    };

    switchBackgroundType = type => {
        this.setHiddenParameters();

        switch (type) {
            case ENV_BACKGROUND_COLOR:
                if (this.backgroundColorToggle)
                    this.backgroundColorToggle.hidden = false;
                this.scene.background = new Color(sceneParams.backgroundColor);
                break;

            case ENV_BACKGROUND_TEXTURE:
                this.scene.background = this.environmentMap.texture;
                break;
            default:
                break;
        }
    };

    setHiddenParameters = () => {
        if (this.backgroundColorToggle)
            this.backgroundColorToggle.hidden = true;
    };
}
