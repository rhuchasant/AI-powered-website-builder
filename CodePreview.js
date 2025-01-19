import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

// Simple Card, CardHeader, CardContent, CardTitle components
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-lg ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className="bg-gray-100 p-4 rounded-t-lg">
    {children}
  </div>
);

const CardContent = ({ children }) => (
  <div className="p-4">
    {children}
  </div>
);

const CardTitle = ({ children }) => (
  <h3 className="text-lg font-semibold text-gray-800">
    {children}
  </h3>
);

const CodePreview = () => {
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateCode = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://your-flask-api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ /* your params here */ }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate code');
      }

      const data = await response.json();
      setGeneratedCode(data.code);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Code Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <button 
              onClick={generateCode}
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Code'
              )}
            </button>

            {error && (
              <div className="text-red-500 text-sm">
                {error}
              </div>
            )}

            {generatedCode && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-100 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
                    {generatedCode}
                  </pre>
                </div>

                <div 
                  className="border rounded-lg p-4"
                  dangerouslySetInnerHTML={{ __html: generatedCode }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CodePreview;