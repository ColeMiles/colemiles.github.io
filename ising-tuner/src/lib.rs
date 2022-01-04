extern crate rand;
extern crate wasm_bindgen;
use rand::distributions::Distribution;
use rand::distributions::{Uniform, Bernoulli};
use rand::RngCore;
use rand::{Rng, SeedableRng};
use rand::rngs::SmallRng;

use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub struct SpinGrid {
    spins: Vec<i8>,
    fliprows: Vec<u32>,
    flipcols: Vec<u32>,
    width: usize,
    height: usize,
    interaction: f64,
    inv_temp: f64,
    field: f64,
    rng: SmallRng,
    width_dst: Uniform<usize>,
    height_dst: Uniform<usize>,
}

impl SpinGrid {
    // The change in energy if we were to flip the given spin
    fn local_flip_energy(&self, i: usize, j: usize) -> f64 {
        // This explicit case handling is ugly, but is actually faster
        //  due to branch prediction than modulo
        let up = if i == 0 {
            self.height - 1
        } else {
            i - 1
        };
        let down = if i == self.height - 1 {
            0
        } else {
            i + 1
        };
        let left = if j == 0 {
            self.width - 1
        } else {
            j - 1
        };
        let right = if j == self.width - 1 {
            0
        } else {
            j + 1
        };

        2.0 * self.spins[self.get_index(i, j)] as f64 * (-self.interaction * (
            self.spins[self.get_index(up, j)] +
            self.spins[self.get_index(down, j)] +
            self.spins[self.get_index(i, left)] +
            self.spins[self.get_index(i, right)]
        ) as f64
        + self.field)
    }

    // Same as step, but returns Option containing flip location if accepted
    fn step_opt(&mut self) -> Option<(usize, usize)> {
        let randx = self.width_dst.sample(&mut self.rng);
        let randy = self.height_dst.sample(&mut self.rng);

        let delta_energy = self.local_flip_energy(randx, randy);
        if self.rng.gen::<f64>() < (-self.inv_temp * delta_energy).exp() {
            let idx = self.get_index(randx, randy);
            self.spins[idx] *= -1;
            return Some((randx, randy));
        }
        return None
    }
}

// Public functions to generate wasm for
#[wasm_bindgen]
impl SpinGrid {
    // Creates a randomly-oriented grid of spins
    pub fn new(width: usize, height: usize, interaction: f64, temp: f64, field: f64) -> SpinGrid {
        let mut rng = SmallRng::from_entropy();
        let spins: Vec<i8> = (&mut rng).sample_iter(Uniform::<i8>::new_inclusive(0, 1))
                                .map(|x| {2 * x - 1})
                                .take(width * height)
                                .collect();
        let inv_temp = 1.0 / temp;
        let fliprows = Vec::new();
        let flipcols = Vec::new();
        let width_dst = Uniform::from(0..width);
        let height_dst = Uniform::from(0..height);
        SpinGrid{
            spins,
            fliprows,
            flipcols,
            width,
            height,
            interaction,
            inv_temp,
            field,
            rng,
            width_dst,
            height_dst
        }
    }

    pub fn new_with_seed(width: usize, height: usize, interaction: f64,
                         temp: f64, field: f64, seed: u64) -> SpinGrid {
        let mut rng = SmallRng::seed_from_u64(seed);
        let spins: Vec<i8> = (&mut rng).sample_iter(Uniform::<i8>::new_inclusive(0, 1))
                                .map(|x| {2 * x - 1})
                                .take(width * height)
                                .collect();
        let inv_temp = 1.0 / temp;
        let fliprows = Vec::new();
        let flipcols = Vec::new();
        let width_dst = Uniform::from(0..width);
        let height_dst = Uniform::from(0..height);
        SpinGrid{
            spins,
            fliprows,
            flipcols,
            width,
            height,
            interaction,
            inv_temp,
            field,
            rng,
            width_dst,
            height_dst
        }
    }

