import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import  Providers  from "@/lib/Providers";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TCN Central Database",
  description: "First Nation Office Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50 text-gray-900 antialiased`}>
        <Providers>
          {children}
          <Toaster/>
        </Providers>
      </body>
    </html>
  );
}