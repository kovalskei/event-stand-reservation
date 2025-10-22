import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  description?: string;
}

interface EventEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event | null;
  onSave: (event: { name: string; description: string; date: string; location: string; id?: string }) => void;
  mode: 'create' | 'edit';
}

export function EventEditor({ open, onOpenChange, event, onSave, mode }: EventEditorProps) {
  const [name, setName] = useState(event?.name || 'Новое мероприятие');
  const [description, setDescription] = useState(event?.description || '');
  const [date, setDate] = useState(event?.date || '');
  const [location, setLocation] = useState(event?.location || '');

  const handleSave = () => {
    const eventData = {
      name,
      description,
      date,
      location,
      ...(event?.id && { id: event.id })
    };
    onSave(eventData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name={mode === 'create' ? 'Plus' : 'Edit'} size={20} />
            {mode === 'create' ? 'Создать мероприятие' : 'Редактировать мероприятие'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Заполните информацию о новом мероприятии' 
              : 'Измените информацию о мероприятии'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название мероприятия"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание мероприятия"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Даты проведения</Label>
            <Input
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="Например: 15-20 марта 2025"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Место проведения</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Адрес или название павильона"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave}>
            <Icon name="Save" size={16} className="mr-2" />
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
