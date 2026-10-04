import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { type SchrodingerProps, type OrbitalLayer } from './elementsOld2';

// One color per principal shell n=1..7
const SHELL_COLORS: THREE.Color[] = [
    new THREE.Color(1.00, 0.20, 0.20),  // n=1  red
    new THREE.Color(1.00, 0.55, 0.10),  // n=2  orange
    new THREE.Color(0.15, 0.85, 0.35),  // n=3  green
    new THREE.Color(0.10, 0.50, 1.00),  // n=4  blue
    new THREE.Color(0.75, 0.25, 1.00),  // n=5  purple
    new THREE.Color(0.10, 0.95, 0.90),  // n=6  cyan
    new THREE.Color(1.00, 1.00, 0.25),  // n=7  yellow
];

// ═══════════════════════════════════════════════════════════════════════════════
//  QUANTUM MECHANICS MATH
//
//  ψ_{n,l,m}(r,θ,φ)  =  R_{nl}(r)  ×  Y_l^m(θ,φ)
//
//  Four short recursions — no library, no switch, handles any (n, l, m).
// ═══════════════════════════════════════════════════════════════════════════════

/** n! — only ever called for small n (≤ 2l+1 ≤ 13 for f-block), so a plain loop is fine. */
function factorial(n: number): number {
    if (n <= 1) return 1;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
}

/**
 * Associated Legendre polynomial  P_l^m(cosθ)  for  0 ≤ m ≤ l.
 *
 * sinT = sin(θ) ≥ 0  is passed explicitly so we never compute √(1-cos²θ),
 * which cancels badly near the poles.
 *
 * Includes the Condon–Shortley phase  (-1)^m  in the seed P_m^m.
 *
 * Recurrence:
 *   P_m^m     = (-1)^m (2m-1)!! sin^m θ
 *   P_{m+1}^m = (2m+1) cosθ · P_m^m
 *   P_l^m     = [(2l-1) cosθ · P_{l-1}^m  -  (l+m-1) P_{l-2}^m] / (l-m)
 */
function assocLegendre(l: number, m: number, cosT: number, sinT: number): number {
    let pmm = 1.0;
    for (let i = 1; i <= m; i++) pmm *= -(2 * i - 1) * sinT;   // seed P_m^m

    if (l === m) return pmm;

    let pm1 = (2 * m + 1) * cosT * pmm;
    if (l === m + 1) return pm1;

    let plm = 0.0;
    for (let lv = m + 2; lv <= l; lv++) {
        plm = ((2 * lv - 1) * cosT * pm1 - (lv + m - 1) * pmm) / (lv - m);
        pmm = pm1;
        pm1 = plm;
    }
    return plm;
}

/**
 * Normalized real spherical harmonic  Y_l^m(θ,φ).
 *
 *         ⎧  √2 · N · P_l^|m| · cos(|m|φ)   m > 0
 *  Y_l^m = ⎨      N · P_l^0                  m = 0
 *         ⎩  √2 · N · P_l^|m| · sin(|m|φ)   m < 0
 *
 *  where  N = √[ (2l+1)/4π · (l-|m|)!/(l+|m|)! ]
 *
 * This is the standard real-form used in textbook orbital pictures.
 * Each m value produces a distinct orientation:
 *   l=1, m=0  → p_z      l=2, m=0  → d_{z²}
 *   l=1, m=±1 → p_{x,y}  l=2, m=±1 → d_{xz,yz}
 *                          l=2, m=±2 → d_{x²-y², xy}
 */
function realSH(l: number, m: number, cosT: number, sinT: number, phi: number): number {
    const absM = Math.abs(m);
    const N = Math.sqrt(
        ((2 * l + 1) / (4 * Math.PI)) *
        (factorial(l - absM) / factorial(l + absM))
    );
    const Plm = assocLegendre(l, absM, cosT, sinT);

    if (m === 0) return N * Plm;
    const K = Math.SQRT2 * N * Plm;
    return m > 0 ? K * Math.cos(absM * phi) : K * Math.sin(absM * phi);
}

