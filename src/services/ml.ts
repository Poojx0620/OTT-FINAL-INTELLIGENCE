import type {
  ViewerProfile,
  SegmentInfo,
  RecommendationItem,
  ModelInfo,
  KSelectionResult,
  ClusterPoint,
  EvaluationMetrics,
  DataQuality,
  WhatIfResult,
} from '@/types';

const SEED = 42;
const FEATURES = [
  'watch_time_hours',
  'avg_session_mins',
  'session_frequency',
  'completion_rate',
  'genre_diversity',
];

// Deterministic PRNG (mulberry32)
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// StandardScaler implementation
export class StandardScaler {
  means: number[] = [];
  stds: number[] = [];

  fit(data: number[][]): void {
    const n = data.length;
    const m = data[0].length;
    this.means = new Array(m).fill(0);
    this.stds = new Array(m).fill(0);

    for (let j = 0; j < m; j++) {
      let sum = 0;
      for (let i = 0; i < n; i++) sum += data[i][j];
      this.means[j] = sum / n;
    }
    for (let j = 0; j < m; j++) {
      let sum = 0;
      for (let i = 0; i < n; i++) sum += (data[i][j] - this.means[j]) ** 2;
      this.stds[j] = Math.sqrt(sum / n) || 1;
    }
  }

  transform(data: number[][]): number[][] {
    return data.map((row) =>
      row.map((v, j) => (v - this.means[j]) / this.stds[j])
    );
  }

  fitTransform(data: number[][]): number[][] {
    this.fit(data);
    return this.transform(data);
  }

  toJSON(): { means: number[]; stds: number[] } {
    return { means: this.means, stds: this.stds };
  }

  static fromJSON(data: { means: number[]; stds: number[] }): StandardScaler {
    const s = new StandardScaler();
    s.means = data.means;
    s.stds = data.stds;
    return s;
  }
}

// KMeans implementation
export class KMeans {
  nClusters: number;
  maxIter: number;
  seed: number;
  centroids: number[][] = [];
  labels: number[] = [];
  inertia: number = 0;

  constructor(nClusters: number, maxIter = 300, seed = SEED) {
    this.nClusters = nClusters;
    this.maxIter = maxIter;
    this.seed = seed;
  }

  fit(data: number[][]): void {
    const rng = mulberry32(this.seed);
    const n = data.length;
    const m = data[0].length;

    // KMeans++ initialization
    this.centroids = [];
    const firstIdx = Math.floor(rng() * n);
    this.centroids.push([...data[firstIdx]]);

    for (let c = 1; c < this.nClusters; c++) {
      const distances = data.map((point) => {
        let minDist = Infinity;
        for (const centroid of this.centroids) {
          const d = euclideanDist(point, centroid);
          if (d < minDist) minDist = d;
        }
        return minDist;
      });
      const total = distances.reduce((a, b) => a + b, 0);
      let r = rng() * total;
      let chosen = 0;
      for (let i = 0; i < n; i++) {
        r -= distances[i];
        if (r <= 0) {
          chosen = i;
          break;
        }
      }
      this.centroids.push([...data[chosen]]);
    }

    // Iteration
    this.labels = new Array(n).fill(0);
    for (let iter = 0; iter < this.maxIter; iter++) {
      let changed = false;
      // Assign
      for (let i = 0; i < n; i++) {
        let minDist = Infinity;
        let bestCluster = 0;
        for (let c = 0; c < this.nClusters; c++) {
          const d = euclideanDist(data[i], this.centroids[c]);
          if (d < minDist) {
            minDist = d;
            bestCluster = c;
          }
        }
        if (this.labels[i] !== bestCluster) {
          this.labels[i] = bestCluster;
          changed = true;
        }
      }
      // Update
      const newCentroids: number[][] = Array.from(
        { length: this.nClusters },
        () => new Array(m).fill(0)
      );
      const counts = new Array(this.nClusters).fill(0);
      for (let i = 0; i < n; i++) {
        const c = this.labels[i];
        counts[c]++;
        for (let j = 0; j < m; j++) newCentroids[c][j] += data[i][j];
      }
      for (let c = 0; c < this.nClusters; c++) {
        if (counts[c] > 0) {
          for (let j = 0; j < m; j++)
            newCentroids[c][j] /= counts[c];
        } else {
          newCentroids[c] = [...this.centroids[c]];
        }
      }
      this.centroids = newCentroids;
      if (!changed) break;
    }

    // Inertia
    this.inertia = 0;
    for (let i = 0; i < n; i++) {
      this.inertia += euclideanDist(data[i], this.centroids[this.labels[i]]) ** 2;
    }
  }

