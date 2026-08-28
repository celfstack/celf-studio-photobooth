import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  renderStrip,
  stripDateLabel,
  type BorderStyle,
} from "../lib/strip/render";
import {
  getSessionPhotos,
  getSessionStrip,
  resetSession,
  setSessionStrip,
} from "../lib/strip/session";

export const Route = createFileRoute("/print")({
  component: Print,
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const BORDER_OPTIONS: Array<{ id: BorderStyle; label: string }> = [
  { id: "classic", label: "classic thin" },
  { id: "thick", label: "thick vintage" },
  { id: "none", label: "no border" },
];

function Print() {
  const navigate = useNavigate();
  const [stripUrl, setStripUrl] = useState<string | null>(null);
  const [dropped, setDropped] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [border, setBorder] = useState<BorderStyle>("classic");
  const [reprinting, setReprinting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const existing = getSessionStrip();
    if (existing) {
      setStripUrl(existing.url);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setDropped(true)),
      );
      return;
    }
    const photos = getSessionPhotos();
    if (photos.length !== 4) {
      void navigate({ to: "/" });
      return;
    }
    const started = Date.now();
    void (async () => {
      try {
        const result = await renderStrip(photos);
        // The machine takes a moment, always.
        await sleep(Math.max(0, 1200 - (Date.now() - started)));
        if (cancelled) {
          URL.revokeObjectURL(result.url);
          return;
        }
        setSessionStrip({ url: result.url, blob: result.blob });
        setStripUrl(result.url);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => setDropped(true)),
        );
      } catch {
        if (!cancelled) {
          setRenderError(
            "The printer jammed. Nothing was lost, take another strip.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const onDownload = useCallback(() => {
    if (!stripUrl) return;
    const a = document.createElement("a");
    a.href = stripUrl;
    a.download = `celf-studio-${stripDateLabel().toLowerCase().replaceAll(" ", "-")}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [stripUrl]);

  const onTakeAnother = useCallback(() => {
    resetSession();
    void navigate({ to: "/booth" });
  }, [navigate]);

  const onBorder = useCallback(
    (next: BorderStyle) => {
      if (next === border || reprinting) return;
      const photos = getSessionPhotos();
      if (photos.length !== 4) return;
      setBorder(next);
      setReprinting(true);
      void renderStrip(photos, next)
        .then((result) => {
          setSessionStrip({ url: result.url, blob: result.blob });
          setStripUrl(result.url);
        })
        .catch(() => {
          setRenderError(
            "The printer jammed on that border. Try picking it again.",
          );
        })
        .finally(() => setReprinting(false));
    },
    [border, reprinting],
  );

  const canRestyle = getSessionPhotos().length === 4;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      {/* delivery sign */}
      <div className="rounded-lg bg-gradient-to-b from-chrome to-chrome-deep px-6 py-3 shadow-[0_8px_20px_-10px_rgba(42,36,30,0.5)]">
        <p className="font-type text-center text-[11px] font-bold tracking-[0.22em] text-ink/85 uppercase">
          Photos delivered here
          <br />
          in 1 second
        </p>
        <p aria-hidden="true" className="text-center text-base leading-none text-ink/85">
          &#8595;
        </p>
      </div>

      {/* the chute */}
      <div className="mt-4 w-full max-w-xs">
        <div className="rounded-[26px] bg-gradient-to-b from-chrome to-chrome-deep p-3 shadow-[0_24px_60px_-24px_rgba(42,36,30,0.65)]">
          <div className="relative overflow-hidden rounded-[18px] bg-[#14100c] px-7 py-5 shadow-[inset_0_6px_18px_rgba(0,0,0,0.8)]">
            <div className="min-h-[26rem]">
              {stripUrl ? (
                <div
                  className="strip-delivery mx-auto w-36 sm:w-40"
                  data-delivered={dropped ? "true" : "false"}
                >
                  <button
                    type="button"
                    onClick={() => setViewerOpen(true)}
                    aria-label="View your photo strip in full size"
                    className="block w-full cursor-zoom-in rounded-[3px] transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-paper"
                  >
                    <img
                      src={stripUrl}
                      alt="Photo strip of four contrasty sepia frames with a celfstudio footer"
                      className="w-full rounded-[3px] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.8)]"
                    />
                  </button>
                </div>
              ) : (
                <p
                  className="font-hand flex min-h-[26rem] items-center justify-center text-center text-2xl text-paper/60"
                  aria-live="polite"
                >
                  {renderError ? "" : "developing ..."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {renderError ? (
        <p role="alert" className="mt-4 text-center text-sm text-rust">
          {renderError}
        </p>
      ) : null}
      {stripUrl ? (
        <p className="font-hand mt-3 text-lg text-ink-soft">
          click the strip to see it up close
        </p>
      ) : null}

      {/* border styles */}
      {stripUrl && canRestyle ? (
        <div
          role="radiogroup"
          aria-label="Strip border style"
          className="mt-5 inline-flex rounded-full border border-ink/20 bg-paper-deep/60 p-1"
        >
          {BORDER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={border === opt.id}
              disabled={reprinting}
              onClick={() => onBorder(opt.id)}
              className={`font-hand rounded-full px-4 py-1.5 text-lg transition-colors duration-200 disabled:cursor-wait ${
                border === opt.id
                  ? "bg-ink text-paper"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
      {reprinting ? (
        <p className="font-type mt-2 text-xs text-ink-soft" aria-live="polite">
          reprinting
        </p>
      ) : null}

      {/* actions */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={onDownload}
          disabled={!stripUrl}
          className="rounded-full bg-ink px-7 py-3 text-base font-semibold text-paper transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-10px_rgba(42,36,30,0.7)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Download
        </button>
        <button
          type="button"
          onClick={onTakeAnother}
          className="font-hand rounded-full border-2 border-dashed border-ink/40 px-6 py-3 text-xl text-ink transition-colors duration-200 hover:border-rust hover:text-rust active:scale-[0.98]"
        >
          take another &#10022;
        </button>
      </div>

      {/* full-size viewer */}
      {viewerOpen && stripUrl ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Your photo strip, full size"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-ink/85 px-4 py-8 backdrop-blur-sm"
          onClick={() => setViewerOpen(false)}
        >
          <img
            src={stripUrl}
            alt="Photo strip of four contrasty sepia frames with a celfstudio footer"
            className="max-h-[76dvh] w-auto rounded-[4px] shadow-[0_40px_90px_-20px_rgba(0,0,0,0.9)]"
            onClick={(e) => e.stopPropagation()}
          />
          <div
            className="flex flex-wrap items-center justify-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onDownload}
              className="rounded-full bg-paper px-7 py-3 text-base font-semibold text-ink transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97]"
            >
              Download
            </button>
            <button
              type="button"
              onClick={onTakeAnother}
              className="font-hand rounded-full border-2 border-dashed border-paper/60 px-6 py-3 text-xl text-paper transition-colors duration-200 hover:border-paper active:scale-[0.98]"
            >
              take another &#10022;
            </button>
            <button
              type="button"
              onClick={() => setViewerOpen(false)}
              className="font-type text-sm text-paper/70 underline-offset-4 transition-colors duration-200 hover:text-paper hover:underline"
            >
              close
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
