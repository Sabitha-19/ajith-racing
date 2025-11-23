export default class PowerUp {
constructor(scene) {
this.scene = scene;
this.mesh = null;
}


spawn(x, z) {
const geometry = new THREE.SphereGeometry(1, 16, 16);
const material = new THREE.MeshStandardMaterial({ color: 0xffff00 });
this.mesh = new THREE.Mesh(geometry, material);
this.mesh.position.set(x, 1, z);
this.scene.add(this.mesh);
}


update() {
if (this.mesh) this.mesh.rotation.y += 0.05;
}
}