  predict(point: number[][]): number[] {
    return point.map((p) => {
      let minDist = Infinity;
      let best = 0;
      for (let c = 0; c < this.nClusters; c++) {
        const d = euclideanDist(p, this.centroids[c]);
        if (d < minDist) {
          minDist = d;
          best = c;
        }
      }
      return best;
    });
  }

  distanceToCentroid(point: number[]): number {
    const label = this.predict([point])[0];
    return euclideanDist(point, this.centroids[label]);
  }

  distancesToAllCentroids(point: number[]): number[] {
    return this.centroids.map((c) => euclideanDist(point, c));
  }
}

function euclideanDist(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

// Silhouette score (sampled for efficiency)
export function silhouetteScore(
  data: number[][],
  labels: number[],
  sampleSize = 5000
): number {
  const n = data.length;
  if (n < 3) return 0;

  let indices = Array.from({ length: n }, (_, i) => i);
  if (n > sampleSize) {
    const rng = mulberry32(SEED);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    indices = indices.slice(0, sampleSize);
  }

  let total = 0;
  let count = 0;

  for (const i of indices) {
    const labelI = labels[i];
    let a = 0;
    let aCount = 0;
    const bMap: Record<number, { sum: number; count: number }> = {};

    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const d = euclideanDist(data[i], data[j]);
      if (labels[j] === labelI) {
        a += d;
        aCount++;
      } else {
        if (!bMap[labels[j]]) bMap[labels[j]] = { sum: 0, count: 0 };
        bMap[labels[j]].sum += d;
        bMap[labels[j]].count++;
      }
    }

    if (aCount === 0) continue;
    a /= aCount;

    let b = Infinity;
    for (const key in bMap) {
      const avg = bMap[key].sum / bMap[key].count;
      if (avg < b) b = avg;
    }

    if (b === Infinity) continue;
    const s = (b - a) / Math.max(a, b);
    total += s;
    count++;
  }

  return count > 0 ? total / count : 0;
}

// PCA via power iteration for 2D visualization
export function pca2D(data: number[][]): number[][] {
  const n = data.length;
  const m = data[0].length;

  // Center
  const means = new Array(m).fill(0);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++) means[j] += data[i][j];
  for (let j = 0; j < m; j++) means[j] /= n;

  const centered = data.map((row) => row.map((v, j) => v - means[j]));

  // Covariance
  const cov: number[][] = Array.from({ length: m }, () =>
    new Array(m).fill(0)
  );
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) sum += centered[k][i] * centered[k][j];
      cov[i][j] = sum / (n - 1);
    }
  }

  // Power iteration for top 2 eigenvectors
  const comps = powerIteration(cov, m, 2);

  // Project
  return centered.map((row) => [
    row.reduce((sum, v, j) => sum + v * comps[0][j], 0),
    row.reduce((sum, v, j) => sum + v * comps[1][j], 0),
  ]);
}

function powerIteration(
  matrix: number[][],
  size: number,
  nComponents: number
): number[][] {
  const rng = mulberry32(SEED);
  const components: number[][] = [];
  let work = matrix.map((row) => [...row]);

  for (let c = 0; c < nComponents; c++) {
    let v = Array.from({ length: size }, () => rng());
    let norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    v = v.map((x) => x / norm);

    for (let iter = 0; iter < 100; iter++) {
      const newV = work.map((row) =>
        row.reduce((sum, x, j) => sum + x * v[j], 0)
      );
      norm = Math.sqrt(newV.reduce((s, x) => s + x * x, 0));
      if (norm < 1e-10) break;
      v = newV.map((x) => x / norm);
    }

    components.push(v);

    // Deflate
    const eigenvalue = v.reduce(
      (sum, vi, i) => sum + vi * work[i].reduce((s, wij, j) => s + wij * v[j], 0),
      0
    );
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        work[i][j] -= eigenvalue * v[i] * v[j];
      }
    }
  }

  return components;
}