    pub fn get_index(&self, i: usize, j: usize) -> usize {
        (i * self.width) + j
    }

    pub fn get_height(&self) -> usize {
        self.height
    }

    pub fn get_width(&self) -> usize {
        self.width
    }

    pub fn get_field(&self) -> f64 {
        self.field
    }

    pub fn set_temp(&mut self, temp: f64) {
        self.inv_temp = 1.0 / temp;
    }

    pub fn set_interaction(&mut self, interaction: f64) {
        self.interaction = interaction;
    }

    pub fn set_field(&mut self, field: f64) {
        self.field = field;
    }

    // Total energy of current configuration
    pub fn hamiltonian(&self) -> f64 {
        let mut tot_energy = 0.0;
        for i in 0..self.height {
            for j in 0..self.width {
                tot_energy += self.interaction * (
                    self.spins[self.get_index((i+1) % self.height, j)] + 
                    self.spins[self.get_index(i, (j+1) % self.height)]
                ) as f64;
            }
        }
        tot_energy
    }

    // Average magnetization of the system
    pub fn magnetization(&self) -> f64 {
        self.spins.iter().fold(0.0, |acc, spin| acc + f64::from(*spin)) / (self.width * self.height) as f64
    }

    // Extrinsic magnetization
    pub fn ext_magnetization(&self) -> f64 {
        self.spins.iter().fold(0.0, |acc, spin| acc + f64::from(*spin))
    }

    // Performs a single proposal and acceptance/rejection
    pub fn step(&mut self) {
        let randx = self.rng.next_u32() as usize % self.width;
        let randy = self.rng.next_u32() as usize % self.height;

        let delta_energy = self.local_flip_energy(randx, randy);
        let rand_num = (self.rng.next_u64() as f64) / std::u64::MAX as f64;
        if rand_num < (-self.inv_temp * delta_energy).exp() {
            let idx = self.get_index(randx, randy);
            self.spins[idx] *= -1;
        }
    }

    // Perform many steps, and keep track of which spins flipped in self.flips
    // Returns the number of flips that occurred
    pub fn many_steps(&mut self, steps: usize) -> usize {
        if self.fliprows.capacity() < steps {
            self.fliprows.reserve(steps - self.fliprows.capacity());
            self.flipcols.reserve(steps - self.flipcols.capacity());
        }

        self.fliprows.clear();
        self.flipcols.clear();
        for _ in 1..steps {
            if let Some(coord) = self.step_opt() {
                self.fliprows.push(coord.0 as u32);
                self.flipcols.push(coord.1 as u32);
            }
        }

        self.fliprows.len()
    }

    // Randomize the configuration with each site being
    //  spin up with probability p
    pub fn randomize_p(&mut self, p: f64) {
        let d = Bernoulli::new(p).unwrap();
        for spin in self.spins.iter_mut() {
            *spin = 2 * i8::from(d.sample(&mut self.rng)) - 1;
        }
    }

    // Like many_steps, with steps = size of the system.
    // However, doesn't bother keeping track of flips.
    pub fn rand_sweep(&mut self) {
        let num_steps = self.width * self.height;
        for _ in 1..num_steps {
            self.step()
        }
    }

    pub fn randomize(&mut self) {
        self.randomize_p(0.5);
    }

    pub fn spins_ptr(&self) -> *const i8 {
        self.spins.as_ptr()
    }

    // To avoid copys, I need to maintain the list of flips I've done
    //  in a local Vec, and be able to access this memory from within
    //  Javascript
    // Additionally, Javascript doesn't have tuples?
    //  so I need to keep two separate Vecs for the rows and columns...
    // Use only after calling many_steps!
    pub fn fliprows_ptr(&self) -> *const u32 {
        self.fliprows.as_ptr()
    }
    pub fn flipcols_ptr(&self) -> *const u32 {
        self.flipcols.as_ptr()
    }
}

