import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface StatisticsProps {
  total: number;
  available: number;
  booked: number;
}

export function Statistics({ total, available, booked }: StatisticsProps) {
  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Icon name="BarChart3" size={20} />
        Статистика
      </h2>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Всего стендов:</span>
          <span className="font-semibold">{total}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Свободно:</span>
          <span className="font-semibold text-booth-available">{available}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Забронировано:</span>
          <span className="font-semibold text-booth-booked">{booked}</span>
        </div>
        <div className="pt-2 border-t">
          <div className="text-xs text-gray-500">Заполненность</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(booked / total) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
