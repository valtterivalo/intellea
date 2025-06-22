import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  ignore: [
    // Tailwind config is used by the build process
    'tailwind.config.ts'
  ],
  ignoreDependencies: [
    // tailwindcss-animate is used as a plugin in tailwind.config.ts
    'tailwindcss-animate'
  ]
};

export default config; 