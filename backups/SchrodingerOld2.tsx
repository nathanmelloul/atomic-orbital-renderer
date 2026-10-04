import { useRef } from 'react';
import { useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {type OrbitalLayer } from './elementsOld.tsx';
import {type SchrodingerProps } from './elementsOld.tsx';



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

export const SchrodingerOld2 = ({ layers, version, visualScale }: SchrodingerProps) => {
    const containerRef  = useRef<HTMLDivElement>(null);
    const sceneRef      = useRef<THREE.Scene | null>(null);
    const cloudGroupRef = useRef<THREE.Group | null>(null);   // ← replaces pointCloudRef
    const rendererRef   = useRef<THREE.WebGLRenderer | null>(null);


    /* Add this functionality with the custom orbital builder + electron slider (0-100)
    function splitText(type: string) : String[] {

        const trimmed = type.replace(/\s+/g, ''); 
        const list = type.split("+");
        return list;
    }
    function getFinalArray(type: string, x: number, y: number, z: number, Z: number) { // : OrbitalLayer[]

        }
    }
    */
    
    

    // ── Wavefunction ──────────────────────────────────────────────────────────
    function getWavefunction(type: string, x: number, y: number, z: number, Z: number): number {

        const r = Math.sqrt(x*x + y*y + z*z) + 1e-10;

        const p = Z * r; // scaled radius ρ = Z·r

        switch (type.toLowerCase().trim()) {
            // s orbitals (radial nodes = n-1)
            case '1s':    return Math.exp(-p);
            case '2s':    return (2 - p) * Math.exp(-p / 2);
            case '3s':    return (27 - 18*p + 2*p*p) * Math.exp(-p / 3);
            case '4s':    return (24 - 36*p + 12*p*p - p*p*p) * Math.exp(-p / 4);
            // p orbitals
            case '2pz':   return z * Math.exp(-p / 2);
            case '2px':   return x * Math.exp(-p / 2);
            case '2py':   return y * Math.exp(-p / 2);
            case '3pz':   return z * (6 - p) * Math.exp(-p / 3);
            case '3px':   return x * (6 - p) * Math.exp(-p / 3);
            case '3py':   return y * (6 - p) * Math.exp(-p / 3);
            case '4pz':   return z * (20 - 10*p + p*p) * Math.exp(-p / 4);
            case '4px':   return x * (20 - 10*p + p*p) * Math.exp(-p / 4);
            case '4py':   return y * (20 - 10*p + p*p) * Math.exp(-p / 4);
            // d orbitals
            case '3dz2':  return (2*z*z - x*x - y*y) * Math.exp(-p / 3);
            case '3dxy':  return x * y * Math.exp(-p / 3);
            case '3dxz':  return x * z * Math.exp(-p / 3);
            case '3dyz':  return y * z * Math.exp(-p / 3);
            case '3dx2y2':return (x*x - y*y) * Math.exp(-p / 3);
            case '4dz2':  return (2*z*z - x*x - y*y) * (p - 6) * Math.exp(-p / 4);
            case '4dxy':  return x * y * (p - 6) * Math.exp(-p / 4);
            case '4dxz':  return x * z * (p - 6) * Math.exp(-p / 4);
            case '4dyz':  return y * z * (p - 6) * Math.exp(-p / 4);
            case '4dx2y2':return (x*x - y*y) * (p - 6) * Math.exp(-p / 4);
            // f orbitals (representative — add more as needed)
            case '4fz3':  return z * (2*z*z - 3*x*x - 3*y*y) * Math.exp(-p / 4);
            case '4fxz2': return x * (4*z*z - x*x - y*y) * Math.exp(-p / 4);
            case '4fyz2': return y * (4*z*z - x*x - y*y) * Math.exp(-p / 4);
            default:      return Math.exp(-p);
        }
    }

    // ── Build one THREE.Points for a single OrbitalLayer ─────────────────────
    function buildLayerMesh(layer: OrbitalLayer): THREE.Points {
        const { orbitalStr, n, zeff, electrons } = layer;

        // Grid extent scales with the orbital's Bohr radius (n²/Z_eff).
        // ×9 captures ~90 % of the probability cloud.
        const gridSize   = Math.max(3, (n * n / zeff) * 9);

        // Inner s orbitals are spherically simple → lower res is fine.
        // Outer / d,f orbitals need finer sampling to resolve lobes.
        const l = ['s','p','d','f'].findIndex(c => orbitalStr.includes(c));
        const resolution = Math.round(45 + 8 * l + 5 * n); // 45–80 range
        const step   = gridSize / resolution;
        const jitter = () => (Math.random() - 0.5) * step;
        const total  = resolution ** 3;

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

                const xs = x / visualScale;
                const ys = y / visualScale;
                const zs = z / visualScale;

                const psi = getWavefunction(orbitalStr, xs, ys, zs, zeff);
                const p   = psi * psi;

                pValues[idx]       = p;
                signs[idx]        = Math.sign(psi);
                positions[idx*3]   = x;
                positions[idx*3+1] = y;
                positions[idx*3+2] = z;
                sumP += p;
                idx++;
                }
            }
        }

        // Sort descending by density, keep top 90 %
        const order = Array.from({ length: total }, (_, i) => i)
            .sort((a, b) => pValues[b] - pValues[a]);

        let cumP = 0, cutoff = 0;
        for (let i = 0; i < total; i++) {
            cumP += pValues[order[i]];
            if (cumP >= sumP * 0.90) { cutoff = i + 1; break; }
        }

        const finalPos    = new Float32Array(cutoff * 3);
        const finalColors = new Float32Array(cutoff * 3);
        const baseColor   = SHELL_COLORS[(n - 1) % SHELL_COLORS.length];

        // Negative lobe: shift hue toward warmer for contrast
        const negColor = new THREE.Color(
            Math.min(1, baseColor.r + 0.45),
            Math.max(0, baseColor.g - 0.35),
            Math.max(0, baseColor.b - 0.55),
        );

        for (let i = 0; i < cutoff; i++) 
        {
            const o = order[i];
            finalPos[i*3]   = positions[o*3];
            finalPos[i*3+1] = positions[o*3+1];
            finalPos[i*3+2] = positions[o*3+2];
            const c = signs[o] >= 0 ? baseColor : negColor;
            finalColors[i*3]   = c.r;
            finalColors[i*3+1] = c.g;
            finalColors[i*3+2] = c.b;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(finalPos, 3));
        geo.setAttribute('color',    new THREE.BufferAttribute(finalColors, 3));

        // Point size and opacity both scale with orbital size and occupancy.
        // Inner orbitals need tiny points; outer ones can be larger.
        // const pointSize = Math.max(0.03, 0.025 * (n * n / zeff));
        // const opacity   = 0.05 + (electrons / 14) * 0.10;
        const pointSize = Math.max(0.04, 0.035 * (n * n / zeff));

        // const pointSize = Math.max(0.04, 0.035 * visualScale);
        const opacity   = 0.15 + (electrons / 14) * 0.15;

        return new THREE.Points(geo, new THREE.PointsMaterial({
            size: pointSize,
            vertexColors: true,
            transparent: true,
            opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }));
    }

    // ── Regenerate every layer into the shared group ──────────────────────────
    const generateAllOrbitals = () => {
        const group = cloudGroupRef.current;
        if (!group) return;

        // Dispose existing meshes
        while (group.children.length > 0) {
            const mesh = group.children[0] as THREE.Points;
            group.remove(mesh);
            mesh.geometry.dispose();
            (mesh.material as THREE.Material).dispose();
        }

        for (const layer of layers) {
            group.add(buildLayerMesh(layer));
        }
    };

    useEffect(() => {
        if (sceneRef.current) generateAllOrbitals();
    }, [version]); // <-- Added gridSize here

    // ── One-time scene setup ─────────────────────────────────────────────────
    useEffect(() => 
    {
        if (!containerRef.current || rendererRef.current) return;

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // All orbital meshes live inside this group — rotate once, moves everything
        const group = new THREE.Group();
        scene.add(group);
        cloudGroupRef.current = group;

        group.scale.set(3, 3, 3);

        const camera = new THREE.PerspectiveCamera(
            45,
            containerRef.current.clientWidth / containerRef.current.clientHeight,
            0.1, 1000
        );
        // camera.position.set(20, 15, 20);

        camera.position.set(4, 3, 4);

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
            group.rotation.y += 0.002;   // entire multi-orbital cloud rotates together
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