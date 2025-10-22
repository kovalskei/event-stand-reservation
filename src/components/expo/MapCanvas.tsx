import { RefObject } from 'react';
import { Booth, BoothPosition, Event, Grid } from './types';
import { getBoothColor, rotatePoint } from './utils';

interface MapCanvasProps {
  containerRef: RefObject<HTMLDivElement>;
  selectedEvent: Event;
  booths: Booth[];
  positions: BoothPosition[];
  zoom: number;
  panOffset: { x: number; y: number };
  editMode: boolean;
  gridMode: boolean;
  grid: Grid;
  gridCellAssignments: Record<number, string>;
  editingGrid: boolean;
  dragging: string | null;
  resizing: { id: string; corner: 'se' | 'sw' | 'ne' | 'nw' } | null;
  rotating: string | null;
  isPanning: boolean;
  onBoothClick: (booth: Booth) => void;
  onBoothMouseDown: (e: React.MouseEvent, id: string) => void;
  onResizeMouseDown: (e: React.MouseEvent, id: string, corner: 'se' | 'sw' | 'ne' | 'nw') => void;
  onRotateMouseDown: (e: React.MouseEvent, id: string) => void;
  onMapMouseDown: (e: React.MouseEvent) => void;
  onMapMouseMove: (e: React.MouseEvent) => void;
  onMapMouseUp: () => void;
  onWheel: (e: React.WheelEvent) => void;
  onGridMouseDown: (e: React.MouseEvent) => void;
  onGridResizeMouseDown: (e: React.MouseEvent, corner: 'se' | 'sw' | 'ne' | 'nw') => void;
  onGridRotateMouseDown: (e: React.MouseEvent) => void;
  onCellClick: (cellIndex: number) => void;
}

