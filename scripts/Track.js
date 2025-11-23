export default class Track {
constructor(scene) {
this.scene = scene;
this.trackMesh = null;
}


load() {
const geometry = new THREE.PlaneGeometry(500, 500, 20, 20);
const material = new THREE.MeshStandardMaterial({ color: 0x333333 });
this.trackMesh = new THREE.Mesh(geometry, material);
this.trackMesh.rotation.x = -Math.PI / 2;
this.trackMesh.receiveShadow = true;
this.scene.add(this.trackMesh);
}
}
