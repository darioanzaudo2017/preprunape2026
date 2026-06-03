import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: '#00685f',
  				foreground: '#ffffff'
  			},
  			secondary: {
  				DEFAULT: '#545f73',
  				foreground: '#ffffff'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f2f4f6',
        'surface-container': '#eceef0',
        'surface-container-high': '#e6e8ea',
        'surface-container-highest': '#e0e3e5',
        'surface-bright': '#f7f9fb',
        'surface-dim': '#d8dadc',
        'surface': '#f7f9fb',
        'on-surface': '#191c1e',
        'on-surface-variant': '#3d4947',
        'primary-container': '#008378',
        'on-primary-container': '#f4fffc',
        'inverse-primary': '#6bd8cb',
        'on-primary': '#ffffff',
        'on-secondary': '#ffffff',
        'on-tertiary': '#ffffff',
        'outline': '#6d7a77',
        'outline-variant': '#bcc9c6',
        'tertiary': '#825100',
        'tertiary-container': '#a36700',
        'on-tertiary-container': '#fffbff',
        'on-background': '#191c1e',
        'secondary-fixed': '#d8e3fb',
        'secondary-fixed-dim': '#bcc7de',
        'on-secondary-fixed': '#111c2d',
        'on-secondary-fixed-variant': '#3c475a',
        'tertiary-fixed': '#ffddb8',
        'tertiary-fixed-dim': '#ffb95f',
        'on-tertiary-fixed': '#2a1700',
        'on-tertiary-fixed-variant': '#653e00',
        'primary-fixed': '#89f5e7',
        'primary-fixed-dim': '#6bd8cb',
        'on-primary-fixed': '#00201d',
        'on-primary-fixed-variant': '#005049',
        'inverse-surface': '#2d3133',
        'inverse-on-surface': '#eff1f3',
  			brand: {
  				teal: {
  					DEFAULT: '#0d9488',
  					light: '#ccfbf1',
  					dark: '#0f766e'
  				},
  				navy: {
  					DEFAULT: '#1e293b',
  					light: '#334155',
  					dark: '#0f172a'
  				},
  				amber: {
  					DEFAULT: '#f59e0b',
  					light: '#fef3c7',
  					dark: '#d97706'
  				},
  				slate: {
  					DEFAULT: '#f8fafc',
  					border: '#cbd5e1',
  					text: '#64748b'
  				}
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'sans-serif'
  			],
  			display: [
  				'Hanken Grotesk',
  				'sans-serif'
  			]
  		}
  	}
  },
  plugins: [animate],
};

export default config;
