"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { DbGuest, DbProject, DbEvent, DbWish, isDefaultStorageUrl } from "../../lib/resolveProject";
import { ASSETS } from "../../lib/assets";

export { ASSETS };

interface Props {
  guestName: string;
  guest?: DbGuest | null;
  project?: DbProject | null;
  events?: DbEvent[] | null;
  wishes?: DbWish[] | null;
  stats?: {
    attending: number;
    wishes: number;
  };
  existingRsvp?: any | null;
}

const formatHonorific = (name?: string | null, prefix: string = "") => {
  if (!name || !name.trim()) return "";
  const trimmed = name.trim();
  if (/^(bpk\.?|bapak|ibu|alm\.?|almarhum|almarhumah)/i.test(trimmed)) return trimmed;
  return `${prefix} ${trimmed}`.trim();
};

export default function RightSidebar({ guestName, guest, project, events, wishes: initialWishes, stats, existingRsvp }: Props) {
  // Couple Info
  const brideNickname = project?.bride_nickname || "Annisa";
  const groomNickname = project?.groom_nickname || "Firman";
  const brideFull = project?.bride_name || "Annisa Rahmawati";
  const groomFull = project?.groom_name || "Firman Hidayat";

  const defaultBrideFather = "Bpk. H. Rahmat Hidayat";
  const defaultBrideMother = "Ibu Hj. Siti Aminah";
  const defaultGroomFather = "Bpk. H. Mansur Hidayat";
  const defaultGroomMother = "Ibu Hj. Nurjanah";

  const isDemo = !project || (!project.id && !project.project_name);
  const brideFather = isDemo ? defaultBrideFather : ((project as any)?.bride_father?.trim() || "");
  const brideMother = isDemo ? defaultBrideMother : ((project as any)?.bride_mother?.trim() || "");
  const groomFather = isDemo ? defaultGroomFather : ((project as any)?.groom_father?.trim() || "");
  const groomMother = isDemo ? defaultGroomMother : ((project as any)?.groom_mother?.trim() || "");

  // Event Info
  const mainEvent = events && events.length > 0 ? events[0] : null;
  const weddingDateRaw = mainEvent?.event_date || project?.wedding_date || (project?.countdown_target ? project.countdown_target.split("T")[0] : null);
  
  const formatDateDisplay = (dateStr?: string | null) => {
    if (!dateStr) return "02.02.2028";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
      }
      const d = new Date(dateStr);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${dd}.${mm}.${yyyy}`;
    } catch {
      return "02.02.2028";
    }
  };
  const formattedDate = formatDateDisplay(weddingDateRaw);

  const formatEventTimeDisplay = (timeStr?: string | null, endTimeStr?: string | null) => {
    if (!timeStr || !timeStr.trim()) return "15:00";
    const trimmed = timeStr.trim();
    if (/WIB|WITA|WIT|selesai|-/i.test(trimmed)) {
      return trimmed;
    }
    const cleanTime = trimmed.includes(".") ? trimmed.replace(".", ":") : trimmed;
    const base = cleanTime.length >= 5 ? cleanTime.slice(0, 5) : cleanTime;
    if (endTimeStr && endTimeStr.trim()) {
      const endTrimmed = endTimeStr.trim();
      const endClean = endTrimmed.includes(".") ? endTrimmed.replace(".", ":") : endTrimmed;
      const endBase = endClean.length >= 5 ? endClean.slice(0, 5) : endClean;
      return `${base} - ${endBase}`;
    }
    return base;
  };

  const extractTime = () => {
    if (mainEvent?.event_time) {
      return formatEventTimeDisplay(mainEvent.event_time, mainEvent.end_time);
    }
    if ((project as any)?.wedding_time) {
      return formatEventTimeDisplay((project as any).wedding_time);
    }
    if (project?.countdown_target && project.countdown_target.includes("T")) {
      const timePart = project.countdown_target.split("T")[1];
      if (timePart) return formatEventTimeDisplay(timePart);
    }
    return "15:00";
  };
  const formattedTime = extractTime();

  const venueName = mainEvent?.venue_name || (project as any)?.venue_name || "VILLA DAGO";
  const venueAddress = mainEvent?.venue_address || (project as any)?.venue_address || "Jl. Dago Pakar Permai No. 1, Bandung";
  const mapsUrl = mainEvent?.venue_maps_url || (project as any)?.venue_maps_url || "https://maps.google.com";

  // Story Milestones
  const rawDbStories = (project as any)?.love_story_items || (project as any)?.wedding_stories;
  let dbStories: any[] = [];
  try {
    if (Array.isArray(rawDbStories)) {
      dbStories = rawDbStories;
    } else if (typeof rawDbStories === "string") {
      dbStories = JSON.parse(rawDbStories);
    }
  } catch {}

  const defaultMilestones = [
    {
      year: "2019",
      title: "First Met",
      story: "Berawal dari perkenalan singkat di sebuah kedai kopi kecil di sudut Jakarta, dua dunia perlahan mulai menyatu.",
      icon: ASSETS.timelineBouquet
    },
    {
      year: "2020",
      title: "The Spark",
      story: "Melalui banyak hujan dan kemarau bersama, kami menyadari bahwa tempat ternyaman adalah bersandar pada satu sama lain.",
      icon: ASSETS.timelineRingBox
    },
    {
      year: "2023",
      title: "The Proposal",
      story: "Dalam sebuah makan malam sederhana, sebuah cincin tersemat sebagai tanda komitmen untuk melangkah ke cerita selanjutnya.",
      icon: ASSETS.timelineHands
    }
  ];

  const stories = Array.isArray(dbStories) && dbStories.length > 0 ? dbStories : defaultMilestones;

  // Cashless & Bank Info
  const isCashlessEnabled = (project as any)?.has_cashless !== false;
  let paymentAccounts: any[] = [];
  try {
    if (Array.isArray((project as any)?.payment_accounts)) {
      paymentAccounts = (project as any).payment_accounts;
    } else if (typeof (project as any)?.payment_accounts === "string") {
      paymentAccounts = JSON.parse((project as any).payment_accounts);
    }
  } catch (e) {
    paymentAccounts = [];
  }

  const brideBank = paymentAccounts[0]
    ? {
        bank_name: paymentAccounts[0].provider || paymentAccounts[0].bank_name || "BCA",
        account_number: paymentAccounts[0].account_number || "777555231",
        owner_name: paymentAccounts[0].account_name || paymentAccounts[0].owner_name || "ANNISA",
        nickname: "ANNISA",
      }
    : {
        bank_name: "BCA",
        account_number: "777555231",
        owner_name: "ANNISA",
        nickname: "ANNISA",
      };

  const groomBank = paymentAccounts[1]
    ? {
        bank_name: paymentAccounts[1].provider || paymentAccounts[1].bank_name || "BCA",
        account_number: paymentAccounts[1].account_number || "777555333",
        owner_name: paymentAccounts[1].account_name || paymentAccounts[1].owner_name || "FIRMAN",
        nickname: "FIRMAN",
      }
    : {
        bank_name: "BCA",
        account_number: "777555333",
        owner_name: "FIRMAN",
        nickname: "FIRMAN",
      };

  const coverPhoto = (!isDefaultStorageUrl(project?.opening_photo_url) ? project?.opening_photo_url : null)
    || (!isDefaultStorageUrl(project?.cover_photo_url) ? project?.cover_photo_url : null);

  const isGuestLocked = Boolean(guestName && guestName !== "Guest Name" && guestName.trim() !== "");
  const isDeclined = (status?: string | null) => status === "not_attending" || status === "tidak_hadir";

  const [willBeThere, setWillBeThere] = useState<"yes" | "no" | null>(
    existingRsvp ? (isDeclined(existingRsvp.attendance) ? "no" : "yes") : "yes"
  );
  const [rsvpName, setRsvpName] = useState(isGuestLocked ? guestName : "");
  const [rsvpEmail, setRsvpEmail] = useState(guest?.email || "");
  const [rsvpStatus, setRsvpStatus] = useState<string>(
    existingRsvp ? (isDeclined(existingRsvp.attendance) ? "not_attending" : "attending") : "attending"
  );
  const [guestCount, setGuestCount] = useState<number>(existingRsvp?.pax || 1);
  const [rsvpNotes, setRsvpNotes] = useState<string>("");
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [hasSubmittedRsvp, setHasSubmittedRsvp] = useState(Boolean(existingRsvp));

  const [isOpened, setIsOpened] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("open") === "true") {
        setIsOpened(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpened) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpened]);

  const handleOpenInvitation = () => {
    setIsOpened(true);
    if (!userPausedRef.current && audioRef.current && !isPlaying) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Wishes State
  const [wishesList, setWishesList] = useState<DbWish[]>(initialWishes || [
    {
      id: "1",
      project_id: project?.id || "",
      name: "Dinda & Rizky",
      message: "Barakallahu lakuma wa baraka alaikuma wa jama'a bainakuma fii khair. Semoga sakinah mawaddah warahmah untuk Annisa & Firman!",
      is_approved: true,
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      project_id: project?.id || "",
      name: "Fajar & Nisa",
      message: "Selamat menempuh hidup baru Firman & Annisa! Bahagia selalu dunia dan akhirat.",
      is_approved: true,
      created_at: new Date().toISOString(),
    },
  ]);
  const [wishName, setWishName] = useState(guestName !== "Guest Name" ? guestName : "");
  const [wishMessage, setWishMessage] = useState("");
  const [wishSubmitting, setWishSubmitting] = useState(false);
  const [wishSuccess, setWishSuccess] = useState(false);

  // Toast / Copy notification
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Music Player
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const userPausedRef = useRef(false);

  useEffect(() => {
    const handleFirstClick = () => {
      if (userPausedRef.current) return;
      if (audioRef.current && !isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    };
    window.addEventListener("click", handleFirstClick, { once: true });
    return () => window.removeEventListener("click", handleFirstClick);
  }, []);

  const toggleMusic = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      userPausedRef.current = true;
    } else {
      userPausedRef.current = false;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // RSVP Form Submit
  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim()) return;
    setRsvpSubmitting(true);

    try {
      const activeProjectId = project?.id || "fc4a817c-0f4b-4f0a-8e92-574e2921d280";
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: activeProjectId,
          guest_id: guest?.id,
          name: rsvpName,
          guest_name: rsvpName,
          email: rsvpEmail,
          status: rsvpStatus === "attending" ? "hadir" : "tidak_hadir",
          attendance: rsvpStatus === "attending" ? "hadir" : "tidak_hadir",
          pax: guestCount,
          guests_count: guestCount,
          notes: rsvpNotes,
          message: rsvpNotes,
        }),
      });

      if (res.ok) {
        setRsvpSuccess(true);
        setHasSubmittedRsvp(true);
      }
    } catch (err) {
      console.error("RSVP error:", err);
    } finally {
      setRsvpSubmitting(false);
    }
  };

  // Wishes Form Submit
  const handleWishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishName.trim() || !wishMessage.trim()) return;
    setWishSubmitting(true);

    try {
      const activeProjectId = project?.id || "fc4a817c-0f4b-4f0a-8e92-574e2921d280";
      const res = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: activeProjectId,
          guest_id: guest?.id,
          name: wishName,
          message: wishMessage,
        }),
      });

      if (res.ok) {
        const newWish: DbWish = {
          id: Date.now().toString(),
          project_id: activeProjectId,
          name: wishName,
          message: wishMessage,
          is_approved: true,
          created_at: new Date().toISOString(),
        };
        setWishesList([newWish, ...wishesList]);
        setWishMessage("");
        setWishSuccess(true);
        setTimeout(() => setWishSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Wish error:", err);
    } finally {
      setWishSubmitting(false);
    }
  };

  return (
    <div className={`relative w-full md:w-[42%] lg:w-[38%] ${isOpened ? "min-h-[100dvh] md:h-[100dvh] md:overflow-y-auto md:overflow-x-hidden" : "h-[100dvh] max-h-[100dvh] overflow-hidden overscroll-none touch-none"} bg-[#FAF7F2] text-neutral-900 border-l border-neutral-200 shadow-2xl flex-shrink-0 font-gaegu`}>
      {/* Audio Element */}
      <audio 
        ref={audioRef} 
        src={project?.music_url || "/audio/bgm.mp3"} 
        loop 
        preload="auto" 
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Floating Music Button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          toggleMusic(e);
        }}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-neutral-300 flex items-center justify-center text-neutral-900 transition-all hover:bg-[#701020] hover:text-white group cursor-pointer"
        title={isPlaying ? "Jeda Musik" : "Putar Musik"}
      >
        {isPlaying ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            className="text-xl inline-block select-none"
          >
            🎵
          </motion.span>
        ) : (
          <span className="flex items-center justify-center text-neutral-700 group-hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <rect x="6" y="4" width="3.5" height="16" rx="1.2" />
              <rect x="14.5" y="4" width="3.5" height="16" rx="1.2" />
            </svg>
          </span>
        )}
      </motion.button>

      {/* Toast Notification */}
      <AnimatePresence>
        {copiedText && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#701020] text-white px-5 py-2.5 rounded-full shadow-2xl font-gaegu text-sm font-bold flex items-center gap-2 border border-white/20 select-none"
          >
            <span className="text-emerald-300">✓</span>
            <span>{copiedText} berhasil disalin!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COVER / WELCOME SCREEN (Overlay until user clicks Buka Undangan) */}
      <AnimatePresence>
        {!isOpened && (
          <motion.section
            id="cover-section"
            initial={{ opacity: 1, y: 0 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.85, ease: [0.65, 0, 0.35, 1] }}
            className="fixed md:absolute inset-0 z-50 h-[100dvh] max-h-[100dvh] w-full flex flex-col justify-between items-center text-center px-4 sm:px-6 py-4 overflow-hidden select-none bg-[#FAF7F2]"
          >
            {/* Top Text & Ribbon */}
            <div className="relative z-10 pt-2 space-y-1 shrink-0">
              <p className="font-beautylife text-2xl sm:text-3xl text-[#701020] leading-tight">
                you are invited to our wedding
              </p>
              <div className="flex justify-center py-1">
                <img
                  src={ASSETS.bowRibbon}
                  alt="Bow Ribbon"
                  className="w-10 sm:w-12 h-auto object-contain select-none pointer-events-none drop-shadow-sm"
                />
              </div>
              <h1 className="font-beautylife text-5xl sm:text-6xl text-[#701020] leading-[1.1] my-1">
                {brideNickname} &amp; <br />
                {groomNickname}
              </h1>
            </div>

            {/* Center: Couple Illustration */}
            <div className="relative z-10 my-auto flex-1 min-h-0 w-full max-w-sm flex flex-col items-center justify-center py-2 px-2 overflow-hidden">
              {coverPhoto ? (
                <div className="relative flex-1 min-h-0 max-h-[46vh] aspect-[4/5] rounded-2xl overflow-hidden border-2 border-[#701020] shadow-xl bg-white p-1.5 flex items-center justify-center">
                  <img src={coverPhoto} alt="Cover Photo" className="w-full h-full object-cover rounded-xl" />
                </div>
              ) : (
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                  className="flex justify-center items-center flex-1 min-h-0 w-full overflow-hidden"
                >
                  <img
                    src={ASSETS.couple}
                    alt="Illustrated Couple"
                    className="max-h-[38vh] max-w-[95%] w-auto h-auto object-contain select-none pointer-events-none drop-shadow-md"
                  />
                </motion.div>
              )}
            </div>

            {/* Bottom: Guest Greeting & Button */}
            <div className="relative z-10 w-full max-w-[300px] space-y-3 pb-2 shrink-0 mx-auto">
              <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-neutral-300 p-3 shadow-sm space-y-1">
                <p className="font-erabura font-bold text-xs text-neutral-600 uppercase tracking-wider">
                  Kepada Yth. Bapak/Ibu/Saudara/i:
                </p>
                <p className="font-brawford font-bold text-xl sm:text-2xl text-[#701020] tracking-wide truncate">
                  {formatHonorific(guestName)}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleOpenInvitation}
                className="w-full py-3 px-6 bg-[#6B1020] hover:bg-[#58111A] text-white rounded-full font-erabura font-bold text-sm tracking-widest uppercase shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>BUKA UNDANGAN</span>
              </motion.button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* MAIN INVITATION STRIP (Scrollable after opening) */}
      <div className="relative max-w-md mx-auto px-5 py-8 space-y-14 z-10">

        {/* SECTION 1: HERO / COUPLE */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center space-y-3 pt-2"
        >
          <p className="font-beautylife text-2xl sm:text-3xl text-[#701020] leading-tight">
            you are invited to our wedding
          </p>

          <div className="flex justify-center py-1">
            <img 
              src={ASSETS.bowRibbon} 
              alt="Bow Ribbon" 
              className="w-12 h-auto object-contain select-none pointer-events-none drop-shadow-sm" 
            />
          </div>

          <h1 className="font-beautylife text-5xl sm:text-6xl text-[#701020] leading-[1.1]">
            {brideNickname} &amp; <br />
            {groomNickname}
          </h1>

          {(brideFull || groomFull) && (
            <div className="mt-2 space-y-0.5">
              <p className="font-brawford text-xl sm:text-2xl text-[#701020] tracking-wide">
                {brideFull} &amp; {groomFull}
              </p>
              {Boolean(brideFather || brideMother) && (
                <p className="font-gaegu text-xs sm:text-sm text-neutral-600">
                  Putri dari {formatHonorific(brideFather, "Bpk.")}{Boolean(brideFather && brideMother) ? " & " : ""}{formatHonorific(brideMother, "Ibu")}
                </p>
              )}
              {Boolean(groomFather || groomMother) && (
                <p className="font-gaegu text-xs sm:text-sm text-neutral-600">
                  Putra dari {formatHonorific(groomFather, "Bpk.")}{Boolean(groomFather && groomMother) ? " & " : ""}{formatHonorific(groomMother, "Ibu")}
                </p>
              )}
            </div>
          )}

          <div className="pt-3 flex justify-center">
            <motion.img 
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut" }}
              src={ASSETS.couple} 
              alt="Illustrated Couple" 
              className="w-64 sm:w-72 h-auto object-contain select-none pointer-events-none drop-shadow-md" 
            />
          </div>
        </motion.section>

        {/* SECTION 2: DATE & PLACE */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.7 }}
          className="text-center space-y-4 pt-4"
        >
          <p className="font-beautylife text-2xl sm:text-3xl text-[#701020] leading-tight">
            the details of our big day
          </p>

          <div className="flex justify-center">
            <img 
              src={ASSETS.titleDatePlace} 
              alt="DATE & PLACE" 
              className="w-56 sm:w-64 h-auto object-contain select-none pointer-events-none drop-shadow-sm" 
            />
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex justify-center">
              <img 
                src={ASSETS.calendarIcon} 
                alt="02 February 2028 Calendar" 
                className="w-44 sm:w-52 h-auto object-contain select-none drop-shadow-sm" 
              />
            </div>

            <div className="flex items-center justify-center gap-6 pt-1">
              <div className="flex items-center gap-2">
                <img src={ASSETS.clockIcon} alt="Clock" className="w-5 sm:w-6 h-auto object-contain" />
                <span className="font-brawford text-xl sm:text-2xl font-bold text-[#701020] tracking-wide">
                  {formattedTime}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <img src={ASSETS.pinIcon} alt="Pin" className="w-5 sm:w-6 h-auto object-contain" />
                <span className="font-brawford text-xl sm:text-2xl font-bold text-[#701020] tracking-wide uppercase">
                  {venueName}
                </span>
              </div>
            </div>

            <div className="flex justify-center pt-1">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block transition-transform cursor-pointer"
              >
                <img src={ASSETS.openMapBtn} alt="OPEN MAP" className="h-10 sm:h-12 w-auto object-contain drop-shadow-sm" />
              </motion.a>
            </div>
          </div>
        </motion.section>

        {/* SECTION 3: OUR STORY */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.7 }}
          className="text-center space-y-4 pt-4"
        >
          <p className="font-beautylife text-2xl sm:text-3xl text-[#701020] leading-tight px-4">
            a journey of a thousand miles begins with a single step.
          </p>

          <div className="flex justify-center">
            <img 
              src={ASSETS.titleOurStory} 
              alt="OUR STORY" 
              className="w-56 sm:w-64 h-auto object-contain select-none pointer-events-none drop-shadow-sm" 
            />
          </div>

          <div className="relative max-w-sm mx-auto pt-6 pb-2">
            {/* Center Wavy Line */}
            <div className="absolute top-2 bottom-2 left-1/2 -translate-x-1/2 w-8 sm:w-10 pointer-events-none z-0 flex justify-center">
              <img src={ASSETS.timelineLine} alt="Timeline Line" className="w-full h-full object-fill opacity-90" />
            </div>

            <div className="space-y-12 relative z-10">
              {stories.map((item: any, idx: number) => {
                const isEven = idx % 2 === 1;
                const timelineIcons = [
                  ASSETS.timelineBouquet,
                  ASSETS.timelineRingBox,
                  ASSETS.timelineHands
                ];
                const iconSrc = item.icon || timelineIcons[idx % timelineIcons.length];

                return (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.5, delay: idx * 0.12 }}
                    className="flex items-center justify-between gap-4"
                  >
                    {/* Left Column */}
                    <div className="w-[45%] text-right pr-2">
                      {!isEven ? (
                        <div className="space-y-1">
                          <h4 className="font-gaegu font-bold text-base text-neutral-900 leading-tight">
                            {item.title}
                          </h4>
                          <p className="font-gaegu text-xs text-neutral-700 leading-relaxed">
                            {item.story || item.desc || item.description}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <img src={iconSrc} alt="Milestone Icon" className="w-14 h-14 object-contain" />
                          <span className="font-brawford text-3xl sm:text-4xl font-bold text-[#0E4D2B] block tracking-wide mt-1">
                            {item.year}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="w-[10%] shrink-0"></div>

                    {/* Right Column */}
                    <div className="w-[45%] text-left pl-2">
                      {isEven ? (
                        <div className="space-y-1">
                          <h4 className="font-gaegu font-bold text-base text-neutral-900 leading-tight">
                            {item.title}
                          </h4>
                          <p className="font-gaegu text-xs text-neutral-700 leading-relaxed">
                            {item.story || item.desc || item.description}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-start">
                          <img src={iconSrc} alt="Milestone Icon" className="w-14 h-14 object-contain" />
                          <span className="font-brawford text-3xl sm:text-4xl font-bold text-[#0E4D2B] block tracking-wide mt-1">
                            {item.year}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* SECTION 4: DRESS CODE */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.7 }}
          className="text-center space-y-4 pt-4"
        >
          <p className="font-beautylife text-lg sm:text-xl text-[#701020] leading-tight max-w-xs mx-auto px-2">
            to maintain the harmony of our wedding theme, we kindly request our guests to wear
          </p>

          <div className="flex justify-center">
            <img 
              src={ASSETS.titleDressCode} 
              alt="DRESS CODE" 
              className="w-56 sm:w-64 h-auto object-contain select-none pointer-events-none drop-shadow-sm" 
            />
          </div>

          <div className="flex justify-center pt-2">
            <img 
              src={ASSETS.dressCodeAttire} 
              alt="Formal Attire" 
              className="w-48 sm:w-56 h-auto object-contain select-none drop-shadow-sm" 
            />
          </div>

          <div className="pt-1 space-y-2">
            <p className="font-gaegu font-bold text-lg text-[#701020] tracking-wide">
              Monocrome
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="w-9 h-9 rounded-full bg-black shadow-md border border-neutral-700"></div>
              <div className="w-9 h-9 rounded-full bg-white shadow-md border border-neutral-300"></div>
            </div>
          </div>
        </motion.section>

        {/* SECTION 5: WEDDING GIFT */}
        {isCashlessEnabled && (
          <motion.section 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.7 }}
            className="text-center space-y-4 pt-4"
          >
            <p className="font-beautylife text-base sm:text-lg text-[#701020] leading-relaxed max-w-sm mx-auto px-4">
              your presence is the greatest gift of all. However, if you are unable to attend and would like to send us your wishes in the form of a gift, please use the account details below.
            </p>

            <div className="flex justify-center">
              <img 
                src={ASSETS.titleWeddingGift} 
                alt="WEDDING GIFT" 
                className="w-64 sm:w-72 h-auto object-contain select-none pointer-events-none drop-shadow-sm" 
              />
            </div>

            <div className="space-y-4 max-w-[300px] sm:max-w-[320px] mx-auto pt-2">
              {/* Card 1: Annisa */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-[#6B1020] text-white p-5 rounded-2xl shadow-lg relative text-left overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-2xl tracking-wider font-sans">{brideBank.bank_name}</span>
                  <div className="w-10 h-8 rounded-md bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 border border-amber-200/80 shadow-inner flex items-center justify-center opacity-95">
                    <div className="w-7 h-5 border border-amber-600/40 rounded grid grid-cols-2"></div>
                  </div>
                </div>
                <div className="mt-6 space-y-0.5">
                  <p className="font-brawford text-lg font-bold tracking-wider uppercase">{brideBank.owner_name}</p>
                  <p className="font-mono text-xl tracking-widest font-semibold">{brideBank.account_number}</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => copyToClipboard(brideBank.account_number, `BCA ${brideBank.nickname}`)}
                  className="mt-3 w-full py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-gaegu font-bold tracking-wider uppercase transition-colors cursor-pointer"
                >
                  SALIN REKENING
                </button>
              </motion.div>

              {/* Card 2: Firman */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-[#6B1020] text-white p-5 rounded-2xl shadow-lg relative text-left overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-2xl tracking-wider font-sans">{groomBank.bank_name}</span>
                  <div className="w-10 h-8 rounded-md bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 border border-amber-200/80 shadow-inner flex items-center justify-center opacity-95">
                    <div className="w-7 h-5 border border-amber-600/40 rounded grid grid-cols-2"></div>
                  </div>
                </div>
                <div className="mt-6 space-y-0.5">
                  <p className="font-brawford text-lg font-bold tracking-wider uppercase">{groomBank.owner_name}</p>
                  <p className="font-mono text-xl tracking-widest font-semibold">{groomBank.account_number}</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => copyToClipboard(groomBank.account_number, `BCA ${groomBank.nickname}`)}
                  className="mt-3 w-full py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-gaegu font-bold tracking-wider uppercase transition-colors cursor-pointer"
                >
                  SALIN REKENING
                </button>
              </motion.div>
            </div>

            <div className="text-center font-gaegu text-[#701020] space-y-0.5 pt-3 max-w-xs mx-auto">
              <p className="text-lg font-bold">#Note:</p>
              <p className="text-xs font-bold leading-snug">Before making Transfer/Shipment, please note:</p>
              <p className="text-xs font-bold leading-snug">- Bank Name, Recipient Name are already in accordance with the couple's names</p>
              <p className="text-xs font-bold leading-snug">- Confirm the gift shipment via personal chat to the couple</p>
            </div>
          </motion.section>
        )}

        {/* SECTION 6: ATTENDANCE */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.7 }}
          className="text-center space-y-4 pt-4"
        >
          <p className="font-beautylife text-2xl sm:text-3xl text-[#701020] leading-tight px-4">
            your presence is our greatest honor
          </p>

          <div className="flex justify-center">
            <img 
              src={ASSETS.titleAttendance} 
              alt="ATTENDANCE" 
              className="w-64 sm:w-72 h-auto object-contain select-none pointer-events-none drop-shadow-sm" 
            />
          </div>

          {hasSubmittedRsvp ? (
            <div className="bg-white/95 border-2 border-[#701020] rounded-3xl p-6 shadow-sm max-w-sm mx-auto text-center space-y-3.5 my-2">
              <div className="w-12 h-12 bg-emerald-50 border-2 border-emerald-500 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                ✓
              </div>
              <h4 className="font-gaegu font-bold text-2xl text-neutral-900 leading-tight">
                Konfirmasi Kehadiran Tersimpan
              </h4>
              <p className="font-gaegu text-sm text-neutral-600">
                Halo <strong>{rsvpName || guestName}</strong>, konfirmasi kehadiran Anda telah tercatat. Terima kasih!
              </p>
            </div>
          ) : (
            <form onSubmit={handleRsvpSubmit} className="space-y-4 pt-2 text-left max-w-sm mx-auto">
              <div>
                <label className="block text-sm font-gaegu font-bold text-[#701020] mb-1 ml-3">
                  Guest Identity
                </label>
                <input
                  type="text"
                  required
                  value={isGuestLocked ? guestName : rsvpName}
                  onChange={(e) => {
                    if (!isGuestLocked) setRsvpName(e.target.value);
                  }}
                  readOnly={isGuestLocked}
                  placeholder="Guest Name"
                  className="w-full border-2 border-[#701020] rounded-full px-5 py-2.5 font-gaegu text-base text-neutral-900 placeholder:text-neutral-400 bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#701020]"
                />
              </div>

              <div>
                <label className="block text-sm font-gaegu font-bold text-[#701020] mb-1 ml-3">
                  Email Address
                </label>
                <input
                  type="email"
                  value={rsvpEmail}
                  onChange={(e) => setRsvpEmail(e.target.value)}
                  placeholder="To Receive your digital invitation"
                  className="w-full border-2 border-[#701020] rounded-full px-5 py-2.5 font-gaegu text-base text-neutral-900 placeholder:text-neutral-400 bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#701020]"
                />
              </div>

              <div>
                <label className="block text-sm font-gaegu font-bold text-[#701020] mb-1 ml-3">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  placeholder="Example: 081955562"
                  className="w-full border-2 border-[#701020] rounded-full px-5 py-2.5 font-gaegu text-base text-neutral-900 placeholder:text-neutral-400 bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#701020]"
                />
              </div>

              <div>
                <label className="block text-sm font-gaegu font-bold text-[#701020] mb-1 ml-3">
                  Confirmation
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRsvpStatus("attending");
                      setWillBeThere("yes");
                    }}
                    className={`py-2 px-4 rounded-full font-gaegu font-bold text-sm border-2 border-[#701020] transition-all cursor-pointer ${
                      rsvpStatus === "attending" ? "bg-[#701020] text-white shadow-sm" : "bg-white/70 text-[#701020]"
                    }`}
                  >
                    ✓ Hadir (Yes!)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRsvpStatus("not_attending");
                      setWillBeThere("no");
                    }}
                    className={`py-2 px-4 rounded-full font-gaegu font-bold text-sm border-2 border-[#701020] transition-all cursor-pointer ${
                      rsvpStatus === "not_attending" ? "bg-[#701020] text-white shadow-sm" : "bg-white/70 text-[#701020]"
                    }`}
                  >
                    ✕ Tidak Hadir
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-gaegu font-bold text-[#701020] mb-1 ml-3">
                  Total Persons
                </label>
                <div className="relative">
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full appearance-none border-2 border-[#701020] rounded-full pl-5 pr-11 py-2.5 font-gaegu text-base font-bold text-neutral-900 bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#701020] cursor-pointer"
                  >
                    <option value={1}>1 GUEST</option>
                    <option value={2}>2 GUESTS</option>
                    <option value={3}>3 GUESTS</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#701020]">
                    ▼
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-center">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={rsvpSubmitting}
                  className="w-full py-3 bg-[#6B1020] hover:bg-[#58111A] text-white font-erabura font-bold text-sm sm:text-base tracking-widest rounded-full shadow-lg transition-all uppercase select-none disabled:opacity-60 cursor-pointer"
                >
                  {rsvpSubmitting ? "Menyimpan..." : "CONFIRM PRESENCE"}
                </motion.button>
              </div>

              {rsvpSuccess && (
                <div className="text-center text-xs font-gaegu font-bold text-emerald-600 bg-emerald-50 py-2 rounded-xl border border-emerald-200 mt-2">
                  Terima kasih! Konfirmasi kehadiran Anda telah tersimpan.
                </div>
              )}
            </form>
          )}
        </motion.section>

        {/* SECTION 7: BLESSINGS */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.7 }}
          className="text-center space-y-4 pt-4"
        >
          <p className="font-beautylife text-2xl sm:text-3xl text-[#701020] leading-tight px-4">
            leave your warmest words for the beginning of our new chapter.
          </p>

          <div className="flex justify-center">
            <img 
              src={ASSETS.titleBlessings} 
              alt="BLESSINGS" 
              className="w-60 sm:w-68 h-auto object-contain select-none pointer-events-none drop-shadow-sm" 
            />
          </div>

          <form onSubmit={handleWishSubmit} className="space-y-4 pt-2 text-left max-w-sm mx-auto">
            <div>
              <label className="block text-sm font-gaegu font-bold text-[#701020] mb-1 ml-3">
                Name
              </label>
              <input
                type="text"
                required
                value={wishName}
                onChange={(e) => setWishName(e.target.value)}
                placeholder="Your Name"
                className="w-full border-2 border-[#701020] rounded-full px-5 py-2.5 font-gaegu text-base text-neutral-900 placeholder:text-neutral-400 bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#701020]"
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-gaegu font-bold text-[#701020] mb-1 ml-3">
                Prayers &amp; Wishes
              </label>
              <div className="relative rounded-[30px] border-2 border-[#701020] bg-white/80 p-4 shadow-sm">
                <textarea
                  required
                  rows={4}
                  value={wishMessage}
                  onChange={(e) => setWishMessage(e.target.value)}
                  placeholder="Write your warmest wishes for the bride & groom..."
                  className="w-full bg-transparent font-gaegu text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={wishSubmitting}
                className="w-full py-3 bg-[#6B1020] hover:bg-[#58111A] text-white font-erabura font-bold text-sm sm:text-base tracking-widest rounded-full shadow-lg transition-all uppercase select-none disabled:opacity-60 cursor-pointer"
              >
                {wishSubmitting ? "Mengirim..." : "SUBMIT BLESSING"}
              </motion.button>
            </div>

            {wishSuccess && (
              <div className="text-center text-xs font-gaegu font-bold text-emerald-600 bg-emerald-50 py-2 rounded-xl border border-emerald-200 mt-2">
                Terima kasih atas doa dan ucapan hangatnya!
              </div>
            )}
          </form>

          {/* Wishes List */}
          <div className="pt-6 space-y-3 max-w-sm mx-auto text-left">
            <div className="flex items-center justify-between px-2">
              <span className="font-gaegu text-sm font-bold text-[#701020] uppercase tracking-widest">
                Wishes Wall ({wishesList.length})
              </span>
              <span className="text-[#701020] font-bold text-sm">♥ with love</span>
            </div>

            <div className="space-y-3.5 max-h-[460px] overflow-y-auto p-1.5 pb-6 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">
              {wishesList.map((w, idx) => (
                <div
                  key={w.id || idx}
                  className="bg-white/90 border-2 border-[#701020]/25 rounded-2xl p-4 shadow-sm relative transition-all"
                >
                  <h5 className="font-gaegu font-bold text-base text-neutral-900 mb-0.5">
                    {w.name}
                  </h5>
                  <p className="font-gaegu text-sm text-neutral-700 leading-relaxed">
                    {w.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* SECTION 8: RSVP & BANQUET TABLE */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.7 }}
          className="text-center space-y-4 pt-4"
        >
          <p className="font-beautylife text-2xl sm:text-3xl text-[#701020] leading-tight px-4">
            kindly let us know if you can join us
          </p>

          <div className="flex justify-center">
            <img 
              src={ASSETS.titleRsvp} 
              alt="RSVP" 
              className="w-52 sm:w-60 h-auto object-contain select-none pointer-events-none drop-shadow-sm" 
            />
          </div>

          <div className="text-center space-y-2 pt-2">
            <h3 className="font-brawford text-[#701020] text-2xl font-bold tracking-wider">
              WILL YOU BE THERE?
            </h3>
            <div className="inline-block text-left font-gaegu text-lg font-bold text-[#701020] space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={willBeThere === "yes"} 
                  onChange={() => {
                    setWillBeThere("yes");
                    setRsvpStatus("attending");
                  }} 
                  className="accent-[#701020] w-5 h-5 rounded cursor-pointer" 
                />
                <span>Yes!</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={willBeThere === "no"} 
                  onChange={() => {
                    setWillBeThere("no");
                    setRsvpStatus("not_attending");
                  }} 
                  className="accent-[#701020] w-5 h-5 rounded cursor-pointer" 
                />
                <span>Sorry, cant make it</span>
              </label>
            </div>
          </div>

          {/* Dinner Banquet Table (10-24.png) */}
          <div className="pt-4 flex justify-center">
            <img 
              src={ASSETS.tableBanquet} 
              alt="Banquet Dinner Table" 
              className="w-full max-w-sm h-auto object-contain select-none pointer-events-none drop-shadow-xs" 
            />
          </div>
        </motion.section>

        {/* FOOTER */}
        <footer className="text-center space-y-2 pt-6 pb-6 border-t border-[#701020]/20">
          <p className="font-beautylife text-3xl text-[#701020]">
            {brideNickname} &amp; {groomNickname}
          </p>
          <p className="font-gaegu text-xs text-neutral-500 tracking-wider">
            Thank you for being part of our special love story.
          </p>
          <div className="pt-1">
            <a 
              href="https://www.serastory.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[11px] font-gaegu font-bold text-neutral-400 hover:text-neutral-700 transition-colors uppercase tracking-widest"
            >
              Crafted with ♥ by SERA STORY
            </a>
          </div>
        </footer>

      </div>
    </div>
  );
}
