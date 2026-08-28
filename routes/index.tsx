import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { resetSession } from "../lib/strip/session";

export const Route = createFileRoute("/")({
  component: Home,
});

const STARS: Array<{ top: string; left: string; size: string; delay: string }> =
  [
    { top: "14%", left: "12%", size: "text-3xl", delay: "0s" },
    { top: "22%", left: "82%", size: "text-2xl", delay: "1.2s" },
    { top: "68%", left: "8%", size: "text-2xl", delay: "0.6s" },
    { top: "76%", left: "86%", size: "text-3xl", delay: "1.8s" },
    { top: "8%", left: "55%", size: "text-xl", delay: "2.4s" },
  ];

function Home() {
  const navigate = useNavigate();

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-12">
      {/* floating doodle stars */}
      {STARS.map((s, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`doodle-star pointer-events-none absolute select-none ${s.size} text-ink/25`}
          style={{ top: s.top, left: s.left, animationDelay: s.delay }}
        >
          &#10022;
        </span>
      ))}

      <h1 className="font-hand text-4xl tracking-[-1px] text-ink md:text-5xl">
        celf studio
      </h1>
      <p className="font-hand mt-2 text-lg text-ink-soft">
        a little photo booth, just for you
      </p>

      <button
        type="button"
        onClick={() => {
          resetSession();
          void navigate({ to: "/booth" });
        }}
        aria-label="Step into the photo booth"
        className="group mt-8 rounded-3xl outline-offset-8 transition-transform duration-300 ease-out hover:rotate-1 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-rust active:scale-[0.98]"
      >
        <img
          src="/assets/celfstudio-booth.webp"
          alt="Hand-drawn photo booth with a Celf Studio sign and a half-open curtain"
          width={896}
          height={1195}
          className="max-h-[62dvh] w-auto"
        />
        <span className="font-hand mt-1 block text-xl text-ink-soft transition-colors duration-200 group-hover:text-rust">
          click to step in &#10141;
        </span>
      </button>

      <footer className="absolute bottom-5 left-0 right-0">
        <p className="font-type text-center text-xs text-ink-soft">
          Four poses. Prints at 2 by 6 inches. Your photos never leave this page.
        </p>
      </footer>
    </main>
  );
}
