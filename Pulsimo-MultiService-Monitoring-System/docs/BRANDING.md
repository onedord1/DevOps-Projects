# Pulsimo - Branding Guide

## Brand Identity

**Pulsimo** is a professional real-time service monitoring and intelligent alerting platform.

### Name Origin
- **Pulse** - Representing the heartbeat of your services, real-time monitoring
- **imo** - Modern, tech-forward suffix suggesting immediacy and action
- Together: "Real-time pulse of your infrastructure"

---

## Visual Identity

### Logo
The Pulsimo logo features an animated activity/pulse wave icon enclosed in a gradient-filled rounded square, representing:
- ⚡ Real-time monitoring (pulse wave)
- 🔄 Continuous health checks (animation)
- 📊 Data-driven insights (waveform visualization)

### Color Palette

#### Primary Colors
```
Violet:  #8B5CF6 (violet-600)
Purple:  #A855F7 (purple-600)
```

#### Gradient Combinations
```css
/* Logo Gradient */
background: linear-gradient(to bottom right, #8B5CF6, #A855F7);

/* Text Gradient */
background: linear-gradient(to right, #8B5CF6, #A855F7);
```

#### Background Gradients
```css
/* Login/Register Background */
background: linear-gradient(to bottom right, #0f172a, #5b21b6, #0f172a);
/* slate-900 → violet-900 → slate-900 */
```

#### Supporting Colors
- White: `#FFFFFF` (icons, text on colored backgrounds)
- Slate: `#475569` → `#0f172a` (backgrounds, borders)
- Red: For alerts and errors
- Green: For success states
- Amber: For warnings

---

## Typography

### Font Family
```css
font-family: Inter, system-ui, -apple-system, sans-serif;
```

### Font Weights
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Headings
- **H1**: 3xl (30px) - Bold - Gradient text
- **H2**: 2xl (24px) - Bold
- **H3**: xl (20px) - Semibold
- **Body**: base (16px) - Regular
- **Small**: sm (14px) - Regular

---

## Brand Assets

### Favicon
Location: `/frontend/public/favicon.svg`

**Design Elements:**
- 64x64 SVG format
- Violet to purple gradient background
- White pulse/activity wave
- Animated dot for real-time feel
- Rounded corners (12px radius)

### Browser Tab Title
```
Pulsimo - Real-time Service Monitoring
```

---

## UI Components

### Logo Component (Sidebar)
```tsx
<div className="relative">
  <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl blur opacity-30"></div>
  <div className="relative bg-gradient-to-br from-violet-600 to-purple-600 p-2.5 rounded-xl">
    <Activity className="h-6 w-6 text-white" />
  </div>
</div>
<h2 className="font-bold text-xl bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
  Pulsimo
</h2>
<p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
  Real-time Monitoring
</p>
```

### Login/Register Logo
```tsx
<div className="relative mb-6">
  <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl blur opacity-30"></div>
  <div className="relative bg-gradient-to-br from-violet-600 to-purple-600 p-4 rounded-xl">
    <Activity className="h-10 w-10 text-white" />
  </div>
</div>
<h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-2">
  Welcome to Pulsimo
</h1>
```

---

## Brand Voice & Messaging

### Tagline
**"Real-time Service Monitoring"**

### Key Messages
- **Professional** - Enterprise-grade monitoring platform
- **Intelligent** - Smart alerting with configurable repeat intervals
- **Real-time** - Instant notifications when it matters
- **Reliable** - Always watching your infrastructure

### Tone of Voice
- Professional yet approachable
- Technical but not jargon-heavy
- Confident and reliable
- Action-oriented

---

## Usage Guidelines

### Do's ✅
- Use the official violet-purple gradient
- Maintain consistent spacing around logo
- Use the Activity/Pulse icon as the primary logo element
- Keep tagline paired with logo when introducing brand
- Use gradient text for headlines and important UI elements

### Don'ts ❌
- Don't alter the gradient colors
- Don't use old "PulseTrack" branding
- Don't use different pulse/wave icons
- Don't rotate or distort the logo
- Don't use low contrast color combinations

---

## File Locations

### Frontend
```
/frontend/src/app/layout.tsx           - Root metadata & favicon
/frontend/src/app/login/page.tsx       - Login branding
/frontend/src/app/register/page.tsx    - Register branding
/frontend/src/components/dashboard/
  dashboard-layout.tsx                 - Sidebar logo
/frontend/public/favicon.svg           - Browser favicon
```

### Documentation
```
/docs/BRANDING.md                      - This file
/docs/REPEAT_NOTIFICATIONS.md          - Feature documentation
```

---

## Brand Evolution

### Version History
- **v1.0** - Initial brand: "Service Monitoring System"
- **v1.1** - Rebranded to "PulseTrack" (Blue/Cyan theme)
- **v2.0** - Current: "Pulsimo" (Violet/Purple theme) ✨

### Future Considerations
- Animated logo for loading states
- Dark mode optimizations
- Marketing materials (business cards, presentations)
- Social media assets
- Email templates

---

## Technical Implementation

### Favicon Configuration
```typescript
// /frontend/src/app/layout.tsx
export const metadata: Metadata = {
  title: 'Pulsimo - Real-time Service Monitoring',
  description: 'Professional multi-service monitoring and intelligent alerting platform',
  icons: {
    icon: '/favicon.ico',
  },
}
```

### CSS Variables (if needed)
```css
:root {
  --brand-violet: #8B5CF6;
  --brand-purple: #A855F7;
  --brand-gradient: linear-gradient(to right, var(--brand-violet), var(--brand-purple));
}
```

---

## Contact & Support

For brand guidelines questions or asset requests:
- Review this documentation
- Check `/frontend/public/` for logo files
- Refer to Tailwind CSS classes for color values

---

## License

All Pulsimo brand assets are proprietary.
© 2025 Pulsimo. All Rights Reserved.
