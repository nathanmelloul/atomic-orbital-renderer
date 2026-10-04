import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    base: "/",
    build: {
        // Escapes workspace folder into the root dist directory
        outDir: path.resolve(__dirname, '../../dist/'),
        // emptyOutDir: true, // Safe to clear since it has a dedicated subfolder
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./"),
        },
    },
});