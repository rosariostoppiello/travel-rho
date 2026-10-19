import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// Un sello simple: círculo de tinta con una "b" en serif.
export function mark(px: number) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f3eee4",
      }}
    >
      <div
        style={{
          width: px * 0.72,
          height: px * 0.72,
          borderRadius: "50%",
          background: "#24453b",
          color: "#f3eee4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: px * 0.46,
          fontFamily: "serif",
          fontStyle: "italic",
          paddingBottom: px * 0.05,
        }}
      >
        b
      </div>
    </div>
  );
}

export default function Icon() {
  return new ImageResponse(mark(512), size);
}
