import { useState, useRef, useEffect, useCallback } from "react";
import { C } from "./ui";

const CROP_SIZE = 200; 
const MIN_CROP  = 80;  

export default function AvatarCropModal({ imageSrc, onConfirm, onCancel }) {
  const canvasRef    = useRef();
  const imgRef       = useRef(new Image());
  const dragging     = useRef(false);
  const resizing     = useRef(false);
  const dragStart    = useRef({ x: 0, y: 0 });

  const [imgLoaded,   setImgLoaded]   = useState(false);
  const [cropCircle, setCropCircle] = useState({ x: 0, y: 0, r: 100 });
  const [naturalSize, setNaturalSize] = useState({ w: 1, h: 1 });
  const [layout,      setLayout]      = useState({ canvasW: 500, canvasH: 420, drawY: 0, scale: 1 });
  const [processing, setProcessing]   = useState(false);

  // ── Load image and calculate centered layout ─────────────────────
  useEffect(() => {
    const img = imgRef.current;
    img.onload = () => {
      const maxW = Math.min(window.innerWidth - 80, 500);
      const maxH = Math.min(window.innerHeight - 280, 420);
      
      // Calculate how the image fits width-wise
      const scale = maxW / img.naturalWidth;
      const displayW = maxW;
      const displayH = img.naturalHeight * scale;

      // If the scaled image is shorter than maxH, we center it vertically
      // If it's taller, we cap the canvas at maxH (it will be scrollable/clamped)
      const canvasH = Math.min(displayH, maxH);
      const drawY = (canvasH - displayH) / 2;

      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      setLayout({ canvasW: displayW, canvasH, drawY, scale });
      
      const r = Math.round(Math.min(displayW, displayH) * 0.35);
      setCropCircle({ 
        x: Math.round(displayW / 2), 
        y: Math.round(canvasH / 2), 
        r 
      });
      setImgLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // ── Draw canvas ───────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgLoaded) return;
    const ctx = canvas.getContext("2d");
    const { canvasW: w, canvasH: h, drawY, scale } = layout;
    const { x, y, r } = cropCircle;
    const img = imgRef.current;

    ctx.clearRect(0, 0, w, h);

    // Image drawn at drawY for vertical centering
    const drawH = naturalSize.h * scale;
    const drawImg = () => ctx.drawImage(img, 0, drawY, w, drawH);

    // Background (Dimmed)
    drawImg();
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, 0, w, h);
    
    // Clear the circle
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // High-light area inside circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    drawImg();
    ctx.restore();

    // UI Overlays (Borders & Handles)
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Resize handle
    const hx = x + r * Math.cos(Math.PI * 0.25);
    const hy = y + r * Math.sin(Math.PI * 0.25);
    ctx.beginPath();
    ctx.arc(hx, hy, 9, 0, Math.PI * 2);
    ctx.fillStyle = C.green;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
  }, [imgLoaded, cropCircle, layout, naturalSize]);

  useEffect(() => { draw(); }, [draw]);

  // ── Interaction Helpers ────────────────────────────────────────
  const clampCircle = (nx, ny, nr) => {
    const { canvasW, canvasH, drawY, scale } = layout;
    const imgDisplayH = naturalSize.h * scale;
    
    // Limits based on image bounds, not canvas bounds
    const topLimit = drawY + nr;
    const bottomLimit = drawY + imgDisplayH - nr;
    const leftLimit = nr;
    const rightLimit = canvasW - nr;

    return {
      x: Math.max(leftLimit, Math.min(rightLimit, nx)),
      y: Math.max(topLimit, Math.min(bottomLimit, ny)),
      r: nr
    };
  };

  const onMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const pos = {
      x: (e.touches ? e.touches[0].clientX : e.clientX) - rect.left,
      y: (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
    };
    
    const hx = cropCircle.x + cropCircle.r * Math.cos(Math.PI * 0.25);
    const hy = cropCircle.y + cropCircle.r * Math.sin(Math.PI * 0.25);
    
    if (Math.hypot(pos.x - hx, pos.y - hy) < 20) {
      resizing.current = true;
    } else if (Math.hypot(pos.x - cropCircle.x, pos.y - cropCircle.y) < cropCircle.r) {
      dragging.current = true;
      dragStart.current = { x: pos.x - cropCircle.x, y: pos.y - cropCircle.y };
    }
  };

  const onMouseMove = (e) => {
    if (!dragging.current && !resizing.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const pos = {
      x: (e.touches ? e.touches[0].clientX : e.clientX) - rect.left,
      y: (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
    };

    if (dragging.current) {
      setCropCircle(prev => clampCircle(pos.x - dragStart.current.x, pos.y - dragStart.current.y, prev.r));
    } else if (resizing.current) {
      const newR = Math.max(MIN_CROP / 2, Math.hypot(pos.x - cropCircle.x, pos.y - cropCircle.y));
      setCropCircle(prev => clampCircle(prev.x, prev.y, newR));
    }
  };

  const handleConfirm = async () => {
    setProcessing(true);
    const { x, y, r } = cropCircle;
    const { scale, drawY } = layout;

    // Map screen coordinates back to natural image pixels
    // Subtract drawY to account for the vertical centering offset
    const srcX = (x - r) / scale;
    const srcY = (y - drawY - r) / scale;
    const srcSide = (r * 2) / scale;

    const out = document.createElement("canvas");
    out.width = CROP_SIZE;
    out.height = CROP_SIZE;
    const ctx = out.getContext("2d");

    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.drawImage(imgRef.current, srcX, srcY, srcSide, srcSide, 0, 0, CROP_SIZE, CROP_SIZE);
    out.toBlob(blob => onConfirm(blob), "image/jpeg", 0.9);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,37,64,0.8)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.3)", width: layout.canvasW }}>
        <div style={{ background: C.navy, padding: "16px 20px", color: "#fff" }}>
          <div style={{ fontWeight: 700 }}>Adjust Profile Picture</div>
        </div>

        <div style={{ background: "#000", display: "flex", alignItems: "center", justifyContent: "center", height: layout.canvasH }}>
          {imgLoaded && (
            <canvas
              ref={canvasRef}
              width={layout.canvasW}
              height={layout.canvasH}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={() => { dragging.current = false; resizing.current = false; }}
              onTouchStart={onMouseDown}
              onTouchMove={onMouseMove}
              onTouchEnd={() => { dragging.current = false; resizing.current = false; }}
              style={{ touchAction: "none", cursor: "crosshair" }}
            />
          )}
        </div>

        <div style={{ padding: 20, display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button onClick={onCancel} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #ddd", background: "none", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleConfirm} disabled={processing} style={{ padding: "8px 20px", borderRadius: 8, background: C.green, color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}>
            {processing ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
