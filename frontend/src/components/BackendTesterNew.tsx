import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Server, Play, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '@/services/api';
import { coachService } from '@/services/coachService';
import { resourceService } from '@/services/resourceService';

const BackendTester = () => {
  const [showTester, setShowTester] = useState(false);
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState<string | null>(null);

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setLoading(testName);
    try {
      const result = await testFn();
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: true, data: result, error: null }
      }));
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: false, data: null, error: error.message }
      }));
    } finally {
      setLoading(null);
    }
  };

  const tests = [
    {
      name: 'Root API',
      fn: () => apiClient.get(''),
    },
    {
      name: 'Health Check',
      fn: () => apiClient.get('/test/health'),
    },
    {
      name: 'Hello Endpoint',
      fn: () => apiClient.get('/test/hello'),
    },
    {
      name: 'All Coaches',
      fn: () => coachService.getAllCoaches(),
    },
    {
      name: 'Verified Coaches',
      fn: () => coachService.getVerifiedCoaches(),
    },
    {
      name: 'Resources',
      fn: () => resourceService.getAllResources(),
    },
  ];

  const runAllTests = async () => {
    for (const test of tests) {
      await runTest(test.name, test.fn);
    }
  };

  const getStatusIcon = (testName: string) => {
    if (loading === testName) return <Loader2 className="h-4 w-4 animate-spin" />;
    
    const result = testResults[testName];
    if (!result) return null;
    
    return result.success ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (testName: string) => {
    if (loading === testName) return <Badge variant="secondary">Testing...</Badge>;
    
    const result = testResults[testName];
    if (!result) return <Badge variant="outline">Not tested</Badge>;
    
    return result.success ? 
      <Badge variant="default" className="bg-green-500">Success</Badge> : 
      <Badge variant="destructive">Failed</Badge>;
  };

  if (!showTester) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Backend API Tester
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setShowTester(true)}
            className="w-full"
            variant="outline"
          >
            <Eye className="h-4 w-4 mr-2" />
            Show API Tester
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Backend API Tester - MongoDB Edition
          </span>
          <Button 
            onClick={() => setShowTester(false)}
            variant="ghost"
            size="sm"
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runAllTests} disabled={!!loading}>
            <Play className="h-4 w-4 mr-2" />
            Run All Tests
          </Button>
        </div>

        <div className="grid gap-4">
          {tests.map((test) => (
            <Card key={test.name}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(test.name)}
                    <span className="font-medium">{test.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(test.name)}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runTest(test.name, test.fn)}
                      disabled={loading === test.name}
                    >
                      Test
                    </Button>
                  </div>
                </div>
                
                {testResults[test.name] && (
                  <div className="mt-3">
                    {testResults[test.name].success ? (
                      <div className="bg-green-50 p-3 rounded-md">
                        <div className="text-sm text-green-800 mb-2">✅ Success</div>
                        <pre className="text-xs text-green-700 overflow-auto max-h-32">
                          {JSON.stringify(testResults[test.name].data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="bg-red-50 p-3 rounded-md">
                        <div className="text-sm text-red-800 mb-2">❌ Error</div>
                        <div className="text-xs text-red-700">
                          {testResults[test.name].error}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {Object.keys(testResults).length > 0 && (
          <Alert>
            <AlertDescription>
              Backend Status: {Object.values(testResults).every((r: any) => r.success) ? 
                '🟢 All tests passing' : 
                '🟡 Some tests failing'
              }
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default BackendTester;
