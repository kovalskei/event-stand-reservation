import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface Booth {
  id: string;
  status: string;
  company?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  notes?: string;
  price?: string;
  size?: string;
}

interface Props {
  booth: Booth | null;
  onClose: () => void;
}

const getStatusLabel = (status: string) => {
  if (status === 'available') return 'Свободен';
  if (status === 'booked') return 'Забронирован';
  return 'Недоступен';
};

export default function PublicBoothDialog({ booth, onClose }: Props) {
  if (!booth) return null;

  const isAvailable = booth.status === 'available';

  return (
    <Dialog open={!!booth} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Icon name="MapPin" size={24} className="text-primary" />
            Стенд {booth.id}
          </DialogTitle>
          <DialogDescription>Информация о стенде</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-sm font-medium text-gray-600">Статус</span>
            <Badge
              className={isAvailable ? 'bg-booth-available text-white' : 'bg-booth-booked text-white'}
            >
              {getStatusLabel(booth.status)}
            </Badge>
          </div>

          {booth.size && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Icon name="Maximize" size={18} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Размер</p>
                <p className="font-semibold text-gray-900">{booth.size}</p>
              </div>
            </div>
          )}

          {booth.price && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Icon name="Tag" size={18} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Стоимость</p>
                <p className="font-semibold text-gray-900">{booth.price}</p>
              </div>
            </div>
          )}

          {booth.status === 'booked' && booth.company && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Icon name="Building2" size={18} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Компания</p>
                <p className="font-semibold text-gray-900">{booth.company}</p>
              </div>
            </div>
          )}

          {booth.notes && (
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <Icon name="FileText" size={18} className="text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Описание</p>
                <p className="text-gray-900 text-sm">{booth.notes}</p>
              </div>
            </div>
          )}

          {isAvailable && (
            <div className="pt-2 space-y-2">
              <p className="text-sm text-gray-500 text-center">Хотите забронировать этот стенд?</p>
              <div className="flex gap-2">
                {booth.phone && (
                  <Button asChild className="flex-1" variant="outline">
                    <a href={`tel:${booth.phone}`} className="flex items-center gap-2 justify-center">
                      <Icon name="Phone" size={16} />
                      Позвонить
                    </a>
                  </Button>
                )}
                {booth.email && (
                  <Button asChild className="flex-1">
                    <a href={`mailto:${booth.email}?subject=Бронирование стенда ${booth.id}`} className="flex items-center gap-2 justify-center">
                      <Icon name="Mail" size={16} />
                      Написать
                    </a>
                  </Button>
                )}
                {!booth.phone && !booth.email && (
                  <p className="text-sm text-gray-400 w-full text-center pb-1">Свяжитесь с организаторами для бронирования</p>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
