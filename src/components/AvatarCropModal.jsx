// ── src/components/AvatarCropModal.jsx ───────────────────────────
import { useState, useRef, useEffect, useCallback } from "react";
import { C } from "./ui";

const CROP_SIZE = 200;
const MIN_CROP  = 60;

export default function AvatarCropModal({ imageSrc, onConfirm, onCancel }) {
  const canvasRef  = useRef();
  const imgRef     = useRef(new Image());
  const dragging   = useRef(false);
  const resizing   = useRef(false);
  const dragStart  = useRef({ x: 0, y: 0 });

  const [imgLoaded,   setImgLoaded]   = useState(false);
  const [cropCircle,  setCropCircle]  = useState({ x: 0, y: 0, r: 100 });
  const [naturalSize, setNaturalSize] = useState({ w: 1, h: 1 });
  const [canvasSize,  setCanvasSize]  = useState({ w: 480, h: 480 });
  const [offsetY,     setOffsetY]     = useState(0);
  const [processing,  setProcessing]  = useState(false);

  // ── Load image ────────────────────────────────────────────────
  useEffect(() => {
    const img = imgRef.current;
    img.onload = () => {
      const maxW = Math.min(window.innerWidth - 80, 480);
      const maxH = Math.min(window.innerHeight - 280, 480);

      // Scale based on width
      const ratio = maxW / img.naturalWidth;
      const w     = Math.round(img.naturalWidth  * ratio);
      const h     = Math.round(img.naturalHeight * ratio);

      // Canvas height = min of scaled height and maxH
      const canvasH = Math.min(h, maxH);
      // Center image vertically inside canvas
      const dy = Math.round((canvasH - h) / 2);

      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      setCanvasSize({ w, h: canvasH });
      setOffsetY(dy);

      const r = Math.round(Math.min(w, canvasH) * 0.42);
      setCropCircle({ x: Math.round(w / 2), y: Math.round(canvasH / 2), r });
      setImgLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // ── Draw ──────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgLoaded) return;
    const ctx = canvas.getContext("2d");
    const { w, h } = canvasSize;
    const { x, y, r } = cropCircle;
    const img = imgRef.current;

    // Image dimensions in canvas space
    const dw = w;
    const dh = Math.round(naturalSize.h * (w / naturalSize.w));
    const dx = 0;
    const dy = offsetY;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, w, h);

    // Draw full image
    ctx.drawImage(img, dx, dy, dw, dh);

    // Dim outside circle
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Redraw image inside circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();

    // Circle border
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth   = 2.5;
    ctx.stroke();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.restore();

    // Resize handle
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

  }, [imgLoaded, cropCircle, canvasSize, offsetY, naturalSize]);

  useEffect(() => { draw(); }, [draw]);

  // ── Clamp — keep circle within image bounds ───────────────────
  const imgH = Math.round(naturalSize.h * (canvasSize.w / naturalSize.w));
  const clampCircle = useCallback((x, y, r) => {
    const { w } = canvasSize;
    const imgTop    = offsetY;
    const imgBottom = offsetY + imgH;
    return {
      x: Math.max(r, Math.min(w - r, x)),
      y: Math.max(imgTop + r, Math.min(imgBottom - r, y)),
      r,
    };
  }, [canvasSize, offsetY, imgH]);

  // ── Mouse/touch helpers ───────────────────────────────────────
  const getHandlePos = (cc) => ({
    hx: cc.x + cc.r * Math.cos(Math.PI * 0.25),
    hy: cc.y + cc.r * Math.sin(Math.PI * 0.25),
  });

  const getPos = (e, canvas) => {
    const rect    = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

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
      dragging.current  = true;
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
      setCropCircle(cc => clampCircle(nx, ny, cc.r));
    } else if (resizing.current) {
      setCropCircle(cc => {
        const newR = Math.max(MIN_CROP / 2, Math.min(
          Math.min(w, imgH) / 2 - 2,
          Math.hypot(pos.x - cc.x, pos.y - cc.y)
        ));
        return clampCircle(cc.x, cc.y, newR);
      });
    } else {
      const { hx, hy } = getHandlePos(cropCircle);
      const dHandle = Math.hypot(pos.x - hx, pos.y - hy);
      const dCenter = Math.hypot(pos.x - cropCircle.x, pos.y - cropCircle.y);
      canvas.style.cursor = dHandle < 14 ? "se-resize" : dCenter < cropCircle.r ? "move" : "default";
    }
  }, [canvasSize, cropCircle, clampCircle, imgH]);

  const onMouseUp = useCallback(() => {
    dragging.current = false;
    resizing.current = false;
  }, []);

  // ── Crop and upload ───────────────────────────────────────────
  const handleConfirm = useCallback(async () => {
    setProcessing(true);
    try {
      const { x, y, r } = cropCircle;
      const { w }        = canvasSize;
      const nat          = naturalSize;

      // Scale factors relative to displayed image
      const displayedImgH = Math.round(nat.h * (w / nat.w));
      const scaleX = nat.w / w;
      const scaleY = nat.h / displayedImgH;

      // Subtract offsetY to get coord relative to image top
      const srcX = Math.round(Math.max(0, (x - r)         * scaleX));
      const srcY = Math.round(Math.max(0, (y - r - offsetY) * scaleY));
      const srcW = Math.round(Math.min(nat.w - srcX, r * 2 * scaleX));
      const srcH = Math.round(Math.min(nat.h - srcY, r * 2 * scaleY));

      const out = document.createElement("canvas");
      out.width  = CROP_SIZE;
      out.height = CROP_SIZE;
      const ctx  = out.getContext("2d");

      // Circular clip
      ctx.beginPath();
      ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(imgRef.current, srcX, srcY, srcW, srcH, 0, 0, CROP_SIZE, CROP_SIZE);

      out.toBlob(blob => onConfirm(blob), "image/jpeg", 0.85);
    } catch (err) {
      console.error("Crop error:", err);
      setProcessing(false);
    }
  }, [cropCircle, canvasSize, naturalSize, offsetY, onConfirm]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(10,37,64,0.75)",
      zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(3px)",
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{
        background: C.white, borderRadius: 18, overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)", animation: "fadeIn 0.25s ease",
        maxWidth: "calc(100vw - 40px)",
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
        <div style={{ background: "#1e293b", lineHeight: 0 }}>
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
            <div style={{ width: 480, height: 480, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ color: "#fff", fontSize: 14 }}>Loading image...</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${C.gray100}` }}>
          <div style={{ fontSize: 12, color: C.gray400 }}>Output: 200×200px JPEG · Circular crop</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onCancel} style={{
              padding: "10px 20px", borderRadius: 9, border: `1.5px solid ${C.gray200}`,
              background: C.white, color: C.gray400, fontWeight: 600, fontSize: 14,
              cursor: "pointer", fontFamily: "inherit",
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
