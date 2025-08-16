# Mohammad Ehsan Portfolio Website

A modern, responsive portfolio website built with Next.js 15, React 18, TypeScript, and Tailwind CSS. Features interactive 3D elements, smooth animations, and a secure contact form.

## ✨ Features

- **Modern Stack**: Next.js 15, React 18, TypeScript with strict mode
- **Interactive 3D**: Three.js integration with React Three Fiber
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Smooth Animations**: Framer Motion for fluid transitions
- **Secure Contact Form**: EmailJS integration with spam protection
- **Performance Optimized**: Bundle analysis, code splitting, and optimizations
- **Error Handling**: Comprehensive error boundaries and monitoring
- **Type Safety**: Full TypeScript coverage with strict mode

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm/yarn

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd portfolio-website
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
```bash
cp .env.local.example .env.local
```

4. Configure your EmailJS credentials in `.env.local`:
```env
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
```

### Development

```bash
pnpm dev          # Start development server
pnpm type-check   # Run TypeScript checks
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint issues
```

### Production

```bash
pnpm build        # Build for production
pnpm start        # Start production server
pnpm analyze      # Analyze bundle size
```

## 🛠️ Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix linting issues
- `pnpm type-check` - Run TypeScript checks
- `pnpm analyze` - Analyze bundle size
- `pnpm check` - Run type-check and lint
- `pnpm clean` - Clean build artifacts

## 📧 EmailJS Setup

1. Create an EmailJS account at [emailjs.com](https://www.emailjs.com/)
2. Create a service and template
3. Set the Reply-To field in your template to `{{reply_to}}`
4. Add your credentials to `.env.local`

## 🏗️ Project Structure

```
├── app/                    # Next.js app directory
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── ...               # Feature components
├── contexts/             # React contexts
├── hooks/                # Custom hooks
├── lib/                  # Utility functions
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## 🔧 Configuration

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Next.js recommended rules
- **Tailwind CSS**: Custom design system with CSS variables
- **Bundle Analyzer**: Integrated for performance monitoring

## 🚀 Performance Optimizations

- Bundle analysis and optimization
- Code splitting and lazy loading
- Image optimization
- Security headers
- Error boundaries
- Performance monitoring

## 📱 Contact

- **Email**: [mdehsan2737@gmail.com](mailto:mdehsan2737@gmail.com)
- **GitHub**: [itsEhsan16](https://github.com/itsEhsan16)
- **LinkedIn**: [Mohammad Ehsan](https://www.linkedin.com/in/mohammad-ehsan-23aaba290/)
- **Twitter**: [@Md_Ehsan16](https://x.com/Md_Ehsan16)

## 📄 License

© Mohammad Ehsan. Use freely for educational purposes.

---

Built with ❤️ using Next.js, React, and TypeScript
