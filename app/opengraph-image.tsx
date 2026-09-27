import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ClipDrop — Temporary File & Text Transit";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#090d16",
        padding: "64px 80px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
      }}
    >
      {/* Ambient background glow */}
      <div
        style={{
          position: "absolute",
          top: "-150px",
          right: "-150px",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
        }}
      />

      {/* Brand Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        {/* Logo icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            backgroundColor: "#6366f1",
            color: "#ffffff",
          }}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v10" />
            <path d="m7 7 5 5 5-5" />
            <rect width="20" height="8" x="2" y="14" rx="2" />
          </svg>
        </div>

        <span
          style={{
            fontSize: "28px",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "#f8fafc",
          }}
        >
          ClipDrop
        </span>

        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: "4px 10px",
            borderRadius: "9999px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "#94a3b8",
          }}
        >
          Transit
        </span>
      </div>

      {/* Hero Title & Subtitle */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxWidth: "960px",
        }}
      >
        <div
          style={{
            fontSize: "56px",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            color: "#ffffff",
            lineHeight: 1.15,
          }}
        >
          Temporary File &amp; Text Transit
        </div>

        <div
          style={{
            fontSize: "22px",
            color: "#94a3b8",
            lineHeight: 1.5,
            fontWeight: 400,
          }}
        >
          Transfer documents, notes, code snippets, and clipboard data across
          devices with automatic expiration and download limits.
        </div>
      </div>

      {/* Feature Badges Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          paddingTop: "24px",
        }}
      >
        {[
          "Auto-Expiring Shares",
          "Optional Passwords",
          "Download Limits",
          "Cross-Device Relay",
        ].map((tag) => (
          <div
            key={tag}
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#cbd5e1",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              padding: "8px 16px",
            }}
          >
            {tag}
          </div>
        ))}
      </div>
    </div>,
    {
      ...size,
    },
  );
}
