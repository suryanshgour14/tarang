import "./globals.css";


export const metadata = {
  title: "Analytics Dashboard",
  description: "Modern analytics dashboard with ocean theme",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={` antialiased bg-[#0A0F1F]`}
      >
        <div className="underwater-background min-h-screen relative overflow-hidden">
          <div className="relative z-10">{children}</div>
        </div>
      </body>
    </html>
  );
}
