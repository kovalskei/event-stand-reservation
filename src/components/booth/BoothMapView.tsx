import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Booth, BoothPosition, Event } from '@/types/booth';

interface BoothMapViewProps {
  selectedEvent: Event;
  booths: Booth[];
  positions: BoothPosition[];
  editMode: boolean;
  dragging: string | null;
  resizing: { id: string; corner: 'se' | 'sw' | 'ne' | 'nw' } | null;
  containerRef: React.RefObject<HTMLDivElement>;
  onMouseDown: (e: React.MouseEvent, boothId: string) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onResizeMouseDown: (e: React.MouseEvent, boothId: string, corner: 'se' | 'sw' | 'ne' | 'nw') => void;
  onBoothClick: (booth: Booth) => void;
  onSavePositions: () => void;
  onResetPositions: () => void;
  onToggleEditMode: () => void;
  getBoothColor: (status: Booth['status']) => string;
}

export default function BoothMapView({
  selectedEvent,
  booths,
  positions,
  editMode,
  dragging,
  resizing,
  containerRef,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onResizeMouseDown,
  onBoothClick,
  onSavePositions,
  onResetPositions,
  onToggleEditMode,
  getBoothColor,
}: BoothMapViewProps) {
  return (
    <Card className="p-8 bg-white shadow-xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Интерактивная карта павильона</h2>
        <div className="flex gap-4 items-center">
          {!editMode && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-booth-available"></div>
                <span className="text-sm text-gray-600">Свободен</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-booth-booked"></div>
                <span className="text-sm text-gray-600">Забронирован</span>
              </div>
            </>
          )}
          {editMode ? (
            <div className="flex gap-2">
              <Button onClick={onSavePositions} size="sm" className="bg-booth-available hover:bg-booth-available/80">
                <Icon name="Save" size={16} className="mr-2" />
                Сохранить
              </Button>
              <Button onClick={onResetPositions} variant="outline" size="sm">
                <Icon name="RotateCcw" size={16} className="mr-2" />
                Сбросить
              </Button>
              <Button onClick={onToggleEditMode} variant="outline" size="sm">
                Отменить
              </Button>
            </div>
          ) : (
            <Button onClick={onToggleEditMode} variant="outline" size="sm">
              <Icon name="Edit" size={16} className="mr-2" />
              Настроить разметку
            </Button>
          )}
        </div>
      </div>

      {editMode && (
        <div className="mb-4 p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
          <div className="flex items-start gap-3">
            <Icon name="Info" size={20} className="text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Режим редактирования</p>
              <p className="text-xs text-gray-600 mt-1">
                • Перетаскивайте стенды для позиционирования (автоматическое прилипание)<br/>
                • Тяните за углы для изменения размера стенда<br/>
                • Нажмите "Сохранить" для применения изменений
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="relative bg-white rounded-xl p-4 border-2 border-gray-200 overflow-auto">
        <div 
          ref={containerRef}
          className="relative min-w-[1200px] w-full select-none" 
          style={{ aspectRatio: '1920/850' }}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
        >
          <img 
            src={selectedEvent.mapUrl} 
            alt="План павильона" 
            className="w-full h-full object-contain pointer-events-none"
          />

          {booths.map((booth) => {
            const position = positions.find(p => p.id === booth.id);
            if (!position) return null;
            
            const isActive = dragging === booth.id || resizing?.id === booth.id;
            
            return (
              <div
                key={booth.id}
                className={`absolute cursor-pointer transition-all ${getBoothColor(booth.status)} ${
                  isActive ? 'z-50 scale-105 ring-4 ring-primary/50' : 'z-10'
                } rounded-lg shadow-md hover:shadow-lg flex items-center justify-center text-white font-semibold text-sm`}
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  width: `${position.width}%`,
                  height: `${position.height}%`,
                }}
                onMouseDown={(e) => onMouseDown(e, booth.id)}
                onClick={() => !editMode && onBoothClick(booth)}
              >
                <div className="text-center pointer-events-none">
                  <div className="font-bold">{booth.id}</div>
                  {booth.company && (
                    <div className="text-xs mt-1 opacity-90 truncate max-w-full px-1">
                      {booth.company}
                    </div>
                  )}
                </div>

                {editMode && (
                  <>
                    <div
                      className="absolute top-0 left-0 w-3 h-3 bg-white border-2 border-primary rounded-full cursor-nw-resize"
                      onMouseDown={(e) => onResizeMouseDown(e, booth.id, 'nw')}
                    />
                    <div
                      className="absolute top-0 right-0 w-3 h-3 bg-white border-2 border-primary rounded-full cursor-ne-resize"
                      onMouseDown={(e) => onResizeMouseDown(e, booth.id, 'ne')}
                    />
                    <div
                      className="absolute bottom-0 left-0 w-3 h-3 bg-white border-2 border-primary rounded-full cursor-sw-resize"
                      onMouseDown={(e) => onResizeMouseDown(e, booth.id, 'sw')}
                    />
                    <div
                      className="absolute bottom-0 right-0 w-3 h-3 bg-white border-2 border-primary rounded-full cursor-se-resize"
                      onMouseDown={(e) => onResizeMouseDown(e, booth.id, 'se')}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
