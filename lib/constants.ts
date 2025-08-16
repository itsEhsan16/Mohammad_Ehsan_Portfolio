// Application constants
export const SITE_CONFIG = {
  name: 'Mohammad Ehsan',
  title: 'Mohammad Ehsan | Portfolio',
  description: 'Software Engineer, Front End & App Developer specializing in React, Next.js, and modern web technologies.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com',
  ogImage: '/og-image.jpg',
  author: {
    name: 'Mohammad Ehsan',
    email: process.env.NEXT_PUBLIC_EMAIL || 'mdehsan2737@gmail.com',
    github: process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/itsEhsan16',
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || 'https://www.linkedin.com/in/mohammad-ehsan-23aaba290/',
    twitter: process.env.NEXT_PUBLIC_TWITTER_URL || 'https://x.com/Md_Ehsan16',
  },
} as const;

export const NAVIGATION_ITEMS = [
  { id: '01', label: 'home', href: '#home' },
  { id: '02', label: 'expertise', href: '#expertise' },
  { id: '03', label: 'work', href: '#work' },
  { id: '04', label: 'experience', href: '#experience' },
  { id: '05', label: 'contact', href: '#contact' },
] as const;

export const SKILLS = {
  frontend: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
  backend: ['Node.js', 'Express', 'MongoDB', 'PostgreSQL'],
  tools: ['Git', 'Docker', 'Vercel', 'Figma'],
  mobile: ['React Native', 'Expo'],
} as const;

export const CONTACT_FORM_CONFIG = {
  maxMessageLength: 1000,
  maxNameLength: 100,
  rateLimitRequests: 3,
  rateLimitWindowMs: 60000, // 1 minute
} as const;