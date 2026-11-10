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
    <html lang="en" className="dark" style={{ backgroundColor: '#070B18', color: '#F8FAFC' }}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          html, body {
            background-color: #070B18 !important;
            color: #F8FAFC !important;
            margin: 0;
            padding: 0;
            min-height: 100vh;
          }
          html {
            scrollbar-width: thin;
            scrollbar-color: #facc15 #080d1a;
          }
          html::-webkit-scrollbar, body::-webkit-scrollbar {
            width: 16px;
          }
          html::-webkit-scrollbar-track, body::-webkit-scrollbar-track {
            background: #080d1a;
            border-left: 1px solid #1e293b;
          }
          html::-webkit-scrollbar-thumb, body::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #facc15 0%, #ca8a04 100%);
            border-radius: 8px;
            border: 2px solid #080d1a;
            box-shadow: 0 0 12px rgba(250, 204, 21, 0.6);
            cursor: grab;
          }
          html::-webkit-scrollbar-thumb:hover, body::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #fef08a 0%, #eab308 100%);
            box-shadow: 0 0 18px rgba(250, 204, 21, 0.9);
          }
          html::-webkit-scrollbar-thumb:active, body::-webkit-scrollbar-thumb:active {
            background: linear-gradient(180deg, #38bdf8 0%, #0284c7 100%);
            cursor: grabbing;
          }
          img {
            max-width: 100%;
            height: auto;
          }
          .sidebar-logo-img, .hero-logo-img {
            max-width: 48px !important;
            max-height: 48px !important;
            object-fit: contain !important;
          }
        `}} />
      </head>
      <body className="min-h-screen bg-[#070B18] text-[#F8FAFC]">
        {children}
      </body>
    </html>
  );
}
