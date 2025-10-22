import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Event } from './types';
import Icon from '@/components/ui/icon';

interface EventSelectorProps {
  events: Event[];
  selectedEvent: Event;
  onSelectEvent: (event: Event) => void;
}

export function EventSelector({ events, selectedEvent, onSelectEvent }: EventSelectorProps) {
  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Icon name="Calendar" size={20} />
        Мероприятия
      </h2>
      <div className="space-y-2">
        {events.map(event => (
          <Button
            key={event.id}
            variant={selectedEvent.id === event.id ? 'default' : 'outline'}
            className="w-full justify-start"
            onClick={() => onSelectEvent(event)}
          >
            <div className="text-left">
              <div className="font-semibold">{event.name}</div>
              <div className="text-xs opacity-80">{event.date}</div>
            </div>
          </Button>
        ))}
      </div>
    </Card>
  );
}
