import { TextureLoader, CubeTextureLoader } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import EventEmitter from './EventEmitter.js';

export default class Resources extends EventEmitter {
    constructor(sources) {
        super();

        this.sources = sources;

        this.items = {};
        this.toLoad = this.sources.length;
        this.loaded = 0;

        this.setLoaders();
        this.startLoading();

        // Drag&Drop event
        window.addEventListener('drop', e => {
            e.preventDefault();

            const blobData = this.handleFileDrop(e);
            this.notifyCorrectUpdate(blobData);
        });

        window.addEventListener('dragover', e => {
            e.preventDefault();
        });
    }

    setLoaders() {
        this.loaders = {};
        this.loaders.gltfLoader = new GLTFLoader();
        this.loaders.dracoLoader = new DRACOLoader();
        this.loaders.dracoLoader.setDecoderPath('draco/');
        this.loaders.gltfLoader.setDRACOLoader(this.loaders.dracoLoader);
        this.loaders.textureLoader = new TextureLoader();
        this.loaders.cubeTextureLoader = new CubeTextureLoader();
        this.loaders.rgbeLoader = new RGBELoader();
    }

    startLoading() {
        // Load each source
        for (const source of this.sources) {
            if (source.type === 'gltfModel') {
                this.loaders.gltfLoader.load(source.path, file => {
                    this.sourceLoaded(source, file);
                });
            } else if (source.type === 'hdrTexture') {
                this.loaders.rgbeLoader.load(source.path, file => {
                    this.sourceLoaded(source, file);
                });
            } else if (source.type === 'texture') {
                this.loaders.textureLoader.load(source.path, file => {
                    this.sourceLoaded(source, file);
                });
            } else if (source.type === 'cubeTexture') {
                this.loaders.cubeTextureLoader.load(source.path, file => {
                    this.sourceLoaded(source, file);
                });
            }
        }
    }

    sourceLoaded(source, file) {
        this.items[source.name] = file;

        this.loaded++;

        if (this.loaded === this.toLoad) {
            this.trigger('ready');
        }
    }

    handleFileDrop = e => {
        const files = e.dataTransfer.files;

        if (!files) return;

        const file = files[0];

        if (!file) return;

        const type = file.name.split('.').pop();
        return { url: URL.createObjectURL(file), type };
    };

    notifyCorrectUpdate = data => {
        const { url, type } = data;

        switch (type) {
            case 'hdr':
                this.trigger('updateHdr', [url]);
                break;

            case 'glb':
                this.trigger('updateGlb', [url]);
                break;
            default:
                break;
        }
    };
}
