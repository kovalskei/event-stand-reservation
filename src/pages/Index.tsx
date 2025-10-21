import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

type BoothStatus = 'available' | 'booked' | 'unavailable';

interface Booth {
  id: string;
  status: BoothStatus;
  company?: string;
  contact?: string;
}

interface BoothPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const initialBooths: Booth[] = [
  { id: 'A1', status: 'available' },
  { id: 'A2', status: 'booked', company: 'ТехноПром', contact: 'Иванов И.И.' },
  { id: 'A3', status: 'available' },
  { id: 'A4', status: 'available' },
  { id: 'A5', status: 'booked', company: 'ИнноВейт', contact: 'Петрова А.С.' },
  { id: 'A6', status: 'available' },
  { id: 'A7', status: 'available' },
  { id: 'A8', status: 'available' },
  { id: 'A9', status: 'available' },
  { id: 'A10', status: 'booked', company: 'МегаСтрой', contact: 'Сидоров П.П.' },
  { id: 'A11', status: 'available' },
  { id: 'A12', status: 'available' },
  { id: 'B1', status: 'available' },
  { id: 'B2', status: 'available' },
  { id: 'B3', status: 'booked', company: 'ЭкоЛайн', contact: 'Морозова Е.В.' },
];

const defaultPositions: BoothPosition[] = [
  { id: 'A1', x: 19, y: 18, width: 5, height: 10.5 },
  { id: 'A2', x: 24.15, y: 18, width: 5, height: 10.5 },
  { id: 'A3', x: 29.3, y: 18, width: 5, height: 10.5 },
  { id: 'A4', x: 34.45, y: 18, width: 5, height: 10.5 },
  { id: 'A5', x: 39.6, y: 18, width: 5, height: 10.5 },
  { id: 'A6', x: 44.75, y: 18, width: 5, height: 10.5 },
  { id: 'A7', x: 49.9, y: 18, width: 5, height: 10.5 },
  { id: 'A8', x: 55.05, y: 18, width: 5, height: 10.5 },
  { id: 'A9', x: 60.2, y: 18, width: 5, height: 10.5 },
  { id: 'A10', x: 65.35, y: 18, width: 5, height: 10.5 },
  { id: 'A11', x: 70.5, y: 18, width: 5, height: 10.5 },
  { id: 'A12', x: 75.65, y: 18, width: 5, height: 10.5 },
  { id: 'B1', x: 43, y: 50.5, width: 4.5, height: 10.5 },
  { id: 'B2', x: 47.8, y: 50.5, width: 4.5, height: 10.5 },
  { id: 'B3', x: 52.6, y: 50.5, width: 4.5, height: 10.5 },
];

