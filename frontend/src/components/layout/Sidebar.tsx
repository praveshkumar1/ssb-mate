import { Link } from 'react-router-dom';
import { User, Calendar, FileText, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Sidebar = () => {
  return (
    <aside className="w-64 hidden md:block border-r border-border bg-background/50 p-4" aria-label="Sidebar">
      <nav className="space-y-4">
        <div className="text-sm font-semibold text-muted-foreground">Overview</div>
        <ul className="space-y-1 mt-2">
          <li>
            <Link to="/dashboard" className="flex items-center gap-3 p-2 rounded hover:bg-accent">
              <User className="w-5 h-5" /> <span>Profile</span>
            </Link>
          </li>
          <li>
            <Link to="/dashboard/sessions" className="flex items-center gap-3 p-2 rounded hover:bg-accent">
              <Calendar className="w-5 h-5" /> <span>Sessions</span>
            </Link>
          </li>
          {/* Mentor-only manage sessions link */}
          {(() => {
            const auth = useAuth();
            if (auth.isAuthenticated && auth.user?.role === 'mentor') {
              return (
                <li>
                  <Link to="/dashboard/manage-sessions" className="flex items-center gap-3 p-2 rounded hover:bg-accent">
                    <Calendar className="w-5 h-5" /> <span>Manage Sessions</span>
                  </Link>
                </li>
              );
            }
            return null;
          })()}
          <li>
            <Link to="/dashboard/resources" className="flex items-center gap-3 p-2 rounded hover:bg-accent">
              <FileText className="w-5 h-5" /> <span>Resources</span>
            </Link>
          </li>
          <li>
            <Link to="/dashboard/settings" className="flex items-center gap-3 p-2 rounded hover:bg-accent">
              <Settings className="w-5 h-5" /> <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
