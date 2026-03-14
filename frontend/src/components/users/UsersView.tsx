import { useUsers, useUpdateUserRole } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function UsersView() {
  const { data: users = [], isLoading } = useUsers();
  const updateRole = useUpdateUserRole();
  const { user: currentUser } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-center">טוען...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">ניהול משתמשים</h2>
        <p className="text-muted-foreground mt-1">נהל הרשאות משתמשים במערכת</p>
      </div>

      <div className="bg-card rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-right text-sm font-medium">משתמש</th>
              <th className="px-4 py-3 text-right text-sm font-medium">אימייל</th>
              <th className="px-4 py-3 text-right text-sm font-medium">תפקיד</th>
              <th className="px-4 py-3 text-right text-sm font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {user.picture ? (
                      <img
                        src={user.picture}
                        alt={user.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="font-medium">{user.name}</span>
                    {user.id === currentUser?.id && (
                      <Badge variant="outline" className="text-xs">את/ה</Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role === 'admin' ? 'מנהל' : 'צופה'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Select
                    value={user.role}
                    onValueChange={(role: 'admin' | 'viewer') =>
                      updateRole.mutate({ id: user.id, role })
                    }
                    disabled={user.id === currentUser?.id}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">מנהל</SelectItem>
                      <SelectItem value="viewer">צופה</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
