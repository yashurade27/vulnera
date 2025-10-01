# Vulnera Home Page Components

## Overview
The new home page is a modern, animated landing page designed specifically for the Vulnera bug bounty platform. It features a clean, professional design with smooth animations and a focus on security research.

## Components Structure

### 1. **Navbar** (`src/components/layout/navbar.tsx`)
- Fixed glass-morphism navigation bar
- Responsive mobile menu
- Smooth scroll effects
- Links to main platform sections

### 2. **Hero Section** (`src/components/sections/hero.tsx`)
- Eye-catching headline and call-to-action
- Platform statistics (rewards paid, researchers, bugs found)
- Animated cards showcasing key features
- Grid background pattern with gradient overlay

### 3. **Features Section** (`src/components/sections/features.tsx`)
- 6 key platform features with icons
- Hover animations on cards
- Highlighted "Instant Payouts" feature
- Icons from lucide-react

### 4. **How It Works Section** (`src/components/sections/how-it-works.tsx`)
- 4-step process visualization
- Circular animation showing the workflow
- Step-by-step cards with hover effects
- Highlighted "Submit Findings" step

### 5. **Stats Section** (`src/components/sections/stats.tsx`)
- Animated counter components
- 4 key metrics displayed
- Icons for visual representation
- Radial gradient background effect

### 6. **Blog Section** (`src/components/sections/blog.tsx`)
- 6 featured blog posts/articles
- Color-coded by topic
- Icon-based visual design
- Tags for categorization

### 7. **CTA Section** (`src/components/sections/cta.tsx`)
- Final call-to-action
- Trust indicators with animated dots
- Two CTAs: "Launch Platform" and "View Documentation"
- Gradient background effects

### 8. **Footer** (`src/components/layout/footer.tsx`)
- 4-column layout
- Links to platform sections
- Social media icons
- Legal links (Privacy, Terms, etc.)

## Design System

### Colors
- **Primary Accent**: Yellow (#F5E942) - Used for CTAs and highlights
- **Background**: Dark theme with card-based layout
- **Text**: High contrast for accessibility

### Animations
- **Framer Motion**: Used for scroll-based animations
- **Fade In**: Entry animations for sections
- **Slide Up**: Card animations on scroll
- **Float**: Subtle floating animation for icons
- **Count Up**: Number animations for statistics

### Typography
- **Headings**: Bold, large text with gradient effects
- **Body**: Clean, readable text with proper hierarchy
- **Highlights**: Yellow accent color for key terms

### Utilities (Custom CSS Classes)
- `.container-custom` - Max-width container with padding
- `.section-title` - Large, bold section headings
- `.btn-wallet` - Primary CTA button with gradient
- `.btn-primary` - Secondary button style
- `.card-glass` - Glass-morphism card effect
- `.process-card` - Feature/step card style
- `.icon-3d` - 3D-style icon container
- `.text-gradient` - Yellow gradient text effect

## Tech Stack
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Utility-first CSS
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

## Usage

The home page is automatically rendered at the root route (`/`). All sections are client-side components using the `"use client"` directive for animations.

### Customization

To customize content:
1. Edit text in each component file
2. Modify stats in `stats.tsx`
3. Update blog posts in `blog.tsx`
4. Change feature descriptions in `features.tsx`

### Adding New Sections

1. Create a new file in `src/components/sections/`
2. Export your section component
3. Import and add it to `src/app/page.tsx`

Example:
```tsx
import { MyNewSection } from "@/components/sections/my-new-section";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* ...other sections */}
        <MyNewSection />
      </main>
      <Footer />
    </div>
  );
}
```

## Responsive Design

All components are fully responsive:
- **Mobile**: Single column layout, hamburger menu
- **Tablet**: 2-column grids where appropriate
- **Desktop**: Full multi-column layouts

## Performance

- **Code Splitting**: Each section is a separate component
- **Lazy Loading**: Framer Motion animations only trigger on viewport entry
- **Optimized Images**: Use Next.js Image component for any future images
- **Minimal Dependencies**: Only essential libraries included

## Future Enhancements

Potential additions:
- [ ] Add testimonials section
- [ ] Integrate real-time stats from blockchain
- [ ] Add interactive vulnerability map
- [ ] Include video demonstrations
- [ ] Add newsletter signup form
- [ ] Implement light/dark theme toggle specific to landing page

## Notes

- The page is designed to be separate from the main app layout
- All links currently point to `/vulnera` (the main platform)
- Dark theme is the default and primary design
- CSS utility classes are defined in `globals.css`
- Icons use Lucide React for consistency

## Development

To run locally:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the home page.

## Support

For issues or questions, refer to the main project documentation or contact the development team.
