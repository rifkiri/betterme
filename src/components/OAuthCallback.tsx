
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { googleSheetsService } from '@/services/GoogleSheetsService';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      console.log('OAuth callback started');
      console.log('Search params:', Object.fromEntries(searchParams.entries()));
      
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        console.error('OAuth error:', error, errorDescription);
        setStatus('error');
        setMessage(`Authentication failed: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`);
        toast.error(`Authentication failed: ${error}`);
        setTimeout(() => navigate('/settings'), 3000);
        return;
      }

      if (!code) {
        console.error('No authorization code received');
        setStatus('error');
        setMessage('No authorization code received from Google');
        toast.error('No authorization code received');
        setTimeout(() => navigate('/settings'), 3000);
        return;
      }

      console.log('Authorization code received:', code.substring(0, 10) + '...');

      try {
        console.log('Exchanging code for tokens...');
        await googleSheetsService.exchangeCodeForTokens(code);
        console.log('Token exchange successful');
        setStatus('success');
        setMessage('Successfully authenticated with Google Sheets!');
        toast.success('Authentication successful!');
        setTimeout(() => navigate('/settings'), 2000);
      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(`Failed to complete authentication: ${error instanceof Error ? error.message : 'Unknown error'}`);
        toast.error('Authentication failed - check console for details');
        setTimeout(() => navigate('/settings'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
            {status === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
            Google Sheets Authentication
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'loading' && (
            <p className="text-sm text-muted-foreground">
              Please wait while we complete the authentication process...
            </p>
          )}
          {status === 'success' && (
            <p className="text-sm text-green-600">
              Redirecting to settings...
            </p>
          )}
          {status === 'error' && (
            <div className="text-sm space-y-2">
              <p className="text-red-600">Redirecting to settings...</p>
              <p className="text-xs text-muted-foreground">
                Check the console for detailed error information
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
