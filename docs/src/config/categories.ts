export const categories = {
  'azure-architecture': { name: 'Azure Architecture & Design', color: 'var(--color-cat-azure)', icon: '☁️', order: 1 },
  'azure-apim': { name: 'Azure API Management', color: 'var(--color-cat-azure)', icon: '🔌', order: 2 },
  'infrastructure-as-code': { name: 'Infrastructure as Code', color: 'var(--color-cat-terraform)', icon: '🧱', order: 3 },
  'diagramming': { name: 'Diagramming', color: 'var(--color-cat-diagram)', icon: '🖼️', order: 4 },
  'github-workflows': { name: 'GitHub Workflows', color: 'var(--color-cat-github)', icon: '⚙️', order: 5 },
} as const;

export type CategorySlug = keyof typeof categories;
