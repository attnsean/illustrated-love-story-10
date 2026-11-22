"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { DbGuest, DbProject, DbEvent, DbWish, isDefaultStorageUrl } from "../../lib/resolveProject";
import { ASSETS } from "../../lib/assets";
import { AnimatedCoupleName, AnimatedTitle } from "./AnimatedHeaders";

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

  // Event Info
  const mainEvent = events && events.length > 0 ? events[0] : null;
  const weddingDateRaw = mainEvent?.event_date || project?.wedding_date || "2028-02-02";
  
  const formatDateDisplay = (dateStr?: string | null) => {
    if (!dateStr) return "02 . 02 . 2028";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]} . ${parts[1]} . ${parts[0]}`;
      }
      const d = new Date(dateStr);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${dd} . ${mm} . ${yyyy}`;
    } catch {
      return "02 . 02 . 2028";
    }
  };
  const formattedDate = formatDateDisplay(weddingDateRaw);

  const formatEventTimeDisplay = (timeStr?: string | null) => {
    if (!timeStr || !timeStr.trim()) return "15:00";
    const trimmed = timeStr.trim();
    const cleanTime = trimmed.includes(".") ? trimmed.replace(".", ":") : trimmed;
    return cleanTime.length >= 5 ? cleanTime.slice(0, 5) : cleanTime;
  };
  const formattedTime = formatEventTimeDisplay(mainEvent?.event_time || (project as any)?.wedding_time || "15:00");

  const venueName = mainEvent?.venue_name || (project as any)?.venue_name || "Villa Dago";
  const mapsUrl = mainEvent?.venue_maps_url || (project as any)?.venue_maps_url || "https://maps.google.com/?q=Villa+Dago+Bandung";

  // Countdown Timer
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const getTargetTimestamp = () => {
      if ((project as any)?.countdown_target) {
        const t = new Date((project as any).countdown_target).getTime();
        if (!isNaN(t)) return t;
      }
      const dateStr = weddingDateRaw || "2028-02-02";
      let timeStr = "15:00:00";
      const rawT = mainEvent?.event_time || (project as any)?.wedding_time;
      if (rawT && typeof rawT === "string") {
        const match = rawT.match(/(\d{1,2})[:.](\d{2})/);
        if (match) {
          timeStr = `${match[1].padStart(2, "0")}:${match[2]}:00`;
        } else if (rawT.length === 5) {
          timeStr = rawT + ":00";
        }
      }
      const isoStr = dateStr + "T" + timeStr;
      const parsed = new Date(isoStr).getTime();
      if (!isNaN(parsed)) return parsed;
      const fallback = new Date(dateStr).getTime();
      if (!isNaN(fallback)) return fallback;
      return new Date("2028-02-02T15:00:00").getTime();
    };

    const targetTime = getTargetTimestamp();
    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, targetTime - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [(project as any)?.countdown_target, weddingDateRaw, mainEvent?.event_time]);

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
  let rawPaymentAccounts: any[] = [];
  try {
    if (Array.isArray((project as any)?.payment_accounts)) {
      rawPaymentAccounts = (project as any).payment_accounts;
    } else if (typeof (project as any)?.payment_accounts === "string") {
      rawPaymentAccounts = JSON.parse((project as any).payment_accounts);
    }
  } catch (e) {
    rawPaymentAccounts = [];
  }

  // Filter out empty or dummy account numbers
  const paymentAccounts = (rawPaymentAccounts || []).filter(
    (acc: any) =>
      acc &&
      acc.account_number &&
      String(acc.account_number).trim() !== "" &&
      String(acc.account_number).trim() !== "777555231" &&
      String(acc.account_number).trim() !== "777555333"
  );

  const isCashlessEnabled = Boolean(
    ((project as any)?.has_cashless || (project as any)?.subscriptions?.packages?.has_amplop_digital) &&
    paymentAccounts.length > 0
  );

  const coverPhoto = (!isDefaultStorageUrl(project?.opening_photo_url) ? project?.opening_photo_url : null)
    || (!isDefaultStorageUrl(project?.cover_photo_url) ? project?.cover_photo_url : null);

  const isGuestLocked = Boolean(guestName && guestName !== "Guest Name" && guestName.trim() !== "");
  const isDeclined = (status?: string | null) => status === "not_attending" || status === "tidak_hadir";

  const [willBeThere, setWillBeThere] = useState<"yes" | "no" | null>(
    existingRsvp ? (isDeclined(existingRsvp.attendance) ? "no" : "yes") : "yes"
  );
  const [rsvpName, setRsvpName] = useState(isGuestLocked ? guestName : "");
  const [rsvpEmail, setRsvpEmail] = useState(guest?.email || "");
  const [rsvpPhone, setRsvpPhone] = useState(guest?.phone || "");
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
      const finalStatus = willBeThere === "no" ? "tidak_hadir" : (rsvpStatus === "not_attending" ? "tidak_hadir" : "hadir");
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: activeProjectId,
          guest_id: guest?.id,
          name: rsvpName,
          guest_name: rsvpName,
          email: rsvpEmail,
          phone: rsvpPhone,
          status: finalStatus,
          attendance: finalStatus,
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
    <div className={`relative w-full md:w-[42%] lg:w-[38%] ${isOpened ? "min-h-[100dvh] md:h-[100dvh] md:overflow-y-auto md:overflow-x-hidden" : "h-[100dvh] max-h-[100dvh] overflow-hidden overscroll-none touch-none"} bg-[#FFFDF3] text-neutral-900 border-l border-neutral-200 shadow-2xl flex-shrink-0 font-gaegu`}>
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
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-neutral-300 flex items-center justify-center text-neutral-900 transition-all hover:bg-[#6C1420] hover:text-white group cursor-pointer"
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
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#6C1420] text-white px-5 py-2.5 rounded-full shadow-2xl font-gaegu text-sm font-bold flex items-center gap-2 border border-white/20 select-none"
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
            className="fixed md:absolute inset-0 z-50 h-[100dvh] max-h-[100dvh] w-full flex flex-col justify-between items-center text-center px-4 sm:px-6 py-3 sm:py-4 overflow-hidden select-none bg-[#FFFDF3]"
          >
            {/* Top Text & Ribbon */}
            <div className="relative z-10 pt-1 space-y-0.5 shrink-0">
              <p className="font-beautylife text-2xl sm:text-3xl text-[#6C1420] leading-tight">
                you are invited to our wedding
              </p>
              <div className="flex justify-center py-0.5">
                <img
                  src={ASSETS.bowRibbon}
                  alt="Bow Ribbon"
                  className="w-14 sm:w-16 h-auto object-contain select-none pointer-events-none drop-shadow-sm"
                />
              </div>
              {/* Couple Name: Annisa & on line 1, Firman on line 2 (Matching Comp_1.mp4 Staggered Character Easy Scale) */}
              <AnimatedCoupleName
                bride={brideNickname}
                groom={groomNickname}
                isCover={true}
                className="text-[#6C1420] w-full px-2 sm:px-4 my-1 select-none"
                brideSize="text-[92px] sm:text-[104px]"
                ampSize="text-[60px] sm:text-[68px]"
                groomSize="text-[92px] sm:text-[104px]"
                line2NegativeMargin="-mt-3.5 sm:-mt-5"
              />
            </div>

            {/* Center: Couple Illustration */}
            <div className="relative z-10 my-auto flex-1 min-h-0 w-full max-w-sm flex flex-col items-center justify-center p-0 overflow-visible">
              {coverPhoto ? (
                <div className="relative flex-1 min-h-0 max-h-[40vh] aspect-[4/5] rounded-2xl overflow-hidden border-2 border-[#6C1420] shadow-xl bg-white p-1.5 flex items-center justify-center">
                  <img src={coverPhoto} alt="Cover Photo" className="w-full h-full object-cover rounded-xl" />
                </div>
              ) : (
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                  className="flex justify-center items-center w-full h-full"
                >
                  <img
                    src={ASSETS.couple}
                    alt="Illustrated Couple"
                    className="max-h-[36vh] sm:max-h-[40vh] w-full max-w-[340px] sm:max-w-[360px] h-auto object-contain select-none pointer-events-none drop-shadow-md"
                  />
                </motion.div>
              )}
            </div>

            {/* Bottom: Guest Greeting & Button */}
            <div className="relative z-10 w-full max-w-[290px] space-y-2 pb-2 shrink-0 mx-auto">
              <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-neutral-300 p-2.5 shadow-sm space-y-0.5">
                <p className="font-gaegu font-bold text-xs text-neutral-600 uppercase tracking-wider">
                  Kepada Yth. Bapak/Ibu/Saudara/i:
                </p>
                <p className="font-gaegu font-bold text-2xl sm:text-3xl text-[#6C1420] tracking-wide truncate">
                  {formatHonorific(guestName)}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleOpenInvitation}
                className="w-full py-3 px-6 bg-[#6C1420] hover:bg-[#58111A] text-white rounded-full font-gaegu font-bold text-xl tracking-wider uppercase shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>BUKA UNDANGAN</span>
              </motion.button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* MAIN INVITATION STRIP (Scrollable after opening) */}
      <div className="relative max-w-md mx-auto px-4 py-6 space-y-6 sm:space-y-8 z-10">

        {/* SECTION 1: HERO / COUPLE (Exact Match to Gambar 3) */}
        <motion.section 
          key={isOpened ? "section1-opened" : "section1-closed"}
          initial="hidden"
          {...(!isOpened
            ? { animate: "hidden" }
            : { whileInView: "visible", viewport: { once: false, amount: 0.15 } }
          )}
          variants={{
            hidden: { opacity: 0, scale: 0.92 },
            visible: {
              opacity: 1,
              scale: 1,
              transition: { duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] },
            },
          }}
          className="text-center space-y-1 pt-1"
        >
          <motion.p 
            variants={{
              hidden: { opacity: 0, y: -8 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.15 } },
            }}
            className="font-beautylife text-2xl sm:text-3xl text-[#6C1420] leading-tight"
          >
            you are invited to our wedding
          </motion.p>

          <motion.div 
            variants={{
              hidden: { opacity: 0, scale: 0.6 },
              visible: { opacity: 1, scale: 1, transition: { duration: 0.45, delay: 0.2 } },
            }}
            className="flex justify-center py-0.5"
          >
            <img 
              src={ASSETS.bowRibbon} 
              alt="Bow Ribbon" 
              className="w-14 sm:w-16 h-auto object-contain select-none pointer-events-none drop-shadow-sm" 
            />
          </motion.div>

          {/* Couple Name: Annisa & Firman (Matching Comp_1.mp4 Staggered Character Easy Scale & Date & Place font size) */}
          <AnimatedCoupleName
            bride={brideNickname}
            groom={groomNickname}
            isOpened={isOpened}
            delayChildren={0.25}
            className="text-[#6C1420] w-full px-2 sm:px-4 my-1 select-none"
            brideSize="text-[130px] sm:text-[148px] md:text-[160px]"
            ampSize="text-[84px] sm:text-[96px] md:text-[104px]"
            groomSize="text-[130px] sm:text-[148px] md:text-[160px]"
            line2NegativeMargin="-mt-6 sm:-mt-8 md:-mt-10"
          />

          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] } },
            }}
            className="-mt-3 sm:-mt-4 flex justify-center"
          >
            <motion.img 
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut" }}
              src={ASSETS.couple} 
              alt="Illustrated Couple" 
              className="w-full max-w-[380px] sm:max-w-[400px] h-auto object-contain select-none pointer-events-none drop-shadow-md" 
            />
          </motion.div>
        </motion.section>

        {/* SECTION 2: DATE & PLACE (Easy Scale) */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.88 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-4 pt-1 sm:pt-2"
        >
          <p className="font-beautylife text-2xl sm:text-3xl text-[#6C1420] leading-tight">
            the details of our big day
          </p>

          <div className="flex justify-center">
            <AnimatedTitle
              type="datePlace"
              alt="DATE & PLACE"
              className="w-56 sm:w-64"
              fallbackSrc={ASSETS.titleDatePlace}
            />
          </div>

          <div className="space-y-4 pt-2">
            {/* Calendar with 02 in heart & February 2028 below */}
            <div className="relative w-48 sm:w-56 aspect-[1918/2258] mx-auto select-none">
              <img 
                src={ASSETS.calendarIcon} 
                alt="02 February 2028 Calendar" 
                className="w-full h-full object-contain pointer-events-none drop-shadow-sm" 
              />
              {/* Inside Heart: 02 */}
              <div className="absolute top-[49%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                <span className="font-beautylife text-4xl sm:text-5xl text-[#C82127] font-bold tracking-tight">
                  02
                </span>
              </div>
              {/* Under Heart: February 2028 */}
              <div className="absolute bottom-[16%] left-[50%] -translate-x-1/2 text-center pointer-events-none w-full">
                <span className="font-beautylife text-base sm:text-lg text-[#6C1420] block leading-tight tracking-wide">
                  February 2028
                </span>
              </div>
            </div>

            {/* Time & Venue in Erabura font */}
            <div className="flex items-center justify-center gap-6 pt-1">
              <div className="flex items-center gap-2">
                <img src={ASSETS.clockIcon} alt="Clock" className="w-5 sm:w-6 h-auto object-contain" />
                <span className="font-erabura text-2xl sm:text-3xl text-[#6C1420] tracking-wide">
                  {formattedTime}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <img src={ASSETS.pinIcon} alt="Pin" className="w-5 sm:w-6 h-auto object-contain" />
                <span className="font-erabura text-2xl sm:text-3xl text-[#6C1420] tracking-wide uppercase">
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
               onClick={(e) => { e.stopPropagation(); window.open(mapsUrl, "_blank", "noopener,noreferrer"); }} >
                <img src={ASSETS.openMapBtn} alt="Buka Google Maps" className="h-10 sm:h-12 w-auto object-contain drop-shadow-sm" />
              </motion.a>
            </div>

            {/* Countdown Timer */}
            <div className="pt-3 pb-1">
              <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-[320px] sm:max-w-sm mx-auto">
                {[
                  { label: "Days", value: timeLeft.days },
                  { label: "Hours", value: timeLeft.hours },
                  { label: "Minutes", value: timeLeft.minutes },
                  { label: "Seconds", value: timeLeft.seconds },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="flex flex-col items-center justify-center p-2 sm:p-2.5 bg-white/90 backdrop-blur-sm border-2 border-[#6C1420] rounded-2xl shadow-sm"
                  >
                    <div className="font-gaegu font-bold text-2xl sm:text-3xl text-[#6C1420] leading-none tabular-nums">
                      {String(item.value).padStart(2, "0")}
                    </div>
                    <div className="font-gaegu text-[11px] sm:text-xs font-bold text-[#6C1420]/75 uppercase tracking-wider mt-0.5">
                      {item.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* SECTION 3: OUR STORY (Milestones & Stories in Gaegu font, Center line as clean vector wavy line) */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.88 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-4 pt-4"
        >
          <p className="font-beautylife text-2xl sm:text-3xl text-[#6C1420] leading-tight px-4">
            a journey of a thousand miles begins with a single step.
          </p>

          <div className="flex justify-center">
            <AnimatedTitle
              type="ourStory"
              alt="OUR STORY"
              className="w-56 sm:w-64"
              fallbackSrc={ASSETS.titleOurStory}
            />
          </div>

          <div className="relative max-w-sm mx-auto pt-6 pb-2">
            {/* Center Wavy Serpentine Vector Line with Arrow */}
            <div className="absolute top-4 bottom-4 left-1/2 -translate-x-1/2 w-8 pointer-events-none z-0 flex justify-center">
              <svg 
                viewBox="0 0 32 600" 
                fill="none" 
                preserveAspectRatio="none" 
                className="w-full h-full stroke-[#6C1420] opacity-80"
              >
                <path 
                  d="M16,0 C28,80 4,160 16,240 C28,320 4,400 16,480 C24,530 16,570 16,588" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                />
                <polygon 
                  points="16,598 11,584 21,584" 
                  fill="#6C1420" 
                />
              </svg>
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
                          <h4 className="font-gaegu font-bold text-lg text-[#6C1420] leading-tight">
                            {item.title}
                          </h4>
                          <p className="font-gaegu text-sm text-[#6C1420] leading-relaxed">
                            {item.story || item.desc || item.description}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <img src={iconSrc} alt="Milestone Icon" className="w-14 h-14 object-contain" />
                          <span className="font-erabura text-3xl sm:text-4xl font-bold text-[#014F2E] block tracking-wide mt-1">
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
                          <h4 className="font-gaegu font-bold text-lg text-[#6C1420] leading-tight">
                            {item.title}
                          </h4>
                          <p className="font-gaegu text-sm text-[#6C1420] leading-relaxed">
                            {item.story || item.desc || item.description}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-start">
                          <img src={iconSrc} alt="Milestone Icon" className="w-14 h-14 object-contain" />
                          <span className="font-erabura text-3xl sm:text-4xl font-bold text-[#014F2E] block tracking-wide mt-1">
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

        {/* SECTION 4: DRESS CODE (Easy Scale) */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.88 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-4 pt-4"
        >
          <p className="font-beautylife text-lg sm:text-xl text-[#6C1420] leading-tight max-w-xs mx-auto px-2">
            to maintain the harmony of our wedding theme, we kindly request our guests to wear
          </p>

          <div className="flex justify-center">
            <AnimatedTitle
              type="dressCode"
              alt="DRESS CODE"
              className="w-56 sm:w-64"
              fallbackSrc={ASSETS.titleDressCode}
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
            <p className="font-brawford font-bold text-xl text-[#6C1420] tracking-wide">
              Monocrome
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="w-8 h-8 rounded-full bg-black shadow-md border border-neutral-700"></div>
              <div className="w-8 h-8 rounded-full bg-white shadow-md border border-neutral-300"></div>
            </div>
          </div>
        </motion.section>

        {/* SECTION 5: WEDDING GIFT (HankRnd Black for Cards & Gaegu for #Note, Easy Scale) */}
        {isCashlessEnabled && paymentAccounts.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, scale: 0.88 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center space-y-4 pt-4"
          >
            <p className="font-beautylife text-base sm:text-lg text-[#6C1420] leading-relaxed max-w-sm mx-auto px-4">
              your presence is the greatest gift of all. However, if you are unable to attend and would like to send us your wishes in the form of a gift, please use the account details below:
            </p>

            <div className="flex justify-center">
              <AnimatedTitle
                type="weddingGift"
                alt="WEDDING GIFT"
                className="w-64 sm:w-72"
                fallbackSrc={ASSETS.titleWeddingGift}
              />
            </div>

            <div className="space-y-4 max-w-[300px] sm:max-w-[320px] mx-auto pt-2">
              {paymentAccounts.map((acc: any, idx: number) => {
                const bankName = (acc.bank || acc.provider || acc.bank_name || "BCA").toUpperCase();
                const accNum = acc.account_number || "";
                const ownerName = acc.account_name || acc.owner_name || (idx === 0 ? brideName : groomName);
                const nick = acc.nickname || (idx === 0 ? brideName : groomName);

                return (
                  <motion.div 
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    className="bg-[#6C1420] text-white p-5 rounded-2xl shadow-lg relative text-left overflow-hidden border border-[#58111A]"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-hankrnd text-2xl tracking-wider text-[#F2F2F2]">{bankName}</span>
                      <div className="w-10 h-8 rounded-md bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 border border-amber-200/80 shadow-inner flex items-center justify-center opacity-95">
                        <div className="w-7 h-5 border border-amber-600/40 rounded grid grid-cols-2"></div>
                      </div>
                    </div>
                    <div className="mt-6 space-y-0.5">
                      <p className="font-hankrnd text-lg tracking-wider uppercase text-[#F2F2F2]">{ownerName}</p>
                      <p className="font-hankrnd text-xl tracking-widest text-[#F2F2F2]">{accNum}</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => copyToClipboard(accNum, `${bankName} ${nick}`)}
                      className="mt-3 w-full py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-gaegu font-bold tracking-wider uppercase transition-colors cursor-pointer"
                    >
                      SALIN REKENING
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Note in Gaegu font */}
            <div className="text-center font-gaegu text-[#C82127] space-y-0.5 pt-3 max-w-xs mx-auto">
              <p className="text-lg font-bold">#Note:</p>
              <p className="text-xs font-bold leading-snug">Before making Transfer/Shipment, please note:</p>
              <p className="text-xs font-bold leading-snug">- Bank Name, Recipient Name are already in accordance with the couple&apos;s names</p>
              <p className="text-xs font-bold leading-snug">- Confirm the gift shipment via personal chat to the couple</p>
            </div>
          </motion.section>
        )}

        {/* SECTION 6: UNIFIED RSVP & ATTENDANCE (Easy Scale) */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.88 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-4 pt-4"
        >
          <p className="font-beautylife text-2xl sm:text-3xl text-[#6C1420] leading-tight px-4">
            kindly let us know if you can join us
          </p>

          <div className="flex justify-center">
            <AnimatedTitle
              type="rsvp"
              alt="RSVP"
              className="w-56 sm:w-64"
              fallbackSrc={ASSETS.titleRsvp}
            />
          </div>

          {/* GAMBAR 1: RSVP Card with WILL YOU BE THERE inside & Banquet Dinner Table */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-[340px] sm:max-w-[380px] mx-auto select-none rounded-[28px] overflow-hidden bg-white/70 border border-[#6C1420]/25 shadow-xs pt-5 pb-0 mb-4"
          >
            {/* WILL YOU BE THERE? inside Gambar 1 */}
            <div className="text-center space-y-2.5 px-4 mb-2">
              <h3 className="font-gaegu text-[#6C1420] text-3xl font-bold tracking-wider">
                WILL YOU BE THERE?
              </h3>
              <div className="inline-flex flex-col items-start font-gaegu text-xl font-bold text-[#6C1420] space-y-2">
                <button 
                  type="button"
                  onClick={() => {
                    if (hasSubmittedRsvp) return;
                    setWillBeThere("yes");
                    setRsvpStatus("attending");
                  }}
                  disabled={hasSubmittedRsvp}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-5 h-5 rounded border-2 border-[#6C1420] flex items-center justify-center bg-white shadow-xs">
                    {willBeThere === "yes" && (
                      <span className="text-[#C82127] font-bold text-lg leading-none">✓</span>
                    )}
                  </div>
                  <span className="group-hover:opacity-80 transition-opacity">Yes!</span>
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    if (hasSubmittedRsvp) return;
                    setWillBeThere("no");
                    setRsvpStatus("not_attending");
                  }}
                  disabled={hasSubmittedRsvp}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-5 h-5 rounded border-2 border-[#6C1420] flex items-center justify-center bg-white shadow-xs">
                    {willBeThere === "no" && (
                      <span className="text-[#C82127] font-bold text-lg leading-none">✓</span>
                    )}
                  </div>
                  <span className="group-hover:opacity-80 transition-opacity">Sorry, cant make it</span>
                </button>
              </div>
            </div>

            {/* Banquet Dinner Table (10-24.png) as the base illustration of Gambar 1 */}
            <div className="w-full flex justify-center px-1">
              <img 
                src={ASSETS.tableBanquet} 
                alt="Banquet Dinner Table" 
                className="w-full h-auto object-contain pointer-events-none drop-shadow-xs" 
              />
            </div>
          </motion.div>

          {hasSubmittedRsvp ? (
            <div className="bg-white/95 border-2 border-[#6C1420] rounded-3xl p-6 shadow-sm max-w-sm mx-auto text-center space-y-3.5 my-2">
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
              {/* Field 1: Guest Identity */}
              <div>
                <label className="block text-base font-gaegu font-bold text-[#6C1420] mb-1 ml-2">
                  Guest Identity
                </label>
                <div className="relative w-full h-[52px] flex items-center">
                  <img src={ASSETS.inputBorder} alt="" className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none" />
                  <input
                    type="text"
                    required
                    value={isGuestLocked ? guestName : rsvpName}
                    onChange={(e) => {
                      if (!isGuestLocked) setRsvpName(e.target.value);
                    }}
                    readOnly={isGuestLocked}
                    placeholder="Guest Name"
                    className="relative z-10 w-full h-full bg-transparent px-6 font-gaegu font-bold text-base text-[#6C1420] placeholder:text-[#5B5B5B] focus:outline-none"
                  />
                </div>
              </div>

              {/* Field 2: Email Address */}
              <div>
                <label className="block text-base font-gaegu font-bold text-[#6C1420] mb-1 ml-2">
                  Email Address
                </label>
                <div className="relative w-full h-[52px] flex items-center">
                  <img src={ASSETS.inputBorder} alt="" className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none" />
                  <input
                    type="email"
                    value={rsvpEmail}
                    onChange={(e) => setRsvpEmail(e.target.value)}
                    placeholder="To Receive your digital invitation"
                    className="relative z-10 w-full h-full bg-transparent px-6 font-gaegu font-bold text-base text-[#6C1420] placeholder:text-[#5B5B5B] focus:outline-none"
                  />
                </div>
              </div>

              {/* Field 3: WhatsApp Number */}
              <div>
                <label className="block text-base font-gaegu font-bold text-[#6C1420] mb-1 ml-2">
                  WhatsApp Number
                </label>
                <div className="relative w-full h-[52px] flex items-center">
                  <img src={ASSETS.inputBorder} alt="" className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none" />
                  <input
                    type="tel"
                    value={rsvpPhone}
                    onChange={(e) => setRsvpPhone(e.target.value)}
                    placeholder="Example: 081955562"
                    className="relative z-10 w-full h-full bg-transparent px-6 font-gaegu font-bold text-base text-[#6C1420] placeholder:text-[#5B5B5B] focus:outline-none"
                  />
                </div>
              </div>

              {/* Field 4: Confirmation */}
              <div>
                <label className="block text-base font-gaegu font-bold text-[#6C1420] mb-1 ml-2">
                  Confirmation
                </label>
                <div className="relative w-full h-[52px] flex items-center">
                  <img src={ASSETS.inputBorder} alt="" className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none" />
                  <select
                    value={rsvpStatus}
                    onChange={(e) => {
                      setRsvpStatus(e.target.value);
                      setWillBeThere(e.target.value === "attending" ? "yes" : "no");
                    }}
                    className="relative z-10 w-full h-full bg-transparent appearance-none pl-6 pr-10 font-gaegu text-base font-bold text-[#6C1420] focus:outline-none cursor-pointer"
                  >
                    <option value="attending" className="bg-white text-neutral-900 font-gaegu">Hadir (Attend)</option>
                    <option value="not_attending" className="bg-white text-neutral-900 font-gaegu">Tidak Hadir (Decline)</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#6C1420] text-xs font-bold">
                    ▼
                  </div>
                </div>
              </div>

              {/* Field 5: Total Persons */}
              <div>
                <label className="block text-base font-gaegu font-bold text-[#6C1420] mb-1 ml-2">
                  Total Persons
                </label>
                <div className="relative w-full h-[52px] flex items-center justify-between px-6">
                  <img src={ASSETS.inputBorder} alt="" className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none" />
                  <button
                    type="button"
                    onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                    className="relative z-10 w-8 h-8 rounded-full text-2xl font-bold font-gaegu text-[#6C1420] hover:bg-[#6C1420]/10 flex items-center justify-center transition-colors cursor-pointer select-none"
                  >
                    -
                  </button>
                  <span className="relative z-10 font-gaegu font-bold text-lg text-[#6C1420] tracking-wider select-none">
                    {guestCount} {guestCount > 1 ? "GUESTS" : "GUEST"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGuestCount(Math.min(10, guestCount + 1))}
                    className="relative z-10 w-8 h-8 rounded-full text-2xl font-bold font-gaegu text-[#6C1420] hover:bg-[#6C1420]/10 flex items-center justify-center transition-colors cursor-pointer select-none"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Submit Button using Asset 10-21.png */}
              <div className="pt-3 flex justify-center">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={rsvpSubmitting}
                  className="relative w-full max-w-[320px] mx-auto h-[52px] block transition-transform cursor-pointer drop-shadow-md disabled:opacity-60"
                >
                  <img src={ASSETS.btnConfirmPresence} alt="CONFIRM PRESENCE" className="w-full h-full object-contain" />
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

        {/* SECTION 7: BLESSINGS & ATTENDANCE (Easy Scale) */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.88 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-4 pt-4"
        >
          <p className="font-beautylife text-2xl sm:text-3xl text-[#6C1420] leading-tight px-4">
            leave your warmest words for the beginning of our new chapter.
          </p>

          <div className="flex justify-center">
            <AnimatedTitle
              type="blessings"
              alt="BLESSINGS"
              className="w-60 sm:w-68"
              fallbackSrc={ASSETS.titleBlessings}
            />
          </div>

          <form onSubmit={handleWishSubmit} className="space-y-4 pt-2 text-left max-w-sm mx-auto">
            {/* Name Input */}
            <div>
              <label className="block text-base font-gaegu font-bold text-[#6C1420] mb-1 ml-2">
                Name
              </label>
              <div className="relative w-full h-[52px] flex items-center">
                <img src={ASSETS.inputBorder} alt="" className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none" />
                <input
                  type="text"
                  required
                  value={wishName}
                  onChange={(e) => setWishName(e.target.value)}
                  placeholder="Your Name"
                  className="relative z-10 w-full h-full bg-transparent px-6 font-gaegu font-bold text-base text-[#6C1420] placeholder:text-[#5B5B5B] focus:outline-none"
                />
              </div>
            </div>

            {/* Prayers & Wishes inside Speech Bubble 10-23.png */}
            <div>
              <label className="block text-base font-gaegu font-bold text-[#6C1420] mb-1 ml-2">
                Prayers &amp; Wishes
              </label>
              <div className="relative w-full max-w-[340px] mx-auto aspect-[4437/2717] flex items-center justify-center p-6">
                <img src={ASSETS.bubbleContainer} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none" />
                <textarea
                  required
                  value={wishMessage}
                  onChange={(e) => setWishMessage(e.target.value)}
                  placeholder="Write your warmest wishes for the bride & groom..."
                  className="relative z-10 w-[82%] h-[68%] bg-transparent font-gaegu text-base text-[#6C1420] placeholder:text-[#6C1420]/50 focus:outline-none resize-none leading-relaxed text-center flex items-center justify-center pt-4"
                />
              </div>
            </div>

            {/* Submit Button using Asset 10-22.png */}
            <div className="pt-2 flex justify-center">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={wishSubmitting}
                className="relative w-full max-w-[320px] mx-auto h-[52px] block transition-transform cursor-pointer drop-shadow-md disabled:opacity-60"
              >
                <img src={ASSETS.btnSubmitBlessing} alt="SUBMIT BLESSING" className="w-full h-full object-contain" />
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
              <motion.span 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="font-gaegu text-base font-bold text-[#6C1420] uppercase tracking-widest inline-block"
              >
                Wishes Wall ({wishesList.length})
              </motion.span>
              <span className="text-[#6C1420] font-bold text-sm">♥ with love</span>
            </div>

            <div className="space-y-3.5 max-h-[460px] overflow-y-auto p-1.5 pb-6 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">
              {wishesList.map((w, idx) => (
                <div
                  key={w.id || idx}
                  className="bg-white/90 border-2 border-[#6C1420]/25 rounded-2xl p-4 shadow-sm relative transition-all"
                >
                  <h5 className="font-gaegu font-bold text-base text-[#6C1420] mb-0.5">
                    {w.name}
                  </h5>
                  <p className="font-gaegu text-sm text-[#6C1420]/80 leading-relaxed">
                    {w.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* FOOTER */}
        <footer className="text-center space-y-2 pt-6 pb-6 border-t border-[#6C1420]/20">
          <p className="text-[#6C1420] font-bold">
            <span className="font-brawford text-3xl">{brideNickname}</span>
            <span className="font-brawford text-xl mx-2 font-normal">&amp;</span>
            <span className="font-brawford text-3xl">{groomNickname}</span>
          </p>
          <p className="font-gaegu text-sm text-[#6C1420]/70 tracking-wider">
            Thank you for being part of our special love story.
          </p>
          <div className="pt-1">
            <a 
              href="https://www.serastory.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-gaegu font-bold text-[#6C1420]/50 hover:text-[#6C1420] transition-colors uppercase tracking-widest"
            >
              Crafted with ♥ by SERA STORY
            </a>
          </div>
        </footer>

      </div>
    </div>
  );
}
