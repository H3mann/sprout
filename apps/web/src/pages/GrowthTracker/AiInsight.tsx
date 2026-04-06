import { useCallback, useEffect, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';

import { searchPerplexity, type PerplexityResult } from '../../services/perplexity';

interface AiInsightProps {
  /** A stable string summarising the data context — used to detect when data changes. */
  contextKey: string;
  /** The prompt sent to Perplexity (built by the parent from current data). */
  prompt: string;
  /** Title shown above the insight card. */
  title?: string;
  /**
   * When provided, disables auto-fetch on contextKey change.
   * Instead, the component fetches only when this value increments.
   * Pass 0 initially, then increment when the user clicks "Add".
   */
  trigger?: number;
}

export const AiInsight = ({ contextKey, prompt, title = 'Insight', trigger }: AiInsightProps) => {
  const [result, setResult] = useState<PerplexityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const lastKeyRef = useRef<string | null>(null);
  const lastTriggerRef = useRef<number>(0);

  const fetchInsight = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchPerplexity(prompt);
      setResult(res);
      lastKeyRef.current = contextKey;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insight.');
    } finally {
      setLoading(false);
    }
  }, [prompt, contextKey]);

  // Manual trigger mode: fetch only when trigger increments
  useEffect(() => {
    if (trigger != null && trigger > 0 && trigger !== lastTriggerRef.current && !loading) {
      lastTriggerRef.current = trigger;
      fetchInsight();
    }
  }, [trigger]); // intentionally only depends on trigger

  // Auto-fetch mode: fetch when contextKey changes (only when trigger prop is not used)
  useEffect(() => {
    if (trigger != null) return; // manual mode — skip auto-fetch
    if (contextKey && contextKey !== lastKeyRef.current && !loading) {
      fetchInsight();
    }
  }, [contextKey]); // intentionally only depends on contextKey

  if (!contextKey) return null;

  return (
    <Card
      sx={{
        mt: 3,
        border: '1px solid',
        borderColor: 'primary.light',
        background: 'linear-gradient(135deg, #f5f7ff 0%, #faf5ff 100%)'
      }}
    >
      <CardContent sx={{ '&:last-child': { pb: 2 } }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ cursor: 'pointer' }}
          onClick={() => setExpanded((prev) => !prev)}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <InfoOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontSize: '1rem' }}>
              {title}
            </Typography>
            {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
          </Stack>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Stack>

        <Collapse in={expanded}>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }} action={
              <Button size="small" onClick={fetchInsight} disabled={loading}>
                Retry
              </Button>
            }>
              {error}
            </Alert>
          )}

          {result && !loading && (
            <Box sx={{ mt: 2 }}>
              <Typography
                variant="body2"
                sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}
              >
                {result.answer}
              </Typography>

              {result.citations.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Sources
                  </Typography>
                  <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                    {result.citations.map((c, i) => (
                      <Link
                        key={i}
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="caption"
                        sx={{ color: 'text.secondary' }}
                      >
                        {c.title}
                      </Link>
                    ))}
                  </Stack>
                </Box>
              )}

              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  fetchInsight();
                }}
                disabled={loading}
                sx={{ mt: 1.5 }}
              >
                Refresh insight
              </Button>
            </Box>
          )}

          {!result && !error && !loading && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
              {trigger != null
                ? 'Add a measurement to generate an insight.'
                : 'Insight will appear once data is available.'}
            </Typography>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};
