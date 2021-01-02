import init, {SpinGrid, Tuner} from "./pkg/ising.js"
// import { memory } from "./pkg/ising_bg.wasm"

async function load() {
  return await init();
}

// Returns a float x rounded to n digits
function toFixed(x, n) {
    return Math.round(x * (10**n)) / (10**n)
}

// Converts a number to 2-character hex string
function numTo256(x) {
    var s = x.toString(16);
    return s.length == 1 ? "0" + s : s;
}

// Converts an integer to a color string
function hexToStr(x) {
    var r = (x >> 16) & 0xff;
    var g = (x >> 8) & 0xff;
    var b = x & 0xff;
    return "#" + numTo256(r) + numTo256(g) + numTo256(b);
}

load().then((mod) => {
    const memory = mod.memory;

    const UP_COLOR_INT = 0xff0000;
    const DOWN_COLOR_INT = 0x0000ff;

    // This is pretty gross ... any better solution?
    const UP_COLOR_R = (UP_COLOR_INT >> 16) & 0xff;
    const UP_COLOR_G = (UP_COLOR_INT >> 8) & 0xff;
    const UP_COLOR_B = UP_COLOR_INT & 0xff;
    const DOWN_COLOR_R = (DOWN_COLOR_INT >> 16) & 0xff;
    const DOWN_COLOR_G = (DOWN_COLOR_INT >> 8) & 0xff;
    const DOWN_COLOR_B = DOWN_COLOR_INT & 0xff;

    const UP_COLOR = hexToStr(UP_COLOR_INT);
    const DOWN_COLOR = hexToStr(DOWN_COLOR_INT);
    var SIZE = 500;
    var CELL_SIZE = 1;

    // The number of updates per measurement passed to the tuner
    const STEPS_PER_MEAS = 10000;
    // The number of measurements per updated frame of the graphics
    const MEAS_PER_FRAME = 10;

    const STEPS_PER_FRAME = STEPS_PER_MEAS * MEAS_PER_FRAME;

    const getIndex = (row, col) => {
        return (row * SIZE) + col;
    }
    const getCanvasIndex = (row, col) => {
        return 4 * CELL_SIZE * (row * CELL_SIZE * SIZE + col);
    }

    const pause_button = document.getElementById("play-pause-button");
    const reset_button = document.getElementById("reset-button");
    const tune_button = document.getElementById("tune-button");
    const toggle_button = document.getElementById("toggle-button");
    const graph_toggle_button = document.getElementById("graph-toggle-button");
    const target_m_input = document.getElementById("target-m-input");
    const forgetful_c_input = document.getElementById("forgetful-c-input");
    const kappa_min_input = document.getElementById("kappa-min-input");
    const kappa_max_input = document.getElementById("kappa-max-input");
    const sys_size_setter = document.getElementById("sys-size");
    const temp_slider = document.getElementById("temp-slider");
    const temp_slider_value = document.getElementById("temp-slider-value");
    const field_slider = document.getElementById("field-slider");
    const field_slider_value = document.getElementById("field-slider-value");
    const mag_value = document.getElementById("mag-value");
    const mag_chart_label = document.getElementById("mag-chart-label");
    const mean_mag_chart_label = document.getElementById("mean-mag-chart-label");
    const field_chart_label = document.getElementById("field-chart-label");
    const mean_field_chart_label = document.getElementById("mean-field-chart-label");
    const kappa_chart_label = document.getElementById("kappa-chart-label");
    const kappa_max_chart_label = document.getElementById("kappa-max-chart-label");
    temp_slider_value.textContent = "T = " + temp_slider.value;
    field_slider_value.textContent = "B = " + field_slider.value;

    var kappa_min = kappa_min_input.value * SIZE * SIZE;
    var kappa_max_pref = kappa_max_input.value; 
    var target_m = target_m_input.value * SIZE * SIZE;
    var forgetful_c = forgetful_c_input.value;

    var grid = SpinGrid.new(SIZE, SIZE, -1.0, temp_slider.value, 0.0);
    var height = grid.get_height();
    var width = grid.get_width();
    var tuner = Tuner.new(0.0, target_m, 1.0, forgetful_c, kappa_min, kappa_max_pref);

    const canvas_div = document.getElementById("ising-canvas-div");
    canvas_div.height = CELL_SIZE * height;
    canvas_div.width = CELL_SIZE * height;
    const canvas = document.getElementById("ising-canvas");
    canvas.height = CELL_SIZE * height;
    canvas.width = CELL_SIZE * width;

    const ctx = canvas.getContext('2d');
    const image = ctx.createImageData(canvas.width, canvas.height);
    // Set all pixels opaque
    for (var i=0; i<image.data.length; i+=4) {
        image.data[i+3] = 255;
    }

    let animation_id = null;

    var show_animation = true;
    var show_plots = true;
    var tuning = false;

    var its = 0;
    var timesteps = [];
    var mag_data = [];
    var mag_chart_ctx = document.getElementById("mag-chart").getContext('2d');
    const mag_chart = new Chart(mag_chart_ctx, {
      type: 'line',
      data: {
        labels: timesteps,
        datasets: [{ 
            data: mag_data,
            label: "Magnetization",
            borderColor: "#3e95cd",
            pointRadius: 0.0,
            fill: false
          }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: 'linear',
                scaleLabel: {
                    display: true,
                    labelString: 'Updates (x10k)'
                }
            },
            y: {
                type: 'linear',
                min: -1.0,
                max: 1.0,
                scaleLabel: {
                    display: true,
                    labelString: 'Mag'
                }
            }
        },
        animation: {
            duration: 0 // general animation time
        },
        hover: {
            animationDuration: 0 // duration of animations when hovering an item
        },
        responsiveAnimationDuration: 0, // animation duration after a resize
        elements: {
            line: {
                tension: 0 // disables bezier curves
            }
        },
        events: ["click"], // Interact only with clicks
      }
    });

    var field_data = [];
    var field_chart_ctx = document.getElementById("field-chart").getContext('2d');
    const field_chart = new Chart(field_chart_ctx, {
      type: 'line',
      data: {
        labels: timesteps,
        datasets: [{ 
            data: field_data,
            label: "Field",
            borderColor: "#efac4f",
            pointRadius: 0.0,
            fill: false
          }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: 'linear',
                scaleLabel: {
                    display: true,
                    labelString: 'Updates (x10k)'
                }
            },
            y: {
                type: 'linear',
                min: -1.0,
                max: 1.0,
                scaleLabel: {
                    display: true,
                    labelString: 'Field'
                }
            },
        },
        animation: {
            duration: 0 // general animation time
        },
        hover: {
            animationDuration: 0 // duration of animations when hovering an item
        },
        responsiveAnimationDuration: 0, // animation duration after a resize
        elements: {
            line: {
                tension: 0 // disables bezier curves
            }
        },
        events: ["click"], // Interact only with clicks
      }
    });

    var kappa_data = [];
    var kappa_min_data = [];
    var kappa_max_data = [];
    var kappa_chart_ctx = document.getElementById("kappa-chart").getContext('2d');
    const kappa_chart = new Chart(kappa_chart_ctx, {
      type: 'line',
      data: {
        labels: timesteps,
        datasets: [{
            data: kappa_data,
            label: "Kappa",
            borderColor: "#48e283",
            pointRadius: 0.0,
            fill: false
          // },{
          //   data: kappa_min_data,
          //   label: "Kappa_min",
          //   borderColor: "#58efde",
          //   borderDash: [5, 5],
          //   pointRadius: 0.0,
          //   fill: false
          // }, {
          //   data: kappa_max_data,
          //   label: "Kappa_max",
          //   borderColor: "#41af33",
          //   borderDash: [5, 5],
          //   pointRadius: 0.0,
          //   fill: false
          }],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: 'linear',
                scaleLabel: {
                    display: true,
                    labelString: 'Updates (x10k)'
                }
            },
            y: {
                type: 'linear',
                scaleLabel: {
                    display: true,
                    labelString: 'Kappa'
                }
            }
        },
        animation: {
            duration: 0 // general animation time
        },
        hover: {
            animationDuration: 0 // duration of animations when hovering an item
        },
        responsiveAnimationDuration: 0, // animation duration after a resize
        elements: {
            line: {
                tension: 0 // disables bezier curves
            }
        },
        events: ["click"], // Interact only with clicks
      }
    });

    // Draws the given color into the square
    const drawSquare = (row, col, r, g, b) => {
        var baseIdx = getCanvasIndex(row, col);
        for (var i=0; i<CELL_SIZE; i++) {
            for (var j=0; j<CELL_SIZE; j++) {
                var idx = baseIdx + 4 * (canvas.width * i + j);
                image.data[idx] = r;
                image.data[idx+1] = g;
                image.data[idx+2] = b;
            }
        }
    }

    // Flips the color of the square with upper-left corner at (row, col)
    const flipSquare = (row, col) => {
        var baseIdx = getCanvasIndex(row, col);
        var r = UP_COLOR_R + DOWN_COLOR_R - image.data[baseIdx];
        var g = UP_COLOR_G + DOWN_COLOR_G - image.data[baseIdx+1];
        var b = UP_COLOR_B + DOWN_COLOR_B - image.data[baseIdx+2];
        for (var i=0; i<CELL_SIZE; i++) {
            for (var j=0; j<CELL_SIZE; j++) {
                var idx = baseIdx + 4 * (canvas.width * i + j)
                image.data[idx] = r;
                image.data[idx+1] = g;
                image.data[idx+2] = b;
            }
        }
    };

    // Draws out the full state of the system
    const drawFullGrid = () => {
        const spins_ptr = grid.spins_ptr();
        const spins = new Int8Array(memory.buffer, spins_ptr, width * height);

        // Draw the initial state
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const idx = getIndex(row, col);

                var r, g, b;
                if (spins[idx] === 1) {
                    r = UP_COLOR_R, g = UP_COLOR_G, b = UP_COLOR_B
                } else {
                    r = DOWN_COLOR_R, g = DOWN_COLOR_G, b = DOWN_COLOR_B
                }

                drawSquare(row, col, r, g, b);
            }
        }

        // Push that image
        ctx.putImageData(image, 0, 0);
    };

    const play = () => {
        pause_button.textContent = "Pause";
        renderLoop();
    };

    const pause = () => {
        pause_button.textContent = "Play";
        cancelAnimationFrame(animation_id);
        animation_id = null;
    }

    pause_button.addEventListener("click", event => {
        if (animation_id === null) {
            play();
        } else {
            pause();
        }
    });

    reset_button.addEventListener("click", event => {
        grid.randomize();
        // Have to redraw full system
        drawFullGrid();
    });

    tune_button.addEventListener("click", event => {
        tuning = !tuning;
        if (tuning) {
            its = 0;
            tune_button.textContent = "Stop Tuning";
            mag_data.length = 0;
            field_data.length = 0;
            timesteps.length = 0;
            target_m = target_m_input.value * SIZE * SIZE;
            forgetful_c = forgetful_c_input.value;
            kappa_min = kappa_min_input.value * SIZE * SIZE;
            kappa_max_pref = kappa_max_input.value;
            tuner = Tuner.new(
                field_slider.value,
                target_m,
                1.0 / temp_slider.value,
                forgetful_c,
                kappa_min,
                kappa_max_pref,
            )
        } else {
            tune_button.textContent = "Tune!"
        }
    });

    toggle_button.addEventListener("click", event => {
        show_animation = !show_animation;
        if (show_animation) {
            drawFullGrid();
            canvas.style.display = "block";
        } else {
            canvas.style.display = "none";
        }
    });

    graph_toggle_button.addEventListener("click", event => {
        show_plots = !show_plots;
        if (show_plots) {
            mag_chart.update();
            field_chart.update();
            kappa_chart.update();
            graph_toggle_button.textContent = "Pause Plots";
        } else {
            graph_toggle_button.textContent = "Enable Plots";
        }
    });

    sys_size_setter.addEventListener("change", event => {
        SIZE = sys_size_setter.value;
        CELL_SIZE = 500 / SIZE
        grid = SpinGrid.new(SIZE, SIZE, -1.0, temp_slider.value, 0.0);
        height = grid.get_height();
        width = grid.get_width();
        drawFullGrid();
        kappa_min = 10.0 * SIZE * SIZE;
        tuner = Tuner.new(0.0, target_m, 1.0, forgetful_c, kappa_min, kappa_max_pref);
    });

    temp_slider.addEventListener("input", event => {
        temp_slider_value.textContent = "T = " + temp_slider.value;
        grid.set_temp(temp_slider.value);
    });

    field_slider.addEventListener("input", event => {
        field_slider_value.textContent = "B = " + field_slider.value;
        grid.set_field(field_slider.value);
    });

    const renderLoop = () => {

        for (var t=0; t<MEAS_PER_FRAME; t++) {
            const num_flips = grid.many_steps(STEPS_PER_MEAS);

            const spins_ptr = grid.spins_ptr();
            const spins = new Int8Array(memory.buffer, spins_ptr, width * height);

            const fliprows_ptr = grid.fliprows_ptr();
            const flipcols_ptr = grid.flipcols_ptr();
            const fliprows = new Uint32Array(memory.buffer, fliprows_ptr, num_flips);

            const flipcols = new Uint32Array(memory.buffer, flipcols_ptr, num_flips);

            // Update data
            var mag = grid.magnetization();
            var field = grid.get_field()
            mag_data.push(mag);
            field_data.push(field);
            timesteps.push(its);

            // Update tuner
            if (tuning) {
                // The tuner deals in the land of extensive quantities
                var ext_mag = mag * (SIZE * SIZE);
                var ext_mag_sq = ext_mag * ext_mag;
                var new_field = tuner.update(ext_mag, ext_mag_sq);

                // Update the field slider
                field_slider.value = new_field;
                field_slider_value.textContent = "B = " + toFixed(new_field, 4);

                grid.set_field(new_field);
                // Plot *intensive* kappa
                var kappa = tuner.get_kappa() / (SIZE * SIZE);
                var kappa_min_t = kappa_min / (SIZE * SIZE * Math.sqrt(kappa_data.length + 1));
                var kappa_max = kappa_max_pref * Math.sqrt(tuner.var_mean_obs) / (SIZE * SIZE * Math.sqrt(tuner.var_mean_field));
                var kappa_eff = Math.min(kappa, kappa_max);
                kappa_eff = Math.max(kappa, kappa_min_t);

                kappa_data.push(kappa_eff);
                var mean_mag = tuner.mean_obs / (SIZE * SIZE);
                mean_mag_chart_label.textContent = "{m} = " + toFixed(mean_mag, 2);
                mean_field_chart_label.textContent = "{B} = " + toFixed(tuner.mean_field, 3);
                kappa_chart_label.textContent = "κ = " + toFixed(kappa, 1);
                kappa_max_chart_label.textContent = "κ_max = " + toFixed(kappa_max, 1);
            }

            // Update the animation of the configuration
            // It would be nice if this was outside of this loops, but then
            //   I need to store many fliprows/flipcols stacked, and I imagine
            //   that is slower.
            // Could make the Rust only clear fliprows/flipcols when explicitly
            //   told to rather than every call to many_steps
            if (show_animation) {
                for (let i = 0; i < num_flips; i++) {
                    const row = fliprows[i];
                    const col = flipcols[i];
                    const spin_idx = getIndex(row, col);

                    flipSquare(row, col);
                }
            }
        }

        // Update chart labels
        mag_chart_label.textContent = "m = " + toFixed(mag, 3);
        field_chart_label.textContent = "B = " + toFixed(grid.get_field(), 3);

        // Only update the plots every once in a while -- they're expensive
        if (show_plots && (its % 200 == 0)) {
            mag_chart.update();
            field_chart.update();
            if (tuning) {
                kappa_chart.update();
            }
        }

        its += 1;

        ctx.putImageData(image, 0, 0);
        animation_id = requestAnimationFrame(renderLoop);
    }

    // Draw the initial state
    drawFullGrid()

    pause();
});
