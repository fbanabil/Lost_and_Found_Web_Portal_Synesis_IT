import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
	plugins: [react()],
	server: {
		port: 5173,
		open: true,
		// ensure HMR websocket connects correctly; adjust protocol to 'wss' if you serve the app over HTTPS
		host: true,
		hmr: {
			protocol: 'ws',
			host: 'localhost'
		}
	},
})