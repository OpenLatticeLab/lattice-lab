export type SceneResponse = {
  scene: any;
  formula: string;
  lattice: {
    a: number;
    b: number;
    c: number;
    alpha: number;
    beta: number;
    gamma: number;
    volume: number;
  };
  n_sites: number;
  source: 'upload' | 'prompt';
};
