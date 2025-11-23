export default class Racer {
constructor(scene) {
this.scene = scene;
this.mesh = null;
this.speed = 0;
this.maxSpeed = 2;
this.acceleration = 0.05;
this.turnSpeed = 0.04;
}


load() {
const geometry = new THREE.BoxGeometry(2, 1, 4);
const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
this.mesh = new THREE.Mesh(geometry, material);
this.mesh.castShadow = true;
this.mesh.position.set(0, 0.5, 0);
this.scene.add(this.mesh);
}


update(input) {
if (!this.mesh) return;


if (input.forward) this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
else this.speed *= 0.95;


if (input.left) this.mesh.rotation.y += this.turnSpeed;
if (input.right) this.mesh.rotation.y -= this.turnSpeed;


this.mesh.position.x += Math.sin(this.mesh.rotation.y) * this.speed;
this.mesh.position.z += Math.cos(this.mesh.rotation.y) * this.speed;
}
}

