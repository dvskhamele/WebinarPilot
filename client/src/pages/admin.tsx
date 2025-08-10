import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRegistration } from '@shared/types';

interface AdminRegistration extends UserRegistration {
  webinarTitle?: string;
  webinarHost?: string;
  webinarDate?: Date;
}

interface AdminRegistrationsResponse {
  totalRegistrations: number;
  registrations: AdminRegistration[];
}

export default function Admin() {
  const { data, isLoading, error } = useQuery<AdminRegistrationsResponse>({
    queryKey: ['/api/admin/registrations'],
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading registrations: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900" data-testid="text-admin-title">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Manage webinar registrations and view analytics
        </p>
      </div>

      <Card data-testid="card-registration-summary">
        <CardHeader>
          <CardTitle>Registration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-indigo-600" data-testid="text-total-registrations">
            {data?.totalRegistrations || 0}
          </div>
          <p className="text-sm text-gray-600">Total registrations across all webinars</p>
        </CardContent>
      </Card>

      <Card data-testid="card-registration-list">
        <CardHeader>
          <CardTitle>All Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.registrations && data.registrations.length > 0 ? (
            <div className="space-y-4">
              {data.registrations.map((registration, index) => (
                <div 
                  key={registration.id} 
                  className="p-4 border border-gray-200 rounded-lg"
                  data-testid={`registration-item-${index}`}
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-lg" data-testid={`text-name-${index}`}>
                        {registration.name}
                      </h3>
                      <p className="text-gray-600" data-testid={`text-email-${index}`}>
                        {registration.email}
                      </p>
                      {registration.whatsappNumber && (
                        <p className="text-gray-600" data-testid={`text-whatsapp-${index}`}>
                          WhatsApp: {registration.whatsappNumber}
                        </p>
                      )}
                      <p className="text-sm text-gray-500" data-testid={`text-registration-type-${index}`}>
                        Type: {registration.registrationType}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium" data-testid={`text-webinar-title-${index}`}>
                        {registration.webinarTitle}
                      </h4>
                      <p className="text-gray-600 text-sm" data-testid={`text-webinar-host-${index}`}>
                        Host: {registration.webinarHost}
                      </p>
                      {registration.webinarDate && (
                        <p className="text-gray-600 text-sm" data-testid={`text-webinar-date-${index}`}>
                          Date: {new Date(registration.webinarDate).toLocaleDateString()}
                        </p>
                      )}
                      <p className="text-xs text-gray-400" data-testid={`text-created-at-${index}`}>
                        Registered: {registration.createdAt ? new Date(registration.createdAt).toLocaleString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8" data-testid="text-no-registrations">
              No registrations found.
            </p>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-supabase-verification">
        <CardHeader>
          <CardTitle>Supabase Database Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Database:</strong> Connected to Supabase at https://brroucjplqmngljroknr.supabase.co
            </p>
            <p className="text-sm">
              <strong>Table:</strong> webinar_registrations
            </p>
            <p className="text-sm">
              <strong>Status:</strong> {data ? '✅ Successfully connected and fetching data' : '❌ No data'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}