import { Profiler } from 'react';

function isRenderProfilerEnabled() {
  if (typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem('DEBUG_RENDER') === '1';
  } catch {
    return false;
  }
}

function onRender(id, phase, actualDuration, baseDuration, startTime, commitTime) {
  console.log(`[render] ${id} ${phase}`, {
    actualDuration: Number(actualDuration.toFixed(2)),
    baseDuration: Number(baseDuration.toFixed(2)),
    startTime: Number(startTime.toFixed(2)),
    commitTime: Number(commitTime.toFixed(2)),
  });
}

export default function RenderProfiler({ id, children }) {
  if (!isRenderProfilerEnabled()) {
    return children;
  }

  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
}
