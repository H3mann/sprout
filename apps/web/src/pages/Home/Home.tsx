import { useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import CircleIcon from '@mui/icons-material/Circle';
import CloseIcon from '@mui/icons-material/Close';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import SearchIcon from '@mui/icons-material/Search';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useNavigate } from 'react-router-dom';

import { searchPerplexity, type PerplexityResult } from '../../services/perplexity';

const HeroSection = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.light}22 0%, ${theme.palette.secondary.light}22 100%)`,
  padding: theme.spacing(8, 0, 6),
  textAlign: 'center'
}));

const FeatureCard = styled(Card)(() => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
  }
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  width: 56,
  height: 56,
  borderRadius: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(2)
}));

const TrustSection = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.dark,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(8, 0),
  textAlign: 'center'
}));

const features = [
  {
    icon: <ShowChartIcon sx={{ fontSize: 28, color: 'white' }} />,
    iconBg: '#4CAF50',
    title: 'Growth Tracking',
    description:
      'Monitor your child\'s height, weight, and head circumference against WHO and CDC growth charts. See exactly where they stand and track trends over time — all reviewed by board-certified pediatricians.'
  },
  {
    icon: <VaccinesIcon sx={{ fontSize: 28, color: 'white' }} />,
    iconBg: '#FF9800',
    title: 'Vaccine Schedules',
    description:
      'Stay on top of your child\'s immunization schedule with personalized timelines based on their age. Get reminders for upcoming doses and keep a complete vaccination record in one place.'
  },
  {
    icon: <QuestionAnswerIcon sx={{ fontSize: 28, color: 'white' }} />,
    iconBg: '#2196F3',
    title: 'Ask a Question',
    description:
      'Have a health question? Get answers sourced directly from peer-reviewed medical literature and clinical guidelines — not AI-generated content, not forums, not anecdotal advice. Real evidence, curated by real pediatricians.'
  }
];

const suggestedQuestions = [
  'When is a fever too high for a baby?',
  'How much sleep does my toddler need?',
  'When should I start solid foods?',
  'Is it safe to co-sleep with my newborn?',
  'What vaccines does my baby need at 6 months?',
  'Why does my baby spit up so much?'
];

function formatLine(text: string, citations: { title: string; url: string }[]) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/#{2,}\s*(.+)/g, '<strong>$1</strong>')
    .replace(
      /\[(\d+)\]/g,
      (_, num) => {
        const idx = parseInt(num, 10) - 1;
        const cite = citations[idx];
        if (cite) {
          return `<a href="${cite.url}" target="_blank" rel="noopener noreferrer" style="color: #4CAF50; font-size: 0.7rem; vertical-align: super; text-decoration: none; font-weight: 600;">[${num}]</a>`;
        }
        return `[${num}]`;
      }
    );
}

export const Home = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<PerplexityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const q = (searchQuery || query).trim();
    if (!q) return;

    if (searchQuery) setQuery(searchQuery);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await searchPerplexity(q);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClear = () => {
    setQuery('');
    setResult(null);
    setError(null);
  };

  return (
    <Box>
      <HeroSection>
        <Container maxWidth="md">
          <Typography variant="h1" gutterBottom>
            Parenting with confidence,{' '}
            <Box component="span" sx={{ color: 'primary.main' }}>
              guided by pediatricians
            </Box>
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              fontSize: '1.1rem',
              maxWidth: 600,
              mx: 'auto',
              mb: 4
            }}
          >
            Get evidence-based answers to your child's health questions — sourced from
            PubMed, NIH, AAP, and CDC. No forums. No guesswork.
          </Typography>

          {/* Search bar */}
          <Box sx={{ maxWidth: 640, mx: 'auto', mb: 2 }}>
            <Stack direction="row" spacing={1.5}>
              <TextField
                fullWidth
                placeholder="Ask any pediatric health question..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    endAdornment: query ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={handleClear}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null
                  }
                }}
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    fontSize: '1.05rem',
                    py: 0.5
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={() => handleSearch()}
                disabled={!query.trim() || loading}
                sx={{ px: 4, whiteSpace: 'nowrap', borderRadius: 3 }}
              >
                Search
              </Button>
            </Stack>
          </Box>

          {/* Source badges */}
          <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" sx={{ gap: 0.5, mb: 3 }}>
            <Chip icon={<VerifiedIcon />} label="PubMed & NIH" size="small" sx={{ bgcolor: 'white', fontWeight: 600, fontSize: '0.75rem' }} />
            <Chip label="AAP" size="small" sx={{ bgcolor: 'white', fontWeight: 600, fontSize: '0.75rem' }} />
            <Chip label="CDC" size="small" sx={{ bgcolor: 'white', fontWeight: 600, fontSize: '0.75rem' }} />
            <Chip label="WHO" size="small" sx={{ bgcolor: 'white', fontWeight: 600, fontSize: '0.75rem' }} />
            <Chip label="No forums or social media" size="small" sx={{ bgcolor: '#FFEBEE', color: '#C62828', fontWeight: 600, fontSize: '0.75rem' }} />
          </Stack>

          {/* Suggested questions */}
          {!result && !loading && (
            <Box sx={{ maxWidth: 640, mx: 'auto' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5, fontSize: '0.8rem' }}>
                Try asking:
              </Typography>
              <Stack direction="row" flexWrap="wrap" justifyContent="center" sx={{ gap: 1 }}>
                {suggestedQuestions.map((q) => (
                  <Chip
                    key={q}
                    label={q}
                    size="small"
                    onClick={() => handleSearch(q)}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: 'white',
                      fontWeight: 500,
                      fontSize: '0.8rem',
                      '&:hover': { bgcolor: 'primary.light', color: 'white' }
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Container>
      </HeroSection>

      {/* Search results */}
      {(loading || result || error) && (
        <Container maxWidth="md" sx={{ py: 4 }}>
          {loading && (
            <Card sx={{ textAlign: 'center', py: 5 }}>
              <CardContent>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body1">Searching trusted medical sources...</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                  This may take a few seconds
                </Typography>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card sx={{ bgcolor: '#FFF3E0' }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: '#E65100' }}>{error}</Typography>
              </CardContent>
            </Card>
          )}

          {result && (
            <>
              <Card sx={{ mb: 3, border: '2px solid', borderColor: 'primary.main' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <SearchIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                    <Typography variant="h5">Answer</Typography>
                  </Stack>

                  <Box sx={{ mb: 3, '& > *:not(:last-child)': { mb: 2 } }}>
                    {result.answer.split('\n').map((line, i) => {
                      const trimmed = line.trim();
                      if (!trimmed) return null;

                      const headerMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
                      if (headerMatch) {
                        return (
                          <Typography key={i} variant="body2" fontWeight={700} sx={{ mt: 2, fontSize: '0.95rem' }}>
                            {headerMatch[1]}
                          </Typography>
                        );
                      }

                      const mdHeaderMatch = trimmed.match(/^#{2,}\s+(.+)/);
                      if (mdHeaderMatch) {
                        return (
                          <Typography key={i} variant="body2" fontWeight={700} sx={{ mt: 2, fontSize: '0.95rem' }}>
                            {mdHeaderMatch[1]}
                          </Typography>
                        );
                      }

                      if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
                        return (
                          <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start" sx={{ pl: 1 }}>
                            <CircleIcon sx={{ fontSize: 6, color: 'primary.main', mt: 1, flexShrink: 0 }} />
                            <Typography
                              variant="body2"
                              sx={{ lineHeight: 1.8, fontSize: '0.9rem' }}
                              dangerouslySetInnerHTML={{ __html: formatLine(trimmed.replace(/^[•\-]\s*/, ''), result.citations) }}
                            />
                          </Stack>
                        );
                      }

                      return (
                        <Typography
                          key={i}
                          variant="body2"
                          sx={{ lineHeight: 1.8, fontSize: '0.925rem' }}
                          dangerouslySetInnerHTML={{ __html: formatLine(trimmed, result.citations) }}
                        />
                      );
                    })}
                  </Box>

                  {result.citations.length > 0 && (
                    <>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>Sources</Typography>
                      <Stack spacing={0.75}>
                        {result.citations.map((citation, i) => (
                          <Stack key={i} direction="row" alignItems="flex-start" spacing={1}>
                            <Chip
                              label={i + 1}
                              size="small"
                              sx={{ minWidth: 24, height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'primary.main', color: 'white' }}
                            />
                            <Link href={citation.url} target="_blank" rel="noopener noreferrer" sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                              {citation.title}
                            </Link>
                          </Stack>
                        ))}
                      </Stack>
                    </>
                  )}

                  <Box sx={{ mt: 2.5 }}>
                    <Chip
                      label="Sources restricted to: PubMed, NIH, AAP, CDC, WHO, Mayo Clinic"
                      size="small"
                      sx={{ bgcolor: '#E3F2FD', color: '#1565C0', fontWeight: 500, fontSize: '0.75rem' }}
                    />
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ bgcolor: '#FAFBFC', mb: 3 }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                    <strong>Disclaimer:</strong> This information is for educational purposes only and is
                    not a substitute for professional medical advice. Always consult your child's
                    pediatrician for diagnosis and treatment decisions.
                  </Typography>
                </CardContent>
              </Card>

              <Box sx={{ textAlign: 'center' }}>
                <Button variant="outlined" onClick={() => navigate('/ask?tab=1')}>
                  Go to Full Research Tool
                </Button>
              </Box>
            </>
          )}
        </Container>
      )}

      {/* Features section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h2" textAlign="center" gutterBottom>
          Everything you need, nothing you don't
        </Typography>
        <Typography
          variant="body1"
          textAlign="center"
          sx={{ color: 'text.secondary', maxWidth: 560, mx: 'auto', mb: 6 }}
        >
          Built by pediatricians who understand that parents deserve better than
          guesswork, misinformation, and midnight Google spirals.
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 4
          }}
        >
          {features.map((feature) => (
            <FeatureCard key={feature.title}>
              <CardContent sx={{ p: 4, flexGrow: 1 }}>
                <IconWrapper sx={{ backgroundColor: feature.iconBg }}>
                  {feature.icon}
                </IconWrapper>
                <Typography variant="h5" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {feature.description}
                </Typography>
              </CardContent>
            </FeatureCard>
          ))}
        </Box>
      </Container>

      <TrustSection>
        <Container maxWidth="md">
          <Typography variant="h2" gutterBottom>
            Why Sprout is different
          </Typography>
          <Typography
            variant="body1"
            sx={{ fontSize: '1.1rem', opacity: 0.9, mb: 4, maxWidth: 600, mx: 'auto' }}
          >
            Every feature, every answer, and every recommendation in Sprout is
            reviewed and validated by board-certified pediatricians. We don't
            rely on AI-generated content or crowdsourced opinions. When you use
            the research tool, your answers come from peer-reviewed research and
            established clinical guidelines — the same sources your pediatrician uses.
          </Typography>
          <Stack direction="row" spacing={3} justifyContent="center">
            <Box textAlign="center">
              <Typography variant="h3">Evidence-Based</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Sourced from peer-reviewed literature
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h3">Pediatrician-Reviewed</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Every answer vetted by real doctors
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h3">No Guesswork</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                No forums, no AI, no anecdotes
              </Typography>
            </Box>
          </Stack>
        </Container>
      </TrustSection>

      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h2" gutterBottom>
          Ready to parent with confidence?
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: 'text.secondary', mb: 4, maxWidth: 480, mx: 'auto' }}
        >
          Join thousands of parents who trust Sprout for reliable, pediatrician-backed
          guidance on their child's health and development.
        </Typography>
        <Button variant="contained" color="primary" size="large" onClick={() => navigate('/children')}>
          Create Your Free Account
        </Button>
      </Container>
    </Box>
  );
};
