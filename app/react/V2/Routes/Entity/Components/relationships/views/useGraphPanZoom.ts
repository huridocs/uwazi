import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import type { GraphTransform } from '#V2/formatters/relationships/relationshipsPanelGraph.js';

const STEP = 0.25;

const useGraphPanZoom = (fit: GraphTransform, fitKey: string) => {
  const [transform, setTransform] = useState(fit);
  const fitRef = useRef(fit);
  const lastFitKey = useRef(fitKey);
  fitRef.current = fit;

  useEffect(() => {
    if (lastFitKey.current === fitKey) return;
    lastFitKey.current = fitKey;
    setTransform(fitRef.current);
  }, [fitKey]);

  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    initTx: 0,
    initTy: 0,
    moved: false,
  });

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    const { target } = e;
    if (target instanceof SVGElement && target.dataset.node) {
      dragRef.current.moved = false;
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      initTx: transform.tx,
      initTy: transform.ty,
      moved: false,
    };
  };

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (!dragRef.current.moved && Math.hypot(dx, dy) > 3) dragRef.current.moved = true;
    setTransform(current => ({
      ...current,
      tx: dragRef.current.initTx + dx,
      ty: dragRef.current.initTy + dy,
    }));
  };

  const onPointerUp = (e: PointerEvent<SVGSVGElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragRef.current.active = false;
  };

  const onWheel = (e: WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -STEP : STEP;
    setTransform(current => ({
      ...current,
      scale: Math.min(Math.max(current.scale + delta, 0.25), 4),
    }));
  };

  const zoomIn = () => setTransform(prev => ({ ...prev, scale: Math.min(prev.scale + STEP, 4) }));
  const zoomOut = () =>
    setTransform(prev => ({ ...prev, scale: Math.max(prev.scale - STEP, 0.25) }));
  const reset = () => setTransform(fitRef.current);

  return {
    transform,
    dragRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    zoomIn,
    zoomOut,
    reset,
  };
};

export { useGraphPanZoom };
