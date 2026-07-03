import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FloatingNav from '@/components/home/floating-nav';
import { AuthProvider } from '@/contexts/AuthContext';
import ConditionalNav from '@/components/ConditionalNav';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Tarang - Oceanic Hazard Reports",
  description: "Real-time visualization of oceanic hazards including tsunamis, cyclones, storm surges, and coastal flooding. Monitor environmental threats and enhance community safety.",
  icons: {
    icon: '/wave-icon.svg',
    shortcut: '/wave-icon.svg',
    apple: '/wave-icon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/wave-icon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/wave-icon.svg" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <div className="min-h-screen relative overflow-hidden">
            {/* Conditional Navigation - Only show on non-auth pages */}
            <ConditionalNav />
            
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
