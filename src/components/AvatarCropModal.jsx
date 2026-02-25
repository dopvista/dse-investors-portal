import { useState, useRef, useEffect, useCallback } from "react";
import { C } from "./ui";

const CANVAS_SIZE = 400; // Fixed square dimensions
const CROP_SIZE = 200;   // Final output px
const MIN_CROP  = 80;    

export default function AvatarCropModal({ imageSrc, onConfirm, onCancel }) {
  const canvasRef    = useRef();
  const imgRef       = useRef(new Image());
  const dragging     = useRef(false);
  const resizing     = useRef(false);
  const dragStart    = useRef({ x: 0, y: 0 });

  const [imgLoaded,   setImgLoaded]   = useState(false);
  const [cropCircle, setCropCircle] = useState({ x: 200, y: 200, r: 100 });
  const [naturalSize, setNaturalSize] = useState({ w: 1, h: 1 });
  // layout holds the position and scale of the image within the square canvas
  const [layout,      setLayout]      = useState({ drawX: 0, drawY: 0, drawW: 0, drawH: 0, scale: 1 });
  const [processing, setProcessing]   = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    img.onload = () => {
      // Calculate fit: image should fit entirely within the CANVAS_SIZE square
      const ratio = Math.min(CANVAS_SIZE / img.naturalWidth, CANVAS_SIZE / img.naturalHeight);
      const drawW = img.naturalWidth * ratio;
      const drawH = img.naturalHeight * ratio;
      
      // Center the image within the square
      const drawX = (CANVAS_SIZE - drawW) / 2;
      const drawY = (CANVAS_SIZE - drawH) / 2;

      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      setLayout({ drawX, drawY, drawW, drawH, scale: ratio });
      
      const r = Math.round(Math.min(drawW, drawH) * 0.4);
      setCropCircle({ x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2, r });
      setImgLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgLoaded) return;
    const ctx = canvas.getContext("2d");
    const { drawX, drawY, drawW, drawH } = layout;
    const { x, y, r } = cropCircle;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 1. Draw dimmed background image
    ctx.globalAlpha = 0.4;
    ctx.drawImage(imgRef.current, drawX, drawY, drawW, drawH);
    ctx.globalAlpha = 1.0;

    // 2. Draw the "lit" circular area
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(imgRef.current, drawX, drawY, drawW, drawH);
    ctx.restore();

    // 3. Circle UI
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Handle
    const hx = x + r * Math.cos(Math.PI * 0.25);
    const hy = y + r * Math.sin(Math.PI * 0.25);
    ctx.beginPath();
    ctx.arc(hx, hy, 8, 0, Math.PI * 2);
    ctx.fillStyle = C.green;
    ctx.fill();
    ctx.stroke();
  }, [imgLoaded, cropCircle, layout]);

  useEffect(() => { draw(); }, [draw]);

  const onMouseMove = (e) => {
    if (!dragging.current && !resizing.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const px = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const py = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

    const { drawX, drawY, drawW, drawH } = layout;

    if (dragging.current) {
      const nx = px - dragStart.current.x;
      const ny = py - dragStart.current.y;
      // Clamp within the image boundaries
      setCropCircle(prev => ({
        ...prev,
        x: Math.max(drawX + prev.r, Math.min(drawX + drawW - prev.r, nx)),
        y: Math.max(drawY + prev.r, Math.min(drawY + drawH - prev.r, ny))
      }));
    } else if (resizing.current) {
      const newR = Math.max(MIN_CROP / 2, Math.hypot(px - cropCircle.x, py - cropCircle.y));
      // Ensure circle doesn't expand past image edges
      const maxR = Math.min(
        cropCircle.x - drawX, 
        (drawX + drawW) - cropCircle.x,
        cropCircle.y - drawY,
        (drawY + drawH) - cropCircle.y
      );
      setCropCircle(prev => ({ ...prev, r: Math.min(newR, maxR) }));
    }
  };

  const handleConfirm = () => {
    setProcessing(true);
    const { x, y, r } = cropCircle;
    const { drawX, drawY, scale } = layout;

    // Relative to the image's top-left corner
    const srcX = (x - r - drawX) / scale;
    const srcY = (y - r - drawY) / scale;
    const srcSide = (r * 2) / scale;

    const out = document.createElement("canvas");
    out.width = CROP_SIZE;
    out.height = CROP_SIZE;
    const ctx = out.getContext("2d");

    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.drawImage(imgRef.current, srcX, srcY, srcSide, srcSide, 0, 0, CROP_SIZE, CROP_SIZE);
    out.toBlob(blob => onConfirm(blob), "image/jpeg", 0.85);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", width: CANVAS_SIZE }}>
        <div style={{ background: C.navy, color: "#fff", padding: 16, fontWeight: 700 }}>Center & Crop</div>
        
        <div style={{ background: "#111", width: CANVAS_SIZE, height: CANVAS_SIZE, position: "relative" }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            onMouseDown={(e) => {
                const rect = canvasRef.current.getBoundingClientRect();
                const px = e.clientX - rect.left;
                const py = e.clientY - rect.top;
                const hx = cropCircle.x + cropCircle.r * Math.cos(Math.PI * 0.25);
                const hy = cropCircle.y + cropCircle.r * Math.sin(Math.PI * 0.25);
                if (Math.hypot(px - hx, py - hy) < 15) resizing.current = true;
                else if (Math.hypot(px - cropCircle.x, py - cropCircle.y) < cropCircle.r) {
                    dragging.current = true;
                    dragStart.current = { x: px - cropCircle.x, y: py - cropCircle.y };
                }
            }}
            onMouseMove={onMouseMove}
            onMouseUp={() => { dragging.current = false; resizing.current = false; }}
            style={{ display: "block", touchAction: "none" }}
          />
        </div>

        <div style={{ padding: 16, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onCancel} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #ddd", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleConfirm} disabled={processing} style={{ padding: "8px 16px", borderRadius: 8, background: C.green, color: "#fff", border: "none", cursor: "pointer" }}>
            {processing ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
