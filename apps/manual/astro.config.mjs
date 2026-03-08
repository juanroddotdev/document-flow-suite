// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'DocumentFlow Suite',
			sidebar: [
				{ label: 'Product Overview', slug: 'index' },
				{ label: 'Security', slug: 'security' },
				{ label: 'Business Case', slug: 'roi' },
				{ label: 'Implementation Guide', slug: 'integration' },
			],
		}),
	],
});
