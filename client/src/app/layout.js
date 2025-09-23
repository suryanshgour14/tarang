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
  title: "Tarang",
  description: "Tarang",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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
