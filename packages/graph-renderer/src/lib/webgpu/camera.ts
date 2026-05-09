/**
 * @fileoverview WebGPU camera system with orbit controls.
 * Exports: WebGPUCamera
 */

export type Vec3 = { x: number; y: number; z: number };
export type Quat = { x: number; y: number; z: number; w: number };

export interface CameraState {
  position: Vec3;
  target: Vec3;
  up: Vec3;
  fov: number;
  near: number;
  far: number;
}

export interface OrbitControlsState {
  azimuth: number;
  elevation: number;
  distance: number;
  target: Vec3;
}

/**
 * WebGPU camera with orbit controls and projection matrices.
 */
export class WebGPUCamera {
  private state: CameraState;
  private orbitState: OrbitControlsState;
  private viewMatrix: Float32Array;
  private projectionMatrix: Float32Array;
  private viewProjectionMatrix: Float32Array;

  constructor() {
    this.state = {
      position: { x: 0, y: 0, z: 500 },
      target: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 1, z: 0 },
      fov: 60,
      near: 0.1,
      far: 10000,
    };

    this.orbitState = {
      azimuth: 0,
      elevation: Math.PI / 4,
      distance: 500,
      target: { x: 0, y: 0, z: 0 },
    };

    this.viewMatrix = new Float32Array(16);
    this.projectionMatrix = new Float32Array(16);
    this.viewProjectionMatrix = new Float32Array(16);

