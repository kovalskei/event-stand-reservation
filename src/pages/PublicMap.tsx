import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import PublicBoothDialog from '@/components/booth/PublicBoothDialog';

interface Booth {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  status: string;
  company?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  notes?: string;
  price?: string;
  size?: string;
}

interface EventInfo {
  id: number;
  name: string;
  date: string;
  location: string;
  description?: string;
  map_url?: string;
}

const API_URL = 'https://functions.poehali.dev/c9b46bff-046e-40ca-b12e-632b8ad7462f';

export default function PublicMap() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const pinchStartRef = useRef<{ dist: number; zoom: number; panX: number; panY: number; midX: number; midY: number } | null>(null);

  const searchParams = new URLSearchParams(window.location.search);
  const isWidget = searchParams.get('widget') === '1';
  const urlName = searchParams.get('name');
  const urlDate = searchParams.get('date');
  const urlLocation = searchParams.get('location');

  useEffect(() => {
    if (!eventId) return;
    loadEventData();
  }, [eventId]);

  useEffect(() => {
    const fitMap = () => {
      const parent = containerRef.current?.parentElement;
      if (!parent) return;
      const parentRect = parent.getBoundingClientRect();
      const containerWidth = 2400;
      const containerHeight = 1200;
      const scaleX = parentRect.width / containerWidth;
      const scaleY = parentRect.height / containerHeight;
      const fitZoom = Math.min(scaleX, scaleY, 1);
      const scaledW = containerWidth * fitZoom;
      const scaledH = containerHeight * fitZoom;
      setZoom(fitZoom);
      setPanOffset({ x: (parentRect.width - scaledW) / 2, y: (parentRect.height - scaledH) / 2 });
    };
    fitMap();
    window.addEventListener('resize', fitMap);
    return () => window.removeEventListener('resize', fitMap);
  }, []);

  const loadEventData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}?event_id=${eventId}`);
      if (!res.ok) throw new Error('Мероприятие не найдено');
      const data = await res.json();
      if (data.event) {
        setEvent(data.event);
      } else if (data.booths !== undefined) {
        setEvent(null);
      } else {
        throw new Error('Мероприятие не найдено');
      }
      setBooths(data.booths || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const getBoothColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-booth-available hover:bg-booth-available/80 cursor-pointer';
      case 'booked': return 'bg-booth-booked cursor-pointer';
      case 'unavailable': return 'bg-booth-unavailable cursor-not-allowed opacity-60';
      default: return 'bg-gray-400';
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(Math.max(z * delta, 0.1), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, panX: panOffset.x, panY: panOffset.y };
      pinchStartRef.current = null;
    } else if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      pinchStartRef.current = { dist, zoom, panX: panOffset.x, panY: panOffset.y, midX, midY };
      touchStartRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && touchStartRef.current) {
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;
      setPanOffset({ x: touchStartRef.current.panX + dx, y: touchStartRef.current.panY + dy });
    } else if (e.touches.length === 2 && pinchStartRef.current) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / pinchStartRef.current.dist;
      const newZoom = Math.min(Math.max(pinchStartRef.current.zoom * scale, 0.1), 5);
      setZoom(newZoom);
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    pinchStartRef.current = null;
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${isWidget ? 'h-full min-h-[400px]' : 'min-h-screen'} bg-slate-50`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Загружаем карту...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center ${isWidget ? 'h-full min-h-[400px]' : 'min-h-screen'} bg-slate-50`}>
        <div className="text-center space-y-2">
          <Icon name="AlertCircle" size={48} className="text-red-400 mx-auto" />
          <p className="text-gray-700 font-medium">{error}</p>
          <p className="text-gray-500 text-sm">Проверьте ссылку или попробуйте позже</p>
        </div>
      </div>
    );
  }

  const mapUrl = event?.map_url;
  const displayName = event?.name || urlName || 'Карта выставки';
  const displayDate = event?.date || urlDate || '';
  const displayLocation = event?.location || urlLocation || '';
  const stats = {
    total: booths.length,
    available: booths.filter(b => b.status === 'available').length,
    booked: booths.filter(b => b.status === 'booked').length,
  };

  return (
    <div className={`flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 ${isWidget ? 'h-full' : 'min-h-screen'}`}>
      {!isWidget && (
        <header className="bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{displayName}</h1>
              <p className="text-sm text-gray-500 flex items-center gap-3 flex-wrap mt-0.5">
                {displayDate && <span className="flex items-center gap-1"><Icon name="Calendar" size={14} />{displayDate}</span>}
                {displayLocation && <span className="flex items-center gap-1"><Icon name="MapPin" size={14} />{displayLocation}</span>}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm shrink-0">
              <span className="flex items-center gap-1.5 text-booth-available font-medium">
                <span className="w-3 h-3 rounded-sm bg-booth-available inline-block" />
                Свободно: {stats.available}
              </span>
              <span className="flex items-center gap-1.5 text-booth-booked font-medium">
                <span className="w-3 h-3 rounded-sm bg-booth-booked inline-block" />
                Занято: {stats.booked}
              </span>
            </div>
          </div>
        </header>
      )}

      {isWidget && (displayName || stats.total > 0) && (
        <div className="px-3 py-2 bg-white border-b border-slate-100 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{displayName}</p>
            {(displayDate || displayLocation) && (
              <p className="text-xs text-gray-500 truncate">{[displayDate, displayLocation].filter(Boolean).join(' • ')}</p>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs shrink-0">
            <Badge variant="outline" className="text-booth-available border-booth-available/40 text-xs">Свободно: {stats.available}</Badge>
            <Badge variant="outline" className="text-booth-booked border-booth-booked/40 text-xs">Занято: {stats.booked}</Badge>
          </div>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden select-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      >
        <div
          style={{
            position: 'absolute',
            width: 2400,
            height: 1200,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {mapUrl ? (
            <img src={mapUrl} alt="Карта" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
          ) : (
            <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
              <p className="text-slate-400 text-lg">Карта не загружена</p>
            </div>
          )}

          {booths.map((booth) => {
            const left = `${booth.x}%`;
            const top = `${booth.y}%`;
            const width = `${booth.width}%`;
            const height = `${booth.height}%`;
            const rotation = booth.rotation || 0;

            return (
              <div
                key={booth.id}
                className={`absolute flex flex-col items-center justify-center rounded transition-all border border-white/30 shadow-sm text-white text-center overflow-hidden ${getBoothColor(booth.status)}`}
                style={{ left, top, width, height, transform: `rotate(${rotation}deg)`, transformOrigin: 'center' }}
                onClick={() => booth.status !== 'unavailable' && setSelectedBooth(booth)}
                ref={containerRef}
              >
                <span className="text-[10px] font-bold leading-tight drop-shadow">{booth.id}</span>
                {booth.company && (
                  <span className="text-[8px] leading-tight opacity-90 truncate w-full text-center px-0.5">{booth.company}</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-3 right-3 flex flex-col gap-1">
          <button onClick={() => setZoom(z => Math.min(z * 1.2, 5))} className="w-8 h-8 bg-white rounded shadow border border-slate-200 flex items-center justify-center text-gray-600 hover:bg-slate-50 text-lg font-medium">+</button>
          <button onClick={() => setZoom(z => Math.max(z * 0.8, 0.1))} className="w-8 h-8 bg-white rounded shadow border border-slate-200 flex items-center justify-center text-gray-600 hover:bg-slate-50 text-lg font-medium">−</button>
        </div>

        {!isWidget && (
          <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-gray-500 border border-slate-200">
            Нажмите на стенд для подробной информации
          </div>
        )}
      </div>

      <PublicBoothDialog booth={selectedBooth} onClose={() => setSelectedBooth(null)} />
    </div>
  );
}