import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from "path";

export default defineConfig(({ mode }) => ({
    build: {
        outDir: './../dist',
        chunkSizeWarningLimit: 1000,
    },
    base: mode == 'development' ? '' : './',
    plugins: [vue()],
    server: {
        port: 3000,
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
            "@components": resolve(__dirname, "src/components"),
            "@views": resolve(__dirname, "src/views"),
        },
    },
}));
