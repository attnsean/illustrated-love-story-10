import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display, Great_Vibes } from "next/font/google";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const customSerif = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const customScript = Great_Vibes({
  variable: "--font-great-vibes",
  weight: "400",
  subsets: ["latin"],
});

import { supabase } from "../lib/supabase";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  let projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

  if (!projectId) {
    try {
      const headersList = await headers();
      const host = headersList.get("host")?.split(":")[0].toLowerCase();
      if (host) {
        const { data: matchedProject } = await supabase
          .from("projects")
          .select("id")
          .or(`custom_domain.eq.${host},site_url.ilike.%${host}%`)
          .limit(1)
          .maybeSingle();
        if (matchedProject?.id) {
          projectId = matchedProject.id;
        }
      }
    } catch {}
  }
  projectId = projectId || 'fc4a817c-0f4b-4f0a-8e92-574e2921d280';
  
  const { data: projectData } = await supabase
    .from('projects')
    .select('site_url, custom_domain')
    .eq('id', projectId)
    .maybeSingle();

  const { data: weddingData } = await supabase
    .from('wedding_details')
    .select('bride_name, groom_name, bride_nickname, groom_nickname, cover_photo_url, opening_photo_url')
    .eq('project_id', projectId)
    .maybeSingle();

  const data = {
    ...projectData,
    ...weddingData
  };

  const rawBrideName = data?.bride_name || "Annisa Rahmawati";
  const brideName = rawBrideName.replace(/NIngrum/g, "Ningrum");
  const groomName = data?.groom_name || "Firman Hidayat";
  const brideNick = data?.bride_nickname || "Annisa";
  const groomNick = data?.groom_nickname || "Firman";
  const rawCover = data?.cover_photo_url || data?.opening_photo_url;
  const siteUrl = data?.custom_domain || data?.site_url || 'https://illustrated-love-story-10.serastory.com';
  const cleanSiteUrl = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;
  const dynamicOgUrl = `${cleanSiteUrl}/api/og?b=${encodeURIComponent(brideNick)}&g=${encodeURIComponent(groomNick)}&bf=${encodeURIComponent(brideName)}&gf=${encodeURIComponent(groomName)}`;
  const coverUrl = (rawCover && !rawCover.includes("/defaults") && !rawCover.includes("onyx")) 
    ? rawCover 
    : dynamicOgUrl;

  const title = `${brideNick} & ${groomNick} Wedding Invitation`;
  const description = `We cordially invite you to celebrate the wedding of ${brideName} & ${groomName}.`;

  return {
    colorScheme: 'light dark',
    other: {
      'color-scheme': 'light dark',
      'supported-color-schemes': 'light dark',
      'darkreader-lock': 'true',
    },
    metadataBase: new URL(cleanSiteUrl),
    title,
    description,
    openGraph: {
      title,
      description,
      url: cleanSiteUrl,
      siteName: `${brideNick} & ${groomNick} Wedding`,
      images: [
        {
          url: coverUrl,
          width: 1200,
          height: 630,
          alt: `${brideNick} & ${groomNick} Wedding Invitation`,
        },
      ],
      locale: 'id_ID',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [coverUrl],
    }
  };
}
 
import ClientSecurity from "./components/ClientSecurity";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en"
      style={{ colorScheme: "light" }}
      className={`${geistSans.variable} ${geistMono.variable} ${customSerif.variable} ${customScript.variable} h-full antialiased`}
    >
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <meta name="darkreader-lock" content="true" />
        <meta name="theme-color" content="#FFFDF3" />
      </head>
      <body style={{ colorScheme: "light dark", backgroundColor: "#FFFDF3", color: "#111111" }} className="min-h-full flex flex-col bg-[#FFFDF3] text-neutral-900">
        {/* Suppress and remove Vercel Toolbar if injected */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var killToolbar = function() {
                    var selectors = ['vercel-toolbar', 'v-toolbar', '#vercel-toolbar', 'vercel-live-feedback', 'iframe[src*="vercel.live"]', 'iframe[title*="Vercel Toolbar"]'];
                    for (var i = 0; i < selectors.length; i++) {
                      var els = document.querySelectorAll(selectors[i]);
                      for (var j = 0; j < els.length; j++) {
                        els[j].remove();
                      }
                    }
                  };
                  killToolbar();
                  if (typeof MutationObserver !== 'undefined') {
                    var observer = new MutationObserver(killToolbar);
                    if (document.body) {
                      observer.observe(document.body, { childList: true, subtree: true });
                    } else {
                      document.addEventListener('DOMContentLoaded', function() {
                        if (document.body) observer.observe(document.body, { childList: true, subtree: true });
                      });
                    }
                    setTimeout(function() { observer.disconnect(); }, 8000);
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        <ClientSecurity />
        {children}
      </body>
    </html>
  );
}