/**
 * Associated Laguerre polynomial  L_n^α(x).
 *
 *   L_0^α = 1
 *   L_1^α = 1 + α − x
 *   L_k^α = [(2k-1+α-x) L_{k-1}^α  −  (k-1+α) L_{k-2}^α] / k
 *
 * Verified:  L_2^1(x) = 3 − 3x + x²/2  ✓  (matches explicit formula)
 */
function assocLaguerre(n: number, alpha: number, x: number): number {
    if (n === 0) return 1;
    let l0 = 1, l1 = 1 + alpha - x;
    if (n === 1) return l1;
    let lk = 0;
    for (let k = 2; k <= n; k++) {
        lk = ((2 * k - 1 + alpha - x) * l1 - (k - 1 + alpha) * l0) / k;
        l0 = l1;
        l1 = lk;
    }
    return lk;
}

/**
 * Hydrogen-like radial wavefunction  R_{nl}(r)  (shape only — normalization
 * constant is omitted because we sample by density and it cancels out).
 *
 *   ρ = 2Zr/n   (atomic units: a₀ = 1)
 *   R = e^{-ρ/2} · ρ^l · L_{n-l-1}^{2l+1}(ρ)
 *
 * Spot-checks:
 *   1s (n=1,l=0): ρ=2Zr,  R = e^{-Zr}                         ✓
 *   2s (n=2,l=0): ρ=Zr,   R = (2-Zr) e^{-Zr/2}               ✓
 *   2p (n=2,l=1): ρ=Zr,   R = Zr · e^{-Zr/2}                 ✓
 *   3s (n=3,l=0): ρ=2Zr/3,R ∝ (27-18Zr+2Z²r²) e^{-Zr/3}    ✓
 */
function radialWF(n: number, l: number, Z: number, r: number): number {
    const rho = (2 * Z * r) / n;
    return Math.exp(-rho / 2) * Math.pow(rho, l) * assocLaguerre(n - l - 1, 2 * l + 1, rho);
}

/**
 * Full hydrogen-like wavefunction  ψ_{n,l,m}(x,y,z).
 *
 * Returns the SIGNED real value; square it for the probability density |ψ|².
 * The sign encodes lobe phase — positive lobes vs negative lobes.
 *
 * Works for any (n, l, m) without special-casing:
 *   n=1..7, l=0..n-1, m=-l..+l  covers H → Og and beyond.
 */
