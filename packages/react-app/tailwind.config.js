/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			'gt-alpina': ['GT Alpina', 'serif'],
  			'inter': ['Inter', 'sans-serif'],
  		},
  		fontSize: {
  			'h1': ['72px', { lineHeight: '84px', letterSpacing: '-0.01em' }],
  			'h2': ['54px', { lineHeight: '72px', letterSpacing: '-0.01em' }],
  			'h3': ['48px', { lineHeight: '48px', letterSpacing: '-0.01em' }],
  			'h4': ['40px', { lineHeight: '40px', letterSpacing: '-0.01em' }],
  			'body-l': ['20px', { lineHeight: '26px', letterSpacing: '-0.01em' }],
  			'body-m': ['16px', { lineHeight: '26px', letterSpacing: '-0.01em' }],
  			'body-s': ['14px', { lineHeight: '18px', letterSpacing: '-0.01em' }],
  			'eyebrow': ['12px', { lineHeight: '16px', letterSpacing: '0em' }],
  		},
  		fontWeight: {
  			'thin': '250',
  			'heavy': '750',
  		},
  		colors: {
  			// Celo Brand Colors
  			'celo': {
  				'yellow': '#FCFF52',
  				'forest': '#4E632A',
  				'purple': '#1A0329',
  				'lt-tan': '#FBF6F1',
  				'dk-tan': '#E6E3D5',
  				'brown': '#635949',
  				'pink': '#F2A9E7',
  				'orange': '#F29E5F',
  				'lime': '#B2EBA1',
  				'blue': '#8AC0F9',
  				'success': '#329F3B',
  				'error': '#E70532',
  				'inactive': '#9B9B9B',
  				'body': '#666666',
  			},
  			// Legacy colors for compatibility
  			colors: {
  				primary: '#FCFF52',
  				primaryComp: '#1A0329',
  				disableCard: '#9B9B9B',
  				primaryLight: '#FBF6F1',
  				secondary: '#4E632A'
  			},
  			background: '#FBF6F1',
  			foreground: '#000000',
  			card: {
  				DEFAULT: '#FFFFFF',
  				foreground: '#000000'
  			},
  			popover: {
  				DEFAULT: '#FFFFFF',
  				foreground: '#000000'
  			},
  			primary: {
  				DEFAULT: '#FCFF52',
  				foreground: '#000000'
  			},
  			secondary: {
  				DEFAULT: '#1A0329',
  				foreground: '#FFFFFF'
  			},
  			muted: {
  				DEFAULT: '#E6E3D5',
  				foreground: '#666666'
  			},
  			accent: {
  				DEFAULT: '#F2A9E7',
  				foreground: '#000000'
  			},
  			destructive: {
  				DEFAULT: '#E70532',
  				foreground: '#FFFFFF'
  			},
  			border: '#CCCCCC',
  			input: '#FFFFFF',
  			ring: '#FCFF52',
  			chart: {
  				'1': '#FCFF52',
  				'2': '#4E632A',
  				'3': '#1A0329',
  				'4': '#F2A9E7',
  				'5': '#F29E5F'
  			}
  		},
  		borderRadius: {
  			'none': '0px',
  			'sm': '2px',
  			'DEFAULT': '4px',
  			'md': '6px',
  			'lg': '8px',
  			'xl': '12px',
  			'2xl': '16px',
  			'3xl': '24px',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
