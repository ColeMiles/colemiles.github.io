/* tslint:disable */
/* eslint-disable */
/**
*/
export class SpinGrid {
  free(): void;
/**
* @param {number} width
* @param {number} height
* @param {number} interaction
* @param {number} temp
* @param {number} field
* @returns {SpinGrid}
*/
  static new(width: number, height: number, interaction: number, temp: number, field: number): SpinGrid;
/**
* @param {number} width
* @param {number} height
* @param {number} interaction
* @param {number} temp
* @param {number} field
* @param {BigInt} seed
* @returns {SpinGrid}
*/
  static new_with_seed(width: number, height: number, interaction: number, temp: number, field: number, seed: BigInt): SpinGrid;
/**
* @param {number} i
* @param {number} j
* @returns {number}
*/
  get_index(i: number, j: number): number;
/**
* @returns {number}
*/
  get_height(): number;
/**
* @returns {number}
*/
  get_width(): number;
/**
* @returns {number}
*/
  get_field(): number;
/**
* @param {number} temp
*/
  set_temp(temp: number): void;
/**
* @param {number} interaction
*/
  set_interaction(interaction: number): void;
/**
* @param {number} field
*/
  set_field(field: number): void;
/**
* @returns {number}
*/
  hamiltonian(): number;
/**
* @returns {number}
*/
  magnetization(): number;
/**
* @returns {number}
*/
  ext_magnetization(): number;
/**
*/
  step(): void;
/**
* @param {number} steps
* @returns {number}
*/
  many_steps(steps: number): number;
/**
* @param {number} p
*/
  randomize_p(p: number): void;
/**
*/
  rand_sweep(): void;
/**
*/
  randomize(): void;
/**
* @returns {number}
*/
  spins_ptr(): number;
/**
* @returns {number}
*/
  fliprows_ptr(): number;
/**
* @returns {number}
*/
  flipcols_ptr(): number;
}
/**
*/
export class Tuner {
  free(): void;
/**
* @param {number} init_field
* @param {number} target_obs
* @param {number} beta
* @param {number} forgetful_c
* @param {number} kappa_min
* @param {number} kappa_max_pref
* @returns {Tuner}
*/
  static new(init_field: number, target_obs: number, beta: number, forgetful_c: number, kappa_min: number, kappa_max_pref: number): Tuner;
/**
* @param {number} obs
* @param {number} obs_sq
* @returns {number}
*/
  update(obs: number, obs_sq: number): number;
/**
* @returns {number}
*/
  get_kappa(): number;
/**
* @returns {number}
*/
  get_kappa_min(): number;
/**
* @returns {number}
*/
  get_kappa_max(): number;
/**
* @returns {number}
*/
  mean_field: number;
/**
* @returns {number}
*/
  mean_obs: number;
/**
* @returns {number}
*/
  mean_obs_sq: number;
/**
* @returns {number}
*/
  var_field: number;
/**
* @returns {number}
*/
  var_obs: number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_spingrid_free: (a: number) => void;
  readonly spingrid_new: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly spingrid_new_with_seed: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly spingrid_get_index: (a: number, b: number, c: number) => number;
  readonly spingrid_get_height: (a: number) => number;
  readonly spingrid_get_width: (a: number) => number;
  readonly spingrid_get_field: (a: number) => number;
  readonly spingrid_set_temp: (a: number, b: number) => void;
  readonly spingrid_set_interaction: (a: number, b: number) => void;
  readonly spingrid_set_field: (a: number, b: number) => void;
  readonly spingrid_hamiltonian: (a: number) => number;
  readonly spingrid_magnetization: (a: number) => number;
  readonly spingrid_ext_magnetization: (a: number) => number;
  readonly spingrid_step: (a: number) => void;
  readonly spingrid_many_steps: (a: number, b: number) => number;
  readonly spingrid_randomize_p: (a: number, b: number) => void;
  readonly spingrid_rand_sweep: (a: number) => void;
  readonly spingrid_randomize: (a: number) => void;
  readonly spingrid_spins_ptr: (a: number) => number;
  readonly spingrid_fliprows_ptr: (a: number) => number;
  readonly spingrid_flipcols_ptr: (a: number) => number;
  readonly __wbg_tuner_free: (a: number) => void;
  readonly __wbg_get_tuner_mean_obs: (a: number) => number;
  readonly __wbg_set_tuner_mean_obs: (a: number, b: number) => void;
  readonly __wbg_get_tuner_mean_obs_sq: (a: number) => number;
  readonly __wbg_set_tuner_mean_obs_sq: (a: number, b: number) => void;
  readonly __wbg_get_tuner_mean_field: (a: number) => number;
  readonly __wbg_set_tuner_mean_field: (a: number, b: number) => void;
  readonly __wbg_get_tuner_var_field: (a: number) => number;
  readonly __wbg_set_tuner_var_field: (a: number, b: number) => void;
  readonly __wbg_get_tuner_var_obs: (a: number) => number;
  readonly __wbg_set_tuner_var_obs: (a: number, b: number) => void;
  readonly tuner_new: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly tuner_update: (a: number, b: number, c: number) => number;
  readonly tuner_get_kappa: (a: number) => number;
  readonly tuner_get_kappa_min: (a: number) => number;
  readonly tuner_get_kappa_max: (a: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
}

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
        