export function wavefunctionNLM(
    n: number, l: number, m: number,
    x: number, y: number, z: number,
    Z: number
): number {
    const r    = Math.sqrt(x * x + y * y + z * z) + 1e-12;
    const cosT = z / r;
    const sinT = Math.sqrt(x * x + y * y) / r;   // = sin(θ), always ≥ 0
    const phi  = Math.atan2(y, x);

    return radialWF(n, l, Z, r) * realSH(l, m, cosT, sinT, phi);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  RENDERER
// ═══════════════════════════════════════════════════════════════════════════════

export const Schrodinger = ({ layers, version, visualScale }: SchrodingerProps) => {
    const containerRef  = useRef<HTMLDivElement>(null);
    const sceneRef      = useRef<THREE.Scene | null>(null);
    const cloudGroupRef = useRef<THREE.Group | null>(null);
    const rendererRef   = useRef<THREE.WebGLRenderer | null>(null);

    // ── Build one THREE.Points for a single OrbitalLayer ─────────────────────
    function buildLayerMesh(layer: OrbitalLayer): THREE.Points {
        const { n, l, m, zeff, electrons } = layer;

        // Grid extent: orbital radius scales as n²/Z_eff (Bohr model).
        // ×9 captures ~90% of the probability density for any (n,l,m).
        const gridSize   = Math.max(3, (n * n / zeff) * 9);

        // Higher l → more angular nodes → finer sampling needed.
        // Higher n → larger cloud → more cells to fill it adequately.
        const resolution = Math.round(45 + 8 * l + 5 * n);   // ~45 (1s) to ~80 (4f)
        const step       = gridSize / resolution;
        const jitter     = () => (Math.random() - 0.5) * step;
        const total      = resolution ** 3;

        const pValues   = new Float32Array(total);
        const signs     = new Int8Array(total);
        const positions = new Float32Array(total * 3);
        let sumP = 0, idx = 0;

        for (let ix = 0; ix < resolution; ix++) {
            for (let iy = 0; iy < resolution; iy++) {
                for (let iz = 0; iz < resolution; iz++) {
                    const x = (ix - resolution / 2) * step + jitter();
                    const y = (iy - resolution / 2) * step + jitter();
                    const z = (iz - resolution / 2) * step + jitter();

                    // visualScale maps Three.js scene units → atomic units (a₀)
                    const psi = wavefunctionNLM(n, l, m, x / visualScale, y / visualScale, z / visualScale, zeff);
                    const p   = psi * psi;

                    pValues[idx]       = p;
                    signs[idx]         = psi >= 0 ? 1 : -1;
                    positions[idx * 3]     = x;
                    positions[idx * 3 + 1] = y;
                    positions[idx * 3 + 2] = z;
                    sumP += p;
                    idx++;
                }
            }
        }

        // Sort descending, keep the voxels that account for 90% of total density.
        const order = Array.from({ length: total }, (_, i) => i)
            .sort((a, b) => pValues[b] - pValues[a]);

        let cumP = 0, cutoff = 0;
        for (let i = 0; i < total; i++) {
            cumP += pValues[order[i]];
            if (cumP >= sumP * 0.90) { cutoff = i + 1; break; }
        }

        const finalPos    = new Float32Array(cutoff * 3);
        const finalColors = new Float32Array(cutoff * 3);

        const baseColor = SHELL_COLORS[(n - 1) % SHELL_COLORS.length];
        // Negative lobe: shifted warm for contrast, so lobe phase is visually distinct.
        const negColor  = new THREE.Color(
            Math.min(1, baseColor.r + 0.45),
            Math.max(0, baseColor.g - 0.35),
            Math.max(0, baseColor.b - 0.55),
        );

        for (let i = 0; i < cutoff; i++) {
            const o = order[i];
            finalPos[i * 3]     = positions[o * 3];
            finalPos[i * 3 + 1] = positions[o * 3 + 1];
            finalPos[i * 3 + 2] = positions[o * 3 + 2];
            const c = signs[o] >= 0 ? baseColor : negColor;
            finalColors[i * 3]     = c.r;
            finalColors[i * 3 + 1] = c.g;
            finalColors[i * 3 + 2] = c.b;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(finalPos, 3));
        geo.setAttribute('color',    new THREE.BufferAttribute(finalColors, 3));

        const pointSize = Math.max(0.04, 0.035 * visualScale);
        const opacity   = 0.15 + (electrons / 14) * 0.15;

        return new THREE.Points(geo, new THREE.PointsMaterial({
            size: pointSize,
            vertexColors: true,
            transparent: true,
            opacity,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: false,
            depthWrite: false,
        }));
    }

    // ── Regenerate every layer into the shared group ──────────────────────────
    const generateAllOrbitals = () => {
        const group = cloudGroupRef.current;
        if (!group) return;
        while (group.children.length > 0) {
            const mesh = group.children[0] as THREE.Points;
            group.remove(mesh);
            mesh.geometry.dispose();
            (mesh.material as THREE.Material).dispose();
        }
        for (const layer of layers) group.add(buildLayerMesh(layer));
    };

    useEffect(() => {
        if (sceneRef.current) generateAllOrbitals();
    }, [version]);

    // ── One-time scene setup ──────────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current || rendererRef.current) return;

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const group = new THREE.Group();
        scene.add(group);
        cloudGroupRef.current = group;

        const camera = new THREE.PerspectiveCamera(
            45,
            containerRef.current.clientWidth / containerRef.current.clientHeight,
            0.1, 1000
        );
        camera.position.set(20, 15, 20);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        scene.add(new THREE.AxesHelper(5));

        let frameId: number;
        const animate = () => {
            frameId = requestAnimationFrame(animate);
            controls.update();
            group.rotation.y += 0.002;
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            if (!containerRef.current) return;
            camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            rendererRef.current = null;
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(frameId);
            controls.dispose();
            renderer.dispose();
            if (renderer.domElement.parentNode)
                renderer.domElement.parentNode.removeChild(renderer.domElement);
        };
    }, []);

    return <div ref={containerRef} className="w-full h-full" />;
};