fn forgetful_mean(data: &Vec<f64>, c: f64, prev_mean: f64) -> f64 {
    // Short-circuit if this is the first element of the series
    let length = data.len();
    if length == 1 {
        return data[0];
    }

    let cutoff = ((1.0 - c) * length as f64).floor() as usize;
    let prev_cutoff = ((1.0 - c) * (length - 1) as f64).floor() as usize;

    let mut new_mean = (length - prev_cutoff - 1) as f64 * prev_mean;
    if prev_cutoff != cutoff {
        new_mean -= data[prev_cutoff];
    }
    new_mean += data.last().unwrap();

    return new_mean / (length - cutoff) as f64;
}

// Welford's online algorithm
fn forgetful_mean_var(data: &Vec<f64>, c: f64, prev_mean: f64, prev_var: f64) -> (f64, f64) {
    // Short-circuit if this is the first element of the series
    let length = data.len();
    if length == 1 {
        return (data[0], 0.0);
    }

    let cutoff = ((1.0 - c) * length as f64).floor() as usize;
    let prev_cutoff = ((1.0 - c) * (length - 1) as f64).floor() as usize;

    let new_pt = data.last().unwrap();

    // Add the new point, update mean and sample variance
    let mut new_length = (data.len() - prev_cutoff) as f64;
    let mut new_mean = prev_mean + (new_pt - prev_mean) / (new_length as f64);
    let mut new_var = prev_var * (new_length - 2.0) + (new_pt - prev_mean) * (new_pt - new_mean);
    new_var /= new_length - 1.0;

    // If we need to drop a point off the back, update mean and sample variance again
    if prev_cutoff != cutoff {
        new_length = (data.len() - cutoff) as f64;
        let drop_pt = data[prev_cutoff];
        let prev_mean = new_mean;
        let prev_var = new_var;

        new_mean = prev_mean - (drop_pt - prev_mean) / new_length;
        new_var = prev_var * new_length - (drop_pt - prev_mean) * (drop_pt - new_mean);

        // Guard against new_length == 1
        if new_length == 1.0 {
            new_var = 0.0;
        } else {
            new_var /= new_length - 1.0;
        }
    }

    return (new_mean, new_var);
}

#[wasm_bindgen]
pub struct Tuner {
    obs_traj: Vec<f64>,        // Generalized N trajectory
    obs_sq_traj: Vec<f64>,     // Generalized N^2 trajectory
    field_traj: Vec<f64>,      // Generalized mu trajectory
    forgetful_c: f64,          // Fraction of most recent data to use
    field: f64,                // Instantaneous mu
    beta: f64,                 // Inverse temperature
    target_obs: f64,           // Target N
    pub mean_obs: f64,         // Time-averaged N
    pub mean_obs_sq: f64,      // Time-averaged N^2
    pub mean_field: f64,       // Time-averaged mu
    pub var_field: f64,        // Var of the field trajectory
    pub var_obs: f64,          // Var of the observable
    kappa: f64,                // Time-averaged guess at kappa
    kappa_min: f64,            // Minimum kappa allowed (/ sqrt(t))
    kappa_max_pref: f64,       // Prefactor on sig_M / sig_B
}

#[wasm_bindgen]
impl Tuner {
    pub fn new(init_field: f64, target_obs: f64, beta: f64, forgetful_c: f64, kappa_min: f64, kappa_max_pref: f64) -> Tuner {
        let obs_traj = Vec::new();
        let obs_sq_traj = Vec::new();
        let field_traj = vec![init_field];
        Tuner {
            obs_traj,
            obs_sq_traj,
            field_traj,
            forgetful_c,
            field: init_field,
            beta,
            target_obs,
            mean_obs: -1.0,
            mean_obs_sq: -1.0,
            mean_field: init_field,
            var_field: 0.0,
            var_obs: 0.0,
            kappa: 0.0,
            kappa_min,
            kappa_max_pref
        }
    }

