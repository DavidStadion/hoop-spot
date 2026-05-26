import { useEffect, useRef, useState } from 'react';
import type { Goal } from '../data/types';
import { buildPoster } from '../lib/poster';
import styles from './PosterPreview.module.css';

interface Props {
  goal: Goal | null;
  open: boolean;
  onClose: () => void;
}

export function PosterPreview({ goal, open, onClose }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!open || !goal) return;
    setDataUrl(null);
    // Build off the main thread frame so the modal can paint first
    const id = requestAnimationFrame(() => {
      const canvas = buildPoster(goal);
      canvasRef.current = canvas;
      setDataUrl(canvas.toDataURL('image/png'));
    });
    return () => cancelAnimationFrame(id);
  }, [open, goal]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function handleDownload() {
    if (!canvasRef.current || !goal) return;
    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `goal-spot-${goal.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 200);
    }, 'image/png');
  }

  async function handleShare() {
    if (!canvasRef.current || !goal) return;
    const navAny = navigator as Navigator & { share?: (data: ShareData) => Promise<void>; canShare?: (d: ShareData) => boolean };
    if (!navAny.share) return handleDownload();
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `goal-spot-${goal.id}.png`, { type: 'image/png' });
      const data: ShareData = { files: [file], title: `${goal.scorer} — ${goal.meta.year}`, text: `${goal.scorer} for ${goal.meta.team} (${goal.meta.year})` };
      if (navAny.canShare?.(data)) {
        try { await navAny.share!(data); } catch { /* user cancelled */ }
      } else {
        handleDownload();
      }
    }, 'image/png');
  }

  if (!open) return null;
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <div className={styles.backdrop} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.sheet} role="dialog" aria-label="Hoop poster preview">
        <div className={styles.head}>
          <span className={styles.eyebrow}>Hoop Poster</span>
          <h3 className={styles.title}>{goal?.scorer}</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.previewWrap}>
          {dataUrl ? (
            <img src={dataUrl} alt="Generated goal poster" className={styles.preview} />
          ) : (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <span>Rendering your poster…</span>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          {canShare && (
            <button className={styles.secondaryBtn} onClick={handleShare} disabled={!dataUrl}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
                <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
              </svg>
              Share
            </button>
          )}
          <button className={styles.primaryBtn} onClick={handleDownload} disabled={!dataUrl}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v13M6 11l6 6 6-6M5 21h14" />
            </svg>
            Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}
