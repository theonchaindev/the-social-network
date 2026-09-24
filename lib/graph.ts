import * as THREE from "three";

export type GraphData = {
  positions: THREE.Vector3[];
  edges: [number, number][];
  neighbours: number[][];
  /** Normalised order each node/edge appears in as the graph grows. */
  nodeOrder: Float32Array;
  edgeOrder: Float32Array;
  /** Index of the most-connected node; it sits at the centre of the layout. */
  hub: number;
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

  // --- radial layout -------------------------------------------------------
  // Root the drawing on the node that actually has the most connections, not on
  // node 0: preferential attachment does not guarantee the first node becomes
  // the hub, and laying out from a low-degree root puts one of the smallest
  // faces in the middle. Breadth-first from the real hub gives rings that read
  // as everything feeding off a centre.
  let hub = 0;
  for (let i = 1; i < count; i++) if (degree[i] > degree[hub]) hub = i;

  const depth = new Int32Array(count).fill(-1);
  const parent = new Int32Array(count).fill(-1);
  const order: number[] = [];
  depth[hub] = 0;
  const queue = [hub];
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head];
    order.push(node);
    for (const next of neighbours[node]) {
      if (depth[next] !== -1) continue;
      depth[next] = depth[node] + 1;
      parent[next] = node;
      queue.push(next);
    }
  }
  // Anything unreachable (shouldn't happen) lands on the outer ring.
  const maxDepth = Math.max(1, ...Array.from(depth));
  for (let i = 0; i < count; i++) if (depth[i] === -1) { depth[i] = maxDepth; order.push(i); }

  const children: number[][] = Array.from({ length: count }, () => []);
  for (let i = 0; i < count; i++) if (parent[i] >= 0) children[parent[i]].push(i);

  // Each branch gets an angular wedge proportional to how much hangs off it, so
  // a busy limb is not crushed into the same slice as a single leaf.
  const weight = new Float64Array(count);
  for (let i = order.length - 1; i >= 0; i--) {
    const node = order[i];
    weight[node] = children[node].length
      ? children[node].reduce((sum, c) => sum + weight[c], 0)
      : 1;
  }

  const angle = new Float64Array(count);
  const stack: [number, number, number][] = [[hub, 0, Math.PI * 2]];
  while (stack.length) {
    const [node, start, end] = stack.pop()!;
    angle[node] = (start + end) / 2;
    let cursor = start;
    for (const child of children[node]) {
      const span = (end - start) * (weight[child] / weight[node]);
      stack.push([child, cursor, cursor + span]);
      cursor += span;
    }
  }

  const RADIUS = 3.0;

  // Space the rings by how many nodes they hold, not by raw depth. A breadth
  // -first tree tapers to a long thin tail, so an even depth-to-radius map
  // parks almost every face inside the middle two thirds and leaves the outer
  // third to a handful of stragglers -- the disc then reads far smaller than
  // the frame it is fitted to. Placing ring d at the square root of the
  // fraction of nodes at depth <= d spreads the populated rings across the
  // full radius and pushes the sparse tail to the rim where it belongs.
  const perDepth = new Float32Array(maxDepth + 1);
  for (let i = 0; i < count; i++) perDepth[depth[i]] += 1;
  const ringRadius = new Float32Array(maxDepth + 1);
  const INNER = 0.3; // Keeps the first ring clear of the oversized hub.
  let seen = 0;
  for (let d = 0; d <= maxDepth; d++) {
    seen += perDepth[d];
    // Half population, half depth. Pure population would pile the sparse
    // deep rings on top of each other at the rim; pure depth is what left
    // the disc small. The blend keeps the rings evenly separated.
    const t = 0.5 * (d / maxDepth) + 0.5 * Math.sqrt(seen / count);
    ringRadius[d] = d === 0 ? 0 : RADIUS * (INNER + (1 - INNER) * t);
  }

  const positions: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    const r = ringRadius[depth[i]] * (0.94 + rand() * 0.12);
    const a = angle[i] + (rand() - 0.5) * 0.1;
    positions.push(
      new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, (rand() - 0.5) * 0.5),
    );
  }
  positions[hub].set(0, 0, 0);

  // Grow outward from the centre rather than in attachment order.
  const nodeOrder = new Float32Array(count);
  order.forEach((node, i) => {
    nodeOrder[node] = count > 1 ? i / (count - 1) : 0;
  });

  const edgeOrder = new Float32Array(edges.length);
  edges.forEach(([a, b], i) => {
    // An edge can only appear once both of its nodes have.
    edgeOrder[i] = Math.max(nodeOrder[a], nodeOrder[b]);
  });

  return { positions, edges, neighbours, nodeOrder, edgeOrder, hub };
}