    this.updateFromOrbit();
  }

  /**
   * Update camera position from orbit controls state.
   */
  private updateFromOrbit(): void {
    const { azimuth, elevation, distance, target } = this.orbitState;

    this.state.position.x = target.x + distance * Math.cos(elevation) * Math.sin(azimuth);
    this.state.position.y = target.y + distance * Math.sin(elevation);
    this.state.position.z = target.z + distance * Math.cos(elevation) * Math.cos(azimuth);
    this.state.target = target;

    this.updateMatrices();
  }

  /**
   * Update view and projection matrices.
   */
  private updateMatrices(): void {
    this.updateViewMatrix();
    this.updateProjectionMatrix();
    this.multiplyMatrices(this.viewMatrix, this.projectionMatrix, this.viewProjectionMatrix);
  }

  /**
   * Update view matrix from camera state.
   */
  private updateViewMatrix(): void {
    const { position, target, up } = this.state;

    const zAxis = this.normalize({
      x: position.x - target.x,
      y: position.y - target.y,
      z: position.z - target.z,
    });

    const xAxis = this.normalize(this.cross(up, zAxis));
    const yAxis = this.cross(zAxis, xAxis);

    this.viewMatrix[0] = xAxis.x;
    this.viewMatrix[1] = yAxis.x;
    this.viewMatrix[2] = zAxis.x;
    this.viewMatrix[3] = 0;

    this.viewMatrix[4] = xAxis.y;
    this.viewMatrix[5] = yAxis.y;
    this.viewMatrix[6] = zAxis.y;
    this.viewMatrix[7] = 0;

    this.viewMatrix[8] = xAxis.z;
    this.viewMatrix[9] = yAxis.z;
    this.viewMatrix[10] = zAxis.z;
    this.viewMatrix[11] = 0;

    this.viewMatrix[12] = -this.dot(xAxis, position);
    this.viewMatrix[13] = -this.dot(yAxis, position);
    this.viewMatrix[14] = -this.dot(zAxis, position);
    this.viewMatrix[15] = 1;
  }

  /**
   * Update projection matrix for perspective camera.
   */
  private updateProjectionMatrix(): void {
    const { fov, near, far } = this.state;
    const aspect = this.aspect;

    const f = 1.0 / Math.tan((fov * Math.PI) / 360);
    const nf = 1 / (near - far);

    this.projectionMatrix[0] = f / aspect;
    this.projectionMatrix[1] = 0;
    this.projectionMatrix[2] = 0;
    this.projectionMatrix[3] = 0;

    this.projectionMatrix[4] = 0;
    this.projectionMatrix[5] = f;
    this.projectionMatrix[6] = 0;
    this.projectionMatrix[7] = 0;

    this.projectionMatrix[8] = 0;
    this.projectionMatrix[9] = 0;
    this.projectionMatrix[10] = (far + near) * nf;
    this.projectionMatrix[11] = -1;

    this.projectionMatrix[12] = 0;
    this.projectionMatrix[13] = 0;
    this.projectionMatrix[14] = 2 * far * near * nf;
    this.projectionMatrix[15] = 0;
  }

  private aspect: number = 1;

  /**
   * Set aspect ratio for projection matrix.
   */
  setAspect(aspect: number): void {
    this.aspect = aspect;
    this.updateMatrices();
  }

  /**
   * Get view-projection matrix as Float32Array for WebGPU.
   */
  getViewProjectionMatrix(): Float32Array {
    return this.viewProjectionMatrix;
  }

  /**
   * Get view matrix.
   */
  getViewMatrix(): Float32Array {
    return this.viewMatrix;
  }

  /**
   * Get projection matrix.
   */
  getProjectionMatrix(): Float32Array {
    return this.projectionMatrix;
  }

  /**
   * Get camera position.
   */
  getPosition(): Vec3 {
    return this.state.position;
  }

  /**
   * Get camera target (look-at point).
   */
  getTarget(): Vec3 {
    return this.state.target;
  }

  /**
   * Set camera position directly.
   */
  setPosition(position: Vec3): void {
    this.state.position = position;
    this.updateMatrices();
  }

  /**
   * Set camera target (look-at point).
   */
  setTarget(target: Vec3): void {
    this.state.target = target;
    this.orbitState.target = target;
    this.updateMatrices();
  }

  /**
   * Rotate camera around target (orbit controls).
   */
  rotate(deltaAzimuth: number, deltaElevation: number): void {
    this.orbitState.azimuth += deltaAzimuth;
    this.orbitState.elevation = Math.max(
      -Math.PI / 2 + 0.01,
      Math.min(Math.PI / 2 - 0.01, this.orbitState.elevation + deltaElevation)
    );
    this.updateFromOrbit();
  }

  /**
   * Zoom camera (adjust distance from target).
   */
  zoom(delta: number): void {
    this.orbitState.distance = Math.max(10, this.orbitState.distance + delta);
    this.updateFromOrbit();
  }

  /**
   * Pan camera (move target and position together).
   */
  pan(deltaX: number, deltaY: number): void {
    const { position, target, up } = this.state;

    const zAxis = this.normalize({
      x: position.x - target.x,
      y: position.y - target.y,
      z: position.z - target.z,
    });

    const xAxis = this.normalize(this.cross(up, zAxis));
    const yAxis = this.cross(zAxis, xAxis);

    this.orbitState.target.x += xAxis.x * deltaX + yAxis.x * deltaY;
    this.orbitState.target.y += xAxis.y * deltaX + yAxis.y * deltaY;
    this.orbitState.target.z += xAxis.z * deltaX + yAxis.z * deltaY;

    this.updateFromOrbit();
  }

  /**
   * Zoom to fit a bounding box.
   */
  zoomToFit(min: Vec3, max: Vec3, padding: number = 1.2): void {
    const center = {
      x: (min.x + max.x) / 2,
      y: (min.y + max.y) / 2,
      z: (min.z + max.z) / 2,
    };

    const size = {
      x: max.x - min.x,
      y: max.y - min.y,
      z: max.z - min.z,
    };

    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = (maxDim / 2) / Math.tan((this.state.fov * Math.PI) / 360) * padding;

    this.orbitState.target = center;
    this.orbitState.distance = distance;
    this.orbitState.azimuth = 0;
    this.orbitState.elevation = Math.PI / 4;

    this.updateFromOrbit();
  }

  // Vector math helpers
  private normalize(v: Vec3): Vec3 {
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    return len > 0 ? { x: v.x / len, y: v.y / len, z: v.z / len } : { x: 0, y: 0, z: 0 };
  }

  private cross(a: Vec3, b: Vec3): Vec3 {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x,
    };
  }

  private dot(a: Vec3, b: Vec3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  private multiplyMatrices(a: Float32Array, b: Float32Array, out: Float32Array): void {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        out[i * 4 + j] =
          a[i * 4 + 0] * b[0 * 4 + j] +
          a[i * 4 + 1] * b[1 * 4 + j] +
          a[i * 4 + 2] * b[2 * 4 + j] +
          a[i * 4 + 3] * b[3 * 4 + j];
      }
    }
  }
}