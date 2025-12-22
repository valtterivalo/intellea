/**
 * @fileoverview Tailwind config for the docs + embed site.
 */

import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/app/**/*.{js,ts,jsx,tsx,mdx}'],
  plugins: [],
};

export default config;
