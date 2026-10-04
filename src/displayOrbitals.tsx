import { ORBITAL_DEFS } from "./elements";

export interface ConfigPart {
    n: number;
    lLabel: string;
    count: number;
}

export function getElectronConfiguration(Z: number): ConfigPart[] {
    let remaining = Z;
    const config: ConfigPart[] = [];
    const lLabels = ['s', 'p', 'd', 'f'];

    for (const { n, l, cap } of ORBITAL_DEFS) {
        if (remaining <= 0) break;
        const count = Math.min(remaining, cap);
        config.push({ n, lLabel: lLabels[l], count });
        remaining -= count;
    }
    return config;
}