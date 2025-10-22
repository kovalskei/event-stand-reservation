import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Booth, BoothStatus } from './types';
import { getStatusText } from './utils';
import Icon from '@/components/ui/icon';

interface BoothInfoDialogProps {
  booth: Booth | null;
  onClose: () => void;
  editMode: boolean;
  onChangeStatus: (boothId: string, status: BoothStatus) => void;
  onDeleteBooth: (boothId: string) => void;
}

export function BoothInfoDialog({ 
  booth, 
  onClose, 
  editMode,
  onChangeStatus,
  onDeleteBooth 
}: BoothInfoDialogProps) {
  if (!booth) return null;

  return (
    <Dialog open={!!booth} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Стенд {booth.id}</DialogTitle>
          <DialogDescription>
            <Badge 
              variant={booth.status === 'available' ? 'default' : booth.status === 'booked' ? 'secondary' : 'destructive'}
              className="mt-2"
            >
              {getStatusText(booth.status)}
            </Badge>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {booth.status === 'booked' && (
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Компания:</span>
                <p className="font-semibold">{booth.company}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Контакт:</span>
                <p className="font-semibold">{booth.contact}</p>
              </div>
              {booth.price && (
                <div>
                  <span className="text-sm text-gray-600">Стоимость:</span>
                  <p className="font-semibold">{booth.price}</p>
                </div>
              )}
              {booth.size && (
                <div>
                  <span className="text-sm text-gray-600">Размер:</span>
                  <p className="font-semibold">{booth.size}</p>
                </div>
              )}
            </div>
          )}
          
          {editMode && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Изменить статус:</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={booth.status === 'available' ? 'default' : 'outline'}
                  onClick={() => onChangeStatus(booth.id, 'available')}
                >
                  Свободен
                </Button>
                <Button
                  size="sm"
                  variant={booth.status === 'booked' ? 'default' : 'outline'}
                  onClick={() => onChangeStatus(booth.id, 'booked')}
                >
                  Забронирован
                </Button>
                <Button
                  size="sm"
                  variant={booth.status === 'unavailable' ? 'default' : 'outline'}
                  onClick={() => onChangeStatus(booth.id, 'unavailable')}
                >
                  Недоступен
                </Button>
              </div>
              <Button
                size="sm"
                variant="destructive"
                className="w-full mt-2"
                onClick={() => {
                  onDeleteBooth(booth.id);
                  onClose();
                }}
              >
                <Icon name="Trash2" className="mr-2" size={16} />
                Удалить стенд
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
