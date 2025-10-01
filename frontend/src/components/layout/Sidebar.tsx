import { Link } from 'react-router-dom';
import { User, Calendar, FileText, Settings, PenSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type Props = {
  forceVisible?: boolean; // when true, render on mobile (used inside Sheet)
};

const Sidebar = ({ forceVisible = false }: Props) => {
  const auth = useAuth();
  const isMentor = auth.isAuthenticated && auth.user?.role === 'mentor';
  return (
    <aside className={`w-64 ${forceVisible ? '' : 'hidden md:block'} border-r border-border bg-background/50 p-4`} aria-label="Sidebar">
      <nav className="space-y-4">
        <div className="text-sm font-semibold text-muted-foreground">Overview</div>
        <ul className="space-y-1 mt-2">
          <li>
            <Link to="/dashboard" className="flex items-center gap-3 p-2 rounded hover:bg-accent">
              <User className="w-5 h-5" /> <span>Profile</span>
            </Link>
          </li>
          {/* Hide Sessions for mentors */}
          {!isMentor && (
            <li>
              <Link to="/dashboard/sessions" className="flex items-center gap-3 p-2 rounded hover:bg-accent">
                <Calendar className="w-5 h-5" /> <span>Sessions</span>
              </Link>
            </li>
          )}
          {/* Mentor-only manage sessions link */}
          {/* Removed for mentors as requested */}
          {/* Mentor-only manage availability link */}
          {isMentor ? (
            <li>
              <Link to="/dashboard/availability" className="flex items-center gap-3 p-2 rounded hover:bg-accent">
                <Calendar className="w-5 h-5" /> <span>Manage Availability</span>
              </Link>
            </li>
          ) : null}
          {/* Mentor-only: Write Blog */}
          {isMentor ? (
            <li>
              <Link to="/dashboard/blog/new" className="flex items-center gap-3 p-2 rounded hover:bg-accent">
                <PenSquare className="w-5 h-5" /> <span>Write Blog</span>
              </Link>
            </li>
          ) : null}
          <li>
            <Link to="/dashboard/resources" className="flex items-center gap-3 p-2 rounded hover:bg-accent">
              <FileText className="w-5 h-5" /> <span>Resources</span>
            </Link>
          </li>
          <li>
            <Link to="/profile/edit" className="flex items-center gap-3 p-2 rounded hover:bg-accent">
              <Settings className="w-5 h-5" /> <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