export default function Index() {
  const [booths] = useState<Booth[]>(initialBooths);
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [positions, setPositions] = useState<BoothPosition[]>(() => {
    const saved = localStorage.getItem('booth-positions');
    return saved ? JSON.parse(saved) : defaultPositions;
  });
  const [dragging, setDragging] = useState<string | null>(null);
  const [resizing, setResizing] = useState<{ id: string; corner: 'se' | 'sw' | 'ne' | 'nw' } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const SNAP_THRESHOLD = 1.5;

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

  const getStatusText = (status: BoothStatus) => {
    switch (status) {
      case 'available':
        return 'Свободен';
      case 'booked':
        return 'Забронирован';
      case 'unavailable':
        return 'Недоступен';
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

  const savePositions = () => {
    localStorage.setItem('booth-positions', JSON.stringify(positions));
    toast({
      title: 'Позиции сохранены',
      description: 'Разметка стендов успешно сохранена',
    });
    setEditMode(false);
  };

  const resetPositions = () => {
    setPositions(defaultPositions);
    localStorage.removeItem('booth-positions');
    toast({
      title: 'Позиции сброшены',
      description: 'Разметка возвращена к настройкам по умолчанию',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <Icon name="CalendarDays" size={32} className="text-primary" />
            <h1 className="text-4xl font-bold text-gray-900">Бронирование стендов</h1>
          </div>
          <p className="text-gray-600 text-lg">Выставка 2025 • Павильон 1</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 animate-scale-in bg-white border-2 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Icon name="Grid3x3" size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Всего стендов</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 animate-scale-in bg-white border-2 border-booth-available/20" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-booth-available/10 rounded-lg">
                <Icon name="CheckCircle" size={24} className="text-booth-available" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Свободно</p>
                <p className="text-3xl font-bold text-gray-900">{stats.available}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 animate-scale-in bg-white border-2 border-booth-booked/20" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-booth-booked/10 rounded-lg">
                <Icon name="Lock" size={24} className="text-booth-booked" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Забронировано</p>
                <p className="text-3xl font-bold text-gray-900">{stats.booked}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 animate-scale-in bg-white border-2 border-gray-200" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Icon name="Percent" size={24} className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Заполненность</p>
                <p className="text-3xl font-bold text-gray-900">{Math.round((stats.booked / stats.total) * 100)}%</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-8 bg-white shadow-xl animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Интерактивная карта павильона</h2>
            <div className="flex gap-4 items-center">
              {!editMode && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-booth-available"></div>
                    <span className="text-sm text-gray-600">Свободен</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-booth-booked"></div>
                    <span className="text-sm text-gray-600">Забронирован</span>
                  </div>
                </>
              )}
              {editMode ? (
                <div className="flex gap-2">
                  <Button onClick={savePositions} size="sm" className="bg-booth-available hover:bg-booth-available/80">
                    <Icon name="Save" size={16} className="mr-2" />
                    Сохранить
                  </Button>
                  <Button onClick={resetPositions} variant="outline" size="sm">
                    <Icon name="RotateCcw" size={16} className="mr-2" />
                    Сбросить
                  </Button>
                  <Button onClick={() => setEditMode(false)} variant="outline" size="sm">
                    Отменить
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setEditMode(true)} variant="outline" size="sm">
                  <Icon name="Edit" size={16} className="mr-2" />
                  Настроить разметку
                </Button>
              )}
            </div>
          </div>

          {editMode && (
            <div className="mb-4 p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
              <div className="flex items-start gap-3">
                <Icon name="Info" size={20} className="text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Режим редактирования</p>
                  <p className="text-xs text-gray-600 mt-1">
                    • Перетаскивайте стенды для позиционирования (автоматическое прилипание)<br/>
                    • Тяните за углы для изменения размера стенда<br/>
                    • Нажмите "Сохранить" для применения изменений
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="relative bg-white rounded-xl p-4 border-2 border-gray-200 overflow-auto">
            <div 
              ref={containerRef}
              className="relative min-w-[1200px] w-full select-none" 
              style={{ aspectRatio: '1920/850' }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <img 
                src="https://cdn.poehali.dev/files/84989299-cef8-4fc0-a2cd-b8106a39b96d.png" 
                alt="План павильона" 
                className="w-full h-full object-contain pointer-events-none"
              />

              {booths.map((booth) => {
                const position = positions.find(p => p.id === booth.id);
                if (!position) return null;
                
                const isActive = dragging === booth.id || resizing?.id === booth.id;
                
                return (
                  <div
                    key={booth.id}
                    className={`absolute ${isActive ? 'z-50' : 'hover:z-40'}`}
                    style={{
                      left: `${position.x}%`,
                      top: `${position.y}%`,
                      width: `${position.width}%`,
                      height: `${position.height}%`,
                    }}
                  >
                    <button
                      onMouseDown={(e) => handleMouseDown(e, booth.id)}
                      onClick={() => !editMode && setSelectedBooth(booth)}
                      className={`${getBoothColor(booth.status)} text-white font-bold text-xs sm:text-sm rounded-sm transition-all duration-200 ${editMode ? 'cursor-move hover:ring-4 hover:ring-primary/50' : 'cursor-pointer hover:scale-110 hover:shadow-2xl'} w-full h-full flex items-center justify-center border-2 ${editMode ? 'border-primary' : 'border-white/20'} ${isActive ? 'shadow-2xl ring-4 ring-primary' : ''}`}
                    >
                      {booth.id}
                    </button>
                    
                    {editMode && (
                      <>
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(e, booth.id, 'se')}
                          className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full cursor-se-resize border-2 border-white shadow-lg hover:scale-125 transition-transform"
                          style={{ transform: 'translate(50%, 50%)' }}
                        />
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(e, booth.id, 'sw')}
                          className="absolute bottom-0 left-0 w-3 h-3 bg-primary rounded-full cursor-sw-resize border-2 border-white shadow-lg hover:scale-125 transition-transform"
                          style={{ transform: 'translate(-50%, 50%)' }}
                        />
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(e, booth.id, 'ne')}
                          className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full cursor-ne-resize border-2 border-white shadow-lg hover:scale-125 transition-transform"
                          style={{ transform: 'translate(50%, -50%)' }}
                        />
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(e, booth.id, 'nw')}
                          className="absolute top-0 left-0 w-3 h-3 bg-primary rounded-full cursor-nw-resize border-2 border-white shadow-lg hover:scale-125 transition-transform"
                          style={{ transform: 'translate(-50%, -50%)' }}
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={!!selectedBooth} onOpenChange={() => setSelectedBooth(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Icon name="MapPin" size={24} className="text-primary" />
              Стенд {selectedBooth?.id}
            </DialogTitle>
            <DialogDescription>
              Подробная информация о стенде
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Статус</span>
              <Badge 
                variant={selectedBooth?.status === 'available' ? 'default' : 'destructive'}
                className={selectedBooth?.status === 'available' ? 'bg-booth-available' : 'bg-booth-booked'}
              >
                {selectedBooth && getStatusText(selectedBooth.status)}
              </Badge>
            </div>

            {selectedBooth?.status === 'booked' && (
              <>
                <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Icon name="Building2" size={18} />
                    <span className="text-sm font-medium">Компания</span>
                  </div>
                  <p className="text-gray-900 font-semibold pl-6">{selectedBooth.company}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Icon name="User" size={18} />
                    <span className="text-sm font-medium">Контактное лицо</span>
                  </div>
                  <p className="text-gray-900 font-semibold pl-6">{selectedBooth.contact}</p>
                </div>
              </>
            )}

            {selectedBooth?.status === 'available' && (
              <div className="p-6 bg-booth-available/10 rounded-lg border-2 border-booth-available/20 text-center">
                <Icon name="CheckCircle" size={48} className="mx-auto mb-3 text-booth-available" />
                <p className="text-booth-available font-bold text-lg">Стенд свободен для бронирования</p>
                <p className="text-gray-600 text-sm mt-2">Свяжитесь с менеджером для оформления брони</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}