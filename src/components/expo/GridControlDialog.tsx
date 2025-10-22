import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Grid } from './types';
import Icon from '@/components/ui/icon';

interface GridControlDialogProps {
  open: boolean;
  grid: Grid;
  onClose: () => void;
  onUpdateGrid: (updates: Partial<Grid>) => void;
  onApplyGrid: () => void;
  onCancelGrid: () => void;
}

export function GridControlDialog({
  open,
  grid,
  onClose,
  onUpdateGrid,
  onApplyGrid,
  onCancelGrid,
}: GridControlDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Настройки сетки</DialogTitle>
          <DialogDescription>
            Настройте параметры сетки для автоматического размещения стендов
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rows">Строки</Label>
              <Input
                id="rows"
                type="number"
                min="1"
                value={grid.rows}
                onChange={(e) => onUpdateGrid({ rows: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <Label htmlFor="cols">Столбцы</Label>
              <Input
                id="cols"
                type="number"
                min="1"
                value={grid.cols}
                onChange={(e) => onUpdateGrid({ cols: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={onApplyGrid} className="flex-1">
              <Icon name="Check" className="mr-2" size={16} />
              Применить
            </Button>
            <Button onClick={onCancelGrid} variant="outline" className="flex-1">
              <Icon name="X" className="mr-2" size={16} />
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
