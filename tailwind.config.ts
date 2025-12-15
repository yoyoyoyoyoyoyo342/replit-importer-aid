import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
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
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
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
    				from: { height: '0' },
    				to: { height: 'var(--radix-accordion-content-height)' }
    			},
    			'accordion-up': {
    				from: { height: 'var(--radix-accordion-content-height)' },
    				to: { height: '0' }
    			},
    			'spin-slow': {
    				from: { transform: 'rotate(0deg)' },
    				to: { transform: 'rotate(360deg)' }
    			},
    			'fade-in': {
    				'0%': { opacity: '0', transform: 'translateY(10px)' },
    				'100%': { opacity: '1', transform: 'translateY(0)' }
    			},
    			'fade-in-up': {
    				'0%': { opacity: '0', transform: 'translateY(20px)' },
    				'100%': { opacity: '1', transform: 'translateY(0)' }
    			},
    			'fade-in-down': {
    				'0%': { opacity: '0', transform: 'translateY(-20px)' },
    				'100%': { opacity: '1', transform: 'translateY(0)' }
    			},
    			'fade-in-left': {
    				'0%': { opacity: '0', transform: 'translateX(-20px)' },
    				'100%': { opacity: '1', transform: 'translateX(0)' }
    			},
    			'fade-in-right': {
    				'0%': { opacity: '0', transform: 'translateX(20px)' },
    				'100%': { opacity: '1', transform: 'translateX(0)' }
    			},
    			'scale-in': {
    				'0%': { opacity: '0', transform: 'scale(0.95)' },
    				'100%': { opacity: '1', transform: 'scale(1)' }
    			},
    			'scale-in-center': {
    				'0%': { opacity: '0', transform: 'scale(0.8)' },
    				'100%': { opacity: '1', transform: 'scale(1)' }
    			},
    			'slide-in-bottom': {
    				'0%': { opacity: '0', transform: 'translateY(100%)' },
    				'100%': { opacity: '1', transform: 'translateY(0)' }
    			},
    			'slide-in-right': {
    				'0%': { transform: 'translateX(100%)' },
    				'100%': { transform: 'translateX(0)' }
    			},
    			'slide-in-left': {
    				'0%': { transform: 'translateX(-100%)' },
    				'100%': { transform: 'translateX(0)' }
    			},
    			'bounce-in': {
    				'0%': { opacity: '0', transform: 'scale(0.3)' },
    				'50%': { opacity: '1', transform: 'scale(1.05)' },
    				'70%': { transform: 'scale(0.9)' },
    				'100%': { transform: 'scale(1)' }
    			},
    			'float': {
    				'0%, 100%': { transform: 'translateY(0)' },
    				'50%': { transform: 'translateY(-10px)' }
    			},
    			'pulse-soft': {
    				'0%, 100%': { opacity: '1' },
    				'50%': { opacity: '0.7' }
    			},
    			'shimmer': {
    				'0%': { backgroundPosition: '-200% 0' },
    				'100%': { backgroundPosition: '200% 0' }
    			},
    			'glow': {
    				'0%, 100%': { boxShadow: '0 0 5px hsl(var(--primary) / 0.3)' },
    				'50%': { boxShadow: '0 0 20px hsl(var(--primary) / 0.6)' }
    			},
    			'wiggle': {
    				'0%, 100%': { transform: 'rotate(-3deg)' },
    				'50%': { transform: 'rotate(3deg)' }
    			},
    			'shake': {
    				'0%, 100%': { transform: 'translateX(0)' },
    				'10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
    				'20%, 40%, 60%, 80%': { transform: 'translateX(5px)' }
    			},
    			'ping-slow': {
    				'75%, 100%': { transform: 'scale(1.5)', opacity: '0' }
    			},
    			'spin-reverse': {
    				'0%': { transform: 'rotate(360deg)' },
    				'100%': { transform: 'rotate(0deg)' }
    			},
    			'blur-in': {
    				'0%': { opacity: '0', filter: 'blur(10px)' },
    				'100%': { opacity: '1', filter: 'blur(0)' }
    			},
    			'flip-in': {
    				'0%': { opacity: '0', transform: 'perspective(400px) rotateY(90deg)' },
    				'100%': { opacity: '1', transform: 'perspective(400px) rotateY(0)' }
    			},
    			'stagger-fade': {
    				'0%': { opacity: '0', transform: 'translateY(10px)' },
    				'100%': { opacity: '1', transform: 'translateY(0)' }
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out',
    			'spin-slow': 'spin-slow 3s linear infinite',
    			'fade-in': 'fade-in 0.4s ease-out forwards',
    			'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
    			'fade-in-down': 'fade-in-down 0.5s ease-out forwards',
    			'fade-in-left': 'fade-in-left 0.5s ease-out forwards',
    			'fade-in-right': 'fade-in-right 0.5s ease-out forwards',
    			'scale-in': 'scale-in 0.3s ease-out forwards',
    			'scale-in-center': 'scale-in-center 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    			'slide-in-bottom': 'slide-in-bottom 0.4s ease-out forwards',
    			'slide-in-right': 'slide-in-right 0.3s ease-out forwards',
    			'slide-in-left': 'slide-in-left 0.3s ease-out forwards',
    			'bounce-in': 'bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
    			'float': 'float 3s ease-in-out infinite',
    			'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
    			'shimmer': 'shimmer 2s linear infinite',
    			'glow': 'glow 2s ease-in-out infinite',
    			'wiggle': 'wiggle 0.3s ease-in-out',
    			'shake': 'shake 0.5s ease-in-out',
    			'ping-slow': 'ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite',
    			'spin-reverse': 'spin-reverse 1s linear infinite',
    			'blur-in': 'blur-in 0.4s ease-out forwards',
    			'flip-in': 'flip-in 0.5s ease-out forwards',
    			'stagger-fade': 'stagger-fade 0.4s ease-out forwards'
    		},
    		boxShadow: {
    			'2xs': 'var(--shadow-2xs)',
    			xs: 'var(--shadow-xs)',
    			sm: 'var(--shadow-sm)',
    			md: 'var(--shadow-md)',
    			lg: 'var(--shadow-lg)',
    			xl: 'var(--shadow-xl)',
    			'2xl': 'var(--shadow-2xl)'
    		},
    		fontFamily: {
    			sans: [
    				'Work Sans',
    				'ui-sans-serif',
    				'system-ui',
    				'-apple-system',
    				'BlinkMacSystemFont',
    				'Segoe UI',
    				'Roboto',
    				'Helvetica Neue',
    				'Arial',
    				'Noto Sans',
    				'sans-serif'
    			],
    			serif: [
    				'Lora',
    				'ui-serif',
    				'Georgia',
    				'Cambria',
    				'Times New Roman',
    				'Times',
    				'serif'
    			],
    			mono: [
    				'Inconsolata',
    				'ui-monospace',
    				'SFMono-Regular',
    				'Menlo',
    				'Monaco',
    				'Consolas',
    				'Liberation Mono',
    				'Courier New',
    				'monospace'
    			]
    		}
    	}
    },
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
