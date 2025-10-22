import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface ControlPanelProps {
  editMode: boolean;
  gridMode: boolean;
  snapEnabled: boolean;
  autoSync: boolean;
  lastSyncTime: string | null;
  mapChanged: boolean;
  onToggleEdit: () => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onToggleAutoSync: () => void;
  onSaveMap: () => void;
  onExportPDF: () => void;
  onUploadMap: () => void;
  onSyncSheet: () => void;
  onSheetSettings: () => void;
}

export function ControlPanel({
  editMode,
  gridMode,
  snapEnabled,
  autoSync,
  lastSyncTime,
  mapChanged,
  onToggleEdit,
  onToggleGrid,
  onToggleSnap,
  onToggleAutoSync,
  onSaveMap,
  onExportPDF,
  onUploadMap,
  onSyncSheet,
  onSheetSettings,
}: ControlPanelProps) {
  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Icon name="Settings" size={20} />
        Управление
      </h2>
      <div className="space-y-2">
        <Button
          variant={editMode ? 'default' : 'outline'}
          className="w-full justify-start"
          onClick={onToggleEdit}
        >
          <Icon name={editMode ? 'Lock' : 'Edit'} className="mr-2" size={16} />
          {editMode ? 'Режим просмотра' : 'Режим редактирования'}
        </Button>

        {editMode && (
          <>
            <Button
              variant={gridMode ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={onToggleGrid}
            >
              <Icon name="Grid3x3" className="mr-2" size={16} />
              {gridMode ? 'Закрыть сетку' : 'Создать сетку'}
            </Button>

            <Button
              variant={snapEnabled ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={onToggleSnap}
            >
              <Icon name="Magnet" className="mr-2" size={16} />
              {snapEnabled ? 'Прилипание вкл' : 'Прилипание выкл'}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={onUploadMap}
            >
              <Icon name="Upload" className="mr-2" size={16} />
              Загрузить карту
            </Button>

            {mapChanged && (
              <Button
                variant="default"
                className="w-full justify-start bg-green-600 hover:bg-green-700"
                onClick={onSaveMap}
              >
                <Icon name="Save" className="mr-2" size={16} />
                Сохранить карту
              </Button>
            )}
          </>
        )}

        <div className="border-t pt-2 mt-2">
          <Button
            variant="outline"
            className="w-full justify-start mb-2"
            onClick={onExportPDF}
          >
            <Icon name="Download" className="mr-2" size={16} />
            Экспорт в PDF
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start mb-2"
            onClick={onSheetSettings}
          >
            <Icon name="FileSpreadsheet" className="mr-2" size={16} />
            Настройки таблицы
          </Button>

          <Button
            variant={autoSync ? 'default' : 'outline'}
            className="w-full justify-start mb-2"
            onClick={onToggleAutoSync}
          >
            <Icon name="RefreshCw" className="mr-2" size={16} />
            {autoSync ? 'Авто-синхронизация' : 'Вкл авто-синхронизацию'}
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={onSyncSheet}
          >
            <Icon name="Download" className="mr-2" size={16} />
            Синхронизировать
          </Button>

          {lastSyncTime && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Последняя синхронизация: {lastSyncTime}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
