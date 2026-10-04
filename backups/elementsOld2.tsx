// ─── Element list ─────────────────────────────────────────────────────────────

export interface Element {
    name: string;
    z: number;
}

export const Elements: Element[] = [
    { name: 'Hydrogen',      z: 1   },
    { name: 'Helium',        z: 2   },
    { name: 'Lithium',       z: 3   },
    { name: 'Beryllium',     z: 4   },
    { name: 'Boron',         z: 5   },
    { name: 'Carbon',        z: 6   },
    { name: 'Nitrogen',      z: 7   },
    { name: 'Oxygen',        z: 8   },
    { name: 'Fluorine',      z: 9   },
    { name: 'Neon',          z: 10  },
    { name: 'Sodium',        z: 11  },
    { name: 'Magnesium',     z: 12  },
    { name: 'Aluminum',      z: 13  },
    { name: 'Silicon',       z: 14  },
    { name: 'Phosphorus',    z: 15  },
    { name: 'Sulfur',        z: 16  },
    { name: 'Chlorine',      z: 17  },
    { name: 'Argon',         z: 18  },
    { name: 'Potassium',     z: 19  },
    { name: 'Calcium',       z: 20  },
    { name: 'Scandium',      z: 21  },
    { name: 'Titanium',      z: 22  },
    { name: 'Vanadium',      z: 23  },
    { name: 'Chromium',      z: 24  },
    { name: 'Manganese',     z: 25  },
    { name: 'Iron',          z: 26  },
    { name: 'Cobalt',        z: 27  },
    { name: 'Nickel',        z: 28  },
    { name: 'Copper',        z: 29  },
    { name: 'Zinc',          z: 30  },
    { name: 'Gallium',       z: 31  },
    { name: 'Germanium',     z: 32  },
    { name: 'Arsenic',       z: 33  },
    { name: 'Selenium',      z: 34  },
    { name: 'Bromine',       z: 35  },
    { name: 'Krypton',       z: 36  },
    { name: 'Rubidium',      z: 37  },
    { name: 'Strontium',     z: 38  },
    { name: 'Yttrium',       z: 39  },
    { name: 'Zirconium',     z: 40  },
    { name: 'Niobium',       z: 41  },
    { name: 'Molybdenum',    z: 42  },
    { name: 'Technetium',    z: 43  },
    { name: 'Ruthenium',     z: 44  },
    { name: 'Rhodium',       z: 45  },
    { name: 'Palladium',     z: 46  },
    { name: 'Silver',        z: 47  },
    { name: 'Cadmium',       z: 48  },
    { name: 'Indium',        z: 49  },
    { name: 'Tin',           z: 50  },
    { name: 'Antimony',      z: 51  },
    { name: 'Tellurium',     z: 52  },
    { name: 'Iodine',        z: 53  },
    { name: 'Xenon',         z: 54  },
    { name: 'Cesium',        z: 55  },
    { name: 'Barium',        z: 56  },
    { name: 'Lanthanum',     z: 57  },
    { name: 'Cerium',        z: 58  },
    { name: 'Praseodymium',  z: 59  },
    { name: 'Neodymium',     z: 60  },
    { name: 'Promethium',    z: 61  },
    { name: 'Samarium',      z: 62  },
    { name: 'Europium',      z: 63  },
    { name: 'Gadolinium',    z: 64  },
    { name: 'Terbium',       z: 65  },
    { name: 'Dysprosium',    z: 66  },
    { name: 'Holmium',       z: 67  },
    { name: 'Erbium',        z: 68  },
    { name: 'Thulium',       z: 69  },
    { name: 'Ytterbium',     z: 70  },
    { name: 'Lutetium',      z: 71  },
    { name: 'Hafnium',       z: 72  },
    { name: 'Tantalum',      z: 73  },
    { name: 'Tungsten',      z: 74  },
    { name: 'Rhenium',       z: 75  },
    { name: 'Osmium',        z: 76  },
    { name: 'Iridium',       z: 77  },
    { name: 'Platinum',      z: 78  },
    { name: 'Gold',          z: 79  },
    { name: 'Mercury',       z: 80  },
    { name: 'Thallium',      z: 81  },
    { name: 'Lead',          z: 82  },
    { name: 'Bismuth',       z: 83  },
    { name: 'Polonium',      z: 84  },
    { name: 'Astatine',      z: 85  },
    { name: 'Radon',         z: 86  },
    { name: 'Francium',      z: 87  },
    { name: 'Radium',        z: 88  },
    { name: 'Actinium',      z: 89  },
    { name: 'Thorium',       z: 90  },
    { name: 'Protactinium',  z: 91  },
    { name: 'Uranium',       z: 92  },
    { name: 'Neptunium',     z: 93  },
    { name: 'Plutonium',     z: 94  },
    { name: 'Americium',     z: 95  },
    { name: 'Curium',        z: 96  },
    { name: 'Berkelium',     z: 97  },
    { name: 'Californium',   z: 98  },
    { name: 'Einsteinium',   z: 99  },
    { name: 'Fermium',       z: 100 },
    { name: 'Mendelevium',   z: 101 },
    { name: 'Nobelium',      z: 102 },
    { name: 'Lawrencium',    z: 103 },
    { name: 'Rutherfordium', z: 104 },
    { name: 'Dubnium',       z: 105 },
    { name: 'Seaborgium',    z: 106 },
    { name: 'Bohrium',       z: 107 },
    { name: 'Hassium',       z: 108 },
    { name: 'Meitnerium',    z: 109 },
    { name: 'Darmstadtium',  z: 110 },
    { name: 'Roentgenium',   z: 111 },
    { name: 'Copernicium',   z: 112 },
    { name: 'Nihonium',      z: 113 },
    { name: 'Flerovium',     z: 114 },
    { name: 'Moscovium',     z: 115 },
    { name: 'Livermorium',   z: 116 },
    { name: 'Tennessine',    z: 117 },
    { name: 'Oganesson',     z: 118 },
];

