import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface SheetDialogProps {
  open: boolean;
  onClose: () => void;
  sheetUrl: string;
  onSave: (url: string) => void;
}

export function SheetDialog({ open, onClose, sheetUrl, onSave }: SheetDialogProps) {
  const [url, setUrl] = useState(sheetUrl);

  const handleSave = () => {
    onSave(url);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Настройки Google Таблицы</DialogTitle>
          <DialogDescription>
            Введите ссылку на Google Таблицу для синхронизации данных
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="sheet-url">Ссылка на таблицу</Label>
            <Input
              id="sheet-url"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              <Icon name="Save" className="mr-2" size={16} />
              Сохранить
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
