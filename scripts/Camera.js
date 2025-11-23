export default class FollowCamera {
constructor(camera, racer) {
this.camera = camera;
this.racer = racer;
}


update() {
if (!this.racer.mesh) return;


const targetPos = this.racer.mesh.position;
this.camera.position.lerp(
new THREE.Vector3(targetPos.x, targetPos.y + 8, targetPos.z + 14),
0.1
);
this.camera.lookAt(targetPos);
}
}
