import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type BoothStatus = 'available' | 'booked' | 'unavailable';

interface Booth {
  id: string;
  status: BoothStatus;
  company?: string;
  contact?: string;
  price?: string;
  size?: string;
}

interface BoothPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  mapUrl: string;
  sheetId: string;
}

const mockEvents: Event[] = [
  {
    id: '1',
    name: 'Выставка 2025',
    date: '15-20 марта 2025',
    location: 'Павильон 1',
    mapUrl: 'https://cdn.poehali.dev/files/84989299-cef8-4fc0-a2cd-b8106a39b96d.png',
    sheetId: '',
  },
  {
    id: '2',
    name: 'Tech Forum 2025',
    date: '5-10 апреля 2025',
    location: 'Павильон 2',
    mapUrl: 'https://cdn.poehali.dev/files/84989299-cef8-4fc0-a2cd-b8106a39b96d.png',
    sheetId: '',
  },
];

const initialBooths: Booth[] = [
  { id: 'A1', status: 'available' },
  { id: 'A2', status: 'booked', company: 'ТехноПром', contact: 'Иванов И.И.', price: '50 000 ₽', size: '3x3 м' },
  { id: 'A3', status: 'available' },
  { id: 'A4', status: 'available' },
  { id: 'A5', status: 'booked', company: 'ИнноВейт', contact: 'Петрова А.С.', price: '50 000 ₽', size: '3x3 м' },
  { id: 'A6', status: 'available' },
  { id: 'A7', status: 'available' },
  { id: 'A8', status: 'available' },
  { id: 'A9', status: 'available' },
  { id: 'A10', status: 'booked', company: 'МегаСтрой', contact: 'Сидоров П.П.', price: '50 000 ₽', size: '3x3 м' },
  { id: 'A11', status: 'available' },
  { id: 'A12', status: 'available' },
  { id: 'B1', status: 'available' },
  { id: 'B2', status: 'available' },
  { id: 'B3', status: 'booked', company: 'ЭкоЛайн', contact: 'Морозова Е.В.', price: '75 000 ₽', size: '4x4 м' },
];

const defaultPositions: BoothPosition[] = [
  { id: 'A1', x: 19, y: 18, width: 5, height: 10.5, rotation: 0 },
  { id: 'A2', x: 24.15, y: 18, width: 5, height: 10.5, rotation: 0 },
  { id: 'A3', x: 29.3, y: 18, width: 5, height: 10.5, rotation: 0 },
  { id: 'A4', x: 34.45, y: 18, width: 5, height: 10.5, rotation: 0 },
  { id: 'A5', x: 39.6, y: 18, width: 5, height: 10.5, rotation: 0 },
  { id: 'A6', x: 44.75, y: 18, width: 5, height: 10.5, rotation: 0 },
  { id: 'A7', x: 49.9, y: 18, width: 5, height: 10.5, rotation: 0 },
  { id: 'A8', x: 55.05, y: 18, width: 5, height: 10.5, rotation: 0 },
  { id: 'A9', x: 60.2, y: 18, width: 5, height: 10.5, rotation: 0 },
  { id: 'A10', x: 65.35, y: 18, width: 5, height: 10.5, rotation: 0 },
  { id: 'A11', x: 70.5, y: 18, width: 5, height: 10.5, rotation: 0 },
  { id: 'A12', x: 75.65, y: 18, width: 5, height: 10.5, rotation: 0 },
  { id: 'B1', x: 43, y: 50.5, width: 4.5, height: 10.5, rotation: 0 },
  { id: 'B2', x: 47.8, y: 50.5, width: 4.5, height: 10.5, rotation: 0 },
  { id: 'B3', x: 52.6, y: 50.5, width: 4.5, height: 10.5, rotation: 0 },
];

