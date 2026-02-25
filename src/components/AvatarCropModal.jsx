// ── src/components/AvatarCropModal.jsx ───────────────────────────
import { useState, useRef, useEffect, useCallback } from "react";
import { C } from "./ui";

const CANVAS_SIZE = 420;
const CROP_SIZE   = 200;
const MIN_CROP    = 80;

export default function AvatarCropModal({ imageSrc, onConfirm, onCancel }) {
  const canvasRef  = useRef();
  const imgRef     = useRef(new Image());
  const dragging   = useRef(false);
  const resizing   = useRef(false);
  const dragStart  = useRef({ x: 0, y: 0 });

  const [imgLoaded,  setImgLoaded]  = useState(false);
  const [cropCircle, setCropCircle] = useState({ x: 210, y: 210, r: 100 });
  const [naturalSize,setNaturalSize]= useState({ w: 1, h: 1 });
  const [layout,     setLayout]     = useState({ drawX: 0, drawY: 0, drawW: 0, drawH: 0, scale: 1 });
  const [processing, setProcessing] = useState(false);

  // ── Load image — fit inside square, center it ─────────────────
  useEffect(() => {
    const img = imgRef.current;
    img.onload = () => {
      const ratio = Math.min(CANVAS_SIZE / img.naturalWidth, CANVAS_SIZE / img.naturalHeight);
      const drawW = img.naturalWidth  * ratio;
      const drawH = img.naturalHeight * ratio;
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

  // ── Draw ──────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgLoaded) return;
    const ctx = canvas.getContext("2d");
    const { drawX, drawY, drawW, drawH } = layout;
    const { x, y, r } = cropCircle;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Background
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Dimmed full image
    ctx.globalAlpha = 0.35;
    ctx.drawImage(imgRef.current, drawX, drawY, drawW, drawH);
    ctx.globalAlpha = 1.0;

    // Bright image inside crop circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(imgRef.current, drawX, drawY, drawW, drawH);
    ctx.restore();

    // Circle border
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth   = 2.5;
    ctx.stroke();

    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Resize handle
    const hx = x + r * Math.cos(Math.PI * 0.25);
    const hy = y + r * Math.sin(Math.PI * 0.25);
    ctx.beginPath();
    ctx.arc(hx, hy, 8, 0, Math.PI * 2);
    ctx.fillStyle   = C.green;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth   = 2;
    ctx.fill();
    ctx.stroke();
  }, [imgLoaded, cropCircle, layout]);

  useEffect(() => { draw(); }, [draw]);

  // ── Mouse/touch events ────────────────────────────────────────
  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      px: (e.touches ? e.touches[0].clientX : e.clientX) - rect.left,
      py: (e.touches ? e.touches[0].clientY : e.clientY) - rect.top,
    };
  };

  const onMouseDown = (e) => {
    const { px, py } = getPos(e);
    const hx = cropCircle.x + cropCircle.r * Math.cos(Math.PI * 0.25);
    const hy = cropCircle.y + cropCircle.r * Math.sin(Math.PI * 0.25);
    if (Math.hypot(px - hx, py - hy) < 15) {
      resizing.current = true;
    } else if (Math.hypot(px - cropCircle.x, py - cropCircle.y) < cropCircle.r) {
      dragging.current  = true;
      dragStart.current = { x: px - cropCircle.x, y: py - cropCircle.y };
    }
  };

  const onMouseMove = (e) => {
    if (!dragging.current && !resizing.current) return;
    const { px, py } = getPos(e);
    const { drawX, drawY, drawW, drawH } = layout;

    if (dragging.current) {
      const nx = px - dragStart.current.x;
      const ny = py - dragStart.current.y;
      setCropCircle(prev => ({
        ...prev,
        x: Math.max(drawX + prev.r, Math.min(drawX + drawW - prev.r, nx)),
        y: Math.max(drawY + prev.r, Math.min(drawY + drawH - prev.r, ny)),
      }));
    } else if (resizing.current) {
      const newR = Math.max(MIN_CROP / 2, Math.hypot(px - cropCircle.x, py - cropCircle.y));
      const maxR = Math.min(
        cropCircle.x - drawX,
        drawX + drawW - cropCircle.x,
        cropCircle.y - drawY,
        drawY + drawH - cropCircle.y
      );
      setCropCircle(prev => ({ ...prev, r: Math.min(newR, maxR) }));
    }

    // Cursor
    const hx = cropCircle.x + cropCircle.r * Math.cos(Math.PI * 0.25);
    const hy = cropCircle.y + cropCircle.r * Math.sin(Math.PI * 0.25);
    const canvas = canvasRef.current;
    if (Math.hypot(px - hx, py - hy) < 15) canvas.style.cursor = "se-resize";
    else if (Math.hypot(px - cropCircle.x, py - cropCircle.y) < cropCircle.r) canvas.style.cursor = "move";
    else canvas.style.cursor = "default";
  };

  const onMouseUp = () => { dragging.current = false; resizing.current = false; };

  // ── Confirm — extract crop region ────────────────────────────
  const handleConfirm = () => {
    setProcessing(true);
    const { x, y, r }        = cropCircle;
    const { drawX, drawY, scale } = layout;

    const srcX    = (x - r - drawX) / scale;
    const srcY    = (y - r - drawY) / scale;
    const srcSide = (r * 2)         / scale;

    const out = document.createElement("canvas");
    out.width  = CROP_SIZE;
    out.height = CROP_SIZE;
    const ctx  = out.getContext("2d");

    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(imgRef.current, srcX, srcY, srcSide, srcSide, 0, 0, CROP_SIZE, CROP_SIZE);
    out.toBlob(blob => onConfirm(blob), "image/jpeg", 0.85);
  };

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
        width: CANVAS_SIZE,
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
        <div style={{ background: "#1e293b", width: CANVAS_SIZE, height: CANVAS_SIZE }}>
          {imgLoaded ? (
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
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
            <div style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ color: "#9ca3af", fontSize: 13 }}>Loading image...</div>
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
