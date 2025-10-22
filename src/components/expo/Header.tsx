import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/icon';

interface HeaderProps {
  onLoginClick: () => void;
}

export function Header({ onLoginClick }: HeaderProps) {
  const { userEmail, logout } = useAuth();

  return (
    <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <Icon name="Warehouse" size={32} className="text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ExpoManager</h1>
          <p className="text-sm text-gray-600">Управление выставочными стендами</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {userEmail ? (
          <>
            <span className="text-sm text-gray-600">{userEmail}</span>
            <Button onClick={logout} variant="outline" size="sm">
              <Icon name="LogOut" className="mr-2" size={16} />
              Выйти
            </Button>
          </>
        ) : (
          <Button onClick={onLoginClick} size="sm">
            <Icon name="LogIn" className="mr-2" size={16} />
            Войти
          </Button>
        )}
      </div>
    </div>
  );
}
