// Configuración de Tailwind para Tarraco Parkings.
// Los colores apuntan a los tokens CSS definidos en :root dentro de src/styles.css.
/** @type {import('tailwindcss').Config} */
export default Object.assign({
    theme: {
      extend: {
        fontFamily: {
          sans: ['"Source Sans 3"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
          display: ['"Red Hat Display"', '"Source Sans 3"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
          mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
        },
        // Cada color sale de un token CSS de :root (rgb con canal alfa)
        colors: {
          'ground': 'rgb(var(--ground) / <alpha-value>)',
          'surface': 'rgb(var(--surface) / <alpha-value>)',
          'sunken': 'rgb(var(--sunken) / <alpha-value>)',
          'ink': 'rgb(var(--ink) / <alpha-value>)',
          'body': 'rgb(var(--body) / <alpha-value>)',
          'muted': 'rgb(var(--muted) / <alpha-value>)',
          'line': 'rgb(var(--ink) / <alpha-value>)',
          'primary': 'rgb(var(--primary) / <alpha-value>)',
          'on-primary': 'rgb(var(--on-primary) / <alpha-value>)',
          'link': 'rgb(var(--link) / <alpha-value>)',
          'accent': 'rgb(var(--accent) / <alpha-value>)',
          'on-accent': 'rgb(var(--on-accent) / <alpha-value>)',
          'ok': 'rgb(var(--ok) / <alpha-value>)',
          'ok-bg': 'rgb(var(--ok-bg) / <alpha-value>)',
          'warn': 'rgb(var(--warn) / <alpha-value>)',
          'warn-bg': 'rgb(var(--warn-bg) / <alpha-value>)',
          'danger': 'rgb(var(--danger) / <alpha-value>)',
          'danger-bg': 'rgb(var(--danger-bg) / <alpha-value>)',
        },
      },
    },
  }, {
  content: ['./index.html', './src/**/*.{js,jsx}'],
});
