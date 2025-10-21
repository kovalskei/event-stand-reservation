import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Event } from '@/types/booth';

interface EventHeaderProps {
  selectedEvent: Event;
  events: Event[];
  onEventChange: (event: Event) => void;
  onExportPDF: () => void;
  onShowSheetDialog: () => void;
}

export default function EventHeader({
  selectedEvent,
  events,
  onEventChange,
  onExportPDF,
  onShowSheetDialog,
}: EventHeaderProps) {
  return (
    <header className="mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon name="CalendarDays" size={32} className="text-primary" />
          <h1 className="text-4xl font-bold text-gray-900">Бронирование стендов</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={onExportPDF} variant="outline">
            <Icon name="Download" size={16} className="mr-2" />
            Скачать PDF
          </Button>
          <Button onClick={onShowSheetDialog} variant="outline">
            <Icon name="Sheet" size={16} className="mr-2" />
            Синхронизация с Google Таблицами
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-600">Мероприятие:</label>
        <select
          value={selectedEvent.id}
          onChange={(e) => {
            const event = events.find(ev => ev.id === e.target.value);
            if (event) onEventChange(event);
          }}
          className="px-4 py-2 border-2 border-gray-200 rounded-lg bg-white text-gray-900 font-medium focus:border-primary focus:outline-none transition-colors"
        >
          {events.map(event => (
            <option key={event.id} value={event.id}>
              {event.name} • {event.date} • {event.location}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