// Content catalog for recommendations
const CONTENT_CATALOG = [
  { title: 'Galactic Odyssey', genre: 'Sci-Fi', description: 'A deep-space crew uncovers a signal from a vanished civilization.', poster: 'sci-fi' },
  { title: 'Shadow Protocol', genre: 'Action', description: 'An elite agent races to stop a global cyber conspiracy.', poster: 'action' },
  { title: 'Midnight Verdict', genre: 'Thriller', description: 'A detective hunts a killer through the neon streets of Tokyo.', poster: 'thriller' },
  { title: 'Last Frontier', genre: 'Adventure', description: 'Pioneers brave an uncharted wilderness to build a new home.', poster: 'adventure' },
  { title: 'Hearts in Harmony', genre: 'Romance', description: 'Two musicians fall in love across a European tour.', poster: 'romance' },
  { title: 'The Comedy Club', genre: 'Comedy', description: 'A struggling stand-up finds his voice in the city comedy scene.', poster: 'comedy' },
  { title: 'Quiet Devotion', genre: 'Drama', description: 'A family grapples with loss and reconciliation over three decades.', poster: 'drama' },
  { title: 'Quantum Paradox', genre: 'Sci-Fi', description: 'A physicist breaks reality to save her past self.', poster: 'sci-fi' },
  { title: 'Iron Resolve', genre: 'Action', description: 'A retired fighter returns to the ring for one last bout.', poster: 'action' },
  { title: 'Silent Witness', genre: 'Thriller', description: 'A mute child holds the key to a town buried secret.', poster: 'thriller' },
  { title: 'Distant Shores', genre: 'Adventure', description: 'A solo sailor crosses the Pacific in search of meaning.', poster: 'adventure' },
  { title: 'Love in Lisbon', genre: 'Romance', description: 'A travel writer finds more than she expected in Portugal.', poster: 'romance' },
  { title: 'Laugh Track', genre: 'Comedy', description: 'A sitcom cast reunites for one chaotic final season.', poster: 'comedy' },
  { title: 'The Long Goodbye', genre: 'Drama', description: 'A hospice nurse changes the lives of her patients.', poster: 'drama' },
  { title: 'Stellar Drift', genre: 'Sci-Fi', description: 'Astronauts on a generation ship question their mission.', poster: 'sci-fi' },
  { title: 'Code of Vengeance', genre: 'Action', description: 'A hacker turns vigilante after a devastating betrayal.', poster: 'action' },
  { title: 'Edge of Fear', genre: 'Thriller', description: 'A psychologist hunts a patient who vanished without a trace.', poster: 'thriller' },
  { title: 'Wild Hearts', genre: 'Adventure', description: 'A wildlife photographer tracks endangered species across Africa.', poster: 'adventure' },
  { title: 'Summer Letters', genre: 'Romance', description: 'Pen pals meet for the first time after ten years of letters.', poster: 'romance' },
  { title: 'Office Hours', genre: 'Comedy', description: 'A chaotic startup tries to survive its first investor meeting.', poster: 'comedy' },
];

// Segment naming based on cluster characteristics
export function deriveSegmentName(
  clusterId: number,
  clusterProfiles: Record<number, { avg: number[]; count: number }>,
  globalAvg: number[]
): string {
  const cp = clusterProfiles[clusterId];
  if (!cp) return `Segment ${clusterId}`;

  const watchTime = cp.avg[0];
  const sessionDur = cp.avg[1];
  const frequency = cp.avg[2];
  const completion = cp.avg[3];
  const diversity = cp.avg[4];

  const gWatch = globalAvg[0];
  const gFreq = globalAvg[2];
  const gDiv = globalAvg[4];

  if (watchTime > gWatch * 1.3 && frequency > gFreq * 1.3) {
    return 'Highly Engaged Viewers';
  }
  if (watchTime < gWatch * 0.6 && frequency < gFreq * 0.6) {
    return 'Occasional Viewers';
  }
  if (diversity > gDiv * 1.2 && completion < 0.75) {
    return 'Genre Explorers';
  }
  return 'Casual Viewers';
}

