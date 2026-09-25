import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * Geist yalnızca CSS içinden keşfedildiği için ilk boyamadan sonra iner.
 * Türkçe metin hem latin (ı) hem latin-ext (ğ, ş, İ) alt kümesine ihtiyaç
 * duyar; ikisini de <head> içinde önceden yükleyerek font değişim kaymasını
 * ve LCP gecikmesini azaltırız. Yalnızca build çıktısında çalışır.
 */
function preloadGeistFont(): Plugin {
	const subsets = ['geist-latin-wght-normal', 'geist-latin-ext-wght-normal']
	return {
		name: 'sgr:preload-geist-font',
		apply: 'build',
		transformIndexHtml: {
			order: 'post',
			handler(_html, ctx) {
				if (!ctx.bundle) return
				const files = Object.values(ctx.bundle)
					.map((output) => output.fileName)
					.filter((fileName) => fileName.endsWith('.woff2'))
				return subsets.flatMap((subset) => {
					const fileName = files.find((file) => file.includes(`/${subset}-`))
					if (!fileName) return []
					return [
						{
							tag: 'link',
							attrs: {
								rel: 'preload',
								href: `/${fileName}`,
								as: 'font',
								type: 'font/woff2',
								crossorigin: '',
							},
							injectTo: 'head' as const,
						},
					]
				})
			},
		},
	}
}

export default defineConfig({
	plugins: [react(), tailwindcss(), preloadGeistFont()],
	resolve: {
		alias: {
			'@': '/src',
		},
	},
	server: {
		proxy: {
			'/api': {
				target: 'http://127.0.0.1:8787',
				changeOrigin: true,
			},
		},
	},
	build: {
		outDir: 'dist/client',
		emptyOutDir: true,
		rolldownOptions: {
			output: {
				// React çekirdeği uygulama kodundan ayrı bir parçada: her dağıtımda
				// değişmediği için tarayıcı önbelleğinde kalır.
				codeSplitting: {
					groups: [
						{
							name: 'react-vendor',
							test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
						},
					],
				},
			},
		},
	},
})
