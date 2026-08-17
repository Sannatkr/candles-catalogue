import { InstagramIcon } from "@/components/instagram-icon";
import { Reveal } from "@/components/reveal";
import { getSettings } from "@/lib/data";
import { instagramDmLink } from "@/lib/format";

export const metadata = { title: "Terms & Payment" };

export default async function TermsPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-[1240px] px-5 pt-10 sm:px-8 sm:pt-16 lg:pt-20">
      <Reveal>
        <p className="eyebrow">Trade terms</p>
        <h1 className="mt-4 max-w-[18ch] font-display text-[clamp(2.3rem,5.5vw,3.7rem)] leading-[1.05] tracking-[-0.02em] text-ink">
          Terms &amp; Payment
        </h1>
        <p className="mt-5 max-w-[58ch] text-[1.02rem] leading-relaxed text-ink-soft">
          {settings.termsIntro}
        </p>
      </Reveal>

      <div className="mt-16 grid gap-14 lg:grid-cols-[220px_1fr] lg:gap-20">
        {/* Sticky index */}
        <aside className="hidden lg:block">
          <nav className="sticky top-28">
            <p className="eyebrow">On this page</p>
            <ul className="mt-4 space-y-2.5">
              {settings.termsSections.map((section) => (
                <li key={section.heading}>
                  <a
                    href={`#${slugify(section.heading)}`}
                    className="text-[0.875rem] text-ink-soft transition-colors hover:text-ember"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="max-w-[70ch]">
          {settings.termsSections.map((section, i) => (
            <Reveal
              key={section.heading}
              as="section"
              delay={i * 40}
              className="scroll-mt-28 border-b border-line py-9 first:pt-0 last:border-0"
            >
              <div id={slugify(section.heading)} className="scroll-mt-28">
                <div className="flex items-baseline gap-4">
                  <span className="font-display text-[0.95rem] text-ember">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="font-display text-[clamp(1.4rem,2.6vw,1.85rem)] leading-tight text-ink">
                    {section.heading}
                  </h2>
                </div>

                <ul className="mt-5 space-y-3.5 pl-[2.1rem]">
                  {section.body.map((line) => (
                    <li key={line} className="relative text-[0.975rem] leading-relaxed text-ink-soft">
                      <span className="absolute -left-[1.1rem] top-[0.62rem] h-1 w-1 rounded-full bg-ink-faint" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}

          <Reveal className="mt-14 rounded-[18px] border border-line bg-surface p-8 sm:p-10">
            <h2 className="font-display text-[1.5rem] leading-tight text-ink">
              Something here not working for your order?
            </h2>
            <p className="mt-3 max-w-[48ch] text-[0.95rem] leading-relaxed text-ink-soft">
              Most of these terms have some room in them, especially on repeat business. Tell us what you
              need and we will tell you honestly whether we can do it.
            </p>
            <a
              href={instagramDmLink(settings.instagramHandle)}
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-flex items-center gap-2.5 rounded-full bg-ink px-7 py-3.5 text-[0.925rem] text-canvas transition-colors hover:bg-ember"
            >
              <InstagramIcon size={17} />
              Talk to us
            </a>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
