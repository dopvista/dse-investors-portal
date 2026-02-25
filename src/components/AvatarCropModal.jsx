// ── src/components/AvatarCropModal.jsx ───────────────────────────
import { useState, useRef, useEffect, useCallback } from "react";
import { C } from "./ui";

const CANVAS_SIZE = 420;
const CROP_SIZE   = 200;
const MIN_CROP    = 80;

export default function AvatarCropModal({ imageSrc, onConfirm, onCancel }) {
  const canvasRef       = useRef();
  const imgRef          = useRef(new Image());
  const dragging        = useRef(false);
  const resizing        = useRef(false);
  const dragStart       = useRef({ x: 0, y: 0 });
  const lastPinchDist   = useRef(null);

  const [imgLoaded,   setImgLoaded]   = useState(false);
  const [cropCircle,  setCropCircle]  = useState({ x: 210, y: 210, r: 100 });
  const [naturalSize, setNaturalSize] = useState({ w: 1, h: 1 });
  const [zoom,        setZoom]        = useState(1);
  const [layout,      setLayout]      = useState({ drawX: 0, drawY: 0, drawW: 0, drawH: 0, baseScale: 1 });
  const [processing,  setProcessing]  = useState(false);

  // ── Load image ────────────────────────────────────────────────
  useEffect(() => {
    const img = imgRef.current;
    img.onload = () => {
      const baseScale = Math.min(CANVAS_SIZE / img.naturalWidth, CANVAS_SIZE / img.naturalHeight);
      const drawW = img.naturalWidth  * baseScale;
      const drawH = img.naturalHeight * baseScale;
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      setLayout({
        drawX: (CANVAS_SIZE - drawW) / 2,
        drawY: (CANVAS_SIZE - drawH) / 2,
        drawW, drawH, baseScale,
      });
      const r = Math.round(Math.min(drawW, drawH) * 0.4);
      setCropCircle({ x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2, r });
      setImgLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // ── Dynamic zoomed dimensions ─────────────────────────────────
  const currentScale = layout.baseScale * zoom;
  const currentW     = naturalSize.w * currentScale;
  const currentH     = naturalSize.h * currentScale;
  const currentX     = (CANVAS_SIZE - currentW) / 2;
  const currentY     = (CANVAS_SIZE - currentH) / 2;

  // ── Clamp circle within image bounds ─────────────────────────
  const clampCircle = useCallback((nx, ny, nr) => {
    const maxR = Math.min(currentW, currentH) / 2;
    const safeR = Math.min(Math.max(nr, MIN_CROP / 2), maxR);
    return {
      x: Math.max(currentX + safeR, Math.min(currentX + currentW - safeR, nx)),
      y: Math.max(currentY + safeR, Math.min(currentY + currentH - safeR, ny)),
      r: safeR,
    };
  }, [currentW, currentH, currentX, currentY]);

  // ── Mouse wheel zoom ──────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 3));
      setCropCircle(c => clampCircle(c.x, c.y, c.r));
    };
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [clampCircle]);

  // ── Reset ─────────────────────────────────────────────────────
  const handleReset = () => {
    setZoom(1);
    const r = Math.round(Math.min(layout.drawW, layout.drawH) * 0.4);
    setCropCircle({ x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2, r });
  };

  // ── Draw ──────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgLoaded) return;
    const ctx = canvas.getContext("2d");
    const { x, y, r } = cropCircle;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Dark background
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Dimmed full image
    ctx.globalAlpha = 0.35;
    ctx.drawImage(imgRef.current, currentX, currentY, currentW, currentH);
    ctx.globalAlpha = 1.0;

    // Dark overlay
    ctx.fillStyle = "rgba(10,37,64,0.45)";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Bright image inside crop circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(imgRef.current, currentX, currentY, currentW, currentH);
    ctx.restore();

    // Circle border
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth   = 2.5;
    ctx.stroke();

    // Dashed inner ring
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.restore();

    // Resize handle
    const hx = x + r * Math.cos(Math.PI * 0.25);
    const hy = y + r * Math.sin(Math.PI * 0.25);
    ctx.beginPath();
    ctx.arc(hx, hy, 9, 0, Math.PI * 2);
    ctx.fillStyle   = C.green;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth   = 2;
    ctx.fill();
    ctx.stroke();

  }, [imgLoaded, cropCircle, currentX, currentY, currentW, currentH]);

  useEffect(() => { draw(); }, [draw]);

  // ── Interaction start ─────────────────────────────────────────
  const handleInteractionStart = (e) => {
    const rect    = canvasRef.current.getBoundingClientRect();
    const touches = e.touches || [e];

    if (touches.length === 2) {
      lastPinchDist.current = Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
      );
      return;
    }

    const px = touches[0].clientX - rect.left;
    const py = touches[0].clientY - rect.top;
    const hx = cropCircle.x + cropCircle.r * Math.cos(Math.PI * 0.25);
    const hy = cropCircle.y + cropCircle.r * Math.sin(Math.PI * 0.25);

    if (Math.hypot(px - hx, py - hy) < 20) {
      resizing.current = true;
    } else if (Math.hypot(px - cropCircle.x, py - cropCircle.y) < cropCircle.r) {
      dragging.current  = true;
      dragStart.current = { x: px - cropCircle.x, y: py - cropCircle.y };
    }
  };

  // ── Interaction move ──────────────────────────────────────────
  const handleInteractionMove = (e) => {
    const rect    = canvasRef.current.getBoundingClientRect();
    const touches = e.touches || [e];

    // Pinch to zoom
    if (touches.length === 2 && lastPinchDist.current !== null) {
      const dist  = Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
      );
      const delta = (dist - lastPinchDist.current) / 150;
      setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 3));
      setCropCircle(prev => clampCircle(prev.x, prev.y, prev.r));
      lastPinchDist.current = dist;
      return;
    }

    if (!dragging.current && !resizing.current) return;
    const px = touches[0].clientX - rect.left;
    const py = touches[0].clientY - rect.top;

    if (dragging.current) {
      setCropCircle(prev =>
        clampCircle(px - dragStart.current.x, py - dragStart.current.y, prev.r)
      );
    } else if (resizing.current) {
      setCropCircle(prev =>
        clampCircle(prev.x, prev.y, Math.hypot(px - prev.x, py - prev.y))
      );
    }
  };

  const handleInteractionEnd = () => {
    dragging.current      = false;
    resizing.current      = false;
    lastPinchDist.current = null;
  };

  // ── Confirm — extract crop region ────────────────────────────
  const handleConfirm = () => {
    setProcessing(true);
    const { x, y, r } = cropCircle;
    const srcX    = (x - r - currentX) / currentScale;
    const srcY    = (y - r - currentY) / currentScale;
    const srcSide = (r * 2)            / currentScale;

    const out = document.createElement("canvas");
    out.width  = CROP_SIZE;
    out.height = CROP_SIZE;
    const ctx  = out.getContext("2d");

    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(imgRef.current, srcX, srcY, srcSide, srcSide, 0, 0, CROP_SIZE, CROP_SIZE);
    out.toBlob(blob => onConfirm(blob), "image/jpeg", 0.9);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(10,37,64,0.75)",
      zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(3px)",
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }
        .zoom-slider { -webkit-appearance: none; width: 100%; height: 5px; background: ${C.gray200}; border-radius: 5px; outline: none; }
        .zoom-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: ${C.green}; border-radius: 50%; cursor: pointer; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
      `}</style>

      <div style={{
        background: C.white, borderRadius: 18, overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,0.45)", animation: "fadeIn 0.22s ease",
        width: CANVAS_SIZE,
      }}>

        {/* Header */}
        <div style={{ background: C.navy, padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: C.white, fontWeight: 800, fontSize: 15 }}>Edit Profile Picture</div>
            <div style={{ color: C.gold, fontSize: 11, marginTop: 2, fontWeight: 500 }}>
              Drag to reposition · Green handle to resize · Scroll to zoom
            </div>
          </div>
          <button onClick={onCancel} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: C.white, width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {/* Canvas */}
        <div style={{ background: "#111827", lineHeight: 0 }}>
          {imgLoaded ? (
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE} height={CANVAS_SIZE}
              onMouseDown={handleInteractionStart}
              onMouseMove={handleInteractionMove}
              onMouseUp={handleInteractionEnd}
              onMouseLeave={handleInteractionEnd}
              onTouchStart={handleInteractionStart}
              onTouchMove={handleInteractionMove}
              onTouchEnd={handleInteractionEnd}
              style={{ display: "block", cursor: "move", touchAction: "none" }}
            />
          ) : (
            <div style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ color: "#9ca3af", fontSize: 13 }}>Loading...</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 22px", borderTop: `1px solid ${C.gray100}` }}>

          {/* Zoom slider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.gray400, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
              🔍 Zoom
            </span>
            <input
              type="range" min="0.5" max="3" step="0.01"
              value={zoom} className="zoom-slider"
              onChange={e => {
                setZoom(parseFloat(e.target.value));
                setCropCircle(prev => clampCircle(prev.x, prev.y, prev.r));
              }}
            />
            <button onClick={handleReset} style={{
              background: "none", border: "none", color: C.green,
              fontSize: 11, fontWeight: 700, cursor: "pointer",
              textDecoration: "underline", padding: 0, whiteSpace: "nowrap",
              fontFamily: "inherit",
            }}>Reset</button>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: C.gray400 }}>Output: 200×200px JPEG</span>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onCancel} style={{
                padding: "9px 18px", borderRadius: 9, border: `1.5px solid ${C.gray200}`,
                background: C.white, color: C.gray400, fontWeight: 600, fontSize: 13,
                cursor: "pointer", fontFamily: "inherit",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.gray200; e.currentTarget.style.color = C.gray400; }}>
                Cancel
              </button>
              <button onClick={handleConfirm} disabled={!imgLoaded || processing} style={{
                padding: "9px 22px", borderRadius: 9, border: "none",
                background: !imgLoaded || processing ? C.gray200 : C.green,
                color: C.white, fontWeight: 700, fontSize: 13,
                cursor: !imgLoaded || processing ? "not-allowed" : "pointer",
                fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8,
                boxShadow: !imgLoaded || processing ? "none" : `0 4px 12px ${C.green}44`,
              }}>
                {processing ? (
                  <>
                    <div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    Saving...
                  </>
                ) : "✓ Save Photo"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
