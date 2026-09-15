import * as THREE from "three";

/** Small deterministic PRNG — keeps scene generation pure and reproducible. */
export function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Even point distribution on a sphere. Golden-angle spiral — no clustering at
 * the poles, which a naive lat/lng grid gives you.
 */
export function fibonacciSphere(count: number, radius = 1) {
  const points: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    points.push(
      new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius),
    );
  }
  return points;
}

/**
 * Connects a sampled subset of nodes to their nearest neighbours. Runs once at
 * mount; sampling keeps it O(sample^2) instead of O(nodes^2).
 */
export function nearestNeighbourEdges(
  points: THREE.Vector3[],
  { sample = 600, k = 2, maxDistance = Infinity } = {},
) {
  const step = Math.max(1, Math.floor(points.length / sample));
  const subset: THREE.Vector3[] = [];
  for (let i = 0; i < points.length; i += step) subset.push(points[i]);

  const positions: number[] = [];
  // Keep the k best as we go. The previous version allocated one object per
  // candidate pair and sorted them, which dominated the hero's mount cost.
  const bestDist = new Float64Array(k);
  const bestIdx = new Int32Array(k);

  for (let i = 0; i < subset.length; i++) {
    const a = subset[i];
    bestDist.fill(Infinity);
    bestIdx.fill(-1);

    for (let j = 0; j < subset.length; j++) {
      if (i === j) continue;
      const d = a.distanceToSquared(subset[j]);
      if (d >= bestDist[k - 1]) continue;
      let slot = k - 1;
      while (slot > 0 && bestDist[slot - 1] > d) {
        bestDist[slot] = bestDist[slot - 1];
        bestIdx[slot] = bestIdx[slot - 1];
        slot--;
      }
      bestDist[slot] = d;
      bestIdx[slot] = j;
    }

    const maxSq = maxDistance * maxDistance;
    for (let n = 0; n < k; n++) {
      if (bestIdx[n] < 0 || bestDist[n] > maxSq) continue;
      const b = subset[bestIdx[n]];
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }

  return new Float32Array(positions);
}

/** Expanding-ring pulses that read as requests propagating across the graph. */
export class PulseField {
  readonly uniform: THREE.Vector4[];
  private speeds: number[];
  private delays: number[];

  constructor(count: number) {
    this.uniform = [];
    this.speeds = [];
    this.delays = [];
    for (let i = 0; i < count; i++) {
      this.uniform.push(new THREE.Vector4(0, 1, 0, 10));
      this.speeds.push(0);
      this.delays.push(0.25 + i * 1.9);
    }
  }

  private respawn(i: number) {
    const dir = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
    ).normalize();
    this.uniform[i].set(dir.x, dir.y, dir.z, 0);
    this.speeds[i] = 0.26 + Math.random() * 0.3;
  }

  update(dt: number) {
    for (let i = 0; i < this.uniform.length; i++) {
      if (this.delays[i] > 0) {
        this.delays[i] -= dt;
        // Park the ring off-sphere so it contributes nothing while dormant.
        this.uniform[i].w = 99;
        if (this.delays[i] <= 0) this.respawn(i);
        continue;
      }
      this.uniform[i].w += this.speeds[i] * dt;
      if (this.uniform[i].w > Math.PI + 0.4) {
        this.delays[i] = 1.4 + Math.random() * 3.6;
      }
    }
  }
}
