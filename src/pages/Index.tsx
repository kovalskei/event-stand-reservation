import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { LoginDialog } from '@/components/LoginDialog';
import { api } from '@/lib/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { Booth, BoothPosition, Event, BoothStatus, Grid } from '@/components/expo/types';
import { mockEvents, initialBooths, defaultPositions, SNAP_THRESHOLD } from '@/components/expo/constants';
import { snapToNeighbors, getAngle, getBoothColor, rotatePoint } from '@/components/expo/utils';
import { Header } from '@/components/expo/Header';
import { EventSelector } from '@/components/expo/EventSelector';
import { Statistics } from '@/components/expo/Statistics';
import { ControlPanel } from '@/components/expo/ControlPanel';
import { BoothInfoDialog } from '@/components/expo/BoothInfoDialog';
import { SheetDialog } from '@/components/expo/SheetDialog';
import { GridControlDialog } from '@/components/expo/GridControlDialog';

export default function Index() {
  const { userEmail } = useAuth();
  const [showLoginDialog, setShowLoginDialog] = useState(!userEmail);
  const [events] = useState<Event[]>(mockEvents);
  const [selectedEvent, setSelectedEvent] = useState<Event>(mockEvents[0]);
  const [booths, setBooths] = useState<Booth[]>(initialBooths);
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sheetUrl, setSheetUrl] = useState(() => {
    const saved = localStorage.getItem(`sheet-url-${mockEvents[0].id}`);
    return saved || '';
  });
  const [showSheetDialog, setShowSheetDialog] = useState(false);
  const [showMapUploadDialog, setShowMapUploadDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [autoSync, setAutoSync] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [positions, setPositions] = useState<BoothPosition[]>(() => {
    const saved = localStorage.getItem(`booth-positions-${mockEvents[0].id}`);
    return saved ? JSON.parse(saved) : defaultPositions;
  });
  const [dragging, setDragging] = useState<string | null>(null);
  const [resizing, setResizing] = useState<{ id: string; corner: 'se' | 'sw' | 'ne' | 'nw' } | null>(null);
  const [rotating, setRotating] = useState<string | null>(null);
  const [boothRotationStart, setBoothRotationStart] = useState<{ angle: number; rotation: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [mapChanged, setMapChanged] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isMousePanning, setIsMousePanning] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const [gridMode, setGridMode] = useState(false);
  const [grid, setGrid] = useState<Grid>({ x: 10, y: 10, width: 80, height: 60, rotation: 0, rows: 3, cols: 3 });
  const [gridCellAssignments, setGridCellAssignments] = useState<Record<number, string>>({});
  const [editingGrid, setEditingGrid] = useState(false);
  const [draggingGrid, setDraggingGrid] = useState(false);
  const [resizingGrid, setResizingGrid] = useState<'se' | 'sw' | 'ne' | 'nw' | null>(null);
  const [rotatingGrid, setRotatingGrid] = useState(false);
  const [rotationStart, setRotationStart] = useState<{ angle: number; rotation: number } | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);

  useEffect(() => {
    if (!userEmail) {
      setShowLoginDialog(true);
    }
  }, [userEmail]);

  useEffect(() => {
    const handleMouseUp = () => {
      setIsMousePanning(false);
      setIsPanning(false);
    };

    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(`booth-positions-${selectedEvent.id}`);
    if (saved) {
      setPositions(JSON.parse(saved));
    } else {
      setPositions(defaultPositions);
    }

    const savedMapUrl = localStorage.getItem(`map-url-${selectedEvent.id}`);
    if (savedMapUrl) {
      setSelectedEvent(prev => ({
        ...prev,
        mapUrl: savedMapUrl
      }));
    }
  }, [selectedEvent.id]);

  const stats = {
    total: booths.length,
    available: booths.filter(b => b.status === 'available').length,
    booked: booths.filter(b => b.status === 'booked').length,
  };

  const handleBoothClick = (booth: Booth) => {
    if (!editMode) {
      setSelectedBooth(booth);
    }
  };

  const handleChangeStatus = (boothId: string, status: BoothStatus) => {
    setBooths(booths.map(b => b.id === boothId ? { ...b, status } : b));
    setSelectedBooth(prev => prev ? { ...prev, status } : null);
  };

  const handleDeleteBooth = (boothId: string) => {
    setBooths(booths.filter(b => b.id !== boothId));
    setPositions(positions.filter(p => p.id !== boothId));
    setMapChanged(true);
    toast({ title: 'Стенд удален', description: `Стенд ${boothId} удален с карты` });
  };

  const handleBoothMouseDown = (e: React.MouseEvent, id: string) => {
    if (!editMode) return;
    e.stopPropagation();
    setDragging(id);
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * 100;
    const svgY = ((e.clientY - rect.top) / rect.height) * 100;
    const pos = positions.find(p => p.id === id);
    if (pos) {
      setDragOffset({ x: svgX - pos.x, y: svgY - pos.y });
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent, id: string, corner: 'se' | 'sw' | 'ne' | 'nw') => {
    if (!editMode) return;
    e.stopPropagation();
    setResizing({ id, corner });
  };

  const handleRotateMouseDown = (e: React.MouseEvent, id: string) => {
    if (!editMode) return;
    e.stopPropagation();
    setRotating(id);
    const container = containerRef.current;
    const pos = positions.find(p => p.id === id);
    if (!container || !pos) return;
    const rect = container.getBoundingClientRect();
    const centerX = pos.x + pos.width / 2;
    const centerY = pos.y + pos.height / 2;
    const svgX = ((e.clientX - rect.left) / rect.width) * 100;
    const svgY = ((e.clientY - rect.top) / rect.height) * 100;
    const angle = getAngle(centerX, centerY, svgX, svgY);
    setBoothRotationStart({ angle, rotation: pos.rotation || 0 });
  };

  const handleMapMouseDown = (e: React.MouseEvent) => {
    if (editMode) return;
    if (e.button === 0) {
      setIsMousePanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMapMouseMove = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    if (isMousePanning && !editMode) {
      const dx = (e.clientX - panStart.x) / zoom;
      const dy = (e.clientY - panStart.y) / zoom;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (!editMode) return;

    const rect = container.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * 100;
    const svgY = ((e.clientY - rect.top) / rect.height) * 100;

    if (dragging) {
      setPositions(positions.map(pos => {
        if (pos.id === dragging) {
          let newX = svgX - dragOffset.x;
          let newY = svgY - dragOffset.y;
          if (snapEnabled) {
            const snapped = snapToNeighbors(pos.id, newX, newY, pos.width, pos.height, positions);
            newX = snapped.x;
            newY = snapped.y;
          }
          return { ...pos, x: newX, y: newY };
        }
        return pos;
      }));
      setMapChanged(true);
    }

    if (resizing) {
      setPositions(positions.map(pos => {
        if (pos.id === resizing.id) {
          const newPos = { ...pos };
          const corner = resizing.corner;
          if (corner === 'se') {
            newPos.width = Math.max(2, svgX - pos.x);
            newPos.height = Math.max(2, svgY - pos.y);
          } else if (corner === 'sw') {
            const newWidth = Math.max(2, pos.x + pos.width - svgX);
            newPos.x = pos.x + pos.width - newWidth;
            newPos.width = newWidth;
            newPos.height = Math.max(2, svgY - pos.y);
          } else if (corner === 'ne') {
            newPos.width = Math.max(2, svgX - pos.x);
            const newHeight = Math.max(2, pos.y + pos.height - svgY);
            newPos.y = pos.y + pos.height - newHeight;
            newPos.height = newHeight;
          } else if (corner === 'nw') {
            const newWidth = Math.max(2, pos.x + pos.width - svgX);
            const newHeight = Math.max(2, pos.y + pos.height - svgY);
            newPos.x = pos.x + pos.width - newWidth;
            newPos.y = pos.y + pos.height - newHeight;
            newPos.width = newWidth;
            newPos.height = newHeight;
          }
          return newPos;
        }
        return pos;
      }));
      setMapChanged(true);
    }

    if (rotating && boothRotationStart) {
      setPositions(positions.map(pos => {
        if (pos.id === rotating) {
          const centerX = pos.x + pos.width / 2;
          const centerY = pos.y + pos.height / 2;
          const currentAngle = getAngle(centerX, centerY, svgX, svgY);
          const deltaAngle = currentAngle - boothRotationStart.angle;
          const newRotation = (boothRotationStart.rotation + deltaAngle) % 360;
          return { ...pos, rotation: newRotation };
        }
        return pos;
      }));
      setMapChanged(true);
    }

    if (draggingGrid) {
      setGrid(prev => ({
        ...prev,
        x: svgX - prev.width / 2,
        y: svgY - prev.height / 2,
      }));
    }

    if (resizingGrid) {
      setGrid(prev => {
        const newGrid = { ...prev };
        const corner = resizingGrid;
        if (corner === 'se') {
          newGrid.width = Math.max(5, svgX - prev.x);
          newGrid.height = Math.max(5, svgY - prev.y);
        } else if (corner === 'sw') {
          const newWidth = Math.max(5, prev.x + prev.width - svgX);
          newGrid.x = prev.x + prev.width - newWidth;
          newGrid.width = newWidth;
          newGrid.height = Math.max(5, svgY - prev.y);
        } else if (corner === 'ne') {
          newGrid.width = Math.max(5, svgX - prev.x);
          const newHeight = Math.max(5, prev.y + prev.height - svgY);
          newGrid.y = prev.y + prev.height - newHeight;
          newGrid.height = newHeight;
        } else if (corner === 'nw') {
          const newWidth = Math.max(5, prev.x + prev.width - svgX);
          const newHeight = Math.max(5, prev.y + prev.height - svgY);
          newGrid.x = prev.x + prev.width - newWidth;
          newGrid.y = prev.y + prev.height - newHeight;
          newGrid.width = newWidth;
          newGrid.height = newHeight;
        }
        return newGrid;
      });
    }

    if (rotatingGrid && rotationStart) {
      const centerX = grid.x + grid.width / 2;
      const centerY = grid.y + grid.height / 2;
      const currentAngle = getAngle(centerX, centerY, svgX, svgY);
      const deltaAngle = currentAngle - rotationStart.angle;
      const newRotation = (rotationStart.rotation + deltaAngle) % 360;
      setGrid(prev => ({ ...prev, rotation: newRotation }));
    }
  };

  const handleMapMouseUp = () => {
    setDragging(null);
    setResizing(null);
    setRotating(null);
    setBoothRotationStart(null);
    setDraggingGrid(false);
    setResizingGrid(null);
    setRotatingGrid(false);
    setRotationStart(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(3, prev * delta)));
  };

  const handleSaveMap = async () => {
    setLoading(true);
    localStorage.setItem(`booth-positions-${selectedEvent.id}`, JSON.stringify(positions));
    
    try {
      await api.saveBooths(selectedEvent.id, booths, positions);
      toast({ title: 'Карта сохранена', description: 'Все изменения успешно сохранены в базе данных' });
    } catch (error) {
      toast({ 
        title: 'Ошибка сохранения', 
        description: 'Не удалось сохранить в базу данных',
        variant: 'destructive'
      });
    }
    
    setMapChanged(false);
    setLoading(false);
  };

  const handleExportPDF = async () => {
    const container = containerRef.current;
    if (!container) return;

    setLoading(true);
    toast({ title: 'Экспорт в PDF', description: 'Начинаем экспорт карты...' });

    try {
      const canvas = await html2canvas(container, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({orientation: 'landscape', unit: 'mm', format: 'a4'});
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${selectedEvent.name}-карта.pdf`);
      toast({ title: 'PDF создан', description: 'Карта успешно экспортирована' });
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось создать PDF', variant: 'destructive' });
    }

    setLoading(false);
  };

  const handleUploadMap = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedEvent(prev => ({
        ...prev,
        mapUrl: dataUrl
      }));
      localStorage.setItem(`map-url-${selectedEvent.id}`, dataUrl);
      setMapChanged(true);
      toast({ title: 'Карта загружена', description: 'Новая карта успешно загружена' });
    };
    reader.readAsDataURL(file);
  };

  const handleSyncSheet = async () => {
    if (!sheetUrl) {
      toast({ title: 'Ошибка', description: 'Не указана ссылка на таблицу', variant: 'destructive' });
      return;
    }
    setLoading(true);
    toast({ title: 'Синхронизация', description: 'Загружаем данные из таблицы...' });
    setTimeout(() => {
      setLoading(false);
      setLastSyncTime(new Date().toLocaleTimeString('ru-RU'));
      toast({ title: 'Синхронизация завершена', description: 'Данные успешно загружены' });
    }, 2000);
  };

  const handleToggleAutoSync = () => {
    if (!autoSync) {
      if (!sheetUrl) {
        toast({ title: 'Ошибка', description: 'Сначала настройте Google Таблицу', variant: 'destructive' });
        return;
      }
      syncIntervalRef.current = setInterval(handleSyncSheet, 300000);
      toast({ title: 'Авто-синхронизация включена', description: 'Данные будут обновляться каждые 5 минут' });
    } else {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      toast({ title: 'Авто-синхронизация выключена' });
    }
    setAutoSync(!autoSync);
  };

  const handleSaveSheetUrl = (url: string) => {
    setSheetUrl(url);
    localStorage.setItem(`sheet-url-${selectedEvent.id}`, url);
    toast({ title: 'Настройки сохранены', description: 'Ссылка на таблицу обновлена' });
  };

  const handleToggleGrid = () => {
    if (gridMode) {
      setGridMode(false);
      setEditingGrid(false);
      setGridCellAssignments({});
    } else {
      setGridMode(true);
      setEditingGrid(true);
    }
  };

  const handleApplyGrid = () => {
    const newBooths: Booth[] = [];
    const newPositions: BoothPosition[] = [];
    const cellWidth = grid.width / grid.cols;
    const cellHeight = grid.height / grid.rows;

    Object.entries(gridCellAssignments).forEach(([cellIndexStr, boothId]) => {
      const cellIndex = parseInt(cellIndexStr);
      const row = Math.floor(cellIndex / grid.cols);
      const col = cellIndex % grid.cols;
      const x = grid.x + col * cellWidth;
      const y = grid.y + row * cellHeight;

      newBooths.push({ id: boothId, status: 'available' });
      newPositions.push({
        id: boothId,
        x,
        y,
        width: cellWidth,
        height: cellHeight,
        rotation: grid.rotation,
      });
    });

    setBooths(prev => [...prev, ...newBooths]);
    setPositions(prev => [...prev, ...newPositions]);
    setGridMode(false);
    setEditingGrid(false);
    setGridCellAssignments({});
    setMapChanged(true);
    toast({ title: 'Сетка применена', description: `Создано ${newBooths.length} стендов` });
  };

  const handleCancelGrid = () => {
    setGridMode(false);
    setEditingGrid(false);
    setGridCellAssignments({});
  };

  const handleGridMouseDown = (e: React.MouseEvent) => {
    if (!editingGrid) return;
    e.stopPropagation();
    setDraggingGrid(true);
  };

  const handleGridResizeMouseDown = (e: React.MouseEvent, corner: 'se' | 'sw' | 'ne' | 'nw') => {
    if (!editingGrid) return;
    e.stopPropagation();
    setResizingGrid(corner);
  };

  const handleGridRotateMouseDown = (e: React.MouseEvent) => {
    if (!editingGrid) return;
    e.stopPropagation();
    setRotatingGrid(true);
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const centerX = grid.x + grid.width / 2;
    const centerY = grid.y + grid.height / 2;
    const svgX = ((e.clientX - rect.left) / rect.width) * 100;
    const svgY = ((e.clientY - rect.top) / rect.height) * 100;
    const angle = getAngle(centerX, centerY, svgX, svgY);
    setRotationStart({ angle, rotation: grid.rotation });
  };

  const handleCellClick = (cellIndex: number) => {
    if (!editingGrid) return;
    const currentBoothId = gridCellAssignments[cellIndex];
    if (currentBoothId) {
      const newAssignments = { ...gridCellAssignments };
      delete newAssignments[cellIndex];
      setGridCellAssignments(newAssignments);
    } else {
      const maxBoothNumber = Math.max(
        ...booths.map(b => {
          const match = b.id.match(/\d+$/);
          return match ? parseInt(match[0]) : 0;
        }),
        0
      );
      const newBoothId = `S${maxBoothNumber + Object.keys(gridCellAssignments).length + 1}`;
      setGridCellAssignments({ ...gridCellAssignments, [cellIndex]: newBoothId });
    }
  };

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
            onClick={() => handleCellClick(cellIndex)}
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
    <div className="min-h-screen bg-gray-100">
      <Header onLoginClick={() => setShowLoginDialog(true)} />

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <EventSelector
              events={events}
              selectedEvent={selectedEvent}
              onSelectEvent={setSelectedEvent}
            />
            <Statistics
              total={stats.total}
              available={stats.available}
              booked={stats.booked}
            />
            <ControlPanel
              editMode={editMode}
              gridMode={gridMode}
              snapEnabled={snapEnabled}
              autoSync={autoSync}
              lastSyncTime={lastSyncTime}
              mapChanged={mapChanged}
              onToggleEdit={() => setEditMode(!editMode)}
              onToggleGrid={handleToggleGrid}
              onToggleSnap={() => setSnapEnabled(!snapEnabled)}
              onToggleAutoSync={handleToggleAutoSync}
              onSaveMap={handleSaveMap}
              onExportPDF={handleExportPDF}
              onUploadMap={handleUploadMap}
              onSyncSheet={handleSyncSheet}
              onSheetSettings={() => setShowSheetDialog(true)}
            />
          </div>

          <div className="lg:col-span-3">
            <div
              ref={containerRef}
              className="relative w-full h-[600px] bg-gray-50 rounded-lg overflow-hidden border border-gray-300"
              onMouseDown={handleMapMouseDown}
              onMouseMove={handleMapMouseMove}
              onMouseUp={handleMapMouseUp}
              onWheel={handleWheel}
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
                      onMouseDown={handleGridMouseDown}
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
                              onMouseDown={(e) => handleGridResizeMouseDown(e, c)}
                            />
                          );
                        })}

                        <g
                          onMouseDown={handleGridRotateMouseDown}
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
                        onClick={() => handleBoothClick(booth)}
                        onMouseDown={(e) => editMode ? handleBoothMouseDown(e, pos.id) : undefined}
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
                                onMouseDown={(e) => handleResizeMouseDown(e, pos.id, c)}
                              />
                            );
                          })}

                          <g
                            onMouseDown={(e) => handleRotateMouseDown(e, pos.id)}
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
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <BoothInfoDialog
        booth={selectedBooth}
        onClose={() => setSelectedBooth(null)}
        editMode={editMode}
        onChangeStatus={handleChangeStatus}
        onDeleteBooth={handleDeleteBooth}
      />

      <SheetDialog
        open={showSheetDialog}
        onClose={() => setShowSheetDialog(false)}
        sheetUrl={sheetUrl}
        onSave={handleSaveSheetUrl}
      />

      <GridControlDialog
        open={editingGrid}
        grid={grid}
        onClose={() => setEditingGrid(false)}
        onUpdateGrid={(updates) => setGrid(prev => ({ ...prev, ...updates }))}
        onApplyGrid={handleApplyGrid}
        onCancelGrid={handleCancelGrid}
      />

      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
    </div>
  );
}