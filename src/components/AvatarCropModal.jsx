import { useState, useRef, useEffect, useCallback } from "react";
import { C } from "./ui";

const CANVAS_SIZE = 420; 
const CROP_SIZE = 200;   
const MIN_CROP  = 80;    

export default function AvatarCropModal({ imageSrc, onConfirm, onCancel }) {
  const canvasRef    = useRef();
  const imgRef       = useRef(new Image());
  const dragging     = useRef(false);
  const resizing     = useRef(false);
  const dragStart    = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef(null); // Track pinch distance

  const [imgLoaded,   setImgLoaded]   = useState(false);
  const [cropCircle, setCropCircle] = useState({ x: 210, y: 210, r: 100 });
  const [naturalSize, setNaturalSize] = useState({ w: 1, h: 1 });
  const [zoom,        setZoom]        = useState(1); 
  const [layout,      setLayout]      = useState({ drawX: 0, drawY: 0, drawW: 0, drawH: 0, baseScale: 1 });
  const [processing, setProcessing]   = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    img.onload = () => {
      const baseScale = Math.min(CANVAS_SIZE / img.naturalWidth, CANVAS_SIZE / img.naturalHeight);
      const drawW = img.naturalWidth * baseScale;
      const drawH = img.naturalHeight * baseScale;
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      setLayout({ drawX: (CANVAS_SIZE - drawW) / 2, drawY: (CANVAS_SIZE - drawH) / 2, drawW, drawH, baseScale });
      setCropCircle({ x: 210, y: 210, r: Math.round(Math.min(drawW, drawH) * 0.4) });
      setImgLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const currentScale = layout.baseScale * zoom;
  const currentW = naturalSize.w * currentScale;
  const currentH = naturalSize.h * currentScale;
  const currentX = (CANVAS_SIZE - currentW) / 2;
  const currentY = (CANVAS_SIZE - currentH) / 2;

  const clampCircle = useCallback((nx, ny, nr) => {
    const maxR = Math.min(currentW / 2, currentH / 2);
    const safeR = Math.min(nr, maxR);
    return {
      x: Math.max(currentX + safeR, Math.min(currentX + currentW - safeR, nx)),
      y: Math.max(currentY + safeR, Math.min(currentY + currentH - safeR, ny)),
      r: safeR
    };
  }, [currentW, currentH, currentX, currentY]);

  // ── Wheel & Pinch Support ─────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => {
        const next = Math.min(Math.max(prev + delta, 1), 3);
        setCropCircle(c => clampCircle(c.x, c.y, c.r));
        return next;
      });
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [clampCircle]);

  const handleReset = () => {
    setZoom(1);
    const baseR = Math.round(Math.min(layout.drawW, layout.drawH) * 0.4);
    setCropCircle({ x: 210, y: 210, r: baseR });
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgLoaded) return;
    const ctx = canvas.getContext("2d");
    const { x, y, r } = cropCircle;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.drawImage(imgRef.current, currentX, currentY, currentW, currentH);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(imgRef.current, currentX, currentY, currentW, currentH);
    ctx.restore();

    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5; ctx.stroke();

    const hx = x + r * Math.cos(Math.PI * 0.25);
    const hy = y + r * Math.sin(Math.PI * 0.25);
    ctx.beginPath(); ctx.arc(hx, hy, 8, 0, Math.PI * 2);
    ctx.fillStyle = C.green; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
    ctx.fill(); ctx.stroke();
  }, [imgLoaded, cropCircle, currentX, currentY, currentW, currentH]);

  useEffect(() => { draw(); }, [draw]);

  // ── Touch/Mouse Interactions ──────────────────────────────────
  const handleInteractionStart = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const touches = e.touches || [e];
    
    if (touches.length === 2) {
      // Initialize pinch
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

    if (Math.hypot(px - hx, py - hy) < 25) {
      resizing.current = true;
    } else if (Math.hypot(px - cropCircle.x, py - cropCircle.y) < cropCircle.r) {
      dragging.current = true;
      dragStart.current = { x: px - cropCircle.x, y: py - cropCircle.y };
    }
  };

  const handleInteractionMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const touches = e.touches || [e];

    if (touches.length === 2 && lastPinchDist.current !== null) {
      e.preventDefault();
      const dist = Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
      );
      const delta = (dist - lastPinchDist.current) / 100;
      setZoom(prev => Math.min(Math.max(prev + delta, 1), 3));
      setCropCircle(prev => clampCircle(prev.x, prev.y, prev.r));
      lastPinchDist.current = dist;
      return;
    }

    if (!dragging.current && !resizing.current) return;
    const px = touches[0].clientX - rect.left;
    const py = touches[0].clientY - rect.top;

    if (dragging.current) {
      setCropCircle(prev => clampCircle(px - dragStart.current.x, py - dragStart.current.y, prev.r));
    } else if (resizing.current) {
      const dist = Math.hypot(px - cropCircle.x, py - cropCircle.y);
      setCropCircle(prev => clampCircle(prev.x, prev.y, Math.max(MIN_CROP / 2, dist)));
    }
  };

  const handleInteractionEnd = () => {
    dragging.current = false;
    resizing.current = false;
    lastPinchDist.current = null;
  };

  const handleConfirm = async () => {
    setProcessing(true);
    const { x, y, r } = cropCircle;
    const srcX = (x - r - currentX) / currentScale;
    const srcY = (y - r - currentY) / currentScale;
    const srcSide = (r * 2) / currentScale;
    const out = document.createElement("canvas");
    out.width = CROP_SIZE; out.height = CROP_SIZE;
    const ctx = out.getContext("2d");
    ctx.beginPath(); ctx.arc(CROP_SIZE/2, CROP_SIZE/2, CROP_SIZE/2, 0, Math.PI*2); ctx.clip();
    ctx.drawImage(imgRef.current, srcX, srcY, srcSide, srcSide, 0, 0, CROP_SIZE, CROP_SIZE);
    out.toBlob(blob => onConfirm(blob), "image/jpeg", 0.85);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,37,64,0.72)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(3px)" }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .zoom-slider { -webkit-appearance: none; width: 100%; height: 6px; background: ${C.gray100}; border-radius: 5px; outline: none; }
        .zoom-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: ${C.green}; border-radius: 50%; cursor: pointer; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
      `}</style>

      <div style={{ background: C.white, borderRadius: 18, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.4)", animation: "fadeIn 0.25s ease", width: CANVAS_SIZE }}>
        <div style={{ background: C.navy, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: C.white, fontWeight: 800, fontSize: 16 }}>Edit Profile Picture</div>
            <div style={{ color: C.gold, fontSize: 12, marginTop: 2, fontWeight: 500 }}>Pinch, scroll, or slide to zoom</div>
          </div>
          <button onClick={onCancel} style={{ background: "none", border: "none", color: C.white, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>

        <div style={{ background: "#000" }}>
          <canvas
            ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE}
            onMouseDown={handleInteractionStart}
            onMouseMove={handleInteractionMove}
            onMouseUp={handleInteractionEnd}
            onMouseLeave={handleInteractionEnd}
            onTouchStart={handleInteractionStart}
            onTouchMove={handleInteractionMove}
            onTouchEnd={handleInteractionEnd}
            style={{ display: "block", cursor: "move", touchAction: "none" }}
          />
        </div>

        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.gray100}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 15 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: C.gray400, fontWeight: 700 }}>ZOOM</span>
                <button onClick={handleReset} style={{ background: "none", border: "none", color: C.gold, fontSize: 11, fontWeight: 600, cursor: "pointer", textDecoration: "underline", padding: 0 }}>Reset</button>
            </div>
            <div style={{ width: "70%" }}>
                <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => { setZoom(parseFloat(e.target.value)); setCropCircle(prev => clampCircle(prev.x, prev.y, prev.r)); }} className="zoom-slider" />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: C.gray400 }}>200x200 Export</span>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onCancel} style={{ padding: "8px 16px", borderRadius: 8, border: `1.5px solid ${C.gray200}`, background: "#fff", color: C.gray400, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleConfirm} disabled={processing} style={{ padding: "8px 20px", borderRadius: 8, background: C.green, color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>
                {processing ? "Saving..." : "✓ Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