export function deriveSegmentDescription(
  name: string,
  clusterProfiles: Record<number, { avg: number[]; count: number }>,
  clusterId: number
): string {
  const cp = clusterProfiles[clusterId];
  if (!cp) return '';
  const watchTime = cp.avg[0];
  const frequency = cp.avg[2];
  const completion = cp.avg[3];
  const diversity = cp.avg[4];

  switch (name) {
    case 'Highly Engaged Viewers':
      return `These viewers show strong engagement with ${watchTime.toFixed(0)}h average watch time and ${frequency.toFixed(0)} sessions per week. They complete ${Math.round(completion * 100)}% of what they start and tend to stick with preferred genres.`;
    case 'Casual Viewers':
      return `Moderate engagement with ${watchTime.toFixed(0)}h watch time across ${frequency.toFixed(0)} sessions. They watch regularly but with shorter sessions and moderate completion rates.`;
    case 'Genre Explorers':
      return `These viewers explore broadly with a genre diversity of ${diversity.toFixed(2)}. They sample varied content but have lower completion rates at ${Math.round(completion * 100)}%.`;
    case 'Occasional Viewers':
      return `Light engagement with only ${watchTime.toFixed(0)}h watch time and ${frequency.toFixed(0)} sessions. They watch infrequently with shorter sessions and lower completion.`;
    default:
      return `Segment with ${watchTime.toFixed(0)}h average watch time and ${frequency.toFixed(0)} sessions.`;
  }
}

export function deriveBehavioralTraits(
  clusterProfiles: Record<number, { avg: number[]; count: number }>,
  clusterId: number,
  globalAvg: number[]
): string[] {
  const cp = clusterProfiles[clusterId];
  if (!cp) return [];
  const traits: string[] = [];
  if (cp.avg[0] > globalAvg[0]) traits.push('Above-average watch time');
  else traits.push('Below-average watch time');
  if (cp.avg[2] > globalAvg[2]) traits.push('High session frequency');
  else traits.push('Low session frequency');
  if (cp.avg[3] > globalAvg[3]) traits.push('Strong completion rate');
  else traits.push('Moderate completion rate');
  if (cp.avg[4] > globalAvg[4]) traits.push('Diverse genre preference');
  else traits.push('Focused genre preference');
  return traits;
}

// Generate recommendations
export function generateRecommendations(
  segmentId: number,
  topGenres: string[],
  segmentName: string,
  profile: { watch_time_hours: number; completion_rate: number }
): RecommendationItem[] {
  const reasons: Record<string, string[]> = {
    'Highly Engaged Viewers': ['Matches preferred genre', 'Suitable for highly engaged behavioral segment', 'Aligns with deep viewing patterns'],
    'Casual Viewers': ['Matches preferred genre', 'Suitable for casual viewing patterns', 'Easy to pick up and enjoy'],
    'Genre Explorers': ['Introduces new genres for exploration', 'Matches diverse viewing behavior', 'Encourages genre discovery'],
    'Occasional Viewers': ['Easy to start with short commitment', 'Matches light viewing patterns', 'Suitable for occasional watchers'],
  };

  const segmentReasons = reasons[segmentName] || reasons['Casual Viewers'];

  // Score and sort content
  const scored = CONTENT_CATALOG.map((content) => {
    let score = 0;
    if (topGenres.includes(content.genre)) score += 0.5;
    if (profile.completion_rate > 0.8) score += 0.1;
    if (profile.watch_time_hours > 40) score += 0.1;
    score += Math.random() * 0.05;
    return { ...content, match_score: Math.min(score, 1) };
  });

  // Genre-matched first, then fill from catalog
  const matched = scored.filter((c) => topGenres.includes(c.genre));
  const others = scored.filter((c) => !topGenres.includes(c.genre));
  const ordered = [...matched, ...others].slice(0, 6);

  return ordered.map((content) => ({
    title: content.title,
    genre: content.genre,
    description: content.description,
    poster: content.poster,
    reasons: segmentReasons,
    match_score: content.match_score,
  }));
}

