export default class EnemyRacer {
constructor(scene) {
this.scene = scene;
this.mesh = null;
this.speed = 1.3;
}


load() {
const geometry = new THREE.BoxGeometry(2, 1, 4);
const material = new THREE.MeshStandardMaterial({ color: 0x0000ff });
this.mesh = new THREE.Mesh(geometry, material);
this.mesh.position.set(0, 0.5, -20);
this.scene.add(this.mesh);
}


update() {
if (!this.mesh) return;


this.mesh.position.z += this.speed;
}
}
