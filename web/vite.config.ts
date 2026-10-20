/*
 * vite dev server for the browser demo. the kitchen's CORS policy allows any localhost origin, so the port is free to change.
 */
import { defineConfig } from 'vite';

export default defineConfig({
    server: { host: 'localhost', port: 5173, strictPort: true, open: true },
});
