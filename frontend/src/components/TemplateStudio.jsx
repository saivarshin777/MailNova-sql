import { useState, useRef, useCallback, useEffect } from "react";
import { dashboardApi } from "../services/api";
const Icon = ({ name, size = 16, color = "currentColor" }) => {
  const icons = {
    drag: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="9" cy="5" r="1" fill={color}/><circle cx="15" cy="5" r="1" fill={color}/><circle cx="9" cy="12" r="1" fill={color}/><circle cx="15" cy="12" r="1" fill={color}/><circle cx="9" cy="19" r="1" fill={color}/><circle cx="15" cy="19" r="1" fill={color}/></svg>,
    mobile: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18" strokeLinecap="round" strokeWidth="3"/></svg>,
    grid: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    pencil: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    fb: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>,
    tw: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>,
    li: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>,
    ig: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeLinecap="round" strokeWidth="3"/></svg>,
    mail: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    star: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    rocket: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
    chart: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    refresh: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
    chat: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    calendar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    cart: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
    shield: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    headphone: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>,
    close: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    eye: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    copy: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
    location: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    person: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    bell: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    arrow: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    money: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    support: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.7 16a2 2 0 0 1 .3.92z"/></svg>,
    workflow: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="2" y="7" width="6" height="6" rx="1"/><rect x="16" y="3" width="6" height="6" rx="1"/><rect x="16" y="15" width="6" height="6" rx="1"/><path d="M8 10h4"/><path d="M12 6v12"/><path d="M12 6h4M12 18h4"/></svg>,
    trend: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    download: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    menu: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    send: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    blank: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9" strokeDasharray="2 2"/><line x1="9" y1="13" x2="15" y2="13" strokeDasharray="2 2"/></svg>,
    image: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    upload: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
    camera: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  };
  return icons[name] || null;
};

