import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { ASSETS } from "../../../lib/assets";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let groom = searchParams.get("g") || "";
    let bride = searchParams.get("b") || "";
    let groomFull = searchParams.get("gf") || "";
    let brideFull = searchParams.get("bf") || "";
    let date = searchParams.get("d") || "";
    let venue = searchParams.get("v") || "";
    const guest = searchParams.get("to") || searchParams.get("guest") || "";

    if (!bride || !groom) {
      try {
        const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '84ea6217-b9ed-4ce2-baca-e14b30086d98';
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sdnuzcdcaxuydoyocqgj.supabase.co';
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_CakDY3TRcwAUw8FvXBynkw_PaeoCuGW';
        const res = await fetch(`${supabaseUrl}/rest/v1/wedding_details?project_id=eq.${projectId}&select=*`, {
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`
          }
        });
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const w = rows[0];
          groom = groom || w.groom_nickname || "Andre";
          bride = bride || w.bride_nickname || "Melia";
          groomFull = groomFull || w.groom_name || "";
          brideFull = brideFull || w.bride_name || "";
          if (!date && w.wedding_date) {
            const parts = w.wedding_date.split('-');
            if (parts.length === 3) date = `${parts[2]} . ${parts[1]} . ${parts[0]}`;
          }
          venue = venue || w.venue_name || "";
        }
      } catch (err) {
        console.error("Supabase fetch in OG route error:", err);
      }
    }

    groom = groom || "Andre";
    bride = bride || "Melia";
    date = date || "06 . 12 . 2026";

    const coupleImg = ASSETS.couple || "https://cdn.serastory.com/undangan/templates/illustrated-love-story-10/10-02.png";
    const ribbonImg = ASSETS.bowRibbon || "https://cdn.serastory.com/undangan/templates/illustrated-love-story-10/10-06.png";

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            backgroundColor: "#FFFDF3",
            padding: "40px 60px",
            fontFamily: "sans-serif",
            position: "relative",
          }}
        >
          {/* Outer elegant border frame */}
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 20,
              right: 20,
              bottom: 20,
              border: "3px solid #6C1420",
              borderRadius: 28,
            }}
          />

          {/* Left: Illustrated Couple Card */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 440,
              height: 520,
              backgroundColor: "#FFFFFF",
              borderRadius: 32,
              border: "2.5px solid #6C1420",
              boxShadow: "0 16px 40px rgba(108, 20, 32, 0.12)",
              padding: "24px 20px",
            }}
          >
            {/* Header text on card */}
            <div
              style={{
                fontSize: 16,
                color: "#6C1420",
                fontWeight: 600,
                letterSpacing: "0.08em",
                marginBottom: 6,
              }}
            >
              you are invited to our wedding
            </div>

            {/* Bow ribbon */}
            {ribbonImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ribbonImg}
                alt="Ribbon"
                style={{
                  width: 52,
                  height: 38,
                  objectFit: "contain",
                  marginBottom: 8,
                }}
              />
            ) : null}

            {/* Couple Illustration */}
            {coupleImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coupleImg}
                alt="Couple Illustration"
                style={{
                  width: 380,
                  height: 340,
                  objectFit: "contain",
                }}
              />
            ) : null}

            {/* Small button inside card */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#6C1420",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 700,
                padding: "8px 24px",
                borderRadius: 20,
                letterSpacing: "0.05em",
                marginTop: 6,
              }}
            >
              BUKA UNDANGAN
            </div>
          </div>

          {/* Right: Personal Couple & Invitation Details */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
              flex: 1,
              paddingLeft: 50,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: 15,
                letterSpacing: "0.25em",
                color: "#6C1420",
                fontWeight: 700,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              THE WEDDING INVITATION OF
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                fontSize: 62,
                fontWeight: 800,
                color: "#6C1420",
                lineHeight: 1.1,
                marginBottom: 10,
              }}
            >
              {bride} & {groom}
            </div>

            {brideFull && groomFull ? (
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#6C1420",
                  opacity: 0.85,
                  marginBottom: 16,
                }}
              >
                {brideFull} & {groomFull}
              </div>
            ) : null}

            <div
              style={{
                width: 140,
                height: 3,
                backgroundColor: "#6C1420",
                marginBottom: 18,
                borderRadius: 2,
              }}
            />

            {/* Date & Venue */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#014F2E",
                }}
              >
                🗓 {date}
              </div>
              {venue ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: 18,
                    fontWeight: 600,
                    color: "#6C1420",
                    opacity: 0.9,
                    maxWidth: 520,
                  }}
                >
                  📍 {venue}
                </div>
              ) : null}
            </div>

            {/* Guest personalization badge if provided */}
            {guest ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                  border: "1.5px solid #6C1420",
                  borderRadius: 16,
                  padding: "8px 20px",
                  marginBottom: 18,
                  boxShadow: "0 4px 12px rgba(108, 20, 32, 0.08)",
                }}
              >
                <span style={{ fontSize: 13, color: "#6C1420", opacity: 0.75, marginRight: 8 }}>
                  Kepada Yth:
                </span>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#6C1420" }}>
                  {guest}
                </span>
              </div>
            ) : null}

            {/* Large CTA Button */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#6C1420",
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: 700,
                padding: "12px 32px",
                borderRadius: 50,
                letterSpacing: "0.08em",
                boxShadow: "0 6px 16px rgba(108, 20, 32, 0.2)",
              }}
            >
              BUKA UNDANGAN DIGITAL
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("OG image generation failed:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
