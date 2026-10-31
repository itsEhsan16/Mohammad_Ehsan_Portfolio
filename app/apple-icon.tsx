import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0B0B0A" }}>
        <svg width="132" height="132" viewBox="0 0 64 64">
          <path d="M14 46V18l9 16 9-16v28" fill="none" stroke="#EDEAE4" strokeWidth="6" strokeLinejoin="miter" strokeLinecap="square" />
          <rect x="38" y="40" width="13" height="6" fill="#FF4D00" />
        </svg>
      </div>
    ),
    size,
  );
}
