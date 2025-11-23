# Updated Racer Game Files (Option B Architecture)

Below are the updated scripts for the **6 main files** used in the Option B architecture using `RacerGame.js` as the controller.

---

## **Track.js**

```javascript
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
```

---

## **Racer.js**

```javascript
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
```

---

## **Camera.js**

```javascript
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
```

---

## **TouchControls.js**

```javascript
export default class TouchControls {
    constructor() {
        this.forward = false;
        this.left = false;
        this.right = false;

        this.#setupKeyboard();
    }

    #setupKeyboard() {
        window.addEventListener("keydown", (e) => {
            if (e.code === "ArrowUp") this.forward = true;
            if (e.code === "ArrowLeft") this.left = true;
            if (e.code === "ArrowRight") this.right = true;
        });

        window.addEventListener("keyup", (e) => {
            if (e.code === "ArrowUp") this.forward = false;
            if (e.code === "ArrowLeft") this.left = false;
            if (e.code === "ArrowRight") this.right = false;
        });
    }
}
```

---

## **EnemyRacer.js**

```javascript
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
```

---

## **PowerUp.js**

```javascript
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
```

---

