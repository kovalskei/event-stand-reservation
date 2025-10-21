import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface SheetDialogProps {
  open: boolean;
  sheetUrl: string;
  autoSync: boolean;
  lastSyncTime: string | null;
  loading: boolean;
  onClose: () => void;
  onSheetUrlChange: (url: string) => void;
  onAutoSyncChange: (enabled: boolean) => void;
  onLoadData: () => void;
}

export default function SheetDialog({
  open,
  sheetUrl,
  autoSync,
  lastSyncTime,
  loading,
  onClose,
  onSheetUrlChange,
  onAutoSyncChange,
  onLoadData,
}: SheetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
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
              onChange={(e) => onSheetUrlChange(e.target.value)}
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
              onChange={(e) => onAutoSyncChange(e.target.checked)}
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
            <Button onClick={onClose} variant="outline">
              Отменить
            </Button>
            <Button onClick={onLoadData} disabled={loading} className="bg-booth-available hover:bg-booth-available/80">
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
  );
}