// ─── Logo Component (shared, respects custom logo) ───────────────────────────
const Logo = ({ size = "md", customLogo = null }) => {
  const sz = size === "sm" ? 16 : 20;
  const containerH = size === "sm" ? 24 : 28;

  if (customLogo) {
    return (
      <div style={{ display: "flex", alignItems: "center", height: containerH }}>
        <img
          src={customLogo}
          alt="Custom logo"
          style={{
            height: containerH,
            maxWidth: size === "sm" ? 100 : 120,
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: sz + 4, height: sz + 4, background: "linear-gradient(135deg,#0f766e,#115e59)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="mail" size={sz - 2} color="#fff" />
      </div>
      <span style={{ fontWeight: 700, fontSize: size === "sm" ? 13 : 15 }}>
        <span style={{ color: "#1e1e2e" }}>Mail</span>
        <span style={{ color: "#0f766e" }}>Nova</span>
      </span>
    </div>
  );
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const compressImageFile = async (file, { maxWidth = 1200, quality = 0.82 } = {}) => {
  if (!file || !file.type.startsWith("image/")) return "";
  if (file.type === "image/gif") return readFileAsDataUrl(file);

  const dataUrl = await readFileAsDataUrl(file);
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });

  const scale = Math.min(1, maxWidth / image.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", quality);
};

// ─── Logo Upload Modal ────────────────────────────────────────────────────────
const LogoUploadModal = ({ currentLogo, onSave, onClose }) => {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(currentLogo);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const optimized = await compressImageFile(file, { maxWidth: 600, quality: 0.84 });
    setPreview(optimized);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1e1e2e" }}>Change Logo</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Upload your brand logo — it will appear in all templates</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Icon name="close" size={18} color="#888" />
          </button>
        </div>

        {/* Upload zone */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={e => handleFile(e.target.files[0])}
        />
        <div
          onClick={() => fileInputRef.current.click()}
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          style={{
            border: dragOver ? "2px solid #0f766e" : "2px dashed #99f6e4",
            borderRadius: 10,
            padding: "24px 16px",
            textAlign: "center",
            cursor: "pointer",
            background: dragOver ? "#f0fdfa" : "#f0fdfa",
            transition: "all 0.15s",
            marginBottom: 16,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#f0fdfa"; e.currentTarget.style.borderColor = "#0f766e"; }}
          onMouseLeave={e => { if (!dragOver) { e.currentTarget.style.background = "#f0fdfa"; e.currentTarget.style.borderColor = "#99f6e4"; } }}
        >
          <div style={{ color: "#9b83ff", marginBottom: 8 }}>
            <Icon name="upload" size={28} color="#9b83ff" />
          </div>
          <div style={{ fontWeight: 600, color: "#0f766e", fontSize: 13 }}>Click to upload or drag & drop</div>
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>PNG, JPG, SVG, WEBP — recommended height 28–40px</div>
        </div>

        {/* Live preview */}
        <div style={{ background: "#f0fdfa", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Preview</div>

          {/* Email header bar simulation */}
          <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            {preview
              ? <img src={preview} alt="logo preview" style={{ height: 24, maxWidth: 120, objectFit: "contain", display: "block" }} />
              : <Logo size="sm" />
            }
            <span style={{ fontSize: 9, color: "#bbb" }}>View in browser</span>
          </div>

          {/* Header area simulation */}
          <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            {preview
              ? <img src={preview} alt="logo preview" style={{ height: 28, maxWidth: 140, objectFit: "contain", display: "block" }} />
              : <Logo size="md" />
            }
            <span style={{ fontSize: 10, color: "#bbb", marginLeft: "auto" }}>Larger size</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          {currentLogo && (
            <button
              onClick={() => { onSave(null); onClose(); }}
              style={{ background: "#fff0f0", border: "1.5px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontWeight: 600, fontSize: 12, cursor: "pointer", color: "#ef4444" }}
            >
              Reset to Default
            </button>
          )}
          <button onClick={onClose} style={{ flex: 1, background: "#f5f5f5", border: "none", borderRadius: 8, padding: "11px", fontWeight: 600, fontSize: 13, cursor: "pointer", color: "#555" }}>Cancel</button>
          <button
            onClick={() => { if (preview) { onSave(preview); onClose(); } }}
            disabled={!preview}
            style={{ flex: 2, background: preview ? "#0f766e" : "#99f6e4", border: "none", borderRadius: 8, padding: "11px", fontWeight: 700, fontSize: 13, cursor: preview ? "pointer" : "not-allowed", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.15s" }}
          >
            <Icon name="check" size={14} color="#fff" /> Apply Logo
          </button>
        </div>
      </div>
    </div>
  );
};

const SocialRow = ({ color = "#555", size = 14 }) => (
  <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
    {["fb","tw","li","ig"].map(n => (
      <div key={n} onClick={() => alert(`Opening ${n.toUpperCase()} page…`)} style={{ width: 28, height: 28, background: "#f0f0f0", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "transform 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
        <Icon name={n} size={size} color={color} />
      </div>
    ))}
  </div>
);

// Template cards — all accept customLogo prop
const WelcomeCard = ({ customLogo }) => (
  <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", fontFamily: "sans-serif", fontSize: 12 }}>
    <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}><Logo size="sm" customLogo={customLogo}/></div>
    <div style={{ padding: "16px", background: "linear-gradient(135deg,#f0fdfa,#fff)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.2, color: "#1e1e2e", marginBottom: 4 }}>Welcome to<br/><span style={{ color: "#0f766e" }}>MailNova</span> 👋</div>
          <p style={{ color: "#666", fontSize: 11, margin: "8px 0 12px", lineHeight: 1.5 }}>We're excited to have you on board.<br/>Here's what you can do with MailNova.</p>
          <button style={{ background: "#0f766e", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>Get Started</button>
        </div>
        <div style={{ fontSize: 40, marginLeft: 8 }}>💻</div>
      </div>
    </div>
    <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
      {[{ icon: "mail", label: "Create Campaigns", sub: "Design and send beautiful emails." },{ icon: "chart", label: "Track Performance", sub: "Get real-time insights and analytics." },{ icon: "workflow", label: "Automate Workflows", sub: "Save time with powerful automation." }].map(({ icon, label, sub }) => (
        <div key={label} style={{ textAlign: "center" }}>
          <div style={{ color: "#0f766e", marginBottom: 4 }}><Icon name={icon} size={18} color="#0f766e"/></div>
          <div style={{ fontWeight: 600, fontSize: 10, color: "#1e1e2e" }}>{label}</div>
          <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>{sub}</div>
        </div>
      ))}
    </div>
    <div style={{ padding: "10px 16px", borderTop: "1px solid #f0f0f0", textAlign: "center" }}>
      <div style={{ fontSize: 10, color: "#888", marginBottom: 8 }}>Need help? We're here for you.</div>
      <SocialRow />
    </div>
  </div>
);

const NewsletterCard = ({ customLogo }) => (
  <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", fontFamily: "sans-serif", fontSize: 12 }}>
    <div style={{ padding: "10px 14px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}><Logo size="sm" customLogo={customLogo}/><span style={{ fontSize: 10, color: "#0f766e", cursor: "pointer" }}>View in browser</span></div>
    <div style={{ padding: "14px" }}>
      <div style={{ fontWeight: 700, fontSize: 18, color: "#1e1e2e", marginBottom: 4 }}>Weekly Newsletter</div>
      <div style={{ color: "#888", fontSize: 11, marginBottom: 10 }}>Stay updated with the latest news and insights.</div>
      <div style={{ borderRadius: 8, overflow: "hidden", marginBottom: 10, height: 70, background: "linear-gradient(135deg,#1e1e2e,#2d2d44)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 28 }}>☕</span></div>
      {[{ icon: "trend", title: "Top 10 Email Marketing Tips", sub: "Improve open rates, clicks and conversions." },{ icon: "rocket", title: "Product Updates – May 2024", sub: "See what's new in MailNova this month." },{ icon: "person", title: "Customer Spotlight", sub: "How customers achieve success with MailNova." }].map(({ icon, title, sub }) => (
        <div key={title} style={{ display: "flex", gap: 10, marginBottom: 10, padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
          <div style={{ color: "#0f766e", flexShrink: 0, marginTop: 2 }}><Icon name={icon} size={16} color="#0f766e"/></div>
          <div><div style={{ fontWeight: 600, color: "#1e1e2e", fontSize: 11 }}>{title}</div><div style={{ color: "#888", fontSize: 10, margin: "2px 0 4px" }}>{sub}</div><span style={{ color: "#0f766e", fontSize: 10, cursor: "pointer" }}>Read More →</span></div>
        </div>
      ))}
    </div>
    <div style={{ background: "#1e1e2e", padding: "12px 14px", textAlign: "center" }}><SocialRow color="#aaa" /><div style={{ color: "#888", fontSize: 9, marginTop: 8 }}>© 2024 MailNova. All rights reserved.</div></div>
  </div>
);

const ProductLaunchCard = ({ customLogo }) => (
  <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", fontFamily: "sans-serif", fontSize: 12 }}>
    <div style={{ padding: "10px 14px", borderBottom: "1px solid #f0f0f0" }}><Logo size="sm" customLogo={customLogo}/></div>
    <div style={{ background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)", padding: "20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <span style={{ background: "#0f766e", color: "#fff", fontSize: 9, padding: "2px 8px", borderRadius: 20, fontWeight: 700, marginBottom: 8, display: "inline-block" }}>NEW LAUNCH</span>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 17, lineHeight: 1.3, marginTop: 4 }}>Introducing<br/>MailNova Pro</div>
        <div style={{ color: "#bbb", fontSize: 10, marginTop: 6, marginBottom: 12 }}>The most powerful email marketing<br/>platform for growing businesses.</div>
        <button style={{ background: "#0f766e", color: "#fff", border: "none", borderRadius: 6, padding: "8px 14px", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>Explore Now</button>
      </div>
      <div style={{ fontSize: 48 }}>🚀</div>
    </div>
    <div style={{ padding: "14px" }}>
      <div style={{ fontWeight: 600, fontSize: 12, color: "#1e1e2e", marginBottom: 10 }}>What's New?</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
        {[{ icon: "chart", label: "Advanced Analytics" },{ icon: "workflow", label: "Smart Automation" },{ icon: "person", label: "Team Collaboration" }].map(({ icon, label }) => (
          <div key={label} style={{ textAlign: "center", padding: 6 }}><div style={{ marginBottom: 4 }}><Icon name={icon} size={18} color="#0f766e"/></div><div style={{ fontWeight: 600, fontSize: 9, color: "#1e1e2e" }}>{label}</div></div>
        ))}
      </div>
    </div>
  </div>
);

const DiscountCard = ({ customLogo }) => (
  <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", fontFamily: "sans-serif", fontSize: 12 }}>
    <div style={{ padding: "10px 14px", borderBottom: "1px solid #f0f0f0" }}><Logo size="sm" customLogo={customLogo}/></div>
    <div style={{ padding: "20px 16px", textAlign: "center" }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: "#1e1e2e", marginBottom: 4 }}>Special Offer Just For You!</div>
      <div style={{ color: "#888", fontSize: 11, marginBottom: 8 }}>Get up to</div>
      <div style={{ fontWeight: 900, fontSize: 42, color: "#f97316", lineHeight: 1 }}>50% OFF</div>
      <div style={{ color: "#555", fontSize: 11, marginTop: 6 }}>On all premium plans</div>
      <div style={{ border: "2px dashed #f97316", borderRadius: 8, padding: "10px 20px", margin: "14px auto", maxWidth: 160, fontSize: 11, color: "#555" }}>Use code: <span style={{ color: "#f97316", fontWeight: 700 }}>SAVE50</span></div>
      <button style={{ background: "#f97316", color: "#fff", border: "none", borderRadius: 8, padding: "10px 32px", fontWeight: 700, fontSize: 12, cursor: "pointer", width: "100%" }}>Claim Your Discount</button>
    </div>
  </div>
);

const EventCard = ({ customLogo }) => (
  <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", fontFamily: "sans-serif", fontSize: 12 }}>
    <div style={{ padding: "10px 14px", borderBottom: "1px solid #f0f0f0" }}><Logo size="sm" customLogo={customLogo}/></div>
    <div style={{ display: "flex", padding: "16px", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: "#1e1e2e", marginBottom: 8 }}>You're Invited!</div>
        <div style={{ color: "#555", fontSize: 11, lineHeight: 1.5, marginBottom: 10 }}>Join us for an exclusive webinar on email marketing trends.</div>
        {[{ icon: "calendar", text: "24 May 2024" },{ icon: "bell", text: "11:00 AM (EST)" },{ icon: "location", text: "Online Event" }].map(({ icon, text }) => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}><Icon name={icon} size={12} color="#0f766e"/><span style={{ fontSize: 10, color: "#555" }}>{text}</span></div>
        ))}
        <button style={{ background: "#0f766e", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 600, fontSize: 11, cursor: "pointer", marginTop: 8 }}>Reserve Your Spot</button>
      </div>
      <div style={{ width: 100, height: 130, borderRadius: 8, background: "linear-gradient(135deg,#ccfbf1,#5ec9be)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 50 }}>🧑‍💻</span></div>
    </div>
  </div>
);

const FeedbackCard = ({ customLogo }) => (
  <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", fontFamily: "sans-serif", fontSize: 12 }}>
    <div style={{ padding: "10px 14px", borderBottom: "1px solid #f0f0f0" }}><Logo size="sm" customLogo={customLogo}/></div>
    <div style={{ padding: "20px 16px" }}>
      <div style={{ fontWeight: 700, fontSize: 18, color: "#16a34a", marginBottom: 12 }}>We Value Your Feedback!</div>
      <div style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", borderRadius: 10, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div><div style={{ color: "#555", fontSize: 11, lineHeight: 1.6 }}>We hope you're enjoying MailNova.<br/>Your feedback helps us improve.</div></div>
        <div style={{ fontSize: 42, flexShrink: 0 }}>💬</div>
      </div>
      <button style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 700, fontSize: 12, cursor: "pointer", width: "100%" }}>Give Feedback</button>
    </div>
  </div>
);

const RenewalCard = ({ customLogo }) => (
  <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", fontFamily: "sans-serif", fontSize: 12 }}>
    <div style={{ padding: "10px 14px", borderBottom: "1px solid #f0f0f0" }}><Logo size="sm" customLogo={customLogo}/></div>
    <div style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.3, marginBottom: 8 }}>Your Plan is<br/><span style={{ color: "#0f766e" }}>Expiring Soon</span></div>
        <div style={{ color: "#555", fontSize: 11, lineHeight: 1.6, marginBottom: 10 }}>Hi John, your MailNova Pro plan will expire on 25 May 2024. Renew now to continue enjoying premium features.</div>
        <button style={{ background: "#0f766e", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>Renew Now</button>
      </div>
      <div style={{ fontSize: 48, flexShrink: 0 }}>📅</div>
    </div>
  </div>
);

const AbandonedCartCard = ({ customLogo }) => (
  <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", fontFamily: "sans-serif", fontSize: 12 }}>
    <div style={{ padding: "10px 14px", borderBottom: "1px solid #f0f0f0" }}><Logo size="sm" customLogo={customLogo}/></div>
    <div style={{ padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.3, marginBottom: 6 }}>You left something<br/>behind!</div>
          <div style={{ color: "#555", fontSize: 11, lineHeight: 1.5 }}>Looks like you forgot to complete your purchase.</div>
        </div>
        <div style={{ position: "relative" }}><span style={{ fontSize: 40 }}>🛒</span><span style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 }}>1</span></div>
      </div>
      <button style={{ background: "#f97316", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, fontSize: 12, cursor: "pointer", width: "100%", margin: "12px 0" }}>Complete Your Purchase</button>
    </div>
  </div>
);

const BlankCard = ({ customLogo }) => (
  <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", fontFamily: "sans-serif", fontSize: 12 }}>
    <div style={{ padding: "10px 14px", borderBottom: "1px solid #f0f0f0" }}><Logo size="sm" customLogo={customLogo}/></div>
    <div style={{ padding: "40px 16px", textAlign: "center", minHeight: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#f0fdfa,#ccfbf1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="plus" size={28} color="#0f766e" />
      </div>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#1e1e2e" }}>Start from Scratch</div>
      <div style={{ color: "#888", fontSize: 11 }}>Build your own email with drag & drop blocks</div>
    </div>
    <div style={{ padding: "10px 16px", borderTop: "1px solid #f0f0f0", background: "#fafafa" }}>
      <div style={{ border: "2px dashed #5ec9be", borderRadius: 6, padding: "8px", textAlign: "center", color: "#0f766e", fontSize: 10, fontWeight: 500 }}>✦ Fully Customizable ✦</div>
    </div>
  </div>
);

const StudioTemplateCard = ({
  customLogo,
  title,
  subtitle,
  badge,
  accent,
  background,
  dark = false,
  preview = [],
}) => (
  <div style={{ background, borderRadius: 12, overflow: "hidden", fontFamily: "sans-serif", fontSize: 12, minHeight: 248, color: dark ? "#fff" : "#111827", position: "relative" }}>
    <div style={{ position: "absolute", inset: 0, background: dark ? "radial-gradient(circle at 20% 10%,rgba(255,255,255,.16),transparent 28%),radial-gradient(circle at 85% 25%,rgba(255,255,255,.08),transparent 30%)" : "radial-gradient(circle at 15% 20%,rgba(255,255,255,.8),transparent 25%),radial-gradient(circle at 85% 10%,rgba(255,255,255,.6),transparent 22%)" }} />
    <div style={{ position: "relative", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Logo size="sm" customLogo={customLogo} />
      <span style={{ background: dark ? "rgba(255,255,255,.16)" : "rgba(255,255,255,.72)", color: dark ? "#fff" : accent, border: `1px solid ${dark ? "rgba(255,255,255,.24)" : "rgba(255,255,255,.8)"}`, borderRadius: 999, padding: "4px 8px", fontSize: 9, fontWeight: 800, letterSpacing: ".06em" }}>{badge}</span>
    </div>
    <div style={{ position: "relative", padding: "20px 16px 12px" }}>
      <div style={{ width: 44, height: 4, background: accent, borderRadius: 999, marginBottom: 12 }} />
      <div style={{ fontSize: 20, lineHeight: 1.1, fontWeight: 800, letterSpacing: "-.02em", marginBottom: 8 }}>{title}</div>
      <div style={{ color: dark ? "rgba(255,255,255,.76)" : "#475569", fontSize: 11, lineHeight: 1.45, maxWidth: 180 }}>{subtitle}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
        {preview.slice(0, 4).map((item) => (
          <div key={item} style={{ background: dark ? "rgba(255,255,255,.11)" : "rgba(255,255,255,.78)", border: dark ? "1px solid rgba(255,255,255,.12)" : "1px solid rgba(255,255,255,.9)", borderRadius: 8, padding: "7px 8px", fontSize: 10, fontWeight: 700 }}>
            {item}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const TEMPLATES = [
  { id: "welcome",    label: "1. Welcome Email",       Component: WelcomeCard },
  { id: "newsletter", label: "2. Newsletter",           Component: NewsletterCard },
  { id: "launch",     label: "3. Product Launch",       Component: ProductLaunchCard },
  { id: "discount",   label: "4. Discount Offer",       Component: DiscountCard },
  { id: "event",      label: "5. Event Invitation",     Component: EventCard },
  { id: "feedback",   label: "6. Feedback Request",     Component: FeedbackCard },
  { id: "renewal",    label: "7. Subscription Renewal", Component: RenewalCard },
  { id: "cart",       label: "8. Abandoned Cart",       Component: AbandonedCartCard },
  {
    id: "student",
    label: "9. Student Orientation",
    Component: (props) => (
      <StudioTemplateCard {...props} title="Student Success Week" subtitle="Academic welcome kit with agenda, resources, and next steps." badge="CAMPUS" accent="#2563eb" background="linear-gradient(135deg,#dbeafe,#ffffff 48%,#fef3c7)" preview={["Agenda", "Resources", "Mentors", "CTA"]} />
    ),
  },
  {
    id: "course",
    label: "10. Course Launch",
    Component: (props) => (
      <StudioTemplateCard {...props} title="Masterclass Enrollment" subtitle="Premium learning campaign with modules, seats, and certificate highlights." badge="LEARN" accent="#7c3aed" background="linear-gradient(135deg,#ede9fe,#fff,#dcfce7)" preview={["Modules", "Seats", "Certificate", "Enroll"]} />
    ),
  },
  {
    id: "startup",
    label: "11. Startup Pitch",
    Component: (props) => (
      <StudioTemplateCard {...props} title="Investor Update" subtitle="Sharp dark layout for traction, milestones, and product momentum." badge="GROWTH" accent="#22d3ee" background="linear-gradient(135deg,#020617,#172554 55%,#0f766e)" dark preview={["MRR", "Users", "Launch", "Demo"]} />
    ),
  },
  {
    id: "luxury",
    label: "12. Premium Product",
    Component: (props) => (
      <StudioTemplateCard {...props} title="Signature Collection" subtitle="Elegant product storytelling with offer panels and editorial spacing." badge="PREMIUM" accent="#d4af37" background="linear-gradient(135deg,#171717,#3f2f1f 60%,#111827)" dark preview={["Story", "Gallery", "Offer", "Reserve"]} />
    ),
  },
  {
    id: "festival",
    label: "13. Festival Sale",
    Component: (props) => (
      <StudioTemplateCard {...props} title="Celebration Deals" subtitle="High-energy seasonal campaign with coupons, tiers, and urgency." badge="SALE" accent="#f97316" background="linear-gradient(135deg,#fff7ed,#fef2f2 45%,#fde68a)" preview={["Coupon", "Bundles", "Timer", "Shop"]} />
    ),
  },
  { id: "blank",      label: "14. Blank Template",       Component: BlankCard },
];

// ─── Image Block with real file picker ──────────────────────────────────────
const ImageBlockEditor = ({ block, onChange }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const optimized = await compressImageFile(file, { maxWidth: 1400, quality: 0.82 });
    onChange({ ...block, imageData: optimized, content: file.name });
  };

  return (
    <div>
      <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
      {block.imageData ? (
        <div style={{ position: "relative", borderRadius: 8, overflow: "hidden" }}>
          <img src={block.imageData} alt={block.content || "Uploaded"} style={{ width: "100%", display: "block", borderRadius: 8, maxHeight: 220, objectFit: "cover" }} />
          <button onClick={() => fileInputRef.current.click()} style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.65)", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="upload" size={10} color="#fff" /> Change
          </button>
        </div>
      ) : (
        <div onClick={() => fileInputRef.current.click()} style={{ background: "linear-gradient(135deg,#f0fdfa,#ccfbf1)", borderRadius: 8, padding: "28px 16px", textAlign: "center", cursor: "pointer", border: "2px dashed #99f6e4", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#ccfbf1"; e.currentTarget.style.borderColor = "#8b5cf6"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg,#f0fdfa,#ccfbf1)"; e.currentTarget.style.borderColor = "#99f6e4"; }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
          <div style={{ fontWeight: 600, color: "#0f766e", fontSize: 12, marginBottom: 4 }}>Click to upload photo</div>
          <div style={{ fontSize: 10, color: "#9b83ff" }}>PNG, JPG, GIF, WEBP supported</div>
        </div>
      )}
    </div>
  );
};

// ─── Block Editor ─────────────────────────────────────────────────────────────
const BlockEditor = ({ block, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast, isDragging, dragHandleProps }) => {
  const [hovered, setHovered] = useState(false);

  const inputStyle = {
    border: "none", outline: "none", width: "100%",
    fontFamily: "sans-serif", background: "transparent", resize: "none",
    boxSizing: "border-box",
  };

  const renderBlock = () => {
    switch (block.type) {
      case "header":
        return <input style={{ ...inputStyle, fontSize: 20, fontWeight: 700, color: "#1e1e2e" }} value={block.content} onChange={e => onChange({ ...block, content: e.target.value })} placeholder="Heading text…" />;
      case "paragraph":
        return <textarea style={{ ...inputStyle, fontSize: 13, color: "#555", lineHeight: 1.6, minHeight: 40 }} value={block.content} onChange={e => onChange({ ...block, content: e.target.value })} placeholder="Paragraph text…" />;
      case "list":
        return <textarea style={{ ...inputStyle, fontSize: 12, color: "#555", lineHeight: 1.8, minHeight: 40 }} value={block.content} onChange={e => onChange({ ...block, content: e.target.value })} placeholder={"• Item 1\n• Item 2\n• Item 3"} />;
      case "button":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <input style={{ ...inputStyle, background: "#0f766e", color: "#fff", borderRadius: 6, padding: "8px 16px", fontWeight: 600, fontSize: 12, width: "auto", flexShrink: 0, cursor: "text" }} value={block.content} onChange={e => onChange({ ...block, content: e.target.value })} placeholder="Button text" />
            <input style={{ ...inputStyle, fontSize: 11, color: "#888", flex: 1, border: "1px solid #eee", borderRadius: 4, padding: "4px 8px", minWidth: 120 }} value={block.url || ""} onChange={e => onChange({ ...block, url: e.target.value })} placeholder="https://link" />
          </div>
        );
      case "divider":
        return <hr style={{ border: "none", borderTop: "2px solid #ccfbf1", margin: "4px 0" }} />;
      case "spacer":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, background: "repeating-linear-gradient(45deg,#f5f5f5,#f5f5f5 2px,transparent 2px,transparent 8px)", height: Number(block.height || 20), borderRadius: 4 }} />
            <input type="range" min="8" max="80" value={block.height || 20} onChange={e => onChange({ ...block, height: e.target.value })} style={{ width: 80 }} />
            <span style={{ fontSize: 10, color: "#aaa", whiteSpace: "nowrap" }}>{block.height || 20}px</span>
          </div>
        );
      case "quote":
        return (
          <div style={{ borderLeft: "3px solid #0f766e", paddingLeft: 12 }}>
            <textarea style={{ ...inputStyle, fontSize: 13, color: "#555", fontStyle: "italic", lineHeight: 1.6, minHeight: 40 }} value={block.content} onChange={e => onChange({ ...block, content: e.target.value })} placeholder="Quote text…" />
          </div>
        );
      case "image_placeholder":
        return <ImageBlockEditor block={block} onChange={onChange} />;
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        position: "relative", padding: "6px 8px 6px 32px", borderRadius: 8,
        border: isDragging ? "2px dashed #0f766e" : hovered ? "1px solid #99f6e4" : "1px solid transparent",
        marginBottom: 4, background: isDragging ? "#f0fdfa" : hovered ? "#fdfcff" : "transparent",
        transition: "all 0.15s", opacity: isDragging ? 0.5 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div {...dragHandleProps} style={{ position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)", cursor: "grab", color: hovered ? "#9b83ff" : "#ddd", padding: "4px 2px", display: "flex", alignItems: "center", userSelect: "none" }}>
        <Icon name="drag" size={14} color={hovered ? "#9b83ff" : "#ccc"} />
      </div>
      {hovered && (
        <div style={{ position: "absolute", right: 6, top: 6, display: "flex", gap: 3, zIndex: 10 }}>
          {!isFirst && <button onClick={onMoveUp} style={btnSm} title="Move up">↑</button>}
          {!isLast && <button onClick={onMoveDown} style={btnSm} title="Move down">↓</button>}
          <button onClick={onDelete} style={{ ...btnSm, color: "#ef4444", background: "#fff0f0" }} title="Delete">✕</button>
        </div>
      )}
      {renderBlock()}
    </div>
  );
};

const btnSm = {
  background: "#f0fdfa", border: "none", borderRadius: 4, padding: "2px 6px",
  cursor: "pointer", fontSize: 10, color: "#0f766e", fontWeight: 600,
};

const BLOCK_TYPES = [
  { type: "header",            label: "H2",   desc: "Heading" },
  { type: "paragraph",         label: "¶",    desc: "Text" },
  { type: "list",              label: "•",    desc: "List" },
  { type: "button",            label: "⬛",   desc: "Button" },
  { type: "image_placeholder", label: "📷",   desc: "Photo" },
  { type: "divider",           label: "—",    desc: "Divider" },
  { type: "spacer",            label: "↕",    desc: "Spacer" },
  { type: "quote",             label: "❝",    desc: "Quote" },
];

const TEMPLATE_BLOCKS = {
  welcome: [
    { id:1, type:"header", content:"Welcome to MailNova 👋" },
    { id:2, type:"paragraph", content:"We're excited to have you on board. Here's what you can do with MailNova." },
    { id:3, type:"button", content:"Get Started", url:"https://mailnova.com" },
    { id:4, type:"divider", content:"" },
    { id:5, type:"paragraph", content:"Need help? We're here for you." },
  ],
  newsletter: [
    { id:1, type:"header", content:"Weekly Newsletter 📰" },
    { id:2, type:"paragraph", content:"Stay updated with the latest news and insights." },
    { id:3, type:"image_placeholder", content:"Newsletter banner image" },
    { id:4, type:"list", content:"• Top 10 Email Marketing Tips\n• Product Updates – May 2024\n• Customer Spotlight" },
    { id:5, type:"button", content:"Read More →", url:"#" },
  ],
  launch: [
    { id:1, type:"header", content:"Introducing MailNova Pro 🚀" },
    { id:2, type:"paragraph", content:"The most powerful email marketing platform for growing businesses." },
    { id:3, type:"image_placeholder", content:"Product launch hero" },
    { id:4, type:"list", content:"• Advanced Analytics\n• Smart Automation\n• Team Collaboration" },
    { id:5, type:"button", content:"Explore Now", url:"#" },
  ],
  discount: [
    { id:1, type:"header", content:"Special Offer Just For You! 🎉" },
    { id:2, type:"paragraph", content:"Get up to 50% OFF on all premium plans." },
    { id:3, type:"paragraph", content:"Use code: SAVE50" },
    { id:4, type:"button", content:"Claim Your Discount", url:"#" },
    { id:5, type:"paragraph", content:"Offer valid till 31st May 2024" },
  ],
  event: [
    { id:1, type:"header", content:"You're Invited! 🎙️" },
    { id:2, type:"paragraph", content:"Join us for an exclusive webinar on email marketing trends." },
    { id:3, type:"list", content:"• 24 May 2024\n• 11:00 AM (EST)\n• Online Event" },
    { id:4, type:"button", content:"Reserve Your Spot", url:"#" },
  ],
  feedback: [
    { id:1, type:"header", content:"We Value Your Feedback! 💬" },
    { id:2, type:"paragraph", content:"Hi there, we hope you're enjoying MailNova. Your feedback helps us improve and serve you better." },
    { id:3, type:"button", content:"Give Feedback", url:"#" },
    { id:4, type:"paragraph", content:"Thank you for being a part of MailNova!" },
  ],
  renewal: [
    { id:1, type:"header", content:"Your Plan is Expiring Soon ⏰" },
    { id:2, type:"paragraph", content:"Hi John, your MailNova Pro plan will expire on 25 May 2024." },
    { id:3, type:"paragraph", content:"Renew now to continue enjoying premium features." },
    { id:4, type:"button", content:"Renew Now", url:"#" },
    { id:5, type:"list", content:"• Unlimited Emails\n• Advanced Reports\n• Priority Support" },
  ],
  cart: [
    { id:1, type:"header", content:"You left something behind! 🛒" },
    { id:2, type:"paragraph", content:"Looks like you forgot to complete your purchase. No worries, we saved your cart." },
    { id:3, type:"paragraph", content:"Wireless Headphones – Black – $99.00" },
    { id:4, type:"button", content:"Complete Your Purchase", url:"#" },
    { id:5, type:"paragraph", content:"Need help? Contact our support team." },
  ],
  student: [
    { id:1, type:"header", content:"Welcome to Student Success Week" },
    { id:2, type:"paragraph", content:"Your orientation hub is ready. Meet mentors, explore resources, and plan your first week with confidence." },
    { id:3, type:"list", content:"• Day 1: Campus essentials\n• Day 2: Lab and library setup\n• Day 3: Career readiness session" },
    { id:4, type:"quote", content:"Bring your questions. We will help you build your plan." },
    { id:5, type:"button", content:"View Orientation Schedule", url:"#schedule" },
  ],
  course: [
    { id:1, type:"header", content:"Enrollment is open for the AI Masterclass" },
    { id:2, type:"paragraph", content:"A practical 4-week program with live projects, mentor reviews, and a completion certificate." },
    { id:3, type:"list", content:"• 8 live sessions\n• Portfolio-ready assignments\n• Certificate and mentor feedback" },
    { id:4, type:"button", content:"Reserve My Seat", url:"#enroll" },
    { id:5, type:"paragraph", content:"Early seats include a bonus interview preparation session." },
  ],
  startup: [
    { id:1, type:"header", content:"Q2 Investor Update" },
    { id:2, type:"paragraph", content:"We shipped the new analytics suite, grew active teams, and opened our enterprise waitlist." },
    { id:3, type:"list", content:"• 38% month-over-month product growth\n• 4 enterprise pilots in progress\n• New automation engine shipped" },
    { id:4, type:"button", content:"Open Product Demo", url:"#demo" },
  ],
  luxury: [
    { id:1, type:"header", content:"Introducing the Signature Collection" },
    { id:2, type:"paragraph", content:"A refined product story for customers who value craftsmanship, detail, and a quieter kind of luxury." },
    { id:3, type:"quote", content:"Designed for daily use. Finished like an heirloom." },
    { id:4, type:"button", content:"Reserve the Collection", url:"#reserve" },
  ],
  festival: [
    { id:1, type:"header", content:"Celebration Deals Are Live" },
    { id:2, type:"paragraph", content:"Create urgency with curated bundles, colorful sections, and a direct offer your audience can act on today." },
    { id:3, type:"paragraph", content:"Use code FESTIVE30 for 30% off selected plans." },
    { id:4, type:"button", content:"Shop the Offers", url:"#offers" },
    { id:5, type:"paragraph", content:"Offer ends soon. Terms apply." },
  ],
  blank: [],
};

const BG_COLORS = [
  "#ffffff","#fafafa","#f0fdfa","#f9f7f0",
  "#f0fdfa","#ccfbf1","#d8ccff","#99f6e4",
  "#f0f4ff","#dbeafe","#bfdbfe","#93c5fd",
  "#f0fdf4","#d1fae5","#a7f3d0","#6ee7b7",
  "#fffbf0","#fef9c3","#fde68a","#fcd34d",
  "#fdf2f8","#fce7f3","#fbcfe8","#f9a8d4",
  "#f0fdfa","#ccfbf1","#99f6e4","#5eead4",
  "#fff7ed","#ffedd5","#fed7aa","#fdba74",
  "#1e1e2e","#111827","#0f172a","#18181b",
  "#e5e7eb","#d1d5db","#6b7280","#374151",
];

const TEMPLATE_THEMES = {
  welcome: {
    canvas: "#f7f2ff",
    card: "#ffffff",
    accent: "#0f766e",
    heading: "#201735",
    text: "#51445f",
    hero: "linear-gradient(135deg,#0f766e,#0d9488)",
    heroTitle: "Welcome Kit",
    badge: "START HERE",
    footer: "#f4efff",
  },
  newsletter: {
    canvas: "#f8fafc",
    card: "#ffffff",
    accent: "#0f766e",
    heading: "#0f172a",
    text: "#475569",
    hero: "linear-gradient(135deg,#0f766e,#14b8a6)",
    heroTitle: "Weekly Brief",
    badge: "NEWSLETTER",
    footer: "#ecfeff",
  },
  launch: {
    canvas: "#020617",
    card: "#0f172a",
    accent: "#38bdf8",
    heading: "#f8fafc",
    text: "#cbd5e1",
    hero: "linear-gradient(135deg,#312e81,#0891b2)",
    heroTitle: "Launch Lab",
    badge: "PRODUCT",
    footer: "#111827",
    dark: true,
  },
  discount: {
    canvas: "#fff7ed",
    card: "#ffffff",
    accent: "#f97316",
    heading: "#7c2d12",
    text: "#7c2d12",
    hero: "linear-gradient(135deg,#fb923c,#ef4444)",
    heroTitle: "Offer Drop",
    badge: "LIMITED",
    footer: "#ffedd5",
  },
  event: {
    canvas: "#fdf2f8",
    card: "#ffffff",
    accent: "#db2777",
    heading: "#831843",
    text: "#6b2146",
    hero: "linear-gradient(135deg,#be185d,#7c3aed)",
    heroTitle: "Live Session",
    badge: "EVENT",
    footer: "#fce7f3",
  },
  feedback: {
    canvas: "#f0fdfa",
    card: "#ffffff",
    accent: "#0d9488",
    heading: "#134e4a",
    text: "#315b57",
    hero: "linear-gradient(135deg,#0d9488,#22c55e)",
    heroTitle: "Voice of Customer",
    badge: "FEEDBACK",
    footer: "#ccfbf1",
  },
  renewal: {
    canvas: "#eef2ff",
    card: "#ffffff",
    accent: "#115e59",
    heading: "#312e81",
    text: "#475569",
    hero: "linear-gradient(135deg,#4338ca,#6366f1)",
    heroTitle: "Plan Renewal",
    badge: "ACTION",
    footer: "#e0e7ff",
  },
  cart: {
    canvas: "#fff1f2",
    card: "#ffffff",
    accent: "#e11d48",
    heading: "#881337",
    text: "#6b2737",
    hero: "linear-gradient(135deg,#e11d48,#f97316)",
    heroTitle: "Cart Reminder",
    badge: "CHECKOUT",
    footer: "#ffe4e6",
  },
  student: {
    canvas: "#eff6ff",
    card: "#ffffff",
    accent: "#2563eb",
    heading: "#1e3a8a",
    text: "#334155",
    hero: "linear-gradient(135deg,#1d4ed8,#38bdf8)",
    heroTitle: "Student Hub",
    badge: "CAMPUS",
    footer: "#dbeafe",
  },
  course: {
    canvas: "#f5f3ff",
    card: "#ffffff",
    accent: "#7c3aed",
    heading: "#4c1d95",
    text: "#51445f",
    hero: "linear-gradient(135deg,#7c3aed,#22c55e)",
    heroTitle: "Learning Studio",
    badge: "COURSE",
    footer: "#ede9fe",
  },
  startup: {
    canvas: "#020617",
    card: "#07111f",
    accent: "#22d3ee",
    heading: "#f8fafc",
    text: "#cbd5e1",
    hero: "linear-gradient(135deg,#0f172a,#0e7490)",
    heroTitle: "Growth Memo",
    badge: "STARTUP",
    footer: "#0f172a",
    dark: true,
  },
  luxury: {
    canvas: "#171717",
    card: "#241c16",
    accent: "#d4af37",
    heading: "#fff7ed",
    text: "#e7d8c9",
    hero: "linear-gradient(135deg,#111827,#5a3f22)",
    heroTitle: "Signature Edit",
    badge: "PREMIUM",
    footer: "#1c1917",
    dark: true,
  },
  festival: {
    canvas: "#fff7ed",
    card: "#ffffff",
    accent: "#ea580c",
    heading: "#7c2d12",
    text: "#7c2d12",
    hero: "linear-gradient(135deg,#f97316,#facc15)",
    heroTitle: "Festival Campaign",
    badge: "SALE",
    footer: "#ffedd5",
  },
  blank: {
    canvas: "#f8fafc",
    card: "#ffffff",
    accent: "#0f766e",
    heading: "#0f172a",
    text: "#475569",
    hero: "linear-gradient(135deg,#0f766e,#115e59)",
    heroTitle: "Custom Design",
    badge: "BLANK",
    footer: "#f1f5f9",
  },
};

const SendModal = ({ onClose }) => {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [sent, setSent] = useState(false);
  const handleSend = () => {
    if (!to || !subject) { alert("Please fill in recipient email and subject."); return; }
    setSent(true);
    setTimeout(() => { onClose(); setSent(false); }, 2000);
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#1e1e2e" }}>Send Email Campaign</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="close" size={18} color="#888" /></button>
        </div>
        {sent ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 700, color: "#16a34a", fontSize: 16 }}>Email Sent Successfully!</div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>To (recipient email)</label>
              <input value={to} onChange={e => setTo(e.target.value)} placeholder="recipient@example.com" style={{ width: "100%", border: "1.5px solid #eee", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor="#0f766e"} onBlur={e => e.target.style.borderColor="#eee"} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>Subject</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject line" style={{ width: "100%", border: "1.5px solid #eee", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor="#0f766e"} onBlur={e => e.target.style.borderColor="#eee"} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={onClose} style={{ flex: 1, background: "#f5f5f5", border: "none", borderRadius: 8, padding: "11px", fontWeight: 600, fontSize: 13, cursor: "pointer", color: "#555" }}>Cancel</button>
              <button onClick={handleSend} style={{ flex: 2, background: "#0f766e", border: "none", borderRadius: 8, padding: "11px", fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Icon name="send" size={14} color="#fff" /> Send Now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const DownloadModal = ({ html, onClose }) => {
  const handleDownload = () => {
    const full = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Email Template</title></head><body style="margin:0;padding:20px;background:#f4f3ff;">${html}</body></html>`;
    const blob = new Blob([full], { type: "text/html" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "email-template.html"; a.click();
    onClose();
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#1e1e2e" }}>Export Template</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="close" size={18} color="#888" /></button>
        </div>
        <div style={{ color: "#666", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>Your email template will be exported as a fully responsive HTML file, ready to use in any email client.</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: "#f5f5f5", border: "none", borderRadius: 8, padding: "11px", fontWeight: 600, fontSize: 13, cursor: "pointer", color: "#555" }}>Cancel</button>
          <button onClick={handleDownload} style={{ flex: 2, background: "#0f766e", border: "none", borderRadius: 8, padding: "11px", fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon name="download" size={14} color="#fff" /> Download HTML
          </button>
        </div>
      </div>
    </div>
  );
};

const MobilePreviewModal = ({ html, onClose }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ background: "#1e1e2e", borderRadius: 48, padding: "16px", boxShadow: "0 30px 80px rgba(0,0,0,0.5)", position: "relative" }}>
      <button onClick={onClose} style={{ position: "absolute", top: -12, right: -12, background: "#fff", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}><Icon name="close" size={14} color="#1e1e2e" /></button>
      <div style={{ background: "#000", borderRadius: 38, padding: "8px", width: 320 }}>
        <div style={{ background: "#111", borderRadius: 4, height: 8, width: 80, margin: "0 auto 6px" }} />
        <div style={{ background: "#fff", borderRadius: 28, overflow: "hidden", height: 560, overflowY: "auto" }}>
          <div style={{ padding: 12, fontSize: 11 }} dangerouslySetInnerHTML={{ __html: html }} />
        </div>
        <div style={{ background: "#333", borderRadius: "50%", height: 32, width: 32, margin: "8px auto 0" }} />
      </div>
    </div>
  </div>
);

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function TemplateStudio({ onUseTemplate, initialTemplate }) {
  const [activeTab, setActiveTab] = useState("templates");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedDatabaseTemplate, setSelectedDatabaseTemplate] = useState(null);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [templateName, setTemplateName] = useState("Custom Template");
  const [templateSubject, setTemplateSubject] = useState("Campaign update");
  const [blocks, setBlocks] = useState([]);
  const [nextId, setNextId] = useState(200);
  const [editorBg, setEditorBg] = useState("#ffffff");
  const [preview, setPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [showMobile, setShowMobile] = useState(false);
  const [showLogoUpload, setShowLogoUpload] = useState(false);
  const [customLogo, setCustomLogo] = useState(null);
  const [toast, setToast] = useState(null);

  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const loadSavedTemplates = useCallback(async () => {
    try {
      const response = await dashboardApi.getTemplates();
      setSavedTemplates((response.data || []).filter((template) => template.createdBy));
    } catch (error) {
      console.error(error);
      showToast("Could not load saved templates", "error");
    }
  }, []);

  useEffect(() => {
    loadSavedTemplates();
    const interval = setInterval(loadSavedTemplates, 10000);
    return () => clearInterval(interval);
  }, [loadSavedTemplates]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const addBlock = (type) => {
    const defaults = {
      header: "New Heading", paragraph: "New paragraph text.",
      list: "• Item 1\n• Item 2\n• Item 3", button: "Click Here",
      divider: "", image_placeholder: "",
      spacer: "", quote: "Your quote text here…",
    };
    setBlocks(b => [...b, { id: nextId, type, content: defaults[type] }]);
    setNextId(n => n + 1);
  };

  const updateBlock = (id, updated) => setBlocks(b => b.map(x => x.id === id ? updated : x));
  const deleteBlock = (id) => { setBlocks(b => b.filter(x => x.id !== id)); showToast("Block removed"); };
  const moveUp   = (idx) => setBlocks(b => { const a = [...b]; [a[idx-1],a[idx]] = [a[idx],a[idx-1]]; return a; });
  const moveDown = (idx) => setBlocks(b => { const a = [...b]; [a[idx],a[idx+1]] = [a[idx+1],a[idx]]; return a; });

  const handleDragStart = (e, idx) => { setDragIndex(idx); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", idx); };
  const handleDragOver  = (e, idx) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverIndex(idx); };
  const handleDrop = (e, idx) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) { setDragIndex(null); setDragOverIndex(null); return; }
    setBlocks(b => { const arr = [...b]; const [removed] = arr.splice(dragIndex, 1); arr.splice(idx, 0, removed); return arr; });
    setDragIndex(null); setDragOverIndex(null);
    showToast("Block reordered ✓");
  };
  const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null); };

  const generateHTML = () => {
    const themeKey = String(selectedTemplate || selectedDatabaseTemplate?.templateType || "blank").toLowerCase();
    const theme = TEMPLATE_THEMES[themeKey] || TEMPLATE_THEMES.blank;
    const safe = (value = "") =>
      String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    const logoHTML = customLogo
      ? `<img src="${customLogo}" alt="Logo" style="height:28px;max-width:140px;object-fit:contain;display:block;"/>`
      : `<span style="font-weight:800;font-size:17px;letter-spacing:-0.02em;"><span style="color:${theme.dark ? "#ffffff" : theme.heading};">Mail</span><span style="color:${theme.accent};">Nova</span></span>`;

    const blocksHTML = blocks.map(b => {
      if (b.type === "header")           return `<h2 style="font-size:30px;line-height:1.12;font-weight:900;color:${theme.heading};margin:0 0 14px;letter-spacing:-0.03em;">${safe(b.content)}</h2>`;
      if (b.type === "paragraph")        return `<p style="font-size:15px;color:${theme.text};line-height:1.75;margin:12px 0;">${safe(b.content).replace(/\n/g,"<br/>")}</p>`;
      if (b.type === "list")             return `<div style="margin:18px 0;border-radius:16px;overflow:hidden;border:1px solid ${theme.dark ? "rgba(255,255,255,.14)" : "rgba(15,23,42,.08)"};">${String(b.content).split("\n").filter(Boolean).map(l => `<div style="padding:12px 14px;border-bottom:1px solid ${theme.dark ? "rgba(255,255,255,.10)" : "rgba(15,23,42,.06)"};font-size:14px;color:${theme.text};background:${theme.dark ? "rgba(255,255,255,.06)" : "rgba(255,255,255,.68)"};"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${theme.accent};margin-right:10px;"></span>${safe(l.replace(/^•\s*/,""))}</div>`).join("")}</div>`;
      if (b.type === "button")           return `<div style="margin:22px 0 8px;"><a href="${safe(b.url||"#")}" style="display:inline-block;background:${theme.accent};color:#fff;padding:14px 26px;border-radius:999px;font-weight:800;text-decoration:none;font-size:14px;box-shadow:0 12px 24px rgba(15,23,42,.18);">${safe(b.content)}</a></div>`;
      if (b.type === "divider")          return `<hr style="border:none;border-top:2px solid ${theme.accent};opacity:.22;margin:22px 0;"/>`;
      if (b.type === "spacer")           return `<div style="height:${b.height||20}px;"></div>`;
      if (b.type === "quote")            return `<blockquote style="border-left:5px solid ${theme.accent};margin:18px 0;padding:16px 18px;color:${theme.text};font-style:italic;background:${theme.dark ? "rgba(255,255,255,.08)" : theme.footer};border-radius:0 16px 16px 0;">${safe(b.content)}</blockquote>`;
      if (b.type === "image_placeholder") {
        if (b.imageData) return `<img src="${b.imageData}" alt="${safe(b.content||'')}" style="width:100%;border-radius:20px;display:block;margin:18px 0;box-shadow:0 18px 34px rgba(15,23,42,.18);"/>`;
        return `<div style="background:${theme.dark ? "rgba(255,255,255,.08)" : theme.footer};padding:26px;text-align:center;border-radius:20px;color:${theme.text};font-size:13px;margin:18px 0;border:1px dashed ${theme.accent};">Image area for this campaign</div>`;
      }
      return "";
    }).join("\n");

    const sidePanel =
      themeKey === "student" || themeKey === "course"
        ? `<div style="margin-top:22px;display:block;background:${theme.footer};border-radius:18px;padding:18px;border:1px solid rgba(37,99,235,.12);">
            <div style="font-size:12px;font-weight:900;letter-spacing:.08em;color:${theme.accent};text-transform:uppercase;">Learning Path</div>
            <div style="margin-top:8px;color:${theme.heading};font-size:15px;font-weight:800;">Agenda, resources, and next steps in one place.</div>
          </div>`
        : themeKey === "launch" || themeKey === "startup"
        ? `<div style="margin-top:22px;display:grid;gap:10px;">
            <div style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.13);border-radius:16px;padding:14px;color:${theme.text};"><strong style="color:${theme.accent};">01</strong> Product momentum</div>
            <div style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.13);border-radius:16px;padding:14px;color:${theme.text};"><strong style="color:${theme.accent};">02</strong> Key benefits and next action</div>
          </div>`
        : themeKey === "discount" || themeKey === "festival"
        ? `<div style="margin-top:22px;background:#fff;border:2px dashed ${theme.accent};border-radius:20px;padding:18px;text-align:center;">
            <div style="font-size:12px;color:${theme.text};font-weight:800;text-transform:uppercase;letter-spacing:.1em;">Campaign Code</div>
            <div style="font-size:26px;color:${theme.heading};font-weight:900;letter-spacing:.08em;margin-top:4px;">SAVE30</div>
          </div>`
        : "";

    return `<!doctype html>
<html>
  <body style="margin:0;background:${editorBg || theme.canvas};font-family:Arial,sans-serif;color:${theme.text};">
    <div style="background:${editorBg || theme.canvas};padding:32px 14px;">
      <div style="max-width:680px;margin:0 auto;border-radius:28px;overflow:hidden;background:${theme.card};box-shadow:0 24px 70px rgba(15,23,42,.18);border:1px solid ${theme.dark ? "rgba(255,255,255,.10)" : "rgba(15,23,42,.08)"};">
        <div style="background:${theme.hero};padding:26px 30px;color:#fff;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
            ${logoHTML}
            <span style="display:inline-block;border:1px solid rgba(255,255,255,.38);border-radius:999px;padding:6px 10px;font-size:11px;font-weight:900;letter-spacing:.1em;">${theme.badge}</span>
          </div>
          <div style="font-size:42px;line-height:.95;font-weight:900;letter-spacing:-.05em;margin-top:34px;max-width:440px;">${theme.heroTitle}</div>
          <div style="margin-top:12px;font-size:15px;line-height:1.55;max-width:460px;color:rgba(255,255,255,.82);">${safe(templateSubject || "Campaign update")}</div>
        </div>
        <div style="padding:34px 34px 22px;background:${theme.card};">
          ${blocksHTML || `<p style="font-size:15px;color:${theme.text};line-height:1.7;margin:0;">{{content}}</p>`}
          ${sidePanel}
        </div>
        <div style="padding:22px 34px;background:${theme.footer};border-top:1px solid ${theme.dark ? "rgba(255,255,255,.10)" : "rgba(15,23,42,.07)"};">
          <div style="font-size:12px;color:${theme.dark ? "#cbd5e1" : "#64748b"};line-height:1.6;">
            You are receiving this email because you are included in a Mail Nova campaign.
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;
  };

  const handleCopy = () => {
    const html = generateHTML();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(html).then(() => { setCopied(true); showToast("HTML copied to clipboard!"); setTimeout(() => setCopied(false), 2000); });
    } else {
      const ta = document.createElement("textarea"); ta.value = html; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
      setCopied(true); showToast("HTML copied!"); setTimeout(() => setCopied(false), 2000);
    }
  };
  const saveTemplateToDB = async () => {
    try {
      const templateData = {
        name: templateName.trim() || selectedTemplate || "Custom Template",
        subject: templateSubject.trim() || "Campaign update",
        templateType: String(selectedTemplate || "custom").toLowerCase(),
        background: editorBg,
        accentColor: (TEMPLATE_THEMES[String(selectedTemplate || "blank").toLowerCase()] || TEMPLATE_THEMES.blank).accent,
        customLogo: customLogo || "",
        blocks,
        htmlContent: generateHTML(),
        textContent: blocks
          .map((block) => block.content)
          .filter(Boolean)
          .join("\n\n"),
      };

      const response = selectedDatabaseTemplate?._id
        ? await dashboardApi.updateTemplate(selectedDatabaseTemplate._id, templateData)
        : await dashboardApi.createTemplate(templateData);

      setSelectedDatabaseTemplate(response.data);
      await loadSavedTemplates();
      showToast("Template saved. It is now in Saved Templates.");
      return response.data;
    } catch (error) {
      console.error(error);
      showToast("Failed to save template", "error");
      return null;
    }
  };

  const loadDatabaseTemplate = (template) => {
    const templateType = String(template.templateType || "custom").toLowerCase();
    setSelectedDatabaseTemplate(template);
    setSelectedTemplate(templateType);
    setTemplateName(template.name || "Custom Template");
    setTemplateSubject(template.subject || "Campaign update");
    setEditorBg(template.background || TEMPLATE_THEMES[templateType]?.canvas || "#ffffff");
    setCustomLogo(template.customLogo || null);
    setBlocks(
      Array.isArray(template.blocks)
        ? template.blocks.map((block, index) => ({
            ...block,
            id: block.id || Date.now() + index,
          }))
        : []
    );
    setActiveTab("editor");
    showToast(`Loaded saved template: ${template.name}`);
  };

  useEffect(() => {
    if (initialTemplate) {
      loadDatabaseTemplate(initialTemplate);
    }
    // Only run when a new template is explicitly requested for editing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTemplate]);

  const deleteDatabaseTemplate = async (template) => {
    if (!template?._id || !window.confirm(`Delete "${template.name}"?`)) return;

    try {
      await dashboardApi.deleteTemplate(template._id);
      if (selectedDatabaseTemplate?._id === template._id) {
        setSelectedDatabaseTemplate(null);
      }
      await loadSavedTemplates();
      showToast("Template deleted");
    } catch (error) {
      console.error(error);
      showToast("Could not delete template", "error");
    }
  };

  const useTemplateInCampaign = async () => {
    const template = await saveTemplateToDB();

    if (onUseTemplate && template) {
      onUseTemplate(template);
      showToast("Template selected for campaign");
    }
  };

  const loadTemplate = (id) => {
    const tBlocks = TEMPLATE_BLOCKS[id] || [];
    const blocksWithImage =
      tBlocks.some((block) => block.type === "image_placeholder") || id === "blank"
        ? tBlocks
        : [
            ...tBlocks.slice(0, 2),
            { id: 900, type: "image_placeholder", content: "Campaign image" },
            ...tBlocks.slice(2),
          ];
    const theme = TEMPLATE_THEMES[id] || TEMPLATE_THEMES.blank;
    setBlocks(blocksWithImage.map(b => ({ ...b, id: b.id + Date.now() })));
    setSelectedTemplate(id);
    setSelectedDatabaseTemplate(null);
    setEditorBg(theme.canvas);
    setTemplateName(TEMPLATES.find(t => t.id === id)?.label.replace(/^\d+\.\s*/, "") || "Custom Template");
    setTemplateSubject(`${TEMPLATES.find(t => t.id === id)?.label.replace(/^\d+\.\s*/, "") || "Campaign"} update`);
    setActiveTab("editor");
    showToast(id === "blank" ? "Blank canvas ready — add blocks from the sidebar!" : `Template loaded: ${TEMPLATES.find(t => t.id === id)?.label}`);
  };

  const clearAll = () => {
    if (blocks.length === 0 || window.confirm("Clear all blocks?")) {
      setBlocks([]); showToast("Canvas cleared");
    }
  };

  const isDarkBg = ["#1e1e2e","#111827","#0f172a","#18181b","#374151","#6b7280"].includes(editorBg);

  return (
    <div style={{ minHeight: "100vh", background: "#f4f3ff", fontFamily: "'Segoe UI', sans-serif" }}>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: toast.type === "success" ? "#1e1e2e" : "#ef4444", color: "#fff", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.3)", animation: "fadeIn 0.2s ease", whiteSpace: "nowrap" }}>
          {toast.msg}
        </div>
      )}

      {showSend        && <SendModal onClose={() => setShowSend(false)} />}
      {showDownload    && <DownloadModal html={generateHTML()} onClose={() => setShowDownload(false)} />}
      {showMobile      && <MobilePreviewModal html={generateHTML()} onClose={() => setShowMobile(false)} />}
      {showLogoUpload  && (
        <LogoUploadModal
          currentLogo={customLogo}
          onSave={(logo) => {
            setCustomLogo(logo);
            showToast(logo ? "Logo updated across all templates!" : "Logo reset to default");
          }}
          onClose={() => setShowLogoUpload(false)}
        />
      )}

      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #eee", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 8px rgba(15,118,110,.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Logo customLogo={customLogo} />
          <div style={{ width: 1, height: 24, background: "#eee" }} />
          <span style={{ fontWeight: 600, fontSize: 14, color: "#1e1e2e" }}>Email Templates</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Logo change button — prominent in header */}
          <button
            onClick={() => setShowLogoUpload(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: customLogo ? "#f0fdfa" : "#f0fdfa",
              border: customLogo ? "1.5px solid #99f6e4" : "1.5px dashed #99f6e4",
              borderRadius: 7, padding: "5px 12px", cursor: "pointer",
              fontSize: 11, fontWeight: 600, color: "#0f766e",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f0fdfa"; e.currentTarget.style.borderColor = "#0f766e"; }}
            onMouseLeave={e => { e.currentTarget.style.background = customLogo ? "#f0fdfa" : "#f0fdfa"; e.currentTarget.style.borderColor = customLogo ? "#99f6e4" : "#99f6e4"; }}
            title="Upload your brand logo"
          >
            <Icon name="camera" size={13} color="#0f766e" />
            {customLogo ? "Change Logo" : "Upload Logo"}
            {customLogo && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block", marginLeft: 2 }} title="Custom logo active" />}
          </button>

          <div style={{ width: 1, height: 20, background: "#eee" }} />

          {[
            { icon: "drag",   label: "Drag & Drop Editor",  action: () => { setActiveTab("editor"); showToast("Drag the ⠿ handle to reorder blocks!"); } },
            { icon: "mobile", label: "Mobile Responsive",   action: () => { if (blocks.length > 0) setShowMobile(true); else showToast("Add blocks first to preview mobile view"); } },
            { icon: "grid",   label: "Pre-built Sections",  action: () => setActiveTab("templates") },
            { icon: "pencil", label: "Easy to Customize",   action: () => setActiveTab("editor") },
          ].map(({ icon, label, action }) => (
            <button key={label} onClick={action} style={{ display: "flex", alignItems: "center", gap: 5, color: "#0f766e", fontSize: 11, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6, transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f0fdfa"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              <Icon name={icon} size={14} color="#0f766e"/>{label}
            </button>
          ))}
        </div>
      </header>

      {/* Custom logo active banner */}
      {customLogo && (
        <div style={{ background: "#f0fdf4", borderBottom: "1px solid #bbf7d0", padding: "6px 24px", display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#166534" }}>
          <span style={{ fontSize: 14 }}>✓</span>
          <span>Custom logo is active — appearing in all templates and the editor.</span>
          <button onClick={() => { setCustomLogo(null); showToast("Logo reset to default"); }} style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 11, color: "#16a34a", cursor: "pointer", fontWeight: 600, textDecoration: "underline" }}>Remove</button>
        </div>
      )}

      {/* Tab Bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #eee", padding: "0 24px", display: "flex" }}>
        {[{ key: "templates", label: "📋 Templates" }, { key: "editor", label: "✏️ Editor" }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ background: "none", border: "none", padding: "14px 20px", cursor: "pointer", fontWeight: 600, fontSize: 13, color: activeTab === tab.key ? "#0f766e" : "#888", borderBottom: activeTab === tab.key ? "2px solid #0f766e" : "2px solid transparent", transition: "all 0.15s" }}>{tab.label}</button>
        ))}
      </div>

      {/* Templates Grid */}
      {activeTab === "templates" && (
        <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1e1e2e" }}>Choose a Template</h2>
              <p style={{ margin: "4px 0 0", color: "#888", fontSize: 13 }}>Pick a pre-built template or start from a blank canvas</p>
            </div>
            {/* Logo upload shortcut on templates page too */}
            <button
              onClick={() => setShowLogoUpload(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: customLogo ? "#f0fdfa" : "#f0fdfa", border: customLogo ? "1.5px solid #99f6e4" : "1.5px dashed #99f6e4", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#0f766e", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f0fdfa"; }}
              onMouseLeave={e => { e.currentTarget.style.background = customLogo ? "#f0fdfa" : "#f0fdfa"; }}
            >
              <Icon name="camera" size={14} color="#0f766e" />
              {customLogo ? "Change Logo" : "Upload Your Logo"}
              <span style={{ fontSize: 10, color: "#9b83ff", fontWeight: 400 }}>— replaces all template logos</span>
            </button>
          </div>

          {savedTemplates.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: 15, color: "#1e1e2e" }}>Saved in Database</h3>
                <span style={{ fontSize: 11, color: "#888" }}>{savedTemplates.length} template{savedTemplates.length === 1 ? "" : "s"}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                {savedTemplates.map((template) => (
                  <div key={template._id} style={{ background: "#fff", border: "1px solid #ccfbf1", borderRadius: 10, padding: 12, boxShadow: "0 2px 10px rgba(15,118,110,0.08)" }}>
                    <div style={{ fontWeight: 700, color: "#1e1e2e", fontSize: 13 }}>{template.name}</div>
                    <div style={{ color: "#888", fontSize: 11, margin: "4px 0 10px" }}>{template.subject || "Campaign update"}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => loadDatabaseTemplate(template)} style={{ flex: 1, background: "#0f766e", color: "#fff", border: "none", borderRadius: 6, padding: "7px 8px", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>Edit</button>
                      <button onClick={() => { loadDatabaseTemplate(template); onUseTemplate?.(template); }} style={{ flex: 1, background: "#f0fdfa", color: "#0f766e", border: "none", borderRadius: 6, padding: "7px 8px", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>Use</button>
                      <button onClick={() => deleteDatabaseTemplate(template)} style={{ background: "#fff0f0", color: "#ef4444", border: "none", borderRadius: 6, padding: "7px 8px", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 24 }}>
            {TEMPLATES.map(({ id, label, Component }) => (
              <div key={id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ textAlign: "center", fontWeight: 600, fontSize: 12, color: "#555", marginBottom: 4 }}>{label}</div>
                <div
                  style={{ border: selectedTemplate === id ? "2px solid #0f766e" : "2px solid #eee", borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 2px 12px rgba(0,0,0,.06)", transform: selectedTemplate === id ? "scale(1.01)" : "scale(1)" }}
                  onClick={() => loadTemplate(id)}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(15,118,110,0.15)"; e.currentTarget.style.transform = "scale(1.02)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,.06)"; e.currentTarget.style.transform = selectedTemplate === id ? "scale(1.01)" : "scale(1)"; }}
                >
                  <Component customLogo={customLogo} />
                </div>
                <button
                  onClick={() => loadTemplate(id)}
                  style={{ background: selectedTemplate === id ? "#0f766e" : "#f0fdfa", color: selectedTemplate === id ? "#fff" : "#0f766e", border: "none", borderRadius: 6, padding: "8px 0", fontWeight: 600, fontSize: 11, cursor: "pointer", width: "100%", transition: "all 0.2s" }}
                  onMouseEnter={e => { if (selectedTemplate !== id) { e.currentTarget.style.background = "#0f766e"; e.currentTarget.style.color = "#fff"; } }}
                  onMouseLeave={e => { if (selectedTemplate !== id) { e.currentTarget.style.background = "#f0fdfa"; e.currentTarget.style.color = "#0f766e"; } }}
                >
                  {selectedTemplate === id ? "✓ Loaded" : id === "blank" ? "Start Blank →" : "Use Template →"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor */}
      {activeTab === "editor" && (
        <div style={{ display: "flex", height: "calc(100vh - 100px)" }}>
          {/* Sidebar */}
          <aside style={{ width: 220, background: "#fff", borderRight: "1px solid #eee", padding: 16, overflowY: "auto", flexShrink: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#1e1e2e", marginBottom: 8 }}>Template Details</div>
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name"
              style={{ width: "100%", border: "1px solid #ccfbf1", borderRadius: 6, padding: "8px 9px", fontSize: 12, marginBottom: 8, color: "#1e1e2e", background: "#fff" }}
            />
            <input
              value={templateSubject}
              onChange={(e) => setTemplateSubject(e.target.value)}
              placeholder="Email subject"
              style={{ width: "100%", border: "1px solid #ccfbf1", borderRadius: 6, padding: "8px 9px", fontSize: 12, marginBottom: 14, color: "#1e1e2e", background: "#fff" }}
            />

            <div style={{ fontWeight: 700, fontSize: 13, color: "#1e1e2e", marginBottom: 12 }}>Add Blocks</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {BLOCK_TYPES.map(({ type, label, desc }) => (
                <button key={type} onClick={() => addBlock(type)} style={{ background: "#f0fdfa", border: "1px solid #ccfbf1", borderRadius: 6, padding: "8px 10px", cursor: "pointer", textAlign: "left", fontSize: 12, color: "#0f766e", fontWeight: 500, display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#f0fdfa"; e.currentTarget.style.borderColor = "#99f6e4"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#f0fdfa"; e.currentTarget.style.borderColor = "#ccfbf1"; }}>
                  <span style={{ fontSize: 14 }}>{label}</span>
                  <span style={{ color: "#888", fontSize: 11 }}>{desc}</span>
                  {type === "image_placeholder" && <span style={{ marginLeft: "auto", fontSize: 9, background: "#0f766e", color: "#fff", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>NEW</span>}
                </button>
              ))}
            </div>

            {/* Logo section in sidebar */}
            <div style={{ marginTop: 20, fontWeight: 700, fontSize: 13, color: "#1e1e2e", marginBottom: 8 }}>Logo</div>
            <div
              onClick={() => setShowLogoUpload(true)}
              style={{ border: "1.5px dashed #99f6e4", borderRadius: 8, padding: "12px 8px", cursor: "pointer", textAlign: "center", background: "#f0fdfa", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f0fdfa"; e.currentTarget.style.borderColor = "#0f766e"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#f0fdfa"; e.currentTarget.style.borderColor = "#99f6e4"; }}
            >
              {customLogo ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <img src={customLogo} alt="Your logo" style={{ height: 28, maxWidth: 160, objectFit: "contain" }} />
                  <span style={{ fontSize: 10, color: "#0f766e", fontWeight: 600 }}>Click to change</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <Icon name="camera" size={20} color="#9b83ff" />
                  <span style={{ fontSize: 11, color: "#0f766e", fontWeight: 600 }}>Upload your logo</span>
                  <span style={{ fontSize: 9, color: "#bbb" }}>PNG · SVG · JPG</span>
                </div>
              )}
            </div>

            {/* Background colors */}
            <div style={{ marginTop: 20, fontWeight: 700, fontSize: 13, color: "#1e1e2e", marginBottom: 8 }}>Background</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4 }}>
              {BG_COLORS.map(c => (
                <div key={c} title={c} onClick={() => setEditorBg(c)} style={{ width: "100%", aspectRatio: "1", borderRadius: 4, background: c, cursor: "pointer", border: editorBg === c ? "2.5px solid #0f766e" : "1.5px solid #ddd", transition: "transform 0.1s", boxSizing: "border-box" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.2)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"} />
              ))}
            </div>
            <div style={{ marginTop: 6, fontSize: 10, color: "#bbb", textAlign: "center" }}>40 colours · click to apply</div>

            <div style={{ marginTop: 20, fontWeight: 700, fontSize: 13, color: "#1e1e2e", marginBottom: 8 }}>Templates</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {TEMPLATES.map(({ id, label }) => (
                <button key={id} onClick={() => loadTemplate(id)} style={{ background: selectedTemplate === id ? "#f0fdfa" : "none", border: "none", padding: "5px 8px", borderRadius: 5, cursor: "pointer", textAlign: "left", fontSize: 11, color: selectedTemplate === id ? "#0f766e" : "#666", fontWeight: selectedTemplate === id ? 600 : 400, transition: "background 0.15s" }}
                  onMouseEnter={e => { if (selectedTemplate !== id) e.currentTarget.style.background = "#f0fdfa"; }}
                  onMouseLeave={e => { if (selectedTemplate !== id) e.currentTarget.style.background = "none"; }}>
                  {label}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f0f0f0" }}>
              <button onClick={clearAll} style={{ width: "100%", background: "none", border: "1.5px solid #fecaca", borderRadius: 6, padding: "7px", cursor: "pointer", color: "#ef4444", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#fff0f0"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                <Icon name="trash" size={12} color="#ef4444" /> Clear All
              </button>
            </div>
          </aside>

          {/* Canvas */}
          <main style={{ flex: 1, overflowY: "auto", padding: 24, background: "#f4f3ff" }}>
            {/* Toolbar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, background: "#fff", borderRadius: 8, padding: "8px 16px", boxShadow: "0 1px 4px rgba(0,0,0,.06)", flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#1e1e2e" }}>
                {selectedTemplate ? TEMPLATES.find(t => t.id === selectedTemplate)?.label + " — Editor" : "Custom Email — Editor"}
                <span style={{ marginLeft: 8, fontSize: 11, color: "#aaa", fontWeight: 400 }}>
                  {blocks.length} block{blocks.length !== 1 ? "s" : ""} · Drag ⠿ to reorder
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  { label: preview ? "Edit" : "Preview", icon: "eye", action: () => setPreview(p => !p), active: preview },
                  { label: "Save", icon: "check", action: saveTemplateToDB, active: false },
                  { label: "Use in Campaign", icon: "send", action: useTemplateInCampaign, active: false, accent: true },
                  { label: "Mobile", icon: "mobile", action: () => { if (blocks.length > 0) setShowMobile(true); else showToast("Add blocks first!"); }, active: false },
                  { label: copied ? "Copied!" : "Copy HTML", icon: "copy", action: handleCopy, active: copied },
                  { label: "Download", icon: "download", action: () => { if (blocks.length > 0) setShowDownload(true); else showToast("Add blocks first!"); }, active: false },
                  { label: "Quick Send", icon: "send", action: () => { if (blocks.length > 0) setShowSend(true); else showToast("Add blocks first!"); }, active: false },
                ].map(({ label, icon, action, active, accent }) => (
                  <button key={label} onClick={action} style={{ background: accent ? "#0f766e" : active ? "#0f766e" : "#f0fdfa", color: accent || active ? "#fff" : "#0f766e", border: "none", borderRadius: 6, padding: "7px 12px", fontWeight: 600, fontSize: 11, cursor: "pointer", display: "flex", gap: 5, alignItems: "center", transition: "all 0.15s", boxShadow: accent ? "0 2px 8px rgba(15,118,110,0.3)" : "none" }}
                    onMouseEnter={e => { if (!active && !accent) { e.currentTarget.style.background = "#0f766e"; e.currentTarget.style.color = "#fff"; } }}
                    onMouseLeave={e => { if (!active && !accent) { e.currentTarget.style.background = "#f0fdfa"; e.currentTarget.style.color = "#0f766e"; } }}>
                    <Icon name={icon} size={12} color={accent || active ? "#fff" : "#0f766e"} /> {label}
                  </button>
                ))}
              </div>
            </div>

            {!preview && blocks.length > 1 && (
              <div style={{ maxWidth: 560, margin: "0 auto 10px", background: "#f0fdfa", borderRadius: 6, padding: "6px 12px", fontSize: 11, color: "#0f766e", display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="drag" size={12} color="#0f766e" />
                Grab the ⠿ handle on the left to drag and reorder blocks
              </div>
            )}

            {/* Email canvas */}
            <div style={{ maxWidth: 560, margin: "0 auto", background: editorBg, borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,.12)", overflow: "hidden", minHeight: 400 }}>
              {/* Email top bar */}
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${isDarkBg ? "#333" : "#f0f0f0"}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: editorBg }}>
                {/* Clickable logo area */}
                <div
                  onClick={() => setShowLogoUpload(true)}
                  title="Click to change logo"
                  style={{
                    cursor: "pointer",
                    padding: "3px 6px",
                    borderRadius: 6,
                    border: "1.5px dashed transparent",
                    transition: "all 0.15s",
                    position: "relative",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.border = "1.5px dashed #99f6e4";
                    e.currentTarget.style.background = "rgba(15,118,110,0.04)";
                    e.currentTarget.querySelector(".logo-hint").style.opacity = "1";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.border = "1.5px dashed transparent";
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.querySelector(".logo-hint").style.opacity = "0";
                  }}
                >
                  <Logo customLogo={customLogo} />
                  <span className="logo-hint" style={{ position: "absolute", top: "50%", left: "calc(100% + 6px)", transform: "translateY(-50%)", background: "#1e1e2e", color: "#fff", fontSize: 9, padding: "3px 7px", borderRadius: 4, whiteSpace: "nowrap", opacity: 0, transition: "opacity 0.15s", pointerEvents: "none", fontWeight: 500 }}>
                    ✏️ Change logo
                  </span>
                </div>
                <span style={{ fontSize: 10, color: isDarkBg ? "#888" : "#aaa", cursor: "pointer" }} onClick={() => showToast("View in browser — feature coming soon!")}>
                  View in browser
                </span>
              </div>

              {/* Blocks area */}
              <div style={{ padding: "20px" }}>
                {preview ? (
                  <div dangerouslySetInnerHTML={{ __html: generateHTML() }} style={{ fontSize: 13, lineHeight: 1.6 }} />
                ) : (
                  <>
                    {blocks.length === 0 && (
                      <div style={{ textAlign: "center", padding: "40px 20px", color: "#bbb", fontSize: 13, lineHeight: 1.8 }}>
                        <div style={{ fontSize: 36, marginBottom: 12 }}>📧</div>
                        <div style={{ fontWeight: 600, color: isDarkBg ? "#aaa" : "#888" }}>Your canvas is empty</div>
                        <div style={{ color: isDarkBg ? "#666" : "#bbb" }}>← Add blocks from the sidebar to start building</div>
                        <div style={{ marginTop: 8, fontSize: 12, color: isDarkBg ? "#555" : "#ccc" }}>or pick a template from the Templates tab</div>
                      </div>
                    )}
                    {blocks.map((block, idx) => (
                      <div
                        key={block.id}
                        draggable
                        onDragStart={e => handleDragStart(e, idx)}
                        onDragOver={e => handleDragOver(e, idx)}
                        onDrop={e => handleDrop(e, idx)}
                        onDragEnd={handleDragEnd}
                        style={{ borderTop: dragOverIndex === idx && dragIndex !== idx ? "2px solid #0f766e" : "2px solid transparent", transition: "border-color 0.1s" }}
                      >
                        <BlockEditor
                          block={block}
                          onChange={updated => updateBlock(block.id, updated)}
                          onDelete={() => deleteBlock(block.id)}
                          onMoveUp={() => moveUp(idx)}
                          onMoveDown={() => moveDown(idx)}
                          isFirst={idx === 0}
                          isLast={idx === blocks.length - 1}
                          isDragging={dragIndex === idx}
                          dragHandleProps={{}}
                        />
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Email footer */}
              <div style={{ padding: "14px 20px", borderTop: `1px solid ${isDarkBg ? "#333" : "#f0f0f0"}`, background: isDarkBg ? "#111" : "#fafafa", textAlign: "center" }}>
                <SocialRow />
                <div style={{ fontSize: 10, color: "#aaa", marginTop: 8 }}>© 2024 MailNova. All rights reserved.</div>
                <div style={{ fontSize: 10, marginTop: 3 }}>
                  <span style={{ color: "#bbb", cursor: "pointer" }} onClick={() => showToast("Unsubscribe link clicked")}>Unsubscribe</span>
                  <span style={{ color: "#ddd" }}> | </span>
                  <span style={{ color: "#bbb", cursor: "pointer" }} onClick={() => showToast("Privacy Policy clicked")}>Privacy Policy</span>
                </div>
              </div>
            </div>

            <div style={{ height: 40 }} />
          </main>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f4f3ff; }
        ::-webkit-scrollbar-thumb { background: #99f6e4; border-radius: 3px; }
        textarea { field-sizing: content; }
      `}</style>
    </div>
  );
}
