
let wasm;

const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachegetUint8Memory0 = null;
function getUint8Memory0() {
    if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
        cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachegetUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function handleError(f) {
    return function () {
        try {
            return f.apply(this, arguments);

        } catch (e) {
            wasm.__wbindgen_exn_store(addHeapObject(e));
        }
    };
}

function getArrayU8FromWasm0(ptr, len) {
    return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}
/**
*/
export class SpinGrid {

    static __wrap(ptr) {
        const obj = Object.create(SpinGrid.prototype);
        obj.ptr = ptr;

        return obj;
    }

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_spingrid_free(ptr);
    }
    /**
    * @param {number} width
    * @param {number} height
    * @param {number} interaction
    * @param {number} temp
    * @param {number} field
    * @returns {SpinGrid}
    */
    static new(width, height, interaction, temp, field) {
        var ret = wasm.spingrid_new(width, height, interaction, temp, field);
        return SpinGrid.__wrap(ret);
    }
    /**
    * @param {number} i
    * @param {number} j
    * @returns {number}
    */
    get_index(i, j) {
        var ret = wasm.spingrid_get_index(this.ptr, i, j);
        return ret >>> 0;
    }
    /**
    * @returns {number}
    */
    get_height() {
        var ret = wasm.spingrid_get_height(this.ptr);
        return ret >>> 0;
    }
    /**
    * @returns {number}
    */
    get_width() {
        var ret = wasm.spingrid_get_width(this.ptr);
        return ret >>> 0;
    }
    /**
    * @returns {number}
    */
    get_field() {
        var ret = wasm.spingrid_get_field(this.ptr);
        return ret;
    }
    /**
    * @param {number} temp
    */
    set_temp(temp) {
        wasm.spingrid_set_temp(this.ptr, temp);
    }
    /**
    * @param {number} interaction
    */
    set_interaction(interaction) {
        wasm.spingrid_set_interaction(this.ptr, interaction);
    }
    /**
    * @param {number} field
    */
    set_field(field) {
        wasm.spingrid_set_field(this.ptr, field);
    }
    /**
    * @returns {number}
    */
    hamiltonian() {
        var ret = wasm.spingrid_hamiltonian(this.ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    magnetization() {
        var ret = wasm.spingrid_magnetization(this.ptr);
        return ret;
    }
    /**
    */
    step() {
        wasm.spingrid_step(this.ptr);
    }
    /**
    * @param {number} steps
    * @returns {number}
    */
    many_steps(steps) {
        var ret = wasm.spingrid_many_steps(this.ptr, steps);
        return ret >>> 0;
    }
    /**
    */
    randomize() {
        wasm.spingrid_randomize(this.ptr);
    }
    /**
    * @returns {number}
    */
    spins_ptr() {
        var ret = wasm.spingrid_spins_ptr(this.ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    fliprows_ptr() {
        var ret = wasm.spingrid_fliprows_ptr(this.ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    flipcols_ptr() {
        var ret = wasm.spingrid_flipcols_ptr(this.ptr);
        return ret;
    }
}
/**
*/
export class Tuner {

    static __wrap(ptr) {
        const obj = Object.create(Tuner.prototype);
        obj.ptr = ptr;

        return obj;
    }

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_tuner_free(ptr);
    }
    /**
    * @returns {number}
    */
    get mean_obs() {
        var ret = wasm.__wbg_get_tuner_mean_obs(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set mean_obs(arg0) {
        wasm.__wbg_set_tuner_mean_obs(this.ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get mean_obs_sq() {
        var ret = wasm.__wbg_get_tuner_mean_obs_sq(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set mean_obs_sq(arg0) {
        wasm.__wbg_set_tuner_mean_obs_sq(this.ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get mean_field() {
        var ret = wasm.__wbg_get_tuner_mean_field(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set mean_field(arg0) {
        wasm.__wbg_set_tuner_mean_field(this.ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get var_field() {
        var ret = wasm.__wbg_get_tuner_var_field(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set var_field(arg0) {
        wasm.__wbg_set_tuner_var_field(this.ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get var_obs() {
        var ret = wasm.__wbg_get_tuner_var_obs(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set var_obs(arg0) {
        wasm.__wbg_set_tuner_var_obs(this.ptr, arg0);
    }
    /**
    * @param {number} init_field
    * @param {number} target_obs
    * @param {number} beta
    * @param {number} forgetful_c
    * @param {number} kappa_min
    * @param {number} kappa_max_pref
    * @returns {Tuner}
    */
    static new(init_field, target_obs, beta, forgetful_c, kappa_min, kappa_max_pref) {
        var ret = wasm.tuner_new(init_field, target_obs, beta, forgetful_c, kappa_min, kappa_max_pref);
        return Tuner.__wrap(ret);
    }
    /**
    * @param {number} obs
    * @param {number} obs_sq
    * @returns {number}
    */
    update(obs, obs_sq) {
        var ret = wasm.tuner_update(this.ptr, obs, obs_sq);
        return ret;
    }
    /**
    * @returns {number}
    */
    get_kappa() {
        var ret = wasm.tuner_get_kappa(this.ptr);
        return ret;
    }
}

async function load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {

        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

async function init(input) {
    if (typeof input === 'undefined') {
        input = import.meta.url.replace(/\.js$/, '_bg.wasm');
    }
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    };
    imports.wbg.__wbg_getRandomValues_3ac1b33c90b52596 = function(arg0, arg1, arg2) {
        getObject(arg0).getRandomValues(getArrayU8FromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_randomFillSync_6f956029658662ec = function(arg0, arg1, arg2) {
        getObject(arg0).randomFillSync(getArrayU8FromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_self_1c83eb4471d9eb9b = handleError(function() {
        var ret = self.self;
        return addHeapObject(ret);
    });
    imports.wbg.__wbg_static_accessor_MODULE_abf5ae284bffdf45 = function() {
        var ret = module;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_require_5b2b5b594d809d9f = function(arg0, arg1, arg2) {
        var ret = getObject(arg0).require(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_crypto_c12f14e810edcaa2 = function(arg0) {
        var ret = getObject(arg0).crypto;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_msCrypto_679be765111ba775 = function(arg0) {
        var ret = getObject(arg0).msCrypto;
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_is_undefined = function(arg0) {
        var ret = getObject(arg0) === undefined;
        return ret;
    };
    imports.wbg.__wbg_getRandomValues_05a60bf171bfc2be = function(arg0) {
        var ret = getObject(arg0).getRandomValues;
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };

    if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
        input = fetch(input);
    }

    const { instance, module } = await load(await input, imports);

    wasm = instance.exports;
    init.__wbindgen_wasm_module = module;

    return wasm;
}

export default init;

