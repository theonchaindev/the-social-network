import * as THREE from "three";

export type GraphData = {
  positions: THREE.Vector3[];
  edges: [number, number][];
  neighbours: number[][];
  /** Normalised order each node/edge appears in as the graph grows. */
  nodeOrder: Float32Array;
  edgeOrder: Float32Array;
};

/**
 * Preferential attachment, then a few hundred force-directed iterations.
 * Growing by attachment is what gives the hub-and-spoke shape a real social
 * graph has — uniform random edges look like noise.
 */
export function buildSocialGraph(count: number, seed = 7): GraphData {
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };

  const edges: [number, number][] = [];
  const degree = new Array(count).fill(0);
  const neighbours: number[][] = Array.from({ length: count }, () => []);

  const link = (a: number, b: number) => {
    edges.push([a, b]);
    degree[a]++;
    degree[b]++;
    neighbours[a].push(b);
    neighbours[b].push(a);
  };

  for (let i = 1; i < count; i++) {
    const links = i < 4 ? 1 : 1 + (rand() < 0.35 ? 1 : 0);
    const chosen = new Set<number>();
    for (let l = 0; l < links; l++) {
      // Roulette-wheel over existing degree — hubs attract hubs.
      const total = degree.slice(0, i).reduce((acc, d) => acc + d + 1, 0);
      let pick = rand() * total;
      let target = 0;
      for (let j = 0; j < i; j++) {
        pick -= degree[j] + 1;
        if (pick <= 0) {
          target = j;
          break;
        }
      }
      if (!chosen.has(target)) {
        chosen.add(target);
        link(i, target);
      }
    }
  }

  // --- force-directed layout ---
  const positions: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    positions.push(
      new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(4),
    );
  }
  positions[0].set(0, 0, 0);

  const disp = positions.map(() => new THREE.Vector3());
  const k = 1.15;
  const delta = new THREE.Vector3();

  for (let iter = 0; iter < 260; iter++) {
    const temp = 0.9 * (1 - iter / 260) + 0.02;
    disp.forEach((d) => d.set(0, 0, 0));

    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        delta.subVectors(positions[i], positions[j]);
        let dist = delta.length();
        if (dist < 0.001) {
          delta.set(rand() - 0.5, rand() - 0.5, rand() - 0.5);
          dist = 0.001;
        }
        const force = (k * k) / dist;
        delta.multiplyScalar(force / dist);
        disp[i].add(delta);
        disp[j].sub(delta);
      }
    }

    for (const [a, b] of edges) {
      delta.subVectors(positions[a], positions[b]);
      const dist = Math.max(0.001, delta.length());
      const force = (dist * dist) / k;
      delta.multiplyScalar(force / dist);
      disp[a].sub(delta);
      disp[b].add(delta);
    }

    for (let i = 0; i < count; i++) {
      const d = disp[i];
      const len = Math.max(0.001, d.length());
      positions[i].add(d.multiplyScalar(Math.min(len, temp) / len));
      // Gentle pull to origin keeps the cloud from drifting apart.
      positions[i].multiplyScalar(0.995);
    }
  }

  // Normalise into a predictable radius so framing is stable across counts.
  const bounds = new THREE.Box3().setFromPoints(positions);
  const size = bounds.getSize(new THREE.Vector3()).length();
  const centre = bounds.getCenter(new THREE.Vector3());
  const scale = 7.6 / (size || 1);
  positions.forEach((p) => p.sub(centre).multiplyScalar(scale));

  const nodeOrder = new Float32Array(count);
  for (let i = 0; i < count; i++) nodeOrder[i] = i / (count - 1);

  const edgeOrder = new Float32Array(edges.length);
  edges.forEach(([a, b], i) => {
    // An edge can only appear once both of its nodes have.
    edgeOrder[i] = Math.max(nodeOrder[a], nodeOrder[b]);
  });

  return { positions, edges, neighbours, nodeOrder, edgeOrder };
}
