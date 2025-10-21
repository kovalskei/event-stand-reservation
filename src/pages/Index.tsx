import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';

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
  { id: 'A9', status: 'unavailable' },
  { id: 'A10', status: 'available' },
  { id: 'B1', status: 'available' },
  { id: 'B2', status: 'available' },
  { id: 'B3', status: 'booked', company: 'СмартТех', contact: 'Сидоров П.П.', price: '50 000 ₽', size: '3x3 м' },
  { id: 'B4', status: 'available' },
  { id: 'B5', status: 'available' },
  { id: 'B6', status: 'available' },
  { id: 'B7', status: 'available' },
  { id: 'B8', status: 'available' },
  { id: 'B9', status: 'available' },
  { id: 'B10', status: 'available' },
  { id: 'C1', status: 'available' },
  { id: 'C2', status: 'available' },
  { id: 'C3', status: 'available' },
  { id: 'C4', status: 'available' },
  { id: 'C5', status: 'booked', company: 'ДиджиталПро', contact: 'Козлова М.А.', price: '50 000 ₽', size: '3x3 м' },
  { id: 'C6', status: 'available' },
  { id: 'C7', status: 'available' },
  { id: 'C8', status: 'available' },
  { id: 'C9', status: 'available' },
  { id: 'C10', status: 'available' },
  { id: 'D1', status: 'available' },
  { id: 'D2', status: 'available' },
  { id: 'D3', status: 'available' },
  { id: 'D4', status: 'available' },
  { id: 'D5', status: 'available' },
  { id: 'D6', status: 'available' },
  { id: 'D7', status: 'available' },
  { id: 'D8', status: 'available' },
  { id: 'D9', status: 'available' },
  { id: 'D10', status: 'available' },
];

const defaultPositions: BoothPosition[] = [
  // Row A
  { id: 'A1', x: 50, y: 100, width: 80, height: 80 },
  { id: 'A2', x: 140, y: 100, width: 80, height: 80 },
  { id: 'A3', x: 230, y: 100, width: 80, height: 80 },
  { id: 'A4', x: 320, y: 100, width: 80, height: 80 },
  { id: 'A5', x: 410, y: 100, width: 80, height: 80 },
  { id: 'A6', x: 500, y: 100, width: 80, height: 80 },
  { id: 'A7', x: 590, y: 100, width: 80, height: 80 },
  { id: 'A8', x: 680, y: 100, width: 80, height: 80 },
  { id: 'A9', x: 770, y: 100, width: 80, height: 80 },
  { id: 'A10', x: 860, y: 100, width: 80, height: 80 },
  // Row B
  { id: 'B1', x: 50, y: 190, width: 80, height: 80 },
  { id: 'B2', x: 140, y: 190, width: 80, height: 80 },
  { id: 'B3', x: 230, y: 190, width: 80, height: 80 },
  { id: 'B4', x: 320, y: 190, width: 80, height: 80 },
  { id: 'B5', x: 410, y: 190, width: 80, height: 80 },
  { id: 'B6', x: 500, y: 190, width: 80, height: 80 },
  { id: 'B7', x: 590, y: 190, width: 80, height: 80 },
  { id: 'B8', x: 680, y: 190, width: 80, height: 80 },
  { id: 'B9', x: 770, y: 190, width: 80, height: 80 },
  { id: 'B10', x: 860, y: 190, width: 80, height: 80 },
  // Row C
  { id: 'C1', x: 50, y: 280, width: 80, height: 80 },
  { id: 'C2', x: 140, y: 280, width: 80, height: 80 },
  { id: 'C3', x: 230, y: 280, width: 80, height: 80 },
  { id: 'C4', x: 320, y: 280, width: 80, height: 80 },
  { id: 'C5', x: 410, y: 280, width: 80, height: 80 },
  { id: 'C6', x: 500, y: 280, width: 80, height: 80 },
  { id: 'C7', x: 590, y: 280, width: 80, height: 80 },
  { id: 'C8', x: 680, y: 280, width: 80, height: 80 },
  { id: 'C9', x: 770, y: 280, width: 80, height: 80 },
  { id: 'C10', x: 860, y: 280, width: 80, height: 80 },
  // Row D
  { id: 'D1', x: 50, y: 370, width: 80, height: 80 },
  { id: 'D2', x: 140, y: 370, width: 80, height: 80 },
  { id: 'D3', x: 230, y: 370, width: 80, height: 80 },
  { id: 'D4', x: 320, y: 370, width: 80, height: 80 },
  { id: 'D5', x: 410, y: 370, width: 80, height: 80 },
  { id: 'D6', x: 500, y: 370, width: 80, height: 80 },
  { id: 'D7', x: 590, y: 370, width: 80, height: 80 },
  { id: 'D8', x: 680, y: 370, width: 80, height: 80 },
  { id: 'D9', x: 770, y: 370, width: 80, height: 80 },
  { id: 'D10', x: 860, y: 370, width: 80, height: 80 },
];

