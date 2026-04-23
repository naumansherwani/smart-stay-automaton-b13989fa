import { forwardRef } from "react";

const AnimatedTopBorder = forwardRef<HTMLDivElement>(function AnimatedTopBorder(_, ref) {
  return (
    <div ref={ref} className="fixed top-0 left-0 right-0 z-[9999] h-[3px]">
      <div
        className="h-full w-full animate-[borderFlow_8s_linear_infinite]"
        style={{
          backgroundSize: "300% 100%",
          backgroundImage:
            "linear-gradient(90deg, #14B8A6, #0EA5E9, #4F46E5, #8B5CF6, #DB2777, #F97316, #D4AF37, #F59E0B, #22C55E, #14B8A6)",
          boxShadow:
            "0 0 8px rgba(20,184,166,0.5), 0 0 16px rgba(14,165,233,0.3), 0 0 8px rgba(139,92,246,0.4)",
        }}
      />
    </div>
  );
});

export default AnimatedTopBorder;
