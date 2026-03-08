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
				{
					label: 'Part 1: The Product Suite',
					items: [
						{ label: 'The Business Case', slug: 'business-case' },
						{ label: 'Privacy & Compliance', slug: 'privacy-compliance' },
						{ label: 'Integration & Support', slug: 'integration-support' },
					],
				},
				{
					label: "Part 2: The Architect's Vault",
					items: [
						{ label: 'Project Governance', slug: 'internal/project-governance' },
						{ label: 'Engineering Blueprints', slug: 'internal/engineering-blueprints' },
						{ label: 'DevOps', slug: 'internal/devops' },
						{ label: 'Business Strategy', slug: 'internal/business-strategy' },
					],
				},
			],
		}),
	],
});
