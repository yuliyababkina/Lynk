import { useEffect, useState } from "react";

/**
 * Subscribes to a CSS media query from React.
 *
 * Used where a layout cannot be expressed in CSS alone — the chat dock renders
 * either as a pushing column or as an overlay Sheet, and only one of the two
 * may hold the conversation at a time.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    // The query may have changed since the state was initialised.
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);

  return matches;
}