// ─── Orbital definitions (aufbau filling order) ───────────────────────────────
//
//  REMOVED: `str` field — it was the only tie to the old switch-statement renderer.
//  RENAMED: `shape` → `l` — consistent with quantum number notation everywhere else.
//
//  Everything else is identical to your original ORBITAL_DEFS.

export interface OrbitalDef {
    n:   number;   // principal quantum number
    l:   number;   // azimuthal quantum number  (0=s 1=p 2=d 3=f)
    cap: number;   // max electrons in this subshell  (2l+1)*2
}

export const ORBITAL_DEFS: OrbitalDef[] = [
    { n: 1, l: 0, cap:  2 },   //  1s
    { n: 2, l: 0, cap:  2 },   //  2s
    { n: 2, l: 1, cap:  6 },   //  2p
    { n: 3, l: 0, cap:  2 },   //  3s
    { n: 3, l: 1, cap:  6 },   //  3p
    { n: 4, l: 0, cap:  2 },   //  4s
    { n: 3, l: 2, cap: 10 },   //  3d
    { n: 4, l: 1, cap:  6 },   //  4p
    { n: 5, l: 0, cap:  2 },   //  5s
    { n: 4, l: 2, cap: 10 },   //  4d
    { n: 5, l: 1, cap:  6 },   //  5p
    { n: 6, l: 0, cap:  2 },   //  6s
    { n: 4, l: 3, cap: 14 },   //  4f
    { n: 5, l: 2, cap: 10 },   //  5d
    { n: 6, l: 1, cap:  6 },   //  6p
    { n: 7, l: 0, cap:  2 },   //  7s
    { n: 5, l: 3, cap: 14 },   //  5f
    { n: 6, l: 2, cap: 10 },   //  6d
    { n: 7, l: 1, cap:  6 },   //  7p
];

