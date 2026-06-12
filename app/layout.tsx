import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

export const metadata: Metadata = {
  title: "Acquemy — AI Client Acquisition for Freelancers",
  description: "Your AI co-pilot for finding and closing freelance clients",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={montserrat.variable} suppressHydrationWarning>
      <head>
        {/* Applies the theme class before first paint to avoid a flash. Defaults to light;
            follows the user's stored choice, or the OS preference in "system" mode. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||((!t||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <Providers>
          {children}
          <Toaster richColors position="top-right" expand />
        </Providers>
      </body>
    </html>
  );
}
