'use client';

import { useEffect, useRef } from 'react';

export default function Experience() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    let disposed = false;
    let cleanup = () => {};

    import('@/lib/scene').then(({ startExperience }) => {
      if (disposed || !rootRef.current) return;
      try {
        cleanup = startExperience(rootRef.current);
      } catch (error) {
        console.error(error);
      }
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <div ref={rootRef} id="experience" />;
}
