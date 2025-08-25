import { WalletConnect } from "@/components/walletConnect";
export default function Wallet() {

  return (
    <div className="w-full min-h-screen bg-blue-pattern text-white">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/assets/background/home.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      <div>
        <div
          className="relative w-full pt-48 pb-40 m-auto flex justify-center text-center flex-col items-center z-1 text-white"
          style={{ maxWidth: "1200px" }}
        >
          <h1 className="font-funnel-display inline-block max-w-2xl lg:max-w-4xl  w-auto relative text-5xl md:text-6xl lg:text-7xl tracking-tighter mb-10 font-bold">
            Department of Investigation
          </h1>
          <p className="font-funnel-display text-xl mb-5">
            You have been assigned as an officer at the Department of Investigation.
            Connect your wallet to enter.
          </p>
          <WalletConnect />
        </div>
      </div>
    </div>
  );
}
