import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import OceanBackground from '../components/OceanBackground';
import FloatingParticles from '../components/FloatingParticles';
import DeepOceanLife from '../components/DeepOceanLife';
import FloatingNav from '@/components/home/floating-nav';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Tarang - Ocean of Possibilities",
  description: "Dive into the depths of innovation with Tarang",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Global Ocean Theme Wrapper */}
        <div className="min-h-screen relative overflow-hidden bg-gray-900">
          {/* Floating Navigation - Global */}
          <FloatingNav />
          
          {/* Ocean Background - Global */}
          <OceanBackground />
          
          {/* Marine snow and organic particles - Global */}
          <FloatingParticles />
          
          {/* Deep sea creatures and bioluminescence - Global */}
          <DeepOceanLife />
          
          {/* Page Content */}
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
