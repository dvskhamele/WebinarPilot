import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRegistration } from '@shared/types';

interface DashboardProps {
  currentUser: { name: string; email: string };
}

export default function Dashboard({ currentUser }: DashboardProps) {
  // Note: In a real app, you'd fetch user-specific registrations
  // For now, we'll show a simple dashboard
  
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900" data-testid="text-dashboard-title">
          Welcome back, {currentUser.name}!
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Your webinar dashboard
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card data-testid="card-registrations">
          <CardHeader>
            <CardTitle>My Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">0</div>
            <p className="text-sm text-gray-600">Upcoming webinars</p>
          </CardContent>
        </Card>

        <Card data-testid="card-attended">
          <CardHeader>
            <CardTitle>Attended</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">0</div>
            <p className="text-sm text-gray-600">Completed sessions</p>
          </CardContent>
        </Card>

        <Card data-testid="card-certificates">
          <CardHeader>
            <CardTitle>Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">0</div>
            <p className="text-sm text-gray-600">Earned certificates</p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-recent-activity">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No recent activity found. Register for a webinar to get started!
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
