import { useEffect } from 'react';
import { useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface SchrodingerProps {
    config: {
        orbitalStr: string;
        nVal: number;
        zeffVal: number;
        gridSize: number;
        version: number;
    };
}

export const SchrodingerOld = ({ config }: SchrodingerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const pointCloudRef = useRef<THREE.Points | null>(null);

    function getWavefunction(type: string, x: number, y: number, z: number, Zeff: number): number 
    {
        // Remove all spaces
        type.replace(/\s+/g, '')

        // Split by +
        const terms = type.split('+');


        const r = Math.sqrt(x * x + y * y + z * z);



        switch (type.toLowerCase().trim()) 
        {
            case '1s': 
                return Math.exp(-Zeff * r);
            case '2s': 
                return (2 - Zeff * r) * Math.exp(-Zeff * r / 2);
            case '2pz': 
                return Zeff * z * Math.exp(-Zeff * r / 2);
            case '3dz2': 
                return Math.pow(Zeff, 2) * (2 * z * z - x * x - y * y) * Math.exp(-Zeff * r / 3);
            case '3dxy': 
                return Math.pow(Zeff, 2) * (x * y) * Math.exp(-Zeff * r / 3);
            case '4fz3':
            // n = 4, l = 3. 
            // The polynomial creates the complex lobes and nodes
                const fPoly = z * (5 * z * z - 3 * r * r);
                return Math.pow(Zeff, 3) * fPoly * Math.exp(-Zeff * r / 4);
            case 'sp3':
                // It is just 25% 's' character and 75% 'p' character!
                // We call our previously defined math functions:
                const s_part = (2 - Zeff * r) * Math.exp(-Zeff * r / 2); // 2s
                const p_part = Zeff * z * Math.exp(-Zeff * r / 2);       // 2pz
                
                // Add them together (normalized by 1/sqrt(2) usually, 
                // but 0.5 works for relative threshold rendering)
                return 0.5 * (s_part + p_part);
            default: 
                return Math.exp(-Zeff * r);
        }
    }

    // Dynamic Generator (Runs ONLY when config prop gets committed)
    const generateOrbital = () => {
        const scene = sceneRef.current;
        if (!scene) return;

        if (pointCloudRef.current) {
            scene.remove(pointCloudRef.current);
            pointCloudRef.current.geometry.dispose();
            (pointCloudRef.current.material as THREE.Material).dispose();
        }

        const resolution = 100;  
        const step = config.gridSize / resolution; 
        const getJitter = () => (Math.random() - 0.5) * step;
        const totalPoints = resolution * resolution * resolution;

        const pValues = new Float32Array(totalPoints);
        const signs = new Int8Array(totalPoints);
        const positions = new Float32Array(totalPoints * 3);
        const indices = new Int32Array(totalPoints);

        let totalProbability = 0;
        let index = 0;

        for (let ix = 0; ix < resolution; ix++) {
            for (let iy = 0; iy < resolution; iy++) {
                for (let iz = 0; iz < resolution; iz++) {
                    const x = (ix - resolution / 2) * step + getJitter();
                    const y = (iy - resolution / 2) * step + getJitter();
                    const z = (iz - resolution / 2) * step + getJitter();

                    const psi = getWavefunction(config.orbitalStr, x, y, z, config.zeffVal);
                    const p = psi * psi; 

                    pValues[index] = p;
                    signs[index] = Math.sign(psi);
                    positions[index * 3] = x;
                    positions[index * 3 + 1] = y;
                    positions[index * 3 + 2] = z;
                    indices[index] = index;
                    totalProbability += p;
                    index++;
                }
            }
        }

        const indicesArray = Array.from(indices).sort((a, b) => pValues[b] - pValues[a]);
        const targetProbability = totalProbability * 0.90; 
        let cumulativeP = 0;
        let cutoffIndex = 0;

        for (let i = 0; i < totalPoints; i++) {
            cumulativeP += pValues[indicesArray[i]];
            if (cumulativeP >= targetProbability) {
                cutoffIndex = i;
                break;
            }
        }

        const cloudGeometry = new THREE.BufferGeometry();
        const finalPositions = new Float32Array(cutoffIndex * 3);
        const finalColors = new Float32Array(cutoffIndex * 3);
        const colorPositive = new THREE.Color(0x0088ff); 
        const colorNegative = new THREE.Color(0xff4400); 

        for (let i = 0; i < cutoffIndex; i++) {
            const origIndex = indicesArray[i];
            finalPositions[i * 3] = positions[origIndex * 3];
            finalPositions[i * 3 + 1] = positions[origIndex * 3 + 1];
            finalPositions[i * 3 + 2] = positions[origIndex * 3 + 2];

            const color = signs[origIndex] > 0 ? colorPositive : colorNegative;
            finalColors[i * 3] = color.r;
            finalColors[i * 3 + 1] = color.g;
            finalColors[i * 3 + 2] = color.b;
        }

        cloudGeometry.setAttribute('position', new THREE.BufferAttribute(finalPositions, 3));
        cloudGeometry.setAttribute('color', new THREE.BufferAttribute(finalColors, 3));

        const cloudMaterial = new THREE.PointsMaterial({
            size: 0.2, vertexColors: true, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false
        });

        const newPointCloud = new THREE.Points(cloudGeometry, cloudMaterial);
        scene.add(newPointCloud);
        pointCloudRef.current = newPointCloud;
    };

    // Watcher: Listens exclusively to committed config changes
    useEffect(() => {
        if (sceneRef.current) {
            generateOrbital();
        }
    }, [config]);

    // Environment Init (Runs exactly once on component mount)
    useEffect(() => {
        if (!containerRef.current) return;

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
        camera.position.set(20, 15, 20);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        containerRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        const axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);

        // generateOrbital(); // Initial spawn

        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            controls.update();
            if (pointCloudRef.current) pointCloudRef.current.rotation.y += 0.002;
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
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            controls.dispose();
            if (containerRef.current && renderer.domElement) {
                containerRef.current.removeChild(renderer.domElement);
            }
        };
    }, []);

    return <div ref={containerRef} className="w-full h-full"/>;
};