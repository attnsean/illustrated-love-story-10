import React from "react";
import Image from "next/image";
import RightSidebar from "../components/RightSidebar";
import { AnimatedCoupleName } from "../components/AnimatedHeaders";
import { ASSETS } from "../../lib/assets";
import { headers } from "next/headers";
import { resolveProjectData, isDefaultStorageUrl } from "../../lib/resolveProject";
import type { Metadata } from "next";

export const revalidate = 0;

type Props = {
  params: Promise<{ name?: string[] }>;
  searchParams?: Promise<{ to?: string; guest?: string; u?: string; n?: string }>;
};

const formatFallbackGuestName = (raw: string): string => {
  let name = raw;
  try {
    name = decodeURIComponent(raw);
  } catch {}
  name = name
    .replace(/%20/g, " ")
    .replace(/%25/g, " ")
    .replace(/%/g, " ")
    .replace(/\+/g, " ")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return name
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ");
};

const formatDateDisplay = (dateStr?: string | null): string => {
  try {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch {
    return "";
  }
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  let guestName = "Special Guest";
  const slug = resolvedParams?.name && resolvedParams.name.length > 0 ? resolvedParams.name[0] : undefined;

  const queryGuest = resolvedSearchParams?.to || resolvedSearchParams?.guest || resolvedSearchParams?.u || resolvedSearchParams?.n;
  if (queryGuest) {
    guestName = formatFallbackGuestName(queryGuest);
  } else if (resolvedParams?.name && resolvedParams.name.length > 0) {
    guestName = formatFallbackGuestName(resolvedParams.name.join(" "));
  }

  const headersList = await headers();
  const host = headersList.get("host") || undefined;

  const dbData = await resolveProjectData(slug, host, guestName);

  if (dbData.guest) {
    guestName = dbData.guest.name;
  }

  const brideName = dbData.project?.bride_nickname || "Annisa";
  const groomName = dbData.project?.groom_nickname || "Firman";
  const brideFull = dbData.project?.bride_name || "Annisa Rahmawati";
  const groomFull = dbData.project?.groom_name || "Firman Hidayat";

  const title = `Wedding Invitation for ${guestName} | ${brideName} & ${groomName}`;
  const description = `We cordially invite ${guestName} to share our special day. The wedding celebration of ${brideFull} & ${groomFull}.`;
  const weddingDateRaw = dbData.events?.[0]?.event_date || dbData.project?.wedding_date;
  const formattedDate = formatDateDisplay(weddingDateRaw);

  const venueName = dbData.events?.[0]?.venue_name || dbData.project?.venue_name || "";
  const rawCover = dbData.project?.cover_photo_url || dbData.project?.opening_photo_url;
  const hasCustomCover = Boolean(rawCover && !rawCover.includes("/defaults") && !rawCover.includes("onyx") && rawCover.trim() !== "");
  
  const protocol = host && (host.includes("localhost") || host.includes("127.0.0.1")) ? "http" : "https";
  const baseUrl = host ? `${protocol}://${host}` : "https://illustrated-love-story-10.serastory.com";
  const guestParam = guestName && guestName !== "Guest Name" && guestName !== "Special Guest" ? `&to=${encodeURIComponent(guestName)}` : "";
  const dynamicOgUrl = `${baseUrl}/api/og?b=${encodeURIComponent(brideName)}&g=${encodeURIComponent(groomName)}&bf=${encodeURIComponent(brideFull)}&gf=${encodeURIComponent(groomFull)}&d=${encodeURIComponent(formattedDate)}${venueName ? `&v=${encodeURIComponent(venueName)}` : ""}${guestParam}`;
  const imageUrl = hasCustomCover ? (rawCover as string) : dynamicOgUrl;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: `${brideName} & ${groomName} Wedding`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${brideName} & ${groomName} Wedding Invitation`,
        },
      ],
      locale: "id_ID",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function Home({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  let guestName = "Guest Name";
  const slug = resolvedParams?.name && resolvedParams.name.length > 0 ? resolvedParams.name[0] : undefined;

  const queryGuest = resolvedSearchParams?.to || resolvedSearchParams?.guest || resolvedSearchParams?.u || resolvedSearchParams?.n;
  if (queryGuest) {
    guestName = formatFallbackGuestName(queryGuest);
  } else if (resolvedParams?.name && resolvedParams.name.length > 0) {
    guestName = formatFallbackGuestName(resolvedParams.name.join(" "));
  }

  const headersList = await headers();
  const host = headersList.get("host") || undefined;

  const dbData = await resolveProjectData(slug, host, guestName);

  // Check project status
  const isLive = dbData.project ? dbData.project.status === "live" : true;
  const subscription = dbData.project?.subscriptions;
  const isExpired = subscription && (
    subscription.status === "expired" || 
    (subscription.expires_at && new Date(subscription.expires_at) < new Date())
  );

  if (dbData.project && (!isLive || isExpired)) {
    return (
      <main className="min-h-[100dvh] w-full flex items-center justify-center bg-neutral-950 px-4">
        <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl bg-neutral-900 border border-neutral-800 text-white">
          <h2 className="text-2xl font-brawford font-bold text-neutral-200">Undangan Nonaktif</h2>
          <p className="text-sm font-brawford text-neutral-400">
            Masa aktif undangan pernikahan digital ini telah selesai.
          </p>
        </div>
      </main>
    );
  }

  if (dbData.guest) {
    guestName = dbData.guest.name;
  }

  const brideNickname = dbData.project?.bride_nickname || "Annisa";
  const groomNickname = dbData.project?.groom_nickname || "Firman";
  const brideFull = dbData.project?.bride_name || "Annisa Rahmawati";
  const groomFull = dbData.project?.groom_name || "Firman Hidayat";
  const weddingDateRaw = dbData.events?.[0]?.event_date || dbData.project?.wedding_date || (dbData.project?.countdown_target ? dbData.project.countdown_target.split('T')[0] : null);

  const formatDateDot = (dateStr?: string | null) => {
    if (!dateStr) return "02 . 02 . 2028";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "02 . 02 . 2028";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day} . ${month} . ${year}`;
  };

  const formattedDate = formatDateDot(weddingDateRaw);
  const userPhoto = (!isDefaultStorageUrl(dbData.project?.opening_photo_url) ? dbData.project?.opening_photo_url : null)
    || (!isDefaultStorageUrl(dbData.project?.cover_photo_url) ? dbData.project?.cover_photo_url : null)
    || (!isDefaultStorageUrl(dbData.project?.bride_photo_url) ? dbData.project?.bride_photo_url : null)
    || (!isDefaultStorageUrl(dbData.project?.groom_photo_url) ? dbData.project?.groom_photo_url : null);

  return (
    <main className="min-h-[100dvh] w-full flex flex-col md:flex-row bg-[#FFFDF3] text-neutral-900 overflow-hidden relative font-gaegu">
      
      {/* Left side: Desktop Cover Mockup (Hidden on mobile) */}
      <div className="hidden md:flex relative md:w-[58%] lg:w-[62%] md:h-[100dvh] items-center justify-center overflow-hidden bg-[#FAF7EE] border-r border-neutral-200 p-8">
        {userPhoto ? (
          <>
            <Image 
              src={userPhoto} 
              alt={`Prewedding ${groomNickname} & ${brideNickname}`} 
              fill 
              sizes="(max-width: 768px) 0vw, 62vw"
              className="object-cover object-center brightness-[0.85] select-none"
              draggable={false}
              priority
            />
            <div className="absolute inset-0 bg-black/25 backdrop-blur-[0.5px]"></div>
          </>
        ) : null}

        {/* Center Smartphone Mockup Frame (Matching Gambar 1) */}
        <div className="relative z-10 text-center px-5 py-6 rounded-[38px] bg-[#FFFDF3] border-[2.5px] border-neutral-800 shadow-[0_20px_50px_rgba(0,0,0,0.12)] max-w-[350px] lg:max-w-[370px] w-full mx-6 flex flex-col justify-between items-center overflow-hidden">
          <div className="w-full space-y-1">
            <p className="font-beautylife text-2xl lg:text-3xl text-[#6C1420] leading-tight">
              you are invited to our wedding
            </p>

            <div className="flex justify-center py-0.5">
              <img src={ASSETS.bowRibbon} alt="Bow Ribbon" className="w-14 lg:w-16 h-auto object-contain select-none pointer-events-none drop-shadow-sm" />
            </div>

            {/* Couple Name in RT Brawford (Matching Comp_1.mp4 Staggered Character Easy Scale) */}
            <AnimatedCoupleName
              bride={brideNickname}
              groom={groomNickname}
              isCover={true}
              className="text-[#6C1420] w-full px-2 lg:px-4 my-1 select-none"
              brideSize="text-[94px] lg:text-[108px]"
              ampSize="text-[62px] lg:text-[72px]"
              groomSize="text-[94px] lg:text-[108px]"
              line2NegativeMargin="-mt-3.5 lg:-mt-5"
            />

            {(brideFull || groomFull) && (
              <p className="font-gaegu text-xs lg:text-sm text-[#6C1420]/80 font-bold tracking-wide -mt-1 select-none">
                {brideFull.replace(/NIngrum/g, "Ningrum")} &amp; {groomFull}
              </p>
            )}
          </div>

          {/* Illustrated couple in heart (Matching Gambar 1, Large and never cut off) */}
          <div className="w-full flex justify-center -mt-2">
            <img 
              src={ASSETS.couple} 
              alt="Illustrated Couple" 
              className="w-full max-w-[310px] lg:max-w-[330px] h-auto max-h-[300px] lg:max-h-[330px] object-contain select-none pointer-events-none drop-shadow-md" 
            />
          </div>
        </div>
      </div>

      {/* Right side: Illustrated Mobile-Style Scrollable Invitation */}
      <RightSidebar 
        guestName={guestName} 
        guest={dbData.guest}
        project={dbData.project}
        events={dbData.events}
        wishes={dbData.wishes}
        stats={dbData.stats}
        existingRsvp={dbData.existingRsvp}
      />
      
    </main>
  );
}
