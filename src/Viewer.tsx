import { getElectronConfiguration } from "./displayOrbitals";
import { useState, useMemo } from "react";
//import { Schrodinger } from "./Schrodinger"; // Make sure this points to your updated component
import { Schrodinger } from "./Schrodinger"; // Make sure this points to your updated component
import { generateLayer, Elements } from "./elements"; // Adjust this import to your math file name

export const Viewer = () => {
    // 1. State for the currently selected element (Defaulting to Hydrogen, Z=1)
    const [selectedZ, setSelectedZ] = useState<number>(1);
    const [visualScale, setVisualScale] = useState<number>(2);
    const [version, setVersion] = useState<number>(0);
    const [renderMode, setRenderMode] = useState<boolean>(false);
    const electronConfig = getElectronConfiguration(selectedZ);

    // UI Staging State: Tracks the checkbox immediately, but DOES NOT trigger Schrodinger
    // const [stagedRenderAll, setStagedRenderAll] = useState<boolean>(false);

    // Applied State: The actual prop sent to Schrodinger (only updates on button click)
    // const [appliedRenderMode, setAppliedRenderMode] = useState<number>(0);

    // Electron configuration updates instantly for snappy UI text feedback

    // 2. Automatically generate the orbital layers whenever the element changes
    const currentLayers = useMemo(() => {
        return generateLayer(selectedZ);
    }, [selectedZ]);

    // 3. Handler to swap elements and trigger a fresh render
    const handleElementClick = (z: number) => {
        setSelectedZ(z);
        setVisualScale(2);
        setRenderMode(false);
        setVersion(prev => prev + 1);
    };

    // Render button callback
    const handleForceReRender = () => {

        // All this does increment the version
        // This is the ONLY property Schrodinger.tsx looks at!! (causes it to update when changed)

        setVersion(v => v + 1);
    };

    // Find the current element name for display purposes
    const currentElement = Elements.find(e => e.z === selectedZ)?.name || "Unknown";

    return (
        <section id="home">
            <div className="relative min-h-screen w-full text-white">

                {/* UI Panel */}
                <div className="lg:fixed flex left-4 top-4 p-4 flex-col gap-4 z-10 h-fit w-full lg:w-[20%] bg-dark-blue">

                    <div className="flex flex-row justify-between">
                        <div className="">
                            <h2 className="text-2xl font-bold mb-1">{currentElement}</h2>
                            <p className="text-sm text-gray-400">Atomic Number (Z): {selectedZ}</p>
                        </div>
                        <div className="lg:hidden mt-4">
                            <a href="/" rel="external" className="text-teal-300 text-sm font-semibold">
                            BACK TO SITE
                            </a>
                        </div>
 
                    </div>

                    {/* Instant Electron Configuration Display */}
                    <div className="rounded-lg border-teal-800 border-2 p-4">
                        <span className="text-xs font-semibold text-teal-300 block mb-1">
                            ELECTRON CONFIGURATION
                        </span>
                        <div className="text-sm tracking-wide font-mono flex flex-wrap gap-1 items-center">
                            {electronConfig.map((part, idx) => (
                                <span key={idx}>
                                    {part.n}{part.lLabel}<sup>{part.count}</sup>
                                    {idx < electronConfig.length - 1 && <span className="text-slate-600 mx-0.5">+</span>}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* CHANGED: Replaced buttons with a clean, staged UI Checkbox */}
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-teal-300">RENDER SETTINGS</span>
                        <label className="flex items-center gap-3 cursor-pointer select-none mt-1 p-1 rounded hover:bg-gray-700/50 transition-colors">
                            <input
                                type="checkbox"
                                checked={renderMode}
                                onChange={(e) => setRenderMode(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600 bg-slate-950 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800 accent-blue-500"
                            />
                            <span className="text-sm text-gray-300">
                                Display all electron shells
                            </span>
                        </label>
                    </div>

                    {/* Global Grid Size Control */}
                    <label className="flex flex-col">
                        <div className="flex justify-between mb-1">
                            <span className="text-sm text-gray-300">Z-number</span>
                            <strong className="text-blue-400">{selectedZ}</strong>
                        </div>
                        <input className="w-full accent-teal-200"
                            type="range"
                            min="1"
                            max="118"
                            step="1"
                            value={selectedZ}
                            onChange={(e) => setSelectedZ(Number(e.target.value))}
                        />
                    </label>

                    <label className="flex flex-col">
                        <div className="flex justify-between mb-1">
                            <span className="text-sm text-gray-300">Visual scale</span>
                            <strong className="text-blue-400">{visualScale}</strong>
                        </div>
                        <input className="w-full, accent-teal-200"
                            type="range"
                            min="0.1"
                            max="4"
                            step="0.1"
                            value={visualScale}
                            onChange={(e) => setVisualScale(Number(e.target.value))}
                        />
                    </label>

                    <button onClick={handleForceReRender} className=" hover:bg-gray-700/50 transition-colors rounded-lg cursor-pointer relative w-full py-2 px-4 mt-2 h-20">
                        <a className="relative inset-0 text-teal-300 text-lg">
                        RENDER
                        </a>
                        <div className="absolute inset-0 mask-size-[10px] bg-teal-300/50 rounded-lg mask-[url(/patterns/diagonal-lines.svg)]">

                        </div>

  
                    </button>
                </div>

                <div className="lg:fixed lg:flex hidden z-10 top-4 w-fit h-fit right-4 p-4 bg-dark-blue">
                    <a href="/" rel="external" className="text-teal-300 text-sm font-semibold">
                        BACK TO SITE
                    </a>

                </div>

                {/* 3D Canvas Background */}
                <div className="lg:absolute flex w-screen h-screen z-0">
                    {/* Notice we pass appliedRenderMode here, NOT the raw checkbox value! */}
                    <Schrodinger
                        layers={currentLayers}
                        version={version}
                        visualScale={visualScale}
                        renderMode={renderMode}
                    />
                </div>
            </div>
        </section>
    );
};