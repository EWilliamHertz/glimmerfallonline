import './globals.css';

export const metadata = {
  title: 'GlimmerFall Online — 2D Pixel MMORPG of Light & Void',
  description: 'Enter the 2D Pixel MMORPG universe of GlimmerFall. 4 Canonical Factions, 8 Archetypes, 7 Disciplines to Lv. 99, authentic TCG relics, and 3v3 Nexus destruction arenas.',
  icons: {
    icon: '/GlimmerFall_official_multicolor_logo.png',
    apple: '/GlimmerFall_official_multicolor_logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0B0C10] text-[#F8FAFC]">
        {children}
      </body>
    </html>
  );
}
