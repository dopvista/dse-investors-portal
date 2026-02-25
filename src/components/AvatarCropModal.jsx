// ── src/components/AvatarCropModal.jsx ───────────────────────────
import { useState, useRef, useEffect, useCallback } from "react";
import { C } from "./ui";

const CROP_SIZE = 200; // final output px
const MIN_CROP  = 80;  // minimum crop circle diameter on screen

export default function AvatarCropModal({ imageSrc, onConfirm, onCancel }) {
  const canvasRef    = useRef();
  const imgRef       = useRef(new Image());
  const dragging     = useRef(false);
  const resizing     = useRef(false);
  const dragStart    = useRef({ x: 0, y: 0 });

  const [imgLoaded,  setImgLoaded]  = useState(false);
  const [cropCircle, setCropCircle] = useState({ x: 0, y: 0, r: 100 }); // screen coords
  const [naturalSize, setNaturalSize] = useState({ w: 1, h: 1 });
  const [canvasSize,  setCanvasSize]  = useState({ w: 500, h: 380 });
  const [processing, setProcessing]  = useState(false);

  // ── Load image and set canvas dimensions ─────────────────────
  useEffect(() => {
    const img = imgRef.current;
    img.onload = () => {
      // Fixed square canvas — image always centered inside it
      const size = Math.min(window.innerWidth - 80, window.innerHeight - 280, 480);
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      setCanvasSize({ w: size, h: size });
      const r = Math.round(size * 0.42);
      setCropCircle({ x: Math.round(size / 2), y: Math.round(size / 2), r });
      setImgLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // ── Draw canvas ───────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgLoaded) return;
    const ctx = canvas.getContext("2d");
    const { w, h } = canvasSize;
    const { x, y, r } = cropCircle;

    ctx.clearRect(0, 0, w, h);

    // Draw image centered in square canvas (contain — equal space on all sides)
    const img = imgRef.current;
    const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
    const dw = Math.round(img.naturalWidth  * scale);
    const dh = Math.round(img.naturalHeight * scale);
    const dx = Math.round((w - dw) / 2);
    const dy = Math.round((h - dh) / 2);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, dx, dy, dw, dh);

    // Dim everything outside the circle
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, w, h);
    // Cut out circle (clear the circle)
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Redraw image inside circle only (same centered position)
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, dx, dy, dw, dh);
    ctx.restore();

    // Circle border
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth   = 2.5;
    ctx.stroke();
    // Dashed inner ring
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.restore();

    // Resize handle — bottom-right of circle
    const hx = x + r * Math.cos(Math.PI * 0.25);
    const hy = y + r * Math.sin(Math.PI * 0.25);
    ctx.save();
    ctx.beginPath();
    ctx.arc(hx, hy, 8, 0, Math.PI * 2);
    ctx.fillStyle   = C.green;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth   = 2;
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Center crosshair (subtle)
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth   = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x + 12, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x, y + 12); ctx.stroke();
    ctx.restore();

  }, [imgLoaded, cropCircle, canvasSize]);

  useEffect(() => { draw(); }, [draw]);

  // ── Mouse helpers ─────────────────────────────────────────────
  const getHandlePos = (cc) => ({
    hx: cc.x + cc.r * Math.cos(Math.PI * 0.25),
    hy: cc.y + cc.r * Math.sin(Math.PI * 0.25),
  });

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const clampCircle = (x, y, r, w, h) => ({
    x: Math.max(r, Math.min(w - r, x)),
    y: Math.max(r, Math.min(h - r, y)),
    r,
  });

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const pos    = getPos(e, canvas);
    const { hx, hy } = getHandlePos(cropCircle);
    const dHandle = Math.hypot(pos.x - hx, pos.y - hy);
    const dCenter = Math.hypot(pos.x - cropCircle.x, pos.y - cropCircle.y);

    if (dHandle < 14) {
      resizing.current = true;
    } else if (dCenter < cropCircle.r) {
      dragging.current = true;
      dragStart.current = { x: pos.x - cropCircle.x, y: pos.y - cropCircle.y };
    }
  }, [cropCircle]);

  const onMouseMove = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getPos(e, canvas);
    const { w, h } = canvasSize;

    if (dragging.current) {
      const nx = pos.x - dragStart.current.x;
      const ny = pos.y - dragStart.current.y;
      setCropCircle(cc => clampCircle(nx, ny, cc.r, w, h));
    } else if (resizing.current) {
      setCropCircle(cc => {
        const newR = Math.max(MIN_CROP / 2, Math.min(
          Math.min(w, h) / 2 - 2,
          Math.hypot(pos.x - cc.x, pos.y - cc.y)
        ));
        return clampCircle(cc.x, cc.y, newR, w, h);
      });
    } else {
      // Change cursor
      const { hx, hy } = getHandlePos(cropCircle);
      const dHandle = Math.hypot(pos.x - hx, pos.y - hy);
      const dCenter = Math.hypot(pos.x - cropCircle.x, pos.y - cropCircle.y);
      canvas.style.cursor = dHandle < 14 ? "se-resize" : dCenter < cropCircle.r ? "move" : "default";
    }
  }, [canvasSize, cropCircle]);

  const onMouseUp = useCallback(() => {
    dragging.current  = false;
    resizing.current  = false;
  }, []);

  // ── Crop and output ───────────────────────────────────────────
  const handleConfirm = useCallback(async () => {
    setProcessing(true);
    try {
      const { x, y, r } = cropCircle;
      const { w, h }     = canvasSize;
      const nat          = naturalSize;

      // Recalculate image position in canvas (same contain logic as draw)
      const scale = Math.min(w / nat.w, h / nat.h);
      const dw    = Math.round(nat.w * scale);
      const dh    = Math.round(nat.h * scale);
      const dx    = Math.round((w - dw) / 2);
      const dy    = Math.round((h - dh) / 2);
      const scaleX = nat.w / dw;
      const scaleY = nat.h / dh;
      // Map crop circle back to natural image coords, subtract canvas offset
      const srcX = Math.round(Math.max(0, (x - r - dx) * scaleX));
      const srcY = Math.round(Math.max(0, (y - r - dy) * scaleY));
      const srcW = Math.round(Math.min(nat.w - srcX, r * 2 * scaleX));
      const srcH = Math.round(Math.min(nat.h - srcY, r * 2 * scaleY));

      // Draw to 200×200 output canvas (circular clip)
      const out = document.createElement("canvas");
      out.width  = CROP_SIZE;
      out.height = CROP_SIZE;
      const ctx  = out.getContext("2d");

      // Circular clip
      ctx.beginPath();
      ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
      ctx.clip();

      ctx.drawImage(imgRef.current, srcX, srcY, srcW, srcH, 0, 0, CROP_SIZE, CROP_SIZE);

      // Convert to JPEG blob (quality 0.85 — typically 10–25KB)
      out.toBlob(blob => onConfirm(blob), "image/jpeg", 0.85);
    } catch (err) {
      console.error("Crop error:", err);
      setProcessing(false);
    }
  }, [cropCircle, canvasSize, naturalSize, onConfirm]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(10,37,64,0.72)",
      zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(3px)",
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{
        background: C.white, borderRadius: 18, overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        animation: "fadeIn 0.25s ease", maxWidth: "calc(100vw - 40px)",
      }}>
        {/* Header */}
        <div style={{ background: C.navy, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: C.white, fontWeight: 800, fontSize: 16 }}>Crop Profile Picture</div>
            <div style={{ color: C.gold, fontSize: 12, marginTop: 2, fontWeight: 500 }}>
              Drag to reposition · Drag the green handle to resize
            </div>
          </div>
          <button onClick={onCancel} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: C.white, width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {/* Canvas */}
        <div style={{ background: "#111", lineHeight: 0 }}>
          {imgLoaded ? (
            <canvas
              ref={canvasRef}
              width={canvasSize.w}
              height={canvasSize.h}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onTouchStart={onMouseDown}
              onTouchMove={onMouseMove}
              onTouchEnd={onMouseUp}
              style={{ display: "block", touchAction: "none" }}
            />
          ) : (
            <div style={{ width: 400, height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ color: "#fff", fontSize: 14 }}>Loading image...</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${C.gray100}` }}>
          <div style={{ fontSize: 12, color: C.gray400 }}>
            Output: 200×200px JPEG · Circular crop
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onCancel} style={{
              padding: "10px 20px", borderRadius: 9, border: `1.5px solid ${C.gray200}`,
              background: C.white, color: C.gray400, fontWeight: 600, fontSize: 14,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.gray200; e.currentTarget.style.color = C.gray400; }}>
              Cancel
            </button>
            <button onClick={handleConfirm} disabled={!imgLoaded || processing} style={{
              padding: "10px 24px", borderRadius: 9, border: "none",
              background: !imgLoaded || processing ? C.gray200 : C.green,
              color: C.white, fontWeight: 700, fontSize: 14,
              cursor: !imgLoaded || processing ? "not-allowed" : "pointer",
              fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8,
              boxShadow: !imgLoaded || processing ? "none" : `0 4px 12px ${C.green}44`,
            }}>
              {processing ? (
                <>
                  <div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Processing...
                </>
              ) : "✓ Crop & Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
