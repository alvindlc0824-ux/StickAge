import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
export class AssetManager{
constructor(){this.loader=new GLTFLoader();this.cache=new Map()}
async loadModel(url){if(this.cache.has(url))return this.cache.get(url);const g=await this.loader.loadAsync(url);this.cache.set(url,g);return g}
}