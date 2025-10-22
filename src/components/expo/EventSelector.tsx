import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Event } from './types';
import Icon from '@/components/ui/icon';
import { useState } from 'react';
import { EventEditor } from './EventEditor';

interface EventSelectorProps {
  events: Event[];
  selectedEvent: Event;
  onSelectEvent: (event: Event) => void;
  onCreateEvent: (data: { name: string; description: string; date: string; location: string }) => void;
  onUpdateEvent: (data: { name: string; description: string; date: string; location: string; id: string }) => void;
}

export function EventSelector({ events, selectedEvent, onSelectEvent, onCreateEvent, onUpdateEvent }: EventSelectorProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Icon name="Calendar" size={20} />
            Мероприятия
          </h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowCreateDialog(true)}
            className="h-8 w-8 p-0"
          >
            <Icon name="Plus" size={16} />
          </Button>
        </div>
        <div className="space-y-2">
          {events.map(event => (
            <div key={event.id} className="flex gap-1">
              <Button
                variant={selectedEvent.id === event.id ? 'default' : 'outline'}
                className="flex-1 justify-start"
                onClick={() => onSelectEvent(event)}
              >
                <div className="text-left flex-1">
                  <div className="font-semibold">{event.name}</div>
                  <div className="text-xs opacity-80">{event.date}</div>
                </div>
              </Button>
              {selectedEvent.id === event.id && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowEditDialog(true)}
                  className="h-auto px-2"
                >
                  <Icon name="Edit" size={14} />
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <EventEditor
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        mode="create"
        onSave={onCreateEvent}
      />

      <EventEditor
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        event={selectedEvent}
        mode="edit"
        onSave={(data) => onUpdateEvent({ ...data, id: selectedEvent.id })}
      />
    </>
  );
}