export default function Index() {
  const [events] = useState<Event[]>(mockEvents);
  const [selectedEvent, setSelectedEvent] = useState<Event>(mockEvents[0]);
  const [booths, setBooths] = useState<Booth[]>(initialBooths);
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
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
  const [zoom, setZoom] = useState(1);
  const [mapChanged, setMapChanged] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isMousePanning, setIsMousePanning] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const SNAP_THRESHOLD = 1.5;

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
    
    const position = positions.find(p => p.id === boothId);
    if (!position) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const containerWidth = 2400;
    const containerHeight = 1200;
    
    const mouseXInContainer = (e.clientX - rect.left - panOffset.x) / zoom;
    const mouseYInContainer = (e.clientY - rect.top - panOffset.y) / zoom;
    
    const mouseX = (mouseXInContainer / containerWidth) * 100;
    const mouseY = (mouseYInContainer / containerHeight) * 100;
    
    const offsetX = mouseX - position.x;
    const offsetY = mouseY - position.y;
    
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
    const containerWidth = 2400;
    const containerHeight = 1200;
    
    const mouseXInContainer = (e.clientX - rect.left - panOffset.x) / zoom;
    const mouseYInContainer = (e.clientY - rect.top - panOffset.y) / zoom;
    
    const mouseX = (mouseXInContainer / containerWidth) * 100;
    const mouseY = (mouseYInContainer / containerHeight) * 100;

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
    } else if (rotating) {
      const position = positions.find(p => p.id === rotating);
      if (!position) return;

      const centerX = position.x + position.width / 2;
      const centerY = position.y + position.height / 2;

      const angle = Math.atan2(mouseY - centerY, mouseX - centerX) * (180 / Math.PI);
      const rotation = Math.round(angle);

      setPositions(prev => prev.map(p => 
        p.id === rotating ? { ...p, rotation } : p
      ));
    } else if (resizing) {
      const position = positions.find(p => p.id === resizing.id);
      if (!position) return;

      const newPos = { ...position };

      switch (resizing.corner) {
        case 'se':
          newPos.width = Math.max(0.5, mouseX - position.x);
          newPos.height = Math.max(0.5, mouseY - position.y);
          break;
        case 'sw':
          const newWidth = Math.max(0.5, position.x + position.width - mouseX);
          newPos.x = position.x + position.width - newWidth;
          newPos.width = newWidth;
          newPos.height = Math.max(0.5, mouseY - position.y);
          break;
        case 'ne':
          newPos.width = Math.max(0.5, mouseX - position.x);
          const newHeight = Math.max(0.5, position.y + position.height - mouseY);
          newPos.y = position.y + position.height - newHeight;
          newPos.height = newHeight;
          break;
        case 'nw':
          const newW = Math.max(0.5, position.x + position.width - mouseX);
          const newH = Math.max(0.5, position.y + position.height - mouseY);
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

  const handleRotateMouseDown = (e: React.MouseEvent, boothId: string) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    
    setRotating(boothId);
  };

  const handleMouseUp = () => {
    setDragging(null);
    setResizing(null);
    setRotating(null);
  };

  useEffect(() => {
    if (dragging || rotating) {
      window.addEventListener('mouseup', handleMouseUp as any);
      return () => window.removeEventListener('mouseup', handleMouseUp as any);
    }
  }, [dragging, rotating]);

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
      
      if (data.mapUrl) {
        setSelectedEvent(prev => ({
          ...prev,
          mapUrl: data.mapUrl
        }));
      }
      
      setShowSheetDialog(false);
      setLastSyncTime(new Date().toLocaleTimeString('ru-RU'));
      
      if (!silent) {
        toast({
          title: 'Данные загружены',
          description: `Синхронизировано ${data.booths.length} стендов${data.mapUrl ? ' и карта обновлена' : ''}`,
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

  const saveMapUrl = () => {
    localStorage.setItem(`map-url-${selectedEvent.id}`, selectedEvent.mapUrl);
    setMapChanged(false);
    toast({
      title: 'Карта сохранена',
      description: 'URL карты сохранён в localStorage',
    });
  };

  const autoDetectBooths = async () => {
    setLoading(true);
    toast({
      title: 'Автоопределение стендов',
      description: 'Анализируем карту...',
    });

    try {
      const response = await fetch('https://functions.poehali.dev/c2e9e565-4a01-4b37-8c5b-7853ae94e5bd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: selectedEvent.mapUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка определения стендов');
      }

      const data = await response.json();
      
      const detectedPositions = data.booths.map((booth: any) => ({
        id: booth.id,
        x: booth.x,
        y: booth.y,
        width: booth.width,
        height: booth.height,
      }));

      setPositions(detectedPositions);

      toast({
        title: 'Стенды определены',
        description: `Найдено ${data.count} стендов. Проверьте и скорректируйте позиции.`,
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось определить стенды',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPositions = () => {
    setPositions(defaultPositions);
    localStorage.removeItem(`booth-positions-${selectedEvent.id}`);
    toast({
      title: 'Позиции сброшены',
      description: 'Разметка возвращена к настройкам по умолчанию',
    });
  };

  const handleMapUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Ошибка',
        description: 'Выберите файл изображения',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    toast({
      title: 'Загрузка изображения',
      description: 'Изображение сохраняется в проект...',
    });

    try {
      const reader = new FileReader();
      
      reader.onload = () => {
        const dataUrl = reader.result as string;
        
        setSelectedEvent(prev => ({
          ...prev,
          mapUrl: dataUrl
        }));

        setMapChanged(true);
        setShowMapUploadDialog(false);

        toast({
          title: 'Изображение загружено',
          description: 'Нажмите "Сохранить карту" чтобы применить изменения',
        });
        
        setLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };

      reader.onerror = () => {
        toast({
          title: 'Ошибка',
          description: 'Не удалось прочитать файл',
          variant: 'destructive',
        });
        setLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить изображение',
        variant: 'destructive',
      });
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const exportToPDF = async () => {
    const mapElement = containerRef.current;
    if (!mapElement) return;

    toast({
      title: 'Экспорт в PDF',
      description: 'Подготовка документа...',
    });

    try {
      const canvas = await html2canvas(mapElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const headerCanvas = document.createElement('canvas');
      headerCanvas.width = 800;
      headerCanvas.height = 100;
      const ctx = headerCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 800, 100);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(selectedEvent.name, 400, 40);
        ctx.font = '18px Arial';
        ctx.fillText(`${selectedEvent.date} • ${selectedEvent.location}`, 400, 70);
      }
      const headerData = headerCanvas.toDataURL('image/png');
      pdf.addImage(headerData, 'PNG', 10, 10, 190, 23.75);
      
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 10, 40, imgWidth, imgHeight);
      
      let yPosition = 40 + imgHeight + 10;
      
      const bookedBooths = booths.filter(b => b.status === 'booked' && b.company);
      
      if (bookedBooths.length > 0) {
        const listCanvas = document.createElement('canvas');
        listCanvas.width = 800;
        const lineHeight = 30;
        listCanvas.height = (bookedBooths.length + 1) * lineHeight + 20;
        const listCtx = listCanvas.getContext('2d');
        
        if (listCtx) {
          listCtx.fillStyle = '#ffffff';
          listCtx.fillRect(0, 0, listCanvas.width, listCanvas.height);
          listCtx.fillStyle = '#000000';
          listCtx.font = 'bold 24px Arial';
          listCtx.fillText('Забронированные стенды:', 10, 30);
          
          listCtx.font = '20px Arial';
          bookedBooths.forEach((booth, index) => {
            listCtx.fillText(`${booth.id} - ${booth.company}`, 10, 60 + index * lineHeight);
          });
        }
        
        const listData = listCanvas.toDataURL('image/png');
        const listHeight = (listCanvas.height * 190) / listCanvas.width;
        
        if (yPosition + listHeight > 280) {
          pdf.addPage();
          yPosition = 15;
        }
        
        pdf.addImage(listData, 'PNG', 10, yPosition, 190, listHeight);
      }
      
      pdf.save(`${selectedEvent.name}_карта_стендов.pdf`);
      
      toast({
        title: 'PDF сохранен',
        description: 'Карта стендов успешно экспортирована',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать PDF',
        variant: 'destructive',
      });
    }
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
                  <Button onClick={autoDetectBooths} variant="outline" size="sm" disabled={loading}>
                    <Icon name="Sparkles" size={16} className="mr-2" />
                    Автоопределение
                  </Button>
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
                <div className="flex gap-2 items-center">
                  <div className="flex items-center gap-2 mr-2">
                    <Button 
                      onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} 
                      variant="outline" 
                      size="sm"
                      className="px-2"
                    >
                      <Icon name="ZoomOut" size={16} />
                    </Button>
                    <span className="text-sm text-gray-600 font-medium min-w-[60px] text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <Button 
                      onClick={() => setZoom(Math.min(7, zoom + 0.1))} 
                      variant="outline" 
                      size="sm"
                      className="px-2"
                    >
                      <Icon name="ZoomIn" size={16} />
                    </Button>
                    <Button 
                      onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }} 
                      variant="outline" 
                      size="sm"
                      title="Сбросить масштаб"
                    >
                      <Icon name="Maximize2" size={16} />
                    </Button>
                  </div>
                  <Button onClick={() => setShowMapUploadDialog(true)} variant="outline" size="sm">
                    <Icon name="Upload" size={16} className="mr-2" />
                    Загрузить карту
                  </Button>
                  {mapChanged && (
                    <Button onClick={saveMapUrl} size="sm" className="bg-booth-available hover:bg-booth-available/80">
                      <Icon name="Save" size={16} className="mr-2" />
                      Сохранить карту
                    </Button>
                  )}
                  <Button onClick={exportToPDF} variant="outline" size="sm">
                    <Icon name="FileDown" size={16} className="mr-2" />
                    Экспорт в PDF
                  </Button>
                  <Button onClick={() => setEditMode(true)} variant="outline" size="sm">
                    <Icon name="Edit" size={16} className="mr-2" />
                    Настроить разметку
                  </Button>
                </div>
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

          <div 
            className="relative bg-white rounded-xl p-4 border-2 border-gray-200 overflow-hidden"
            style={{ height: '800px' }}
          >
            <div 
              ref={containerRef}
              className="relative w-full select-none" 
              style={{ 
                width: '2400px',
                height: '1200px',
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
                cursor: isPanning ? 'grabbing' : isMousePanning ? 'grab' : 'default'
              }}
              onMouseDown={(e) => {
                if (e.button === 0 && e.target === e.currentTarget) {
                  setIsMousePanning(true);
                  setDragOffset({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
                }
              }}
              onMouseMove={(e) => {
                if (isMousePanning) {
                  setIsPanning(true);
                  setPanOffset({
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y
                  });
                }
                if (editMode) {
                  handleMouseMove(e);
                }
              }}
              onMouseUp={handleMouseUp}
              onWheel={(e) => {
                e.preventDefault();
                const container = containerRef.current?.parentElement;
                if (!container) return;

                const rect = container.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                const delta = e.deltaY > 0 ? -0.15 : 0.15;
                const newZoom = Math.max(0.5, Math.min(7, zoom + delta));

                const pointX = (mouseX - panOffset.x) / zoom;
                const pointY = (mouseY - panOffset.y) / zoom;

                const newPanX = mouseX - pointX * newZoom;
                const newPanY = mouseY - pointY * newZoom;

                setZoom(newZoom);
                setPanOffset({ x: newPanX, y: newPanY });
              }}
            >
              <img 
                src={selectedEvent.mapUrl} 
                alt="План павильона" 
                className="w-full h-full object-contain pointer-events-none"
              />

              {booths.map((booth) => {
                const position = positions.find(p => p.id === booth.id);
                if (!position) return null;
                
                const isActive = dragging === booth.id || resizing?.id === booth.id || rotating === booth.id;
                
                return (
                  <div
                    key={booth.id}
                    className={`absolute ${isActive ? 'z-50' : 'hover:z-40'}`}
                    style={{
                      left: `${position.x}%`,
                      top: `${position.y}%`,
                      width: `${position.width}%`,
                      height: `${position.height}%`,
                      transform: `rotate(${position.rotation || 0}deg)`,
                      transformOrigin: 'center',
                    }}
                  >
                    <button
                      onMouseDown={(e) => handleMouseDown(e, booth.id)}
                      onClick={() => !editMode && setSelectedBooth(booth)}
                      className={`${getBoothColor(booth.status)} text-white font-bold text-xs sm:text-sm rounded-sm transition-all duration-200 ${editMode ? 'cursor-move hover:ring-2 hover:ring-primary/50' : 'cursor-pointer hover:scale-110 hover:shadow-2xl'} w-full h-full flex items-center justify-center ${editMode ? 'border border-primary' : 'border-2 border-white/20'} ${isActive ? 'shadow-2xl ring-2 ring-primary' : ''}`}
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
                        <div
                          onMouseDown={(e) => handleRotateMouseDown(e, booth.id)}
                          className="absolute top-0 left-1/2 w-4 h-4 bg-green-500 rounded-full cursor-grab border-2 border-white shadow-lg hover:scale-125 transition-transform flex items-center justify-center"
                          style={{ transform: 'translate(-50%, -150%)' }}
                          title="Вращать"
                        >
                          <Icon name="RotateCw" size={10} className="text-white" />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="absolute bottom-6 left-6 bg-white/90 px-3 py-2 rounded-lg border-2 border-gray-200 text-xs text-gray-600">
              💡 Колёсико мыши для зума • Зажмите левую кнопку для перемещения карты
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
                  <p className="mt-2 font-medium text-gray-900">Для загрузки карты из таблицы:</p>
                  <p>• Добавьте строку: mapUrl в столбец A, URL картинки в столбец B</p>
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

      <Dialog open={showMapUploadDialog} onOpenChange={setShowMapUploadDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Icon name="Upload" size={24} className="text-primary" />
              Загрузка карты павильона
            </DialogTitle>
            <DialogDescription>
              Загрузите изображение карты, чтобы обновить фоновую подложку
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Выберите изображение</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleMapUpload}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80 cursor-pointer"
              />
            </div>

            <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
              <div className="flex items-start gap-3">
                <Icon name="Info" size={20} className="text-primary mt-0.5 flex-shrink-0" />
                <div className="text-xs text-gray-600">
                  <p className="font-medium text-gray-900 mb-2">Рекомендации:</p>
                  <p>• Формат: PNG, JPG, JPEG</p>
                  <p>• Соотношение сторон: 1920×850 (широкоформатное)</p>
                  <p>• Максимальный размер: 10 МБ</p>
                  <p>• Изображение будет загружено на сервер poehali.dev</p>
                </div>
              </div>
            </div>

            {selectedEvent.mapUrl && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Текущая карта:</p>
                <img 
                  src={selectedEvent.mapUrl} 
                  alt="Текущая карта" 
                  className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                />
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button onClick={() => setShowMapUploadDialog(false)} variant="outline">
                Закрыть
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}