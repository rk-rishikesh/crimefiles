import Image from "next/image";
import Link from "next/link";
export default function Home() {
  return (
    <main className="bg-[#0b0608] text-zinc-100">
      {/* Top section: background video */}
      <section className="relative h-screen overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/assets/background/home.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 flex h-full items-center justify-center px-6 text-center">
          <div>
            <Image src="/assets/logo.svg" alt="Home" width={1000} height={1000} />
            <div className="font-funnel-display text-xl">
              <Link href="/case-files">_ INSPECT THE FILES _</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
