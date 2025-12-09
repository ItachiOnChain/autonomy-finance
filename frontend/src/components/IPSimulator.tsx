interface IPSimulatorProps {
  onRoyaltyPaid?: () => void;
}

export function IPSimulator(_props: IPSimulatorProps) {
  // NOTE: This component was part of the old mock implementation
  // It has been disabled as the new Story Protocol SDK integration
  // uses real on-chain royalty payments instead of simulated ones

  return (
    <div
      className="
        bg-black/50 backdrop-blur-xl
        border border-white/20
        rounded-2xl p-8
        text-white font-mono
      "
    >
      <h2 className="text-base tracking-[0.2em] font-bold uppercase mb-3 text-white/50">
        ROYALTY SIMULATOR
      </h2>

      <p className="text-xs text-white/40 leading-relaxed">
        This simulator was part of the mock implementation and has been disabled.
        Real royalty payments are now handled through Story Protocol on-chain.
      </p>
    </div>
  );
}
