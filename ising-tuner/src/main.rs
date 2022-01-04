// Command-line program to run extended tuning runs and write out results to file

extern crate ising;
extern crate itertools;
use std::path::Path;
use std::fs::{File, create_dir};
use std::io::prelude::*;
use itertools::izip;

// Edit these manually to run with different values -- not great, I know

const FORGETFUL_C: f64 = 0.5;
const REF_NUM_SWEEPS: usize = 5_000_000;
const NUM_SWEEPS: usize = 5_000_000;
const INIT_FIELD: f64 = 1.0;
const TARGET_M: f64 = 0.5;
const KAPPA_MIN_PREF: f64 = 1.0;
const KAPPA_MAX_PREF: f64 = 1.0;
const INIT_P: f64 = 0.5;


fn write_results(fname: &str, fields: &Vec<f64>, mean_fields: &Vec<f64>, mags: &Vec<f64>, 
                 mean_mags: &Vec<f64>, kappas: &Vec<f64>, kappa_maxs: &Vec<f64>,
                 kappa_mins: &Vec<f64>) {
    let mut file = File::create(fname).unwrap();

    // Write a header
    file.write_all(b"Sweep\t\tField\t\tFieldMean\t\tMag\t\tMagMean\t\tKappa\tKappaMax\t\tKappaMin\n").unwrap();

    let mut step = 0;
    for (B, Bmean, M, Mmean, kap, kap_max, kap_min) in izip!(
            fields.iter(), mean_fields.iter(), mags.iter(), mean_mags.iter(),
            kappas.iter(), kappa_maxs.iter(), kappa_mins.iter()
        ) {
        write!(file, "{:>7}  {:>15.9}  {:>15.9}  {:>15.9}  {:>15.9}  {:>15.9}  {:>15.9}  {:>15.9}\n", step, B, Bmean, M, Mmean, kap, kap_max, kap_min).unwrap();
        step += 1;
    }

    return;
}

fn main() {
    let tc: f64 = 2.0 / (1.0_f64 + 2.0_f64.sqrt()).ln();
    let TEMPS: Vec<f64> = vec![3.0, 2.5, tc];
    let SIZES: Vec<usize> = vec![25, 50, 100];
    let SEEDS: Vec<u64> = vec![12345, 23456, 34567, 45678, 56789, 67890, 78901, 89012, 90123, 1234];

    let mut fields = Vec::with_capacity(NUM_SWEEPS+1);
    let mut mean_fields = Vec::with_capacity(NUM_SWEEPS+1);
    let mut mags = Vec::with_capacity(NUM_SWEEPS+1);
    let mut mean_mags = Vec::with_capacity(NUM_SWEEPS+1);
    let mut kappas = Vec::with_capacity(NUM_SWEEPS+1);
    let mut kappa_maxs = Vec::with_capacity(NUM_SWEEPS+1);
    let mut kappa_mins = Vec::with_capacity(NUM_SWEEPS+1);

    for seed in SEEDS.iter() {
        let sweeps = if *seed == SEEDS[0] {
            REF_NUM_SWEEPS
        } else {
            NUM_SWEEPS
        };

        println!("Seed = {}", seed);
        let dirname = format!("ising-tuning-results/seed-{}", seed);
        let dirpath = Path::new(&dirname);
        if !dirpath.exists() {
            create_dir(&dirpath).unwrap();
        }
        for T in TEMPS.iter() {
            let beta = 1.0 / T;
            for size in SIZES.iter() {
                println!("\tT = {}, Size = {}", T, size);

                let mut spingrid = ising::SpinGrid::new_with_seed(
                    *size, *size, -1.0, *T, INIT_FIELD, *seed
                );
                let target_M_ext = TARGET_M * (size * size) as f64;
                let f_size = *size as f64;
                let mut tuner = ising::Tuner::new(
                    INIT_FIELD, target_M_ext, beta, FORGETFUL_C, KAPPA_MIN_PREF * f_size * f_size, KAPPA_MAX_PREF
                );

                fields.push(INIT_FIELD);
                mean_fields.push(INIT_FIELD);
                mags.push(spingrid.magnetization());
                mean_mags.push(spingrid.magnetization());
                kappas.push(0.0);
                kappa_maxs.push(0.0);
                kappa_mins.push(KAPPA_MIN_PREF);

                // Initialize with INIT_P% of spins as spin-up so that we don't
                //  start at the correct magnetization
                spingrid.randomize_p(INIT_P);

                // Do the tuning!
                for n in 1..sweeps {
                    spingrid.rand_sweep();
                    // Update tuner
                    let ext_mag = spingrid.ext_magnetization();
                    let ext_mag_sq = ext_mag * ext_mag;
                    let new_field = tuner.update(ext_mag, ext_mag_sq);

                    // Update field
                    spingrid.set_field(new_field);

                    // Record data
                    fields.push(new_field);
                    mean_fields.push(tuner.mean_field);
                    mags.push(ext_mag / (size * size) as f64);
                    mean_mags.push(tuner.mean_obs / (size * size) as f64);
                    let kappa = tuner.get_kappa() / (size * size) as f64;
                    let kappa_max = tuner.get_kappa_max() / (size * size) as f64;
                    let kappa_min = tuner.get_kappa_min() / (size * size) as f64;
                    kappas.push(kappa);
                    kappa_maxs.push(kappa_max);
                    kappa_mins.push(kappa_min);
                }

                let fname = format!("{}/tuned_size{}_T{}.txt", dirname, size, T);
                write_results(&fname, &fields, &mean_fields, &mags, &mean_mags, &kappas, &kappa_maxs, &kappa_mins);
                fields.clear();
                mean_fields.clear();
                mags.clear();
                mean_mags.clear();
                kappas.clear();
                kappa_maxs.clear();
                kappa_mins.clear();
            }
        }
    }
}