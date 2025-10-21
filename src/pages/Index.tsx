import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';

interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  mapUrl: string;
}

interface Booth {
  id: string;
  status: 'available' | 'booked' | 'unavailable';
  company?: string;
  contact?: string;
  size?: string;
  price?: string;
}

interface BoothPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const events: Event[] = [
  {
    id: 'event-1',
    name: 'Выставка технологий 2025',
    date: '15-20 марта',
    location: 'Павильон №1',
    mapUrl: 'https://cdn.poehali.dev/files/84989299-cef8-4fc0-a2cd-b8106a39b96d.png',
  },
];

const defaultPositions: BoothPosition[] = [
  { id: 'A1', x: 19.5, y: 7, width: 5.8, height: 18 },
  { id: 'A2', x: 25.3, y: 7, width: 5.8, height: 18 },
  { id: 'A3', x: 31.1, y: 7, width: 5.8, height: 18 },
  { id: 'A4', x: 36.9, y: 7, width: 5.8, height: 18 },
  { id: 'A5', x: 42.7, y: 7, width: 5.8, height: 18 },
  { id: 'A6', x: 48.5, y: 7, width: 5.8, height: 18 },
  { id: 'A7', x: 54.3, y: 7, width: 5.8, height: 18 },
  { id: 'A8', x: 60.1, y: 7, width: 5.8, height: 18 },
  { id: 'A9', x: 65.9, y: 7, width: 5.8, height: 18 },
  { id: 'A10', x: 71.7, y: 7, width: 5.8, height: 18 },
  { id: 'A11', x: 77.5, y: 7, width: 5.8, height: 18 },
  { id: 'A12', x: 83.3, y: 7, width: 5.8, height: 18 },
  { id: 'B1', x: 52.3, y: 32, width: 8.8, height: 15 },
  { id: 'B2', x: 61.1, y: 32, width: 8.8, height: 15 },
  { id: 'B3', x: 69.9, y: 32, width: 8.8, height: 15 },
];