// Main ML pipeline class
export class MLPipeline {
  scaler: StandardScaler;
  model: KMeans;
  data: ViewerProfile[];
  scaledData: number[][];
  rawFeatures: number[][];
  labels: number[];
  segments: SegmentInfo[];
  kSelection: KSelectionResult[];
  silhouette: number;
  inertia: number;
  selectedK: number;
  globalAvg: number[];
  clusterProfiles: Record<number, { avg: number[]; count: number }>;
  clusterPoints: ClusterPoint[];
  dataQuality: DataQuality;

  constructor(data: ViewerProfile[]) {
    this.data = data;
    this.scaler = new StandardScaler();
    this.model = new KMeans(4, 300, SEED);
    this.scaledData = [];
    this.rawFeatures = [];
    this.labels = [];
    this.segments = [];
    this.kSelection = [];
    this.silhouette = 0;
    this.inertia = 0;
    this.selectedK = 4;
    this.globalAvg = [];
    this.clusterProfiles = {};
    this.clusterPoints = [];
    this.dataQuality = {
      total_rows: 0,
      duplicate_rows: 0,
      missing_values: 0,
      invalid_numeric: 0,
      unknown_categories: 0,
      clean_rows: 0,
      rows_removed: 0,
    };
  }

  run(): void {
    this.validateData();
    this.engineerFeatures();
    this.scaleFeatures();
    this.selectK();
    this.trainModel();
    this.buildSegments();
    this.buildClusterPoints();
  }

  private validateData(): void {
    const seen = new Set<string>();
    let duplicates = 0;
    let missing = 0;
    let invalid = 0;
    let unknown = 0;

    const validGenres = new Set([
      'Action', 'Sci-Fi', 'Thriller', 'Comedy', 'Drama',
      'Romance', 'Adventure',
    ]);

    for (const row of this.data) {
      const key = `${row.user_id}`;
      if (seen.has(key)) {
        duplicates++;
        continue;
      }
      seen.add(key);

      if (row.watch_time_hours == null || row.avg_session_mins == null ||
          row.session_frequency == null || row.completion_rate == null) {
        missing++;
      }
      if (row.watch_time_hours < 0 || row.completion_rate < 0 ||
          row.completion_rate > 1 || row.avg_session_mins < 0) {
        invalid++;
      }
      for (const g of row.top_genres) {
        if (!validGenres.has(g)) unknown++;
      }
    }

    this.dataQuality = {
      total_rows: this.data.length,
      duplicate_rows: duplicates,
      missing_values: missing,
      invalid_numeric: invalid,
      unknown_categories: unknown,
      clean_rows: this.data.length - duplicates,
      rows_removed: duplicates,
    };
  }

  private engineerFeatures(): void {
    this.rawFeatures = this.data.map((v) => [
      v.watch_time_hours,
      v.avg_session_mins,
      v.session_frequency,
      v.completion_rate,
      v.genre_diversity,
    ]);
  }

  private scaleFeatures(): void {
    this.scaledData = this.scaler.fitTransform(this.rawFeatures);
  }

  private selectK(): void {
    const kCandidates = [2, 3, 4, 5, 6];
    this.kSelection = [];

    for (const k of kCandidates) {
      const km = new KMeans(k, 300, SEED);
      km.fit(this.scaledData);
      const sil = silhouetteScore(this.scaledData, km.labels, Math.min(this.scaledData.length, 2000));
      this.kSelection.push({ k, inertia: km.inertia, silhouette: sil });
    }

    // Select K with highest silhouette
    let best = this.kSelection[0];
    for (const result of this.kSelection) {
      if (result.silhouette > best.silhouette) best = result;
    }
    this.selectedK = best.k;
    this.silhouette = best.silhouette;
  }

