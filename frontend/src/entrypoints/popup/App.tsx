import { useEffect, useState, type ReactNode } from "react";
import { scrapeProduct, type ProductData } from "@/utils/scrape";

const BACKEND = "http://localhost:8000";

type View =
  | { kind: "loading" }
  | { kind: "not-amazon" }
  | { kind: "not-product" }
  | { kind: "product"; product: ProductData };

async function readActiveTab(): Promise<View> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  // The tab's URL is only visible on hosts we have permission for, i.e. Amazon.
  if (!tab?.id || !tab.url || !/^https:\/\/(www\.)?amazon\./.test(tab.url)) return { kind: "not-amazon" };
  const [injection] = await browser.scripting.executeScript({ target: { tabId: tab.id }, func: scrapeProduct });
  return injection?.result ? { kind: "product", product: injection.result } : { kind: "not-product" };
}

// undefined while loading, null when the backend couldn't shorten the title.
function useSearchTerm(title: string | undefined) {
  const [term, setTerm] = useState<string | null>();
  useEffect(() => {
    if (!title) return;
    fetch(`${BACKEND}/api/trim-title`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setTerm(data?.trimmedTitle ?? null))
      .catch(() => setTerm(null));
  }, [title]);
  return term;
}

export default function App() {
  const [view, setView] = useState<View>({ kind: "loading" });
  useEffect(() => {
    readActiveTab().then(setView, () => setView({ kind: "not-amazon" }));
  }, []);

  return (
    <div className="w-[380px]">
      <header className="flex items-center gap-2.5 px-5 pt-4 pb-3">
        <img src="/logo48.png" alt="" className="size-7 rounded-lg" />
        <span className="text-[15px] font-semibold tracking-tight">EcoShelf</span>
      </header>
      {view.kind === "loading" ? (
        <div className="h-64" />
      ) : view.kind === "product" ? (
        <Product product={view.product} />
      ) : (
        <Empty
          title={view.kind === "not-product" ? "Open a product page" : "Open a product on Amazon"}
          body={
            view.kind === "not-product"
              ? "This Amazon page isn't a single product listing. Pick a product to see its shipping details."
              : "EcoShelf reads the Amazon product you're viewing to work out how it ships to you."
          }
        />
      )}
    </div>
  );
}

function Product({ product: p }: { product: ProductData }) {
  const term = useSearchTerm(p.title);
  return (
    <main className="px-5 pb-5">
      <section className="flex gap-3.5">
        {p.image && (
          <img src={p.image} alt="" className="size-20 shrink-0 rounded-xl border border-line bg-white object-contain p-1.5" />
        )}
        <div className="min-w-0">
          <h1 className="line-clamp-3 text-[13px] leading-snug font-medium">{p.title}</h1>
          <div className="mt-1.5 flex items-baseline gap-2 text-[13px]">
            {p.price && <span className="text-base font-semibold">{p.price}</span>}
            {p.rating && (
              <span className="text-muted">
                <span className="text-accent">★</span> {p.rating}
                {p.reviewCount && ` · ${Number(p.reviewCount).toLocaleString()} ratings`}
              </span>
            )}
          </div>
        </div>
      </section>

      <SearchTerm term={term} />

      <h2 className="mt-5 mb-2 text-[11px] font-semibold tracking-wider text-muted uppercase">Shipping</h2>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line">
        <Fact label="Ships from" value={p.shipsFrom} />
        <Fact label="Sold by" value={p.soldBy} />
        <Fact label="Delivers to" value={p.deliveringTo} />
        <Fact label="Arrives" value={p.deliveryDate} />
        <Fact label="Weight" value={p.weight} />
        <Fact label="Size" value={p.dimensions} />
      </dl>

      <section className="mt-4 flex gap-3 rounded-xl bg-accent-soft p-3.5">
        <LeafIcon />
        <div>
          <h2 className="text-[13px] font-semibold">Emissions estimate</h2>
          <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
            Coming next: the CO₂ from shipping this to you, and greener sellers at a similar price.
          </p>
        </div>
      </section>
    </main>
  );
}

function SearchTerm({ term }: { term: string | null | undefined }) {
  return (
    <div className="mt-4 flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-[12px]">
      <SearchIcon />
      {term === undefined ? (
        <span className="h-2.5 w-32 animate-pulse rounded-full bg-line" />
      ) : term === null ? (
        <span className="text-muted">Search term unavailable. Is the backend running?</span>
      ) : (
        <>
          <span className="text-muted">Searching as</span>
          <span className="truncate font-medium">{term}</span>
        </>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-bg px-3 py-2.5">
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd className={`mt-0.5 truncate text-[13px] font-medium ${value ? "" : "text-muted"}`} title={value}>
        {value || "Not listed"}
      </dd>
    </div>
  );
}

function Empty({ title, body }: { title: string; body: ReactNode }) {
  return (
    <main className="flex flex-col items-center px-8 pt-6 pb-9 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-accent-soft">
        <LeafIcon size={26} />
      </div>
      <h1 className="mt-4 text-base font-semibold">{title}</h1>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{body}</p>
    </main>
  );
}

function LeafIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-accent" aria-hidden>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" className="shrink-0 text-muted" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
