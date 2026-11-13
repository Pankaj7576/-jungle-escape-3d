import * as THREE from 'three';

export class RunnerCamera {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    this.positionVelocity = new THREE.Vector3();
    this.lookTarget = new THREE.Vector3();
    this.currentLook = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();
    this.desired = new THREE.Vector3();
    this.up = new THREE.Vector3(0, 1, 0);
    this.initialized = false;
  }

  update(dt, runnerPosition, tangent, jumpHeight = 0, turnBlend = 1) {
    const forward = tangent.clone().normalize();
    const behind = runnerPosition.clone().addScaledVector(forward, -8.6);
    this.desired.copy(behind).add(new THREE.Vector3(0, 4.4 + Math.min(jumpHeight * .12, .35), 0));
    const target = runnerPosition.clone().addScaledVector(forward, 5.8);
    target.y += 1.1;
    if (!this.initialized) {
      this.camera.position.copy(this.desired);
      this.currentLook.copy(target);
      this.initialized = true;
    }

    const ray = this.desired.clone().sub(runnerPosition.clone().add(new THREE.Vector3(0, 1.7, 0)));
    const distance = ray.length();
    this.raycaster.set(runnerPosition.clone().add(new THREE.Vector3(0, 1.7, 0)), ray.normalize());
    this.raycaster.far = distance;
    const hits = this.raycaster.intersectObjects(this.scene.children, true);
    const obstruction = hits.find(hit => hit.distance > 1.1 && hit.object.visible && !hit.object.userData.noCameraCollision);
    if (obstruction) {
      const safeDistance = Math.max(3.8, obstruction.distance - .65);
      this.desired.copy(this.raycaster.ray.origin).addScaledVector(this.raycaster.ray.direction, safeDistance);
    }

    const positionAlpha = 1 - Math.exp(-dt * 5.2);
    const lookAlpha = 1 - Math.exp(-dt * 7.5);
    this.camera.position.lerp(this.desired, positionAlpha);
    this.currentLook.lerp(target, lookAlpha);
    this.camera.up.lerp(this.up, 1 - Math.exp(-dt * 3));
    this.camera.lookAt(this.currentLook);
  }
}