export default function Index() {
  const [selectedEvent, setSelectedEvent] = useState<Event>(events[0]);
  const [booths, setBooths] = useState<Booth[]>(
    defaultPositions.map(p => ({ id: p.id, status: 'available' }))
  );
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [showSheetDialog, setShowSheetDialog] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [positions, setPositions] = useState<BoothPosition[]>(defaultPositions);
  const [dragging, setDragging] = useState<string | null>(null);
  const [resizing, setResizing] = useState<{ id: string; corner: string } | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [autoSync, setAutoSync] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedPositions = localStorage.getItem(`booth-positions-${selectedEvent.id}`);
    if (savedPositions) {
      setPositions(JSON.parse(savedPositions));
    } else {
      setPositions(defaultPositions);
    }
  }, [selectedEvent]);

  const stats = {
    total: booths.length,
    available: booths.filter(b => b.status === 'available').length,
    booked: booths.filter(b => b.status === 'booked').length,
    unavailable: booths.filter(b => b.status === 'unavailable').length,
  };

  const getBoothColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-booth-available hover:bg-booth-available/80';
      case 'booked':
        return 'bg-booth-booked hover:bg-booth-booked/80';
      case 'unavailable':
        return 'bg-booth-unavailable hover:bg-booth-unavailable/80';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Свободен';
      case 'booked':
        return 'Забронирован';
      case 'unavailable':
        return 'Недоступен';
      default:
        return status;
    }
  };

  const handleMouseDown = (e: React.MouseEvent, boothId: string) => {
    if (!editMode) return;
    e.stopPropagation();
    setDragging(boothId);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, boothId: string, corner: string) => {
    e.stopPropagation();
    setResizing({ id: boothId, corner });
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!mapRef.current || !startPos) return;

      const mapRect = mapRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - startPos.x) / mapRect.width) * 100;
      const deltaY = ((e.clientY - startPos.y) / mapRect.height) * 100;

      if (dragging) {
        setPositions(prev => prev.map(p => 
          p.id === dragging 
            ? { ...p, x: Math.max(0, Math.min(95, p.x + deltaX)), y: Math.max(0, Math.min(95, p.y + deltaY)) }
            : p
        ));
        setStartPos({ x: e.clientX, y: e.clientY });
      }

      if (resizing) {
        setPositions(prev => prev.map(p => {
          if (p.id !== resizing.id) return p;
          
          let newWidth = p.width;
          let newHeight = p.height;
          let newX = p.x;
          let newY = p.y;

          if (resizing.corner.includes('e')) {
            newWidth = Math.max(3, p.width + deltaX);
          }
          if (resizing.corner.includes('w')) {
            newWidth = Math.max(3, p.width - deltaX);
            newX = p.x + deltaX;
          }
          if (resizing.corner.includes('s')) {
            newHeight = Math.max(3, p.height + deltaY);
          }
          if (resizing.corner.includes('n')) {
            newHeight = Math.max(3, p.height - deltaY);
            newY = p.y + deltaY;
          }

          return { ...p, width: newWidth, height: newHeight, x: newX, y: newY };
        }));
        setStartPos({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
      setResizing(null);
      setStartPos(null);
    };

    if (dragging || resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, resizing, startPos]);

  const exportToPDF = async () => {
    if (!mapRef.current) return;

    toast({
      title: 'Генерация PDF',
      description: 'Подождите, создается документ...',
    });

    try {
      const canvas = await html2canvas(mapRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${selectedEvent.name}-${selectedEvent.date}.pdf`);

      toast({
        title: 'PDF создан',
        description: 'План мероприятия успешно экспортирован',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать PDF',
        variant: 'destructive',
      });
    }
  };

  const loadSheetData = async (silent = false) => {
    if (!sheetUrl.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Укажите URL Google Таблицы',
        variant: 'destructive',
      });
      return;
    }

    if (!silent) setLoading(true);

    try {
      const sheetId = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      if (!sheetId) {
        throw new Error('Неверный формат URL');
      }

      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      const response = await fetch(csvUrl);
      const csvText = await response.text();

      Papa.parse(csvText, {
        complete: (results) => {
          const data = results.data as string[][];
          const updatedBooths: Booth[] = [];

          data.slice(1).forEach((row) => {
            if (row[0]) {
              updatedBooths.push({
                id: row[0].trim(),
                status: (row[1]?.trim() as 'available' | 'booked' | 'unavailable') || 'available',
                company: row[2]?.trim() || undefined,
                contact: row[3]?.trim() || undefined,
                size: row[4]?.trim() || undefined,
                price: row[5]?.trim() || undefined,
              });
            }
          });

          setBooths(updatedBooths);
          const now = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
          setLastSyncTime(now);
          
          if (!silent) {
            toast({
              title: 'Данные загружены',
              description: `Обновлено ${updatedBooths.length} стендов`,
            });
            setShowSheetDialog(false);
          }
        },
        error: () => {
          throw new Error('Ошибка парсинга данных');
        },
      });
    } catch (error) {
      if (!silent) {
        toast({
          title: 'Ошибка загрузки',
          description: error instanceof Error ? error.message : 'Проверьте URL и доступ к таблице',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Icon name="CalendarDays" size={32} className="text-primary" />
              <h1 className="text-4xl font-bold text-gray-900">Бронирование стендов</h1>
            </div>
            <Button onClick={() => setShowSheetDialog(true)} variant="outline">
              <Icon name="Sheet" size={16} className="mr-2" />
              Синхронизация с Google Таблицами
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-600">Мероприятие:</label>
            <select
              value={selectedEvent.id}
              onChange={(e) => {
                const event = events.find(ev => ev.id === e.target.value);
                if (event) setSelectedEvent(event);
              }}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg bg-white text-gray-900 font-medium focus:border-primary focus:outline-none transition-colors"
            >
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name} • {event.date} • {event.location}
                </option>
              ))}
            </select>
          </div>
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
                <Icon name="XCircle" size={24} className="text-booth-booked" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Забронировано</p>
                <p className="text-3xl font-bold text-gray-900">{stats.booked}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 animate-scale-in bg-white border-2 border-booth-unavailable/20" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-booth-unavailable/10 rounded-lg">
                <Icon name="Ban" size={24} className="text-booth-unavailable" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Недоступно</p>
                <p className="text-3xl font-bold text-gray-900">{stats.unavailable}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Icon name="Map" size={24} className="text-primary" />
              <h2 className="text-2xl font-bold text-gray-900">План павильона</h2>
            </div>
            <div className="flex gap-2">
              {editMode ? (
                <>
                  <Button onClick={resetPositions} variant="outline" size="sm">
                    <Icon name="RotateCcw" size={16} className="mr-2" />
                    Сбросить
                  </Button>
                  <Button onClick={savePositions} size="sm">
                    <Icon name="Save" size={16} className="mr-2" />
                    Сохранить
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setEditMode(true)} variant="outline" size="sm">
                    <Icon name="Edit" size={16} className="mr-2" />
                    Редактировать разметку
                  </Button>
                  <Button onClick={exportToPDF} variant="outline" size="sm">
                    <Icon name="Download" size={16} className="mr-2" />
                    Скачать PDF
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
            <div ref={mapRef} className="relative w-full aspect-[2/1] bg-white">
              <img 
                src={selectedEvent.mapUrl} 
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

            {selectedBooth?.size && (
              <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Icon name="Maximize" size={18} />
                  <span className="text-sm font-medium">Размер</span>
                </div>
                <p className="text-gray-900 font-semibold pl-6">{selectedBooth.size}</p>
              </div>
            )}

            {selectedBooth?.price && (
              <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Icon name="DollarSign" size={18} />
                  <span className="text-sm font-medium">Стоимость</span>
                </div>
                <p className="text-gray-900 font-semibold pl-6">{selectedBooth.price}</p>
              </div>
            )}

            {selectedBooth?.company && (
              <>
                <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Icon name="Building2" size={18} />
                    <span className="text-sm font-medium">Компания</span>
                  </div>
                  <p className="text-gray-900 font-semibold pl-6">{selectedBooth.company}</p>
                </div>

                {selectedBooth.contact && (
                  <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Icon name="Phone" size={18} />
                      <span className="text-sm font-medium">Контакт</span>
                    </div>
                    <p className="text-gray-900 font-semibold pl-6">{selectedBooth.contact}</p>
                  </div>
                )}
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

      <Dialog open={showSheetDialog} onOpenChange={setShowSheetDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Icon name="Sheet" size={24} className="text-primary" />
              Синхронизация с Google Таблицами
            </DialogTitle>
            <DialogDescription>
              Подключите Google Таблицу для автоматической синхронизации статусов бронирования
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">URL Google Таблицы</label>
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
              <div className="flex items-start gap-3">
                <Icon name="Info" size={20} className="text-primary mt-0.5 flex-shrink-0" />
                <div className="text-xs text-gray-600">
                  <p className="font-medium text-gray-900 mb-2">Формат таблицы:</p>
                  <p>• Столбец A: Номер стенда (A1, A2, B1...)</p>
                  <p>• Столбец B: Статус (available/booked/unavailable)</p>
                  <p>• Столбец C: Компания (опционально)</p>
                  <p>• Столбец D: Контакт (опционально)</p>
                  <p>• Столбец E: Размер (опционально)</p>
                  <p>• Столбец F: Цена (опционально)</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
              <input
                type="checkbox"
                id="auto-sync"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
              <label htmlFor="auto-sync" className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                Автоматическое обновление каждые 30 секунд
              </label>
              {lastSyncTime && (
                <span className="text-xs text-gray-500">
                  Обновлено: {lastSyncTime}
                </span>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button onClick={() => setShowSheetDialog(false)} variant="outline">
                Отменить
              </Button>
              <Button onClick={() => loadSheetData(false)} disabled={loading} className="bg-booth-available hover:bg-booth-available/80">
                {loading ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Icon name="Download" size={16} className="mr-2" />
                    Загрузить данные
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
