import { BoothStatus, BoothPosition } from './types';
import { SNAP_THRESHOLD } from './constants';

export const getBoothColor = (status: BoothStatus) => {
  switch (status) {
    case 'available':
      return 'bg-booth-available hover:bg-booth-available/80';
    case 'booked':
      return 'bg-booth-booked hover:bg-booth-booked/80';
    case 'unavailable':
      return 'bg-booth-unavailable hover:bg-booth-unavailable/80';
  }
};

export const getStatusText = (status: BoothStatus) => {
  switch (status) {
    case 'available':
      return 'Свободен';
    case 'booked':
      return 'Забронирован';
    case 'unavailable':
      return 'Недоступен';
  }
};

export const snapToNeighbors = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  positions: BoothPosition[]
) => {
  let snappedX = x;
  let snappedY = y;

  positions.forEach(pos => {
    if (pos.id === id) return;

    const right = x + width;
    const bottom = y + height;
    const posRight = pos.x + pos.width;
    const posBottom = pos.y + pos.height;

    if (Math.abs(y - pos.y) < SNAP_THRESHOLD) snappedY = pos.y;
    if (Math.abs(bottom - posBottom) < SNAP_THRESHOLD) snappedY = pos.y + pos.height - height;
    
    if (Math.abs(x - pos.x) < SNAP_THRESHOLD) snappedX = pos.x;
    if (Math.abs(right - posRight) < SNAP_THRESHOLD) snappedX = pos.x + pos.width - width;

    if (Math.abs(x - posRight) < SNAP_THRESHOLD) snappedX = posRight;
    if (Math.abs(right - pos.x) < SNAP_THRESHOLD) snappedX = pos.x - width;

    if (Math.abs(y - posBottom) < SNAP_THRESHOLD) snappedY = posBottom;
    if (Math.abs(bottom - pos.y) < SNAP_THRESHOLD) snappedY = pos.y - height;
  });

  return { x: snappedX, y: snappedY };
};

export const getAngle = (centerX: number, centerY: number, pointX: number, pointY: number) => {
  return Math.atan2(pointY - centerY, pointX - centerX) * (180 / Math.PI);
};

export const rotatePoint = (x: number, y: number, centerX: number, centerY: number, angle: number) => {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = x - centerX;
  const dy = y - centerY;
  return {
    x: centerX + dx * cos - dy * sin,
    y: centerY + dx * sin + dy * cos
  };
};