export function MapCanvas({
  containerRef,
  selectedEvent,
  booths,
  positions,
  zoom,
  panOffset,
  editMode,
  gridMode,
  grid,
  gridCellAssignments,
  editingGrid,
  dragging,
  resizing,
  rotating,
  isPanning,
  onBoothClick,
  onBoothMouseDown,
  onResizeMouseDown,
  onRotateMouseDown,
  onMapMouseDown,
  onMapMouseMove,
  onMapMouseUp,
  onWheel,
  onGridMouseDown,
  onGridResizeMouseDown,
  onGridRotateMouseDown,
  onCellClick,
}: MapCanvasProps) {
  const renderGridCells = () => {
    const cells = [];
    const cellWidth = grid.width / grid.cols;
    const cellHeight = grid.height / grid.rows;

    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        const cellIndex = row * grid.cols + col;
        const cellX = grid.x + col * cellWidth;
        const cellY = grid.y + row * cellHeight;
        const assignedBoothId = gridCellAssignments[cellIndex];

        cells.push(
          <g
            key={cellIndex}
            onClick={() => onCellClick(cellIndex)}
            style={{ cursor: editingGrid ? 'pointer' : 'default' }}
            transform={`rotate(${grid.rotation}, ${grid.x + grid.width / 2}, ${grid.y + grid.height / 2})`}
          >
            <rect
              x={cellX}
              y={cellY}
              width={cellWidth}
              height={cellHeight}
              fill={assignedBoothId ? 'rgba(59, 130, 246, 0.2)' : 'rgba(200, 200, 200, 0.1)'}
              stroke={assignedBoothId ? '#3b82f6' : '#ccc'}
              strokeWidth={0.3}
            />
            {assignedBoothId && (
              <text
                x={cellX + cellWidth / 2}
                y={cellY + cellHeight / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#1f2937"
                fontSize="2"
                fontWeight="bold"
              >
                {assignedBoothId}
              </text>
            )}
          </g>
        );
      }
    }
    return cells;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[600px] bg-gray-50 rounded-lg overflow-hidden border border-gray-300"
      onMouseDown={onMapMouseDown}
      onMouseMove={onMapMouseMove}
      onMouseUp={onMapMouseUp}
      onWheel={onWheel}
      style={{ cursor: isPanning ? 'grabbing' : editMode ? 'default' : 'grab' }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{
          transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          transformOrigin: 'center',
          transition: isPanning ? 'none' : 'transform 0.1s ease-out',
        }}
      >
        <image
          href={selectedEvent.mapUrl}
          x="0"
          y="0"
          width="100"
          height="100"
          preserveAspectRatio="xMidYMid slice"
        />

        {gridMode && (
          <g>
            <rect
              x={grid.x}
              y={grid.y}
              width={grid.width}
              height={grid.height}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="#3b82f6"
              strokeWidth={0.5}
              strokeDasharray="2,2"
              transform={`rotate(${grid.rotation}, ${grid.x + grid.width / 2}, ${grid.y + grid.height / 2})`}
              onMouseDown={onGridMouseDown}
              style={{ cursor: editingGrid ? 'move' : 'default' }}
            />

            {renderGridCells()}

            {editingGrid && (
              <>
                {['se', 'sw', 'ne', 'nw'].map(corner => {
                  const c = corner as 'se' | 'sw' | 'ne' | 'nw';
                  let cornerX = grid.x;
                  let cornerY = grid.y;

                  if (c === 'se') { cornerX += grid.width; cornerY += grid.height; }
                  else if (c === 'sw') { cornerY += grid.height; }
                  else if (c === 'ne') { cornerX += grid.width; }

                  const rotated = rotatePoint(
                    cornerX,
                    cornerY,
                    grid.x + grid.width / 2,
                    grid.y + grid.height / 2,
                    grid.rotation
                  );

                  return (
                    <circle
                      key={c}
                      cx={rotated.x}
                      cy={rotated.y}
                      r={1}
                      fill="#3b82f6"
                      stroke="white"
                      strokeWidth={0.3}
                      style={{ cursor: `${c}-resize` }}
                      onMouseDown={(e) => onGridResizeMouseDown(e, c)}
                    />
                  );
                })}

                <g
                  onMouseDown={onGridRotateMouseDown}
                  style={{ cursor: 'grab' }}
                >
                  <line
                    x1={grid.x + grid.width / 2}
                    y1={grid.y + grid.height / 2}
                    x2={grid.x + grid.width / 2}
                    y2={grid.y - 5}
                    stroke="#3b82f6"
                    strokeWidth={0.3}
                    transform={`rotate(${grid.rotation}, ${grid.x + grid.width / 2}, ${grid.y + grid.height / 2})`}
                  />
                  <circle
                    cx={grid.x + grid.width / 2}
                    cy={grid.y - 5}
                    r={1.2}
                    fill="#3b82f6"
                    stroke="white"
                    strokeWidth={0.3}
                    transform={`rotate(${grid.rotation}, ${grid.x + grid.width / 2}, ${grid.y + grid.height / 2})`}
                  />
                </g>
              </>
            )}
          </g>
        )}

        {positions.map(pos => {
          const booth = booths.find(b => b.id === pos.id);
          if (!booth) return null;

          const centerX = pos.x + pos.width / 2;
          const centerY = pos.y + pos.height / 2;
          const rotation = pos.rotation || 0;

          return (
            <g key={pos.id}>
              <rect
                x={pos.x}
                y={pos.y}
                width={pos.width}
                height={pos.height}
                className={`${getBoothColor(booth.status)} transition-all cursor-pointer stroke-gray-700`}
                strokeWidth="0.2"
                rx="0.5"
                transform={`rotate(${rotation}, ${centerX}, ${centerY})`}
                onClick={() => onBoothClick(booth)}
                onMouseDown={(e) => editMode ? onBoothMouseDown(e, pos.id) : undefined}
                style={{ cursor: editMode ? (dragging === pos.id ? 'grabbing' : 'grab') : 'pointer' }}
              />
              <text
                x={centerX}
                y={centerY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#1f2937"
                fontSize="2"
                fontWeight="bold"
                pointerEvents="none"
                transform={`rotate(${rotation}, ${centerX}, ${centerY})`}
              >
                {booth.id}
              </text>

              {editMode && (
                <>
                  {['se', 'sw', 'ne', 'nw'].map(corner => {
                    const c = corner as 'se' | 'sw' | 'ne' | 'nw';
                    let cornerX = pos.x;
                    let cornerY = pos.y;

                    if (c === 'se') { cornerX += pos.width; cornerY += pos.height; }
                    else if (c === 'sw') { cornerY += pos.height; }
                    else if (c === 'ne') { cornerX += pos.width; }

                    const rotated = rotatePoint(cornerX, cornerY, centerX, centerY, rotation);

                    return (
                      <circle
                        key={c}
                        cx={rotated.x}
                        cy={rotated.y}
                        r={0.8}
                        fill="white"
                        stroke="#3b82f6"
                        strokeWidth={0.2}
                        style={{ cursor: `${c}-resize` }}
                        onMouseDown={(e) => onResizeMouseDown(e, pos.id, c)}
                      />
                    );
                  })}

                  <g
                    onMouseDown={(e) => onRotateMouseDown(e, pos.id)}
                    style={{ cursor: 'grab' }}
                  >
                    <line
                      x1={centerX}
                      y1={centerY}
                      x2={centerX}
                      y2={pos.y - 3}
                      stroke="#3b82f6"
                      strokeWidth={0.2}
                      transform={`rotate(${rotation}, ${centerX}, ${centerY})`}
                    />
                    <circle
                      cx={centerX}
                      cy={pos.y - 3}
                      r={0.8}
                      fill="#3b82f6"
                      stroke="white"
                      strokeWidth={0.2}
                      transform={`rotate(${rotation}, ${centerX}, ${centerY})`}
                    />
                  </g>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
