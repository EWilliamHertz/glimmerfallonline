import './globals.css';

export const metadata = {
  title: 'GlimmerFall Online — 3D MMORPG of Light & Void',
  description: 'Enter the 3D MMORPG universe of GlimmerFall. Command third-person tab-target combat, harvest Aether resonance, socket authentic TCG cards, and battle in 3v3 Nexus destruction arenas.',
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
