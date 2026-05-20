/**
 * Blinking caret shown at the tail of a streaming assistant message.
 * Pure presentational — sirf jab message stream ho raha ho tab render karo.
 *
 * Existing message render aur logic untouched — bas ek visual cue add karta hai.
 */
export default function TypewriterCursor({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={
        "inline-block w-[2px] h-[1em] align-[-0.15em] ml-0.5 bg-primary/90 animate-pulse " +
        className
      }
    />
  );
}