
import React, { useEffect } from 'react';

export const OAuthCallback = () => {
  useEffect(() => {
    // Get the authorization code from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      // Send error to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: error
        }, window.location.origin);
      }
      window.close();
      return;
    }

    if (code) {
      // Send code to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          code: code
        }, window.location.origin);
      }
      window.close();
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Processing Authentication...</h2>
        <p className="text-gray-600">This window will close automatically.</p>
      </div>
    </div>
  );
};
