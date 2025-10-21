import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Booth, BoothStatus } from '@/types/booth';

interface BoothDialogProps {
  booth: Booth | null;
  onClose: () => void;
}

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

export default function BoothDialog({ booth, onClose }: BoothDialogProps) {
  return (
    <Dialog open={!!booth} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Icon name="MapPin" size={24} className="text-primary" />
            Стенд {booth?.id}
          </DialogTitle>
          <DialogDescription>
            Подробная информация о стенде
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <span className="text-sm font-medium text-gray-600">Статус</span>
            <Badge 
              variant={booth?.status === 'available' ? 'default' : 'destructive'}
              className={booth?.status === 'available' ? 'bg-booth-available' : 'bg-booth-booked'}
            >
              {booth && getStatusText(booth.status)}
            </Badge>
          </div>

          {booth?.size && (
            <div className="p-4 bg-slate-50 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-gray-600">
                <Icon name="Maximize" size={18} />
                <span className="text-sm font-medium">Размер</span>
              </div>
              <p className="text-gray-900 font-semibold pl-6">{booth.size}</p>
            </div>
          )}

          {booth?.price && (
            <div className="p-4 bg-slate-50 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-gray-600">
                <Icon name="DollarSign" size={18} />
                <span className="text-sm font-medium">Стоимость</span>
              </div>
              <p className="text-gray-900 font-semibold pl-6">{booth.price}</p>
            </div>
          )}

          {booth?.status === 'booked' && (
            <>
              <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Icon name="Building2" size={18} />
                  <span className="text-sm font-medium">Компания</span>
                </div>
                <p className="text-gray-900 font-semibold pl-6">{booth.company}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Icon name="User" size={18} />
                  <span className="text-sm font-medium">Контактное лицо</span>
                </div>
                <p className="text-gray-900 font-semibold pl-6">{booth.contact}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