// ─── OrbitalLayer ─────────────────────────────────────────────────────────────
//
//  REMOVED: `orbitalStr` — replaced by explicit quantum numbers n, l, m.
//  ADDED:   `l` and `m`  — the renderer uses these directly in wavefunctionNLM.
//
//  One OrbitalLayer now represents ONE magnetic sublevel (one m value),
//  not an entire subshell.  A full 2p subshell becomes three layers:
//    { n:2, l:1, m:-1, ... }  p_y
//    { n:2, l:1, m: 0, ... }  p_z
//    { n:2, l:1, m:+1, ... }  p_x

export interface OrbitalLayer {
    n:         number;   // principal quantum number
    l:         number;   // azimuthal quantum number
    m:         number;   // magnetic quantum number  (-l … 0 … +l)
    zeff:      number;   // effective nuclear charge (Slater)
    electrons: number;   // electrons in this specific m-orbital (0–2)
}

export interface SchrodingerProps {
    layers:      OrbitalLayer[];
    version:     number;       // bump to trigger a cloud rebuild
    visualScale: number;       // scene-units per Bohr radius
}

// ─── buildConfig (internal) ───────────────────────────────────────────────────
//  Used only by slaterZeff. Unchanged from your original.

function buildConfig(Z: number): [number, number, number][] {
    let remaining = Z;
    const config: [number, number, number][] = [];
    for (const { n, l, cap } of ORBITAL_DEFS) {
        if (remaining <= 0) break;
        const count = Math.min(remaining, cap);
        config.push([n, l, count]);
        remaining -= count;
    }
    return config;
}

// ─── slaterZeff ───────────────────────────────────────────────────────────────
//  Completely unchanged from your original — only `shape` → `l` in the loop.

export function slaterZeff(Z: number, nV: number, lV: number): number {
    const config = buildConfig(Z);
    const isSP   = lV < 2;
    let sigma    = 0;

    for (const [ni, li, count] of config) {
        if (ni === nV && li === lV) {
            const peerShielding = (nV === 1) ? 0.30 : 0.35;
            sigma += (count - 1) * peerShielding;
        } else if (isSP) {
            if      (ni === nV && li < 2) sigma += count * 0.35;
            else if (ni === nV - 1)       sigma += count * 0.85;
            else if (ni < nV - 1)         sigma += count * 1.00;
        } else {
            if (ni < nV || (ni === nV && li < lV)) sigma += count * 1.00;
        }
    }
    return Math.max(1, Z - sigma);
}

// ─── explodeSubshell ──────────────────────────────────────────────────────────
//  Expands one (n, l) subshell into 2l+1 individual OrbitalLayers (one per m).
//  Hund's rule: fill one electron per m before pairing.

export function explodeSubshell(
    n: number,
    l: number,
    totalElectrons: number,
    zeff: number,
): OrbitalLayer[] {
    const mValues = Array.from({ length: 2 * l + 1 }, (_, i) => i - l);  // -l … +l
    const counts  = new Array<number>(mValues.length).fill(0);
    let rem = totalElectrons;
    for (let i = 0; i < mValues.length && rem > 0; i++, rem--) counts[i]++;  // 1st pass
    for (let i = 0; i < mValues.length && rem > 0; i++, rem--) counts[i]++;  // 2nd pass (pair)
    return mValues.map((m, i) => ({ n, l, m, zeff, electrons: counts[i] }));
}

// ─── generateLayer ────────────────────────────────────────────────────────────
//  Entry point: given atomic number Z, returns the full OrbitalLayer[] for the
//  Schrodinger renderer.  Each subshell is exploded into per-m layers here.

export function generateLayer(Z: number): OrbitalLayer[] {
    const layers: OrbitalLayer[] = [];
    let remaining = Z;

    for (const { n, l, cap } of ORBITAL_DEFS) {
        if (remaining <= 0) break;
        const electrons = Math.min(remaining, cap);
        const zeff      = slaterZeff(Z, n, l);
        layers.push(...explodeSubshell(n, l, electrons, zeff));
        remaining -= electrons;
    }

    return layers;
}