import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Server } from 'lucide-react';
import { useHello, useHealth, useVerifiedCoaches } from '@/hooks/useApi';

const BackendTester = () => {
  const [showTester, setShowTester] = useState(false);
  
  const { data: helloData, isLoading: helloLoading, error: helloError, refetch: refetchHello } = useHello();
  const { data: healthData, isLoading: healthLoading, error: healthError, refetch: refetchHealth } = useHealth();
  const { data: coachesData, isLoading: coachesLoading, error: coachesError, refetch: refetchCoaches } = useVerifiedCoaches();

  const allTests = [
    {
      name: 'Hello Endpoint',
      data: helloData,
      loading: helloLoading,
      error: helloError,
      refetch: refetchHello,
    },
    {
      name: 'Health Check',
      data: healthData,
      loading: healthLoading,
      error: healthError,
      refetch: refetchHealth,
    },
    {
      name: 'Coaches API',
      data: coachesData,
      loading: coachesLoading,
      error: coachesError,
      refetch: refetchCoaches,
    },
  ];

  const getStatusIcon = (test: any) => {
    if (test.loading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (test.error) return <XCircle className="h-4 w-4 text-red-500" />;
    if (test.data) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <Server className="h-4 w-4 text-gray-400" />;
  };

  const getStatusBadge = (test: any) => {
    if (test.loading) return <Badge variant="secondary">Loading</Badge>;
    if (test.error) return <Badge variant="destructive">Error</Badge>;
    if (test.data) return <Badge variant="default" className="bg-green-500">Success</Badge>;
    return <Badge variant="outline">Not Tested</Badge>;
  };

  if (!showTester) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              <span className="text-sm font-medium">Backend Connection Test</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowTester(true)}
            >
              Test Backend
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Backend Connection Test
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowTester(false)}
          >
            Hide
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Make sure your Spring Boot backend is running on <code>http://localhost:8080</code>
          </AlertDescription>
        </Alert>

        {allTests.map((test) => (
          <div key={test.name} className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center gap-3">
              {getStatusIcon(test)}
              <span className="font-medium">{test.name}</span>
              {getStatusBadge(test)}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => test.refetch()}
              disabled={test.loading}
            >
              {test.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
            </Button>
          </div>
        ))}

        {/* Display test results */}
        {helloData && (
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <h4 className="font-medium text-green-800">Hello Response:</h4>
            <pre className="text-sm text-green-700 mt-1">{JSON.stringify(helloData, null, 2)}</pre>
          </div>
        )}

        {healthData && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-medium text-blue-800">Health Check:</h4>
            <pre className="text-sm text-blue-700 mt-1">{JSON.stringify(healthData, null, 2)}</pre>
          </div>
        )}

        {coachesData && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded">
            <h4 className="font-medium text-purple-800">Coaches Data:</h4>
            <p className="text-sm text-purple-700 mt-1">
              Found {Array.isArray(coachesData) ? coachesData.length : 0} coaches
            </p>
          </div>
        )}

        {/* Show errors */}
        {(helloError || healthError || coachesError) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <h4 className="font-medium text-red-800">Errors:</h4>
            <div className="text-sm text-red-700 mt-1 space-y-1">
              {helloError && <div>Hello: {helloError.message}</div>}
              {healthError && <div>Health: {healthError.message}</div>}
              {coachesError && <div>Coaches: {coachesError.message}</div>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BackendTester;
