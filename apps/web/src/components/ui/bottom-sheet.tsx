import React, { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Phone-sized modal drawer.
 *
 * The studio's authoring surfaces were all written as ~380-400px desktop rail
 * panels. Their *contents* are fine on a phone — it is only the container that
 * assumes a column of screen to the right of the pitch. This gives them a
 * container that does not, so the panels themselves are reused unchanged rather
 * than forked into mobile copies.
 *
 * Deliberately not a `<dialog>`: the studio keeps the board interactive
 * underneath while a sheet is open (you adjust a colour and watch the pitch),
 * and a modal dialog's inertness would take that away.
 */
interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /**
   * Share of the viewport the sheet may grow to. Capped rather than fixed so a
   * short panel stays short instead of leaving a band of empty sheet.
   */
  maxHeightVh?: number;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  title,
  children,
  maxHeightVh = 72,
}) => {
  // Escape closes, matching every other dismissible surface in the app.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Scrim. Rendered even when closed so it can fade rather than pop, but
          click-through is restored so a closed sheet never eats a drag. */}
      <div
        onClick={onClose}
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 90,
          background: 'rgba(21,20,15,0.45)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.22s ease',
        }}
      />

      <section
        role="dialog"
        aria-label={title}
        aria-hidden={!open}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 91,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: `${maxHeightVh}vh`,
          background: 'var(--surface-container)',
          borderTop: 'var(--border-w) solid var(--ink)',
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          boxShadow: '0 -6px 0 rgba(21,20,15,0.12)',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.26s cubic-bezier(0.4,0,0.2,1)',
          // A closed sheet is still in the tree; keep it out of the tab order
          // and out of the way of pointers on the board behind it.
          visibility: open ? 'visible' : 'hidden',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '12px 16px',
            borderBottom: 'var(--border-w) solid var(--ink)',
            flexShrink: 0,
          }}
        >
          {/* Grab handle, purely affordance — the sheet is button-dismissed. */}
          <span
            aria-hidden
            style={{
              position: 'absolute',
              left: '50%',
              top: 6,
              transform: 'translateX(-50%)',
              width: 38,
              height: 4,
              borderRadius: 2,
              background: 'var(--outline)',
              opacity: 0.5,
            }}
          />
          <h2
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.01em',
              color: 'var(--on-surface)',
            }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 10,
              border: 'var(--border-w) solid var(--ink)',
              background: 'var(--surface-low)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </header>

        <div style={{ overflowY: 'auto', padding: 14, minHeight: 0 }}>
          {children}
        </div>
      </section>
    </>
  );
};

export default BottomSheet;
