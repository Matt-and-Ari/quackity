import { useEffect, useState } from "react";

const DEFAULT_BREAKPOINT = 768;

interface UseIsMobileProps {
  breakpoint?: number;
}

export function useIsMobile(props: UseIsMobileProps = {}) {
  const breakpoint = props.breakpoint ?? DEFAULT_BREAKPOINT;
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < breakpoint,
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    function handleChange(event: MediaQueryListEvent) {
      setIsMobile(event.matches);
    }

    setIsMobile(mql.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, [breakpoint]);

  return isMobile;
}