  private trainModel(): void {
    this.model = new KMeans(this.selectedK, 300, SEED);
    this.model.fit(this.scaledData);
    this.labels = this.model.labels;
    this.inertia = this.model.inertia;

    // Global averages
    const m = FEATURES.length;
    this.globalAvg = new Array(m).fill(0);
    for (const row of this.rawFeatures) {
      for (let j = 0; j < m; j++) this.globalAvg[j] += row[j];
    }
    for (let j = 0; j < m; j++) this.globalAvg[j] /= this.rawFeatures.length;

    // Cluster profiles (raw feature averages)
    this.clusterProfiles = {};
    for (let c = 0; c < this.selectedK; c++) {
      this.clusterProfiles[c] = { avg: new Array(m).fill(0), count: 0 };
    }
    for (let i = 0; i < this.data.length; i++) {
      const c = this.labels[i];
      this.clusterProfiles[c].count++;
      for (let j = 0; j < m; j++) this.clusterProfiles[c].avg[j] += this.rawFeatures[i][j];
    }
    for (let c = 0; c < this.selectedK; c++) {
      if (this.clusterProfiles[c].count > 0) {
        for (let j = 0; j < m; j++)
          this.clusterProfiles[c].avg[j] /= this.clusterProfiles[c].count;
      }
    }
  }

  private buildSegments(): void {
    this.segments = [];
    const total = this.data.length;

    // Sort clusters by watch time descending for consistent naming
    const sortedClusters = Object.keys(this.clusterProfiles)
      .map(Number)
      .sort((a, b) => this.clusterProfiles[b].avg[0] - this.clusterProfiles[a].avg[0]);

    for (const clusterId of sortedClusters) {
      const cp = this.clusterProfiles[clusterId];
      const name = deriveSegmentName(clusterId, this.clusterProfiles, this.globalAvg);
      const description = deriveSegmentDescription(name, this.clusterProfiles, clusterId);
      const traits = deriveBehavioralTraits(this.clusterProfiles, clusterId, this.globalAvg);

      // Dominant genres
      const genreCount: Record<string, number> = {};
      for (let i = 0; i < this.data.length; i++) {
        if (this.labels[i] === clusterId) {
          for (const g of this.data[i].top_genres) {
            genreCount[g] = (genreCount[g] || 0) + 1;
          }
        }
      }
      const dominantGenres = Object.entries(genreCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([g]) => g);

      this.segments.push({
        id: clusterId,
        name,
        description,
        viewer_count: cp.count,
        percentage: (cp.count / total) * 100,
        avg_watch_time: cp.avg[0],
        avg_session_duration: cp.avg[1],
        avg_completion_rate: cp.avg[3],
        avg_frequency: cp.avg[2],
        dominant_genres: dominantGenres,
        behavioral_traits: traits,
      });
    }
  }

  private buildClusterPoints(): void {
    const coords = pca2D(this.scaledData);
    this.clusterPoints = this.data.map((v, i) => ({
      user_id: v.user_id,
      x: coords[i][0],
      y: coords[i][1],
      cluster: this.labels[i],
      watch_time_hours: v.watch_time_hours,
      avg_session_mins: v.avg_session_mins,
      session_frequency: v.session_frequency,
      completion_rate: v.completion_rate,
      top_genres: v.top_genres,
    }));
  }

  // Predict segment for a new user
  predictSegment(profile: {
    watch_time_hours: number;
    avg_session_mins: number;
    session_frequency: number;
    completion_rate: number;
    top_genres: string[];
  }): { segmentId: number; segmentName: string; distance: number; distances: number[] } {
    const diversity = Math.min(profile.top_genres.length / 7, 1);
    const features = [
      profile.watch_time_hours,
      profile.avg_session_mins,
      profile.session_frequency,
      profile.completion_rate,
      diversity,
    ];
    const scaled = this.scaler.transform([features]);
    const segmentId = this.model.predict(scaled)[0];
    const distance = this.model.distanceToCentroid(scaled[0]);
    const distances = this.model.distancesToAllCentroids(scaled[0]);
    const segment = this.segments.find((s) => s.id === segmentId);
    return {
      segmentId,
      segmentName: segment?.name || `Segment ${segmentId}`,
      distance,
      distances,
    };
  }

