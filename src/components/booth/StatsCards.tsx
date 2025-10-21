import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface StatsCardsProps {
  total: number;
  available: number;
  booked: number;
}

export default function StatsCards({ total, available, booked }: StatsCardsProps) {
  const percentage = Math.round((booked / total) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
      <Card className="p-6 animate-scale-in bg-white border-2 border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Icon name="Grid3x3" size={24} className="text-primary" />
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">Всего стендов</p>
            <p className="text-3xl font-bold text-gray-900">{total}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 animate-scale-in bg-white border-2 border-booth-available/20" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-booth-available/10 rounded-lg">
            <Icon name="CheckCircle" size={24} className="text-booth-available" />
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">Свободно</p>
            <p className="text-3xl font-bold text-gray-900">{available}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 animate-scale-in bg-white border-2 border-booth-booked/20" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-booth-booked/10 rounded-lg">
            <Icon name="Lock" size={24} className="text-booth-booked" />
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">Забронировано</p>
            <p className="text-3xl font-bold text-gray-900">{booked}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 animate-scale-in bg-white border-2 border-gray-200" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gray-100 rounded-lg">
            <Icon name="Percent" size={24} className="text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">Заполненность</p>
            <p className="text-3xl font-bold text-gray-900">{percentage}%</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