export default function Index() {
  const [selectedEvent, setSelectedEvent] = useState<Event>(mockEvents[0]);
  const [booths, setBooths] = useState<Booth[]>(initialBooths);
  const [positions, setPositions] = useState<BoothPosition[]>(defaultPositions);
  const [selectedBooth, setSelectedBooth] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [draggedBooth, setDraggedBooth] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingBooth, setResizingBooth] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [showMap, setShowMap] = useState(true);
  const [mapOpacity, setMapOpacity] = useState(0.3);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<BoothStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    company: '',
    contact: '',
    price: '',
    size: '',
  });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (draggedBooth && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newX = e.clientX - rect.left - dragOffset.x;
        const newY = e.clientY - rect.top - dragOffset.y;

        setPositions(prev => prev.map(pos =>
          pos.id === draggedBooth
            ? { ...pos, x: Math.max(0, newX), y: Math.max(0, newY) }
            : pos
        ));
      }

      if (resizingBooth) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        const newWidth = Math.max(40, resizeStart.width + deltaX);
        const newHeight = Math.max(40, resizeStart.height + deltaY);

        setPositions(prev => prev.map(pos =>
          pos.id === resizingBooth
            ? { ...pos, width: newWidth, height: newHeight }
            : pos
        ));
      }
    };

    const onMouseUp = () => {
      if (draggedBooth) {
        snapToNeighbors(draggedBooth);
        setDraggedBooth(null);
      }
      if (resizingBooth) {
        setResizingBooth(null);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [draggedBooth, resizingBooth, dragOffset, resizeStart, positions]);

  const handleBoothClick = (boothId: string) => {
    if (!editMode) {
      setSelectedBooth(boothId);
      const booth = booths.find(b => b.id === boothId);
      if (booth) {
        setFormData({
          company: booth.company || '',
          contact: booth.contact || '',
          price: booth.price || '',
          size: booth.size || '',
        });
        setDialogOpen(true);
      }
    }
  };

  const handleSaveBooth = () => {
    if (selectedBooth) {
      setBooths(booths.map(booth =>
        booth.id === selectedBooth
          ? {
              ...booth,
              status: formData.company ? 'booked' : 'available',
              company: formData.company || undefined,
              contact: formData.contact || undefined,
              price: formData.price || undefined,
              size: formData.size || undefined,
            }
          : booth
      ));
      toast({
        title: 'Сохранено',
        description: `Стенд ${selectedBooth} успешно обновлен`,
      });
      setDialogOpen(false);
      setFormData({ company: '', contact: '', price: '', size: '' });
    }
  };

  const handleMouseDown = (e: React.MouseEvent, boothId: string) => {
    if (!editMode) return;
    e.preventDefault();
    const position = positions.find(p => p.id === boothId);
    if (position) {
      setDraggedBooth(boothId);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent, boothId: string) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    const position = positions.find(p => p.id === boothId);
    if (position) {
      setResizingBooth(boothId);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: position.width,
        height: position.height,
      });
    }
  };



  const snapToNeighbors = (boothId: string) => {
    const SNAP_THRESHOLD = 15;
    const position = positions.find(p => p.id === boothId);
    if (!position) return;

    let snappedX = position.x;
    let snappedY = position.y;

    positions.forEach(otherPos => {
      if (otherPos.id === boothId) return;

      // Snap to right edge
      if (Math.abs(position.x - (otherPos.x + otherPos.width)) < SNAP_THRESHOLD) {
        snappedX = otherPos.x + otherPos.width;
      }
      // Snap to left edge
      if (Math.abs((position.x + position.width) - otherPos.x) < SNAP_THRESHOLD) {
        snappedX = otherPos.x - position.width;
      }
      // Snap to bottom edge
      if (Math.abs(position.y - (otherPos.y + otherPos.height)) < SNAP_THRESHOLD) {
        snappedY = otherPos.y + otherPos.height;
      }
      // Snap to top edge
      if (Math.abs((position.y + position.height) - otherPos.y) < SNAP_THRESHOLD) {
        snappedY = otherPos.y - position.height;
      }
      // Align horizontally
      if (Math.abs(position.y - otherPos.y) < SNAP_THRESHOLD) {
        snappedY = otherPos.y;
      }
      // Align vertically
      if (Math.abs(position.x - otherPos.x) < SNAP_THRESHOLD) {
        snappedX = otherPos.x;
      }
    });

    setPositions(positions.map(pos =>
      pos.id === boothId
        ? { ...pos, x: snappedX, y: snappedY }
        : pos
    ));
  };

  const exportToPDF = async () => {
    if (!containerRef.current) return;

    try {
      toast({
        title: 'Генерация PDF',
        description: 'Подождите, создаем отчет...',
      });

      // Capture the map container
      const canvas = await html2canvas(containerRef.current, {
        allowTaint: true,
        useCORS: true,
        scale: 2,
        backgroundColor: '#ffffff',
      });

      // Create PDF in landscape mode
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Add header
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(selectedEvent.name, pageWidth / 2, 15, { align: 'center' });

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Дата: ${selectedEvent.date}`, pageWidth / 2, 22, { align: 'center' });
      pdf.text(`Место: ${selectedEvent.location}`, pageWidth / 2, 28, { align: 'center' });

      // Add map screenshot
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const yPosition = 35;

      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        10,
        yPosition,
        imgWidth,
        Math.min(imgHeight, 120)
      );

      // Calculate statistics
      const bookedBooths = booths.filter(b => b.status === 'booked');
      const availableBooths = booths.filter(b => b.status === 'available');
      const unavailableBooths = booths.filter(b => b.status === 'unavailable');

      // Add statistics section
      let currentY = yPosition + Math.min(imgHeight, 120) + 10;

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Статистика:', 10, currentY);
      currentY += 7;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Всего стендов: ${booths.length}`, 10, currentY);
      currentY += 6;
      pdf.text(`Забронировано: ${bookedBooths.length}`, 10, currentY);
      currentY += 6;
      pdf.text(`Доступно: ${availableBooths.length}`, 10, currentY);
      currentY += 6;
      pdf.text(`Недоступно: ${unavailableBooths.length}`, 10, currentY);
      currentY += 6;
      pdf.text(
        `Процент бронирования: ${((bookedBooths.length / booths.length) * 100).toFixed(1)}%`,
        10,
        currentY
      );
      currentY += 10;

      // Add list of booked booths
      if (bookedBooths.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Забронированные стенды:', 10, currentY);
        currentY += 7;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');

        bookedBooths.forEach((booth, index) => {
          const text = `${booth.id} - ${booth.company || 'Без названия'}`;
          
          // Check if we need a new page
          if (currentY > pageHeight - 20) {
            pdf.addPage();
            currentY = 15;
          }

          pdf.text(text, 10, currentY);
          currentY += 5;

          // Add additional details on the same line or next line based on space
          if (booth.contact) {
            pdf.setFont('helvetica', 'italic');
            pdf.text(`  Контакт: ${booth.contact}`, 15, currentY);
            currentY += 5;
          }
          if (booth.size && booth.price) {
            pdf.text(`  Размер: ${booth.size}, Цена: ${booth.price}`, 15, currentY);
            currentY += 5;
          }
          pdf.setFont('helvetica', 'normal');
          
          currentY += 2; // Extra spacing between booths
        });
      }

      // Add footer
      const timestamp = new Date().toLocaleString('ru-RU');
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Сгенерировано: ${timestamp}`, pageWidth / 2, pageHeight - 5, { align: 'center' });

      // Save PDF
      pdf.save(`${selectedEvent.name}_план_стендов.pdf`);

      toast({
        title: 'Готово',
        description: 'PDF отчет успешно сохранен',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать PDF',
        variant: 'destructive',
      });
    }
  };

  const exportToCSV = () => {
    const csvData = booths.map(booth => ({
      'ID стенда': booth.id,
      'Статус': booth.status === 'booked' ? 'Забронирован' : booth.status === 'available' ? 'Доступен' : 'Недоступен',
      'Компания': booth.company || '',
      'Контакт': booth.contact || '',
      'Цена': booth.price || '',
      'Размер': booth.size || '',
    }));

    const csv = Papa.unparse(csvData, {
      delimiter: ',',
      header: true,
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedEvent.name}_стенды.csv`;
    link.click();

    toast({
      title: 'Готово',
      description: 'CSV файл успешно экспортирован',
    });
  };

  const importFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const importedBooths = results.data.map((row: any) => ({
          id: row['ID стенда'],
          status: row['Статус'] === 'Забронирован' ? 'booked' : row['Статус'] === 'Недоступен' ? 'unavailable' : 'available',
          company: row['Компания'] || undefined,
          contact: row['Контакт'] || undefined,
          price: row['Цена'] || undefined,
          size: row['Размер'] || undefined,
        })).filter((booth: any) => booth.id);

        setBooths(importedBooths as Booth[]);
        toast({
          title: 'Готово',
          description: `Импортировано ${importedBooths.length} стендов`,
        });
      },
      error: (error) => {
        console.error('CSV import error:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось импортировать CSV',
          variant: 'destructive',
        });
      },
    });
  };

  const resetLayout = () => {
    setPositions(defaultPositions);
    toast({
      title: 'Готово',
      description: 'Расположение стендов сброшено',
    });
  };

  const getStatusColor = (status: BoothStatus) => {
    switch (status) {
      case 'available':
        return 'bg-green-500 hover:bg-green-600';
      case 'booked':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'unavailable':
        return 'bg-gray-400 hover:bg-gray-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusBadgeVariant = (status: BoothStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'available':
        return 'default';
      case 'booked':
        return 'secondary';
      case 'unavailable':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: BoothStatus) => {
    switch (status) {
      case 'available':
        return 'Доступен';
      case 'booked':
        return 'Забронирован';
      case 'unavailable':
        return 'Недоступен';
      default:
        return '';
    }
  };

  const filteredBooths = booths.filter(booth => {
    const matchesSearch = 
      booth.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booth.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booth.contact?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || booth.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: booths.length,
    available: booths.filter(b => b.status === 'available').length,
    booked: booths.filter(b => b.status === 'booked').length,
    unavailable: booths.filter(b => b.status === 'unavailable').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Управление стендами</h1>
          <p className="text-gray-600">Планирование и бронирование выставочных мест</p>
        </div>

        {/* Event Selector */}
        <Card className="mb-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Icon name="calendar" className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedEvent.name}</h2>
                <p className="text-sm text-gray-600">{selectedEvent.date} • {selectedEvent.location}</p>
              </div>
            </div>
            <select
              value={selectedEvent.id}
              onChange={(e) => {
                const event = mockEvents.find(ev => ev.id === e.target.value);
                if (event) setSelectedEvent(event);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {mockEvents.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Icon name="grid-3x3" className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Всего стендов</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Icon name="check-circle" className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Доступно</p>
                <p className="text-2xl font-bold text-gray-900">{stats.available}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Icon name="bookmark" className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Забронировано</p>
                <p className="text-2xl font-bold text-gray-900">{stats.booked}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Icon name="x-circle" className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Недоступно</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unavailable}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Toolbar */}
        <Card className="mb-6 p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск по ID, компании, контакту..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as BoothStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все статусы</option>
              <option value="available">Доступен</option>
              <option value="booked">Забронирован</option>
              <option value="unavailable">Недоступен</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Icon name="grid-3x3" className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <Icon name="list" className="w-4 h-4" />
              </Button>
            </div>

            {/* Edit Mode Toggle */}
            <Button
              variant={editMode ? 'default' : 'outline'}
              onClick={() => setEditMode(!editMode)}
            >
              <Icon name="edit" className="w-4 h-4 mr-2" />
              {editMode ? 'Режим редактирования' : 'Редактировать'}
            </Button>

            {/* Map Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowMap(!showMap)}
            >
              <Icon name="map" className="w-4 h-4 mr-2" />
              {showMap ? 'Скрыть карту' : 'Показать карту'}
            </Button>

            {/* Export Buttons */}
            <Button variant="outline" onClick={exportToPDF}>
              <Icon name="file-text" className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Icon name="download" className="w-4 h-4 mr-2" />
              CSV
            </Button>

            {/* Import CSV */}
            <label className="cursor-pointer">
              <Button variant="outline" asChild>
                <span>
                  <Icon name="upload" className="w-4 h-4 mr-2" />
                  Импорт
                </span>
              </Button>
              <input
                type="file"
                accept=".csv"
                onChange={importFromCSV}
                className="hidden"
              />
            </label>

            {/* Reset Layout */}
            {editMode && (
              <Button variant="outline" onClick={resetLayout}>
                <Icon name="refresh-cw" className="w-4 h-4 mr-2" />
                Сбросить
              </Button>
            )}
          </div>

          {/* Map Opacity Slider */}
          {showMap && editMode && (
            <div className="mt-4 flex items-center gap-4">
              <label className="text-sm text-gray-600">Прозрачность карты:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={mapOpacity}
                onChange={(e) => setMapOpacity(parseFloat(e.target.value))}
                className="flex-1 max-w-xs"
              />
              <span className="text-sm text-gray-600">{Math.round(mapOpacity * 100)}%</span>
            </div>
          )}
        </Card>

        {/* Main Content */}
        {viewMode === 'grid' ? (
          <Card className="p-6">
            <div
              ref={containerRef}
              className="relative bg-white rounded-lg border-2 border-gray-200 overflow-hidden"
              style={{ height: '600px' }}
            >
              {/* Background Map */}
              {showMap && selectedEvent.mapUrl && (
                <img
                  src={selectedEvent.mapUrl}
                  alt="Floor plan"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  style={{ opacity: mapOpacity }}
                />
              )}

              {/* Booths */}
              {filteredBooths.map(booth => {
                const position = positions.find(p => p.id === booth.id);
                if (!position) return null;

                return (
                  <div
                    key={booth.id}
                    className={`absolute cursor-pointer transition-all duration-200 rounded-lg border-2 border-white shadow-lg flex items-center justify-center text-white font-semibold ${getStatusColor(booth.status)} ${
                      draggedBooth === booth.id ? 'z-50 scale-110' : 'z-10'
                    }`}
                    style={{
                      left: `${position.x}px`,
                      top: `${position.y}px`,
                      width: `${position.width}px`,
                      height: `${position.height}px`,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, booth.id)}
                    onClick={() => handleBoothClick(booth.id)}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold">{booth.id}</div>
                      {booth.company && (
                        <div className="text-xs mt-1 truncate px-2">{booth.company}</div>
                      )}
                    </div>
                    
                    {/* Resize Handle */}
                    {editMode && (
                      <div
                        className="absolute bottom-0 right-0 w-4 h-4 bg-white border-2 border-gray-400 rounded-tl cursor-se-resize"
                        onMouseDown={(e) => handleResizeMouseDown(e, booth.id)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">ID</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Статус</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Компания</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Контакт</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Размер</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Цена</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooths.map(booth => (
                    <tr key={booth.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 font-semibold text-gray-900">{booth.id}</td>
                      <td className="p-3">
                        <Badge variant={getStatusBadgeVariant(booth.status)}>
                          {getStatusText(booth.status)}
                        </Badge>
                      </td>
                      <td className="p-3 text-gray-700">{booth.company || '-'}</td>
                      <td className="p-3 text-gray-700">{booth.contact || '-'}</td>
                      <td className="p-3 text-gray-700">{booth.size || '-'}</td>
                      <td className="p-3 text-gray-700">{booth.price || '-'}</td>
                      <td className="p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBoothClick(booth.id)}
                        >
                          <Icon name="edit" className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Legend */}
        <Card className="mt-6 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Легенда</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Доступен</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Забронирован</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-400 rounded"></div>
              <span className="text-sm text-gray-600">Недоступен</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать стенд {selectedBooth}</DialogTitle>
            <DialogDescription>
              Введите информацию о компании и параметры стенда
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Компания
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Название компании"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Контактное лицо
              </label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="Имя контакта"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Размер
              </label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="Например: 3x3 м"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Цена
              </label>
              <input
                type="text"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="Например: 50 000 ₽"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveBooth}>
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}