'use client';

import { useEffect, useRef, useState } from 'react';

// Defers mounting (and therefore downloading) expensive children so they
// don't compete with the critical first paint. Two gates, both must pass:
//  1. The page has finished loading (or gone idle) - on common viewport
//     heights this section sits within the first screen, so viewport
//     visibility alone doesn't defer anything; the page needs to be settled
//     first.
//  2. The wrapper is actually visible (so it still behaves lazily for
//     taller pages/smaller viewports where this genuinely starts off-screen).
export default function LazyOnVisible({ children, placeholder = null, rootMargin = '0px', minHeight }) {
  const ref = useRef(null);
  const [pageSettled, setPageSettled] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (document.readyState === 'complete') {
      setPageSettled(true);
      return;
    }
    const onLoad = () => setPageSettled(true);
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  useEffect(() => {
    if (!pageSettled) return;
    if (visible || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSettled]);

  if (visible) return <>{children}</>;

  return <div ref={ref} style={minHeight ? { minHeight } : undefined}>{placeholder}</div>;
}
