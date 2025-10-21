import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

type BoothStatus = 'available' | 'booked' | 'unavailable';

interface Booth {
  id: string;
  status: BoothStatus;
  company?: string;
  contact?: string;
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

export default function Index() {
  const [booths] = useState<Booth[]>(initialBooths);
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);

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
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-booth-available"></div>
                <span className="text-sm text-gray-600">Свободен</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-booth-booked"></div>
                <span className="text-sm text-gray-600">Забронирован</span>
              </div>
            </div>
          </div>

          <div className="relative bg-white rounded-xl p-4 border-2 border-gray-200 overflow-auto">
            <div className="relative min-w-[1200px] w-full" style={{ aspectRatio: '1920/850' }}>
              <img 
                src="https://cdn.poehali.dev/files/84989299-cef8-4fc0-a2cd-b8106a39b96d.png" 
                alt="План павильона" 
                className="w-full h-full object-contain"
              />

              <div className="absolute top-[18%] left-[19%] w-[62.5%] h-[10.5%] grid grid-cols-12 gap-[0.15%]">
                {booths.filter(b => b.id.startsWith('A')).map((booth) => (
                  <button
                    key={booth.id}
                    onClick={() => setSelectedBooth(booth)}
                    className={`${getBoothColor(booth.status)} text-white font-bold text-xs sm:text-sm rounded-sm transition-all duration-200 transform hover:scale-110 hover:shadow-2xl hover:z-50 cursor-pointer flex items-center justify-center h-full border border-white/20`}
                  >
                    {booth.id}
                  </button>
                ))}
              </div>

              <div className="absolute top-[50.5%] left-[43%] w-[14.5%] h-[10.5%] grid grid-cols-3 gap-[0.3%]">
                {booths.filter(b => b.id.startsWith('B')).map((booth) => (
                  <button
                    key={booth.id}
                    onClick={() => setSelectedBooth(booth)}
                    className={`${getBoothColor(booth.status)} text-white font-bold text-xs sm:text-sm rounded-sm transition-all duration-200 transform hover:scale-110 hover:shadow-2xl hover:z-50 cursor-pointer flex items-center justify-center h-full border border-white/20`}
                  >
                    {booth.id}
                  </button>
                ))}
              </div>
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