  // What-if simulation
  whatIf(
    current: { segmentId: number; segmentName: string },
    modified: {
      watch_time_hours: number;
      avg_session_mins: number;
      session_frequency: number;
      completion_rate: number;
      top_genres: string[];
    }
  ): WhatIfResult {
    const result = this.predictSegment(modified);
    const changed = result.segmentId !== current.segmentId;

    let explanation = 'Profile remains in the same segment.';
    if (changed) {
      const oldSeg = this.segments.find((s) => s.id === current.segmentId);
      const newSeg = this.segments.find((s) => s.id === result.segmentId);
      explanation = `Behavioral changes moved the profile from "${oldSeg?.name}" to "${newSeg?.name}".`;
    }

    return {
      current_segment: current.segmentId,
      current_segment_name: current.segmentName,
      simulated_segment: result.segmentId,
      simulated_segment_name: result.segmentName,
      changed,
      explanation,
      cluster_distances: this.segments.map((s) => ({
        cluster: s.id,
        distance: result.distances[s.id],
        name: s.name,
      })),
    };
  }

  // Generate AI insight from actual cluster stats
  generateInsight(): string {
    const sorted = [...this.segments].sort(
      (a, b) => b.avg_watch_time - a.avg_watch_time
    );
    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];

    const insights: string[] = [];
    insights.push(
      `"${top.name}" shows ${top.avg_watch_time.toFixed(0)}h average watch time with ${Math.round(top.avg_completion_rate * 100)}% completion, while "${bottom.name}" averages only ${bottom.avg_watch_time.toFixed(0)}h.`
    );
    insights.push(
      `The audience is split into ${this.segments.length} segments with a silhouette score of ${this.silhouette.toFixed(2)}, indicating ${this.silhouette > 0.5 ? 'well-separated' : 'moderately separated'} clusters.`
    );
    const diverse = this.segments.find((s) => s.behavioral_traits.includes('Diverse genre preference'));
    if (diverse) {
      insights.push(
        `"${diverse.name}" explores broadly across genres, suggesting an opportunity for content discovery features.`
      );
    }
    return insights.join(' ');
  }

  getModelInfo(): ModelInfo {
    return {
      algorithm: 'KMeans',
      preprocessing: 'StandardScaler',
      random_seed: SEED,
      n_clusters: this.selectedK,
      features: FEATURES,
      model_loaded: true,
      inertia: this.inertia,
      silhouette_score: this.silhouette,
      k_selection: this.kSelection,
    };
  }

  getEvaluationMetrics(testResults: { name: string; status: 'pass' | 'fail'; detail: string }[]): EvaluationMetrics {
    const apiTests = testResults.filter((t) =>
      ['Health Check', 'Valid Recommendation', 'Model Available'].includes(t.name)
    );
    const robustnessTests = testResults.filter((t) =>
      !['Health Check', 'Valid Recommendation', 'Model Available'].includes(t.name)
    );

    const clusterSizes = this.segments.map((s) => s.viewer_count);
    const mean = clusterSizes.reduce((a, b) => a + b, 0) / clusterSizes.length;
    const stdDev = Math.sqrt(
      clusterSizes.reduce((sum, s) => sum + (s - mean) ** 2, 0) / clusterSizes.length
    );
    const cv = mean > 0 ? stdDev / mean : 0;

    // Reproducibility: run model 3 times with same seed
    const silScores: number[] = [];
    for (let run = 0; run < 3; run++) {
      const km = new KMeans(this.selectedK, 300, SEED);
      km.fit(this.scaledData);
      silScores.push(silhouetteScore(this.scaledData, km.labels, Math.min(this.scaledData.length, 2000)));
    }
    const deterministic = silScores.every((s) => Math.abs(s - silScores[0]) < 0.001);

    return {
      api_correctness: {
        passed: apiTests.filter((t) => t.status === 'pass').length,
        failed: apiTests.filter((t) => t.status === 'fail').length,
        tests: apiTests,
      },
      input_robustness: {
        passed: robustnessTests.filter((t) => t.status === 'pass').length,
        failed: robustnessTests.filter((t) => t.status === 'fail').length,
        tests: robustnessTests,
      },
      clustering_quality: {
        silhouette_score: this.silhouette,
        inertia: this.inertia,
        n_clusters: this.selectedK,
        cluster_sizes: clusterSizes,
      },
      cluster_balance: {
        std_dev: stdDev,
        cv,
        is_balanced: cv < 0.3,
      },
      reproducibility: {
        deterministic,
        seed: SEED,
        runs: 3,
        silhouette_scores: silScores,
      },
    };
  }
}
