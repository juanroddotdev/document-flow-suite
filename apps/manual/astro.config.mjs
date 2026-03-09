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
						{ label: 'Testing', slug: 'internal/testing' },
						{ label: 'DevOps', slug: 'internal/devops' },
						{ label: 'Business Strategy', slug: 'internal/business-strategy' },
					],
				},
				{
					label: 'Context (Reference)',
					items: [
						{ label: 'Full Project Manifesto', slug: 'context/full_project_manifesto' },
						{ label: 'Strategy and Roadmap', slug: 'context/strategy_and_roadmap' },
						{ label: 'Manual Structure and TOC', slug: 'context/manual_structure_and_toc' },
						{ label: 'ROI and Business Case', slug: 'context/roi_and_business_case' },
						{ label: 'Zero-Server Security & Privacy', slug: 'context/zero_server_security_privacy' },
						{ label: 'Tech Architecture and Scope', slug: 'context/tech_architecture_and_scope' },
						{ label: 'Agnostic Input Pipeline', slug: 'context/agnostic_input_pipeline' },
						{ label: "Integration & Implementer's Guide", slug: 'context/integration_implementer_guide' },
						{ label: 'Legal and IP Shield', slug: 'context/legal_and_ip' },
						{ label: 'Sales and Outreach', slug: 'context/sales_and_outreach' },
						{ label: 'Docs Tooling — VitePress vs. Starlight', slug: 'context/docs_tooling_starlight' },
					],
				},
			],
		}),
	],
});
