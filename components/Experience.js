'use client';

import { useEffect } from 'react';

// Starts the WebGL stage and scroll choreography on top of the server-rendered page.
export default function Experience() {
  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    import('@/lib/scene').then(({ startExperience }) => {
      const root = document.getElementById('site');
      if (disposed || !root) return;
      try {
        cleanup = startExperience(root);
      } catch (error) {
        console.error(error);
      }
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return null;
}
