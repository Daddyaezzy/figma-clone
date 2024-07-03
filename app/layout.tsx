import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";
import { Room } from "./Room";
import { Provider } from "react-redux";
import { store } from "./store";
import Providers from "@/Provider";

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Figma Clone",
  description:
    "This is DA Figma Clone Using Fabric.js And Liveblocks For Real-Time Collaboration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${workSans.className} `}>
        <Providers>
          <Room>{children}</Room>
        </Providers>
      </body>
    </html>
  );
}
