import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Booth, BoothPosition, BoothStatus, Event, mockEvents, initialBooths, defaultPositions } from '@/types/booth';
import EventHeader from '@/components/booth/EventHeader';
import StatsCards from '@/components/booth/StatsCards';
import BoothMapView from '@/components/booth/BoothMapView';
import BoothDialog from '@/components/booth/BoothDialog';
import SheetDialog from '@/components/booth/SheetDialog';

export default function Index() {
  const [events] = useState<Event[]>(mockEvents);
  const [selectedEvent, setSelectedEvent] = useState<Event>(mockEvents[0]);
  const [booths, setBooths] = useState<Booth[]>(initialBooths);
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [showSheetDialog, setShowSheetDialog] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [positions, setPositions] = useState<BoothPosition[]>(() => {
    const saved = localStorage.getItem(`booth-positions-${mockEvents[0].id}`);
    return saved ? JSON.parse(saved) : defaultPositions;
  });
  const [dragging, setDragging] = useState<string | null>(null);
  const [resizing, setResizing] = useState<{ id: string; corner: 'se' | 'sw' | 'ne' | 'nw' } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const SNAP_THRESHOLD = 1.5;

  useEffect(() => {
    const saved = localStorage.getItem(`booth-positions-${selectedEvent.id}`);
    if (saved) {
      setPositions(JSON.parse(saved));
    } else {
      setPositions(defaultPositions);
    }
  }, [selectedEvent.id]);

  const getBoothColor = (status: BoothStatus) => {
    switch (status) {
      case 'available':
        return 'bg-booth-available hover:bg-booth-available/80';
      case 'booked':
        return 'bg-booth-booked hover:bg-booth-booked/80';
      case 'unavailable':
        return 'bg-booth-unavailable hover:bg-booth-unavailable/80';
    }
  };

  const stats = {
    total: booths.length,
    available: booths.filter(b => b.status === 'available').length,
    booked: booths.filter(b => b.status === 'booked').length,
  };

  const snapToNeighbors = (id: string, x: number, y: number, width: number, height: number) => {
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

      if (Math.abs(right - pos.x) < SNAP_THRESHOLD && Math.abs(y - pos.y) < 5) snappedX = pos.x - width;
      if (Math.abs(x - posRight) < SNAP_THRESHOLD && Math.abs(y - pos.y) < 5) snappedX = posRight;
      
      if (Math.abs(bottom - pos.y) < SNAP_THRESHOLD && Math.abs(x - pos.x) < 5) snappedY = pos.y - height;
      if (Math.abs(y - posBottom) < SNAP_THRESHOLD && Math.abs(x - pos.x) < 5) snappedY = posBottom;
    });

    return { x: snappedX, y: snappedY };
  };

  const handleMouseDown = (e: React.MouseEvent, boothId: string) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const position = positions.find(p => p.id === boothId);
    if (!position) return;
    
    const offsetX = (e.clientX - rect.left) / rect.width * 100 - position.x;
    const offsetY = (e.clientY - rect.top) / rect.height * 100 - position.y;
    
    setDragging(boothId);
    setDragOffset({ x: offsetX, y: offsetY });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, boothId: string, corner: 'se' | 'sw' | 'ne' | 'nw') => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    
    setResizing({ id: boothId, corner });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!editMode) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width * 100;
    const mouseY = (e.clientY - rect.top) / rect.height * 100;

    if (dragging) {
      const position = positions.find(p => p.id === dragging);
      if (!position) return;

      let x = Math.max(0, Math.min(100 - position.width, mouseX - dragOffset.x));
      let y = Math.max(0, Math.min(100 - position.height, mouseY - dragOffset.y));

      const snapped = snapToNeighbors(dragging, x, y, position.width, position.height);
      x = snapped.x;
      y = snapped.y;

      setPositions(prev => prev.map(p => 
        p.id === dragging ? { ...p, x, y } : p
      ));
    } else if (resizing) {
      const position = positions.find(p => p.id === resizing.id);
      if (!position) return;

      const newPos = { ...position };

      switch (resizing.corner) {
        case 'se':
          newPos.width = Math.max(2, mouseX - position.x);
          newPos.height = Math.max(2, mouseY - position.y);
          break;
        case 'sw':
          const newWidth = Math.max(2, position.x + position.width - mouseX);
          newPos.x = position.x + position.width - newWidth;
          newPos.width = newWidth;
          newPos.height = Math.max(2, mouseY - position.y);
          break;
        case 'ne':
          newPos.width = Math.max(2, mouseX - position.x);
          const newHeight = Math.max(2, position.y + position.height - mouseY);
          newPos.y = position.y + position.height - newHeight;
          newPos.height = newHeight;
          break;
        case 'nw':
          const newW = Math.max(2, position.x + position.width - mouseX);
          const newH = Math.max(2, position.y + position.height - mouseY);
          newPos.x = position.x + position.width - newW;
          newPos.y = position.y + position.height - newH;
          newPos.width = newW;
          newPos.height = newH;
          break;
      }

      newPos.x = Math.max(0, Math.min(100 - newPos.width, newPos.x));
      newPos.y = Math.max(0, Math.min(100 - newPos.height, newPos.y));

      setPositions(prev => prev.map(p => 
        p.id === resizing.id ? newPos : p
      ));
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setResizing(null);
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mouseup', handleMouseUp as any);
      return () => window.removeEventListener('mouseup', handleMouseUp as any);
    }
  }, [dragging]);

  const loadSheetData = async (silent = false) => {
    if (!sheetUrl.trim()) {
      if (!silent) {
        toast({
          title: 'Ошибка',
          description: 'Введите URL Google Таблицы',
          variant: 'destructive',
        });
      }
      return;
    }

    if (!silent) setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/0a047b83-702c-4547-ae04-ff2dd383ee27', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка загрузки данных');
      }

      const data = await response.json();
      setBooths(data.booths);
      setShowSheetDialog(false);
      setLastSyncTime(new Date().toLocaleTimeString('ru-RU'));
      
      if (!silent) {
        toast({
          title: 'Данные загружены',
          description: `Синхронизировано ${data.booths.length} стендов`,
        });
      }
    } catch (error) {
      if (!silent) {
        toast({
          title: 'Ошибка',
          description: error instanceof Error ? error.message : 'Не удалось загрузить данные из таблицы',
          variant: 'destructive',
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (autoSync && sheetUrl.trim()) {
      syncIntervalRef.current = setInterval(() => {
        loadSheetData(true);
      }, 30000);
    } else {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [autoSync, sheetUrl]);

  const savePositions = () => {
    localStorage.setItem(`booth-positions-${selectedEvent.id}`, JSON.stringify(positions));
    toast({
      title: 'Позиции сохранены',
      description: 'Разметка стендов успешно сохранена',
    });
    setEditMode(false);
  };

  const resetPositions = () => {
    setPositions(defaultPositions);
    localStorage.removeItem(`booth-positions-${selectedEvent.id}`);
    toast({
      title: 'Позиции сброшены',
      description: 'Разметка возвращена к настройкам по умолчанию',
    });
  };

  const exportToPDF = async () => {
    const mapElement = containerRef.current;
    if (!mapElement) return;

    toast({
      title: 'Создание PDF',
      description: 'Подготовка карты для экспорта...',
    });

    try {
      const canvas = await html2canvas(mapElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${selectedEvent.name} - ${selectedEvent.date}`, pageWidth / 2, 12, { align: 'center' });
      
      const mapWidth = pageWidth - 20;
      const mapHeight = (canvas.height * mapWidth) / canvas.width;
      const maxMapHeight = pageHeight * 0.5;
      
      let finalMapWidth = mapWidth;
      let finalMapHeight = mapHeight;
      
      if (mapHeight > maxMapHeight) {
        finalMapHeight = maxMapHeight;
        finalMapWidth = (canvas.width * finalMapHeight) / canvas.height;
      }
      
      const xOffset = (pageWidth - finalMapWidth) / 2;
      const yOffset = 18;
      
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        xOffset,
        yOffset,
        finalMapWidth,
        finalMapHeight
      );

      let currentY = yOffset + finalMapHeight + 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Всего стендов: ${stats.total} | Свободно: ${stats.available} | Забронировано: ${stats.booked}`,
        pageWidth / 2,
        currentY,
        { align: 'center' }
      );

      currentY += 8;

      const bookedBooths = booths.filter(b => b.status === 'booked');
      
      if (bookedBooths.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Забронированные стенды:', 10, currentY);
        currentY += 6;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');

        bookedBooths.forEach((booth) => {
          if (currentY > pageHeight - 15) {
            pdf.addPage();
            currentY = 15;
          }
          
          const text = `${booth.id} - ${booth.company || 'Без названия'}`;
          pdf.text(text, 10, currentY);
          currentY += 5;
        });
      }

      const fileName = `${selectedEvent.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast({
        title: 'PDF сохранён',
        description: `Файл ${fileName} успешно загружен`,
      });
    } catch (error) {
      console.error('Ошибка при создании PDF:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать PDF файл',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <EventHeader
          selectedEvent={selectedEvent}
          events={events}
          onEventChange={setSelectedEvent}
          onExportPDF={exportToPDF}
          onShowSheetDialog={() => setShowSheetDialog(true)}
        />

        <StatsCards
          total={stats.total}
          available={stats.available}
          booked={stats.booked}
        />

        <BoothMapView
          selectedEvent={selectedEvent}
          booths={booths}
          positions={positions}
          editMode={editMode}
          dragging={dragging}
          resizing={resizing}
          containerRef={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onResizeMouseDown={handleResizeMouseDown}
          onBoothClick={setSelectedBooth}
          onSavePositions={savePositions}
          onResetPositions={resetPositions}
          onToggleEditMode={() => setEditMode(!editMode)}
          getBoothColor={getBoothColor}
        />
      </div>

      <BoothDialog
        booth={selectedBooth}
        onClose={() => setSelectedBooth(null)}
      />

      <SheetDialog
        open={showSheetDialog}
        sheetUrl={sheetUrl}
        autoSync={autoSync}
        lastSyncTime={lastSyncTime}
        loading={loading}
        onClose={() => setShowSheetDialog(false)}
        onSheetUrlChange={setSheetUrl}
        onAutoSyncChange={setAutoSync}
        onLoadData={() => loadSheetData(false)}
      />
    </div>
  );
}