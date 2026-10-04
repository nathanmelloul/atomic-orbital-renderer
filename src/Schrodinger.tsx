import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { type SchrodingerProps, type OrbitalLayer } from './elements';
// import { setupCanvasRecorder, setupScreenshot } from '../../main-site/src/gallery/recorderUtils'

const SHELL_COLORS: THREE.Color[] = [
    new THREE.Color(1.00, 0.20, 0.20),  // n=1  red
    new THREE.Color(1.00, 0.55, 0.10),  // n=2  orange
    new THREE.Color(0.15, 0.85, 0.35),  // n=3  green
    new THREE.Color(0.10, 0.50, 1.00),  // n=4  blue
    new THREE.Color(0.75, 0.25, 1.00),  // n=5  purple
    new THREE.Color(0.10, 0.95, 0.90),  // n=6  cyan
    new THREE.Color(1.00, 1.00, 0.25),  // n=7  yellow
];

function factorial(n: number): number {
    if (n <= 1) return 1;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
}

function assocLegendre(l: number, m: number, cosT: number, sinT: number): number {
    let pmm = 1.0;
    for (let i = 1; i <= m; i++) pmm *= -(2 * i - 1) * sinT;
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

function radialWF(n: number, l: number, Z: number, r: number): number {
    const rho = (2 * Z * r) / n;
    return Math.exp(-rho / 2) * Math.pow(rho, l) * assocLaguerre(n - l - 1, 2 * l + 1, rho);
}

// Still exported for external use (debugging a value at a specific point)
export function wavefunctionNLM(
    n: number, l: number, m: number,
    x: number, y: number, z: number,
    Z: number
): number {
    const r    = Math.sqrt(x * x + y * y + z * z) + 1e-12;
    const cosT = z / r;
    const sinT = Math.sqrt(x * x + y * y) / r;
    const phi  = Math.atan2(y, x);
    return radialWF(n, l, Z, r) * realSH(l, m, cosT, sinT, phi);
}


export const Schrodinger = ({ layers, version, visualScale, renderMode }: SchrodingerProps) => {
    const containerRef  = useRef<HTMLDivElement>(null);
    const sceneRef      = useRef<THREE.Scene | null>(null);
    const cloudGroupRef = useRef<THREE.Group | null>(null);
    const rendererRef   = useRef<THREE.WebGLRenderer | null>(null);

    // Old approach: evaluate ψ on a Cartesian grid (res³ points),
    // sort by density, keep top 90%. O(n³ log n), ~48% wasted.
    // Monte Carlo importance sampling
    // New approach: ψ = R_nl(r) · Y_l^m(θ,φ) is separable, so we sample each factor independently. No sort, no wasted evaluations.

    // Phase 1: Radial CDF (500 evals of R_nl)
    // Compute P(r) ∝ r²|R_nl(r)|² at 500 points, build its CDF.
    // Sample r via inverse-CDF binary search → 100% acceptance, zero waste, works for both compact inner shells and diffuse outer shells equally.

    // Phase 2: Angular bound  (60×60 = 3 600 evals of Y_l^m)
    // Quick 2D scan to find max|Y_l^m(θ,φ)|² over the unit sphere.

    // Phase 3: MC loop (~numPoints / acceptance_rate evals of Y_l^m)
    // Sample (cosθ, φ) uniformly; accept with prob |Y_l^m|² / angMax.
    // Typical acceptance:  l=0 → ~95%,  l=1 → ~32%,  l=2 → ~19%,  l=3 → ~14%.

    // Net cost vs old: ~3–4× fewer wavefunction evaluations, zero sorting.

    function buildLayerMesh(layer: OrbitalLayer, maxN: number): THREE.Points {
        const { n, l, m, zeff, electrons } = layer;

        // Orbital extent in atomic units (a₀). ×10 captures ~99% of density.
        const rMaxAU   = Math.max(3, (n * n / zeff) * 10);
        const numPoints = 300000;   // rendered points per orbital. tune freely

        // Phase 1: Radial CDF
        // Build P(r) ∝ r²|R_nl(r)|² and its cumulative distribution.
        // We also record sign(R_nl) per bin. it flips at radial nodes and
        // drives the inner/outer lobe color distinction for s orbitals.
        const rBins  = 500;
        const rPDF   = new Float64Array(rBins);
        const rSigns = new Int8Array(rBins);

        for (let i = 0; i < rBins; i++) {
            const r  = rMaxAU * (i + 0.5) / rBins;
            const R  = radialWF(n, l, zeff, r);
            rPDF[i]   = r * r * R * R;
            rSigns[i] = R >= 0 ? 1 : -1;
        }

        // Integrate to CDF, then normalize to [0, 1].
        const rCDF = new Float64Array(rBins);
        rCDF[0] = rPDF[0];
        for (let i = 1; i < rBins; i++) rCDF[i] = rCDF[i - 1] + rPDF[i];
        const rTot = rCDF[rBins - 1];
        for (let i = 0; i < rBins; i++) rCDF[i] /= rTot;

        // Phase 2: Angular bound
        // Scan a 60×60 (cosθ, φ) grid to find the maximum of |Y_l^m|².
        // This is the rejection ceiling for Phase 3.
        // 60×60 = 3 600 evaluations — cheap relative to the MC loop.
        let angMax = 1e-30;           // floor avoids ÷0 for degenerate cases
        const angScan = 60;
        for (let it = 0; it < angScan; it++) {
            const cosT = -1 + 2 * (it + 0.5) / angScan;
            const sinT = Math.sqrt(Math.max(0, 1 - cosT * cosT));
            for (let ip = 0; ip < angScan; ip++) {
                const phi = 2 * Math.PI * ip / angScan;
                const Y   = realSH(l, m, cosT, sinT, phi);
                if (Y * Y > angMax) angMax = Y * Y;
            }
        }
        angMax *= 1.05;  // 5% safety margin so no sample ever exceeds the bound

        // Phase 3: Monte Carlo rejection sampling
        const finalPos    = new Float32Array(numPoints * 3);
        const finalColors = new Float32Array(numPoints * 3);

        const baseColor = SHELL_COLORS[(n - 1) % SHELL_COLORS.length];
        const negColor  = new THREE.Color(
            Math.min(1, baseColor.r + 0.45),
            Math.max(0, baseColor.g - 0.35),
            Math.max(0, baseColor.b - 0.55),
        );

        let accepted    = 0;
        const maxAttempts = numPoints * 50;   // hard cap: never loops infinitely

        for (let attempt = 0; attempt < maxAttempts && accepted < numPoints; attempt++) {

            // Sample r from the radial CDF via binary search
            // This is O(log rBins) ≈ 9 comparisons — negligible.
            // Jitter within the bin to avoid banding artifacts.
            const u = Math.random();
            let lo = 0, hi = rBins - 1;
            while (lo < hi) {
                const mid = (lo + hi) >> 1;
                rCDF[mid] < u ? (lo = mid + 1) : (hi = mid);
            }
            const r     = rMaxAU * (lo + Math.random()) / rBins;  // jitter in bin
            const signR = rSigns[lo];

            // ── Sample (cosθ, φ) uniformly; reject on |Y_l^m|² ───────────────
            // Uniform sampling of the sphere: cosθ ∈ [-1,1], φ ∈ [0,2π].
            // Acceptance probability = |Y_l^m(θ,φ)|² / angMax.
            const cosT = 2 * Math.random() - 1;
            const sinT = Math.sqrt(Math.max(0, 1 - cosT * cosT));
            const phi  = 2 * Math.PI * Math.random();

            const Y  = realSH(l, m, cosT, sinT, phi);
            if (Math.random() * angMax > Y * Y) continue;    // reject

            // Convert (r, θ, φ) into world coordinates
            // Spherical to Cartesian math: xM = r sinθ cosφ, yM = r sinθ sinφ, zM = r cosθ

            // Axis remap (matches original code: mathY = -threeZ, mathZ = threeY)
            // threeX =  xM*scale
            // threeY =  zM*scale
            // threeZ = -yM*scale
            const sr = sinT * r * visualScale;
            finalPos[accepted * 3]     =  sr  * Math.cos(phi);         // threeX
            finalPos[accepted * 3 + 1] =  cosT * r * visualScale;      // threeY
            finalPos[accepted * 3 + 2] = -sr  * Math.sin(phi);         // threeZ

            // Lobe color by sign(ψ) = sign(R_nl) × sign(Y_l^m)
            // Same sign: positive lobe (baseColor)
            // Opposite: negative (negColor)
            const positive = (signR > 0) === (Y >= 0);
            const c = positive ? baseColor : negColor;
            finalColors[accepted * 3]     = c.r;
            finalColors[accepted * 3 + 1] = c.g;
            finalColors[accepted * 3 + 2] = c.b;

            accepted++;
        }

        // Build GPU buffers
        // subarray() is a zero-copy view. no extra allocation
        // BufferAttribute holds the reference, preventing GC
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(finalPos.subarray(0, accepted * 3), 3));
        geo.setAttribute('color',    new THREE.BufferAttribute(finalColors.subarray(0, accepted * 3), 3));

        const shellFraction = n / maxN;
        const opacity   = (0.04 + shellFraction * shellFraction * 0.28) * (0.5 + electrons / 4);
        const pointSize = Math.max(0.04, 0.035 * visualScale);

        return new THREE.Points(geo, new THREE.PointsMaterial({
            size: pointSize,
            vertexColors: true,
            transparent: true,
            opacity: Math.min(0.6, opacity),
            blending: THREE.AdditiveBlending,
            sizeAttenuation: false,
            depthWrite: false,
        }));
    }

    // Regenerate every layer into the shared group
    const generateAllOrbitals = () => {
        const group = cloudGroupRef.current;
        if (!group) return;

        while (group.children.length > 0) {
            const mesh = group.children[0] as THREE.Points;
            group.remove(mesh);
            mesh.geometry.dispose();
            (mesh.material as THREE.Material).dispose();
        }

        if (!renderMode) {
            if (layers.length > 0) {
                const hoaoLayer = layers[layers.length - 1];
                console.log(`Rendering ${hoaoLayer.electrons} electrons with m=${hoaoLayer.m}`);
                group.add(buildLayerMesh(hoaoLayer, hoaoLayer.n));
            }
        } else {
            const maxN = layers.reduce((mx, l) => Math.max(mx, l.n), 1);
            for (const layer of layers) group.add(buildLayerMesh(layer, maxN));
        }
    };

    useEffect(() => {
        if (sceneRef.current) generateAllOrbitals();
    }, [version]);

    // Scene setup
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
        camera.position.set(0, 15, 20);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        // scene.add(new THREE.AxesHelper(5));

        let frameId: number;
        const animate = () => {
            frameId = requestAnimationFrame(animate);
            controls.update();
            // group.rotation.y += 0.002;
            renderer.render(scene, camera);
        };
        animate();

        // const cleanupRecorder = setupScreenshot(renderer, scene, camera);

        const handleResize = () => {
            if (!containerRef.current) return;
            camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            // cleanupRecorder();
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