import { Instagram, MapPin, MessageCircle, AtSign, Music2 } from "lucide-react";
import defaultCover from "@/assets/cover.jpg";
import defaultLogo from "@/assets/logo.jpg";

export type StoreView = {
  name: string; slug: string; description: string | null;
  cover_image: string | null; logo_image: string | null; address: string | null; maps_url: string | null;
  instagram_url: string | null; threads_url: string | null; tiktok_url: string | null;
};

function LinkButton({ href, icon: Icon, title, desc }: { href: string; icon: typeof MapPin; title: string; desc?: string | undefined }) {
  return (
    <a href={href} className="link-card" rel="nofollow">
      <span className="flex items-center justify-center gap-2 font-display text-xl font-semibold tracking-wide">
        <Icon className="h-4 w-4 text-gold" /> {title}
      </span>
      {desc && <span className="mt-1 block text-sm text-muted-foreground">{desc}</span>}
    </a>
  );
}

export function StorePage({ store, unavailable, generalContact }: { store: StoreView; unavailable?: boolean; generalContact?: string | null }) {
  const socials = [
    { url: store.instagram_url, icon: Instagram, label: "Instagram" },
    { url: store.threads_url, icon: AtSign, label: "Threads" },
    { url: store.tiktok_url, icon: Music2, label: "TikTok" },
  ].filter((s) => s.url);
  const maps = store.maps_url || (store.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}` : null);

  return (
    <main className="mx-auto min-h-screen w-full max-w-[480px] bg-background pb-12 shadow-2xl">
      <div className="relative h-52 w-full overflow-hidden">
        <img src={store.cover_image || defaultCover} alt="" width={1024} height={640} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      </div>
      <div className="-mt-16 flex flex-col items-center px-6 text-center">
        <img src={store.logo_image || defaultLogo} alt="Cavalheiro Camisaria" width={128} height={128}
          className="relative h-32 w-32 rounded-full border-2 border-gold object-cover shadow-xl" />
        <p className="mt-4 text-xs uppercase tracking-[0.3em] text-gold">Cavalheiro Camisaria</p>
        <h1 className="mt-1 font-display text-4xl font-semibold">{store.name}</h1>
        {store.description && <p className="mt-2 text-sm text-muted-foreground">{store.description}</p>}
        {socials.length > 0 && (
          <div className="mt-4 flex gap-4">
            {socials.map((s) => (
              <a key={s.label} href={s.url!} target="_blank" rel="noreferrer" aria-label={s.label}
                className="text-foreground transition-colors hover:text-gold"><s.icon className="h-5 w-5" /></a>
            ))}
          </div>
        )}
      </div>

      {unavailable && (
        <div className="mx-6 mt-6 rounded-lg border border-gold/50 bg-accent p-4 text-center text-sm">
          No momento nossos consultores estão indisponíveis.
          {generalContact && (<> <a href={generalContact} className="font-semibold text-gold underline">Fale com a loja</a>.</>)}
        </div>
      )}

      <nav className="mt-8 flex flex-col gap-3 px-6" aria-label="Atendimento da loja">
        <LinkButton href={`/redirect/${store.slug}/whatsapp`} icon={MessageCircle} title="Fale com um vendedor" desc="Atendimento pelo WhatsApp" />
        {maps && <LinkButton href={maps} icon={MapPin} title="Endereço da loja" desc={store.address ?? undefined} />}
      </nav>
    </main>
  );
}
