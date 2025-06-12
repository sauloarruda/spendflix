import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

function InsightsContent({ insights }: { insights: string }) {
  return (
    <>
      <div className="flex border-b-1 p-2 items-center mb-4">
        <h1 className="text-2xl flex-grow-1">Insights</h1>
      </div>
      <div className="ai-md">
        <ReactMarkdown>{insights}</ReactMarkdown>
      </div>
    </>
  );
}

export function InsightsReport() {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    console.log('Connecting to insights stream...');
    const source = new EventSource('/api/insights');
    let timeoutId: NodeJS.Timeout | null = null;

    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('Connection timed out after 300 seconds');
        setError('Connection timed out. Please try again.');
        setLoading(false);
        source.close();
        retryConnection(isMounted);
      }, 300000);
    };

    const retryConnection = (mounted: boolean) => {
      if (mounted && retryCount < 3 && insights.length === 0) {
        setRetryCount((prev) => prev + 1);
        console.log(`Retrying connection (attempt ${retryCount + 2}/3)`);
        setTimeout(() => {
          if (mounted) {
            setLoading(true);
            setError(null);
          }
        }, 5000);
      }
    };

    resetTimeout();
    console.log('Initial timeout set for 300 seconds');

    source.onmessage = (event) => {
      try {
        console.log('Received message from stream');
        const data = JSON.parse(event.data);
        if (data.keepAlive) {
          console.log('Received keep-alive message, resetting timeout');
          resetTimeout();
          return;
        }
        if (data.insightsChunk) {
          console.log('Received insights chunk');
          setInsights((prev) => prev + data.insightsChunk);
          resetTimeout();
        } else if (data.error) {
          console.log('Received error from server:', data.error);
          setError(data.error);
          source.close();
        }
        setLoading(false);
      } catch (err) {
        console.error('Error parsing stream data:', err);
        setError(err instanceof Error ? err.message : 'Failed to parse insights data');
        setLoading(false);
        source.close();
      }
    };

    source.onerror = () => {
      console.error('SSE connection error occurred');
      if (insights.length > 0) {
        console.log('Connection closed after receiving data, treating as normal termination');
        setLoading(false);
      } else {
        setError('Failed to connect to insights stream');
        setLoading(false);
        retryConnection(isMounted);
      }
      source.close();
    };

    source.onopen = () => {
      console.log('SSE connection opened successfully');
      setRetryCount(0);
    };

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      console.log('Closing SSE connection');
      source.close();
    };
  }, [retryCount]);

  if (loading) return <div>Gerando insights...</div>;
  if (error) return <div>Erro: {error}</div>;
  if (!insights) return <div>Não temos insights para este mês</div>;

  return <InsightsContent insights={insights} />;
}