    pub fn update(&mut self, obs: f64, obs_sq: f64) -> f64 {
        self.obs_traj.push(obs);
        let obs_mean_var = forgetful_mean_var(
            &self.obs_traj, self.forgetful_c, self.mean_obs, self.var_obs
        );
        self.mean_obs = obs_mean_var.0;
        self.var_obs = obs_mean_var.1;

        self.obs_sq_traj.push(obs_sq);
        self.mean_obs_sq = forgetful_mean(&self.obs_sq_traj, self.forgetful_c, self.mean_obs_sq);

        // Estimate kappa from observable fluctuations
        self.kappa = self.beta * (self.mean_obs_sq - self.mean_obs.powi(2));
        // Apply the kappa_max bound
        let kappa_update = self.kappa.min(
            self.kappa_max_pref * self.var_obs.sqrt() / self.var_field.sqrt()
        );
        // Apply the kappa_min bound
        let len_traj = self.obs_traj.len() as f64;
        let kappa_update = kappa_update.max(self.kappa_min / len_traj.sqrt());

        let new_field = self.mean_field + (self.target_obs - self.mean_obs) / kappa_update;
        self.field = new_field;
        self.field_traj.push(new_field);

        let field_mean_var = forgetful_mean_var(
            &self.field_traj, self.forgetful_c, self.mean_field, self.var_field
        );
        self.mean_field = field_mean_var.0;
        self.var_field = field_mean_var.1;

        return new_field;
    }

    pub fn get_kappa(&self) -> f64 {
        self.kappa
    }

    pub fn get_kappa_min(&self) -> f64 {
        self.kappa_min / self.obs_traj.len() as f64
    }

    pub fn get_kappa_max(&self) -> f64 {
        self.kappa_max_pref * self.var_obs.sqrt() / self.var_field.sqrt()
    }
}


#[cfg(test)]
mod tests {
    use forgetful_mean;
    use forgetful_mean_var;
    use rand::Rng;

    fn _test_forgetful_mean(n: usize, c: f64) {
        let mut rng = rand::thread_rng();

        let mut avg: f64 = rng.gen();
        let mut data: Vec<f64> = vec![avg];

        for _ in 1..n {
            data.push(rng.gen());
            avg = forgetful_mean(&data, c, avg);
        }

        let cut = ((1.0 - c) * data.len() as f64).floor() as usize;
        let data_slice = &data[cut..];
        let real_avg: f64 = data_slice.iter().sum::<f64>() / data_slice.len() as f64;

        assert!((avg - real_avg).abs() < 1e-5);
    }

    fn _test_forgetful_mean_var(n: usize, c: f64) {
        let mut rng = rand::thread_rng();

        let mut avg: f64 = 100.0 * rng.gen::<f64>();
        let mut var: f64 = 0.0;
        let mut data: Vec<f64> = vec![avg];

        for _ in 1..n {
            data.push(100.0 * rng.gen::<f64>());
            let avg_var = forgetful_mean_var(&data, c, avg, var);
            avg = avg_var.0;
            var = avg_var.1;
        }

        let cut = ((1.0 - c) * data.len() as f64).floor() as usize;
        let data_slice = &data[cut..];
        let real_avg: f64 = data_slice.iter().sum::<f64>() / data_slice.len() as f64;
        let real_var: f64 = data_slice.iter().map(
            |&x| {
                (x - real_avg).powi(2)
            }
        ).sum::<f64>() / (data_slice.len() - 1) as f64;

        assert!((avg - real_avg).abs() < 1e-5);
        assert!((var - real_var).abs() < 1e-5);
    }

    #[test]
    fn test_forgetful_mean() {
        _test_forgetful_mean(10, 0.5);
        _test_forgetful_mean(2, 0.5);
        _test_forgetful_mean(300, 0.2);
        _test_forgetful_mean(150, 0.9);
    }

    #[test]
    fn test_forgetful_mean_var() {
        _test_forgetful_mean_var(10, 0.5);
        _test_forgetful_mean_var(300, 0.2);
        _test_forgetful_mean_var(150, 0.9);
    }
}