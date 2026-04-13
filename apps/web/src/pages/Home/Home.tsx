import { useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import SearchIcon from '@mui/icons-material/Search';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useNavigate } from 'react-router-dom';

import { AnswerCard } from '../../components/AnswerCard';
import { MedicalLoader } from '../../components/MedicalLoader';
import { useAuth } from '../../context/AuthContext';
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
  width: 44,
  height: 44,
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(1.5)
}));

const TrustSection = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.dark,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(8, 0),
  textAlign: 'center'
}));

const features = [
  {
    icon: <ShowChartIcon sx={{ fontSize: 22, color: 'white' }} />,
    iconBg: '#4CAF50',
    title: 'Growth Tracking',
    description:
      'Monitor your child\'s height and weight against WHO and CDC percentile charts. See where they stand, track trends over time, and get adult height predictions using the Tanner method based on parental heights.'
  },
  {
    icon: <VaccinesIcon sx={{ fontSize: 22, color: 'white' }} />,
    iconBg: '#FF9800',
    title: 'Vaccine Schedules',
    description:
      'Stay on top of your child\'s immunization schedule with personalized timelines based on their age. Track completed doses and keep a complete vaccination record in one place.'
  },
  {
    icon: <QuestionAnswerIcon sx={{ fontSize: 22, color: 'white' }} />,
    iconBg: '#2196F3',
    title: 'Ask a Question',
    description:
      'Have a health question? Get answers sourced from peer-reviewed medical literature and clinical guidelines — PubMed, NIH, AAP, and CDC. Real evidence, not forums or anecdotal advice.'
  },
  {
    icon: <AutoAwesomeIcon sx={{ fontSize: 22, color: 'white' }} />,
    iconBg: '#7B1FA2',
    title: 'Insights, Not Just Numbers',
    description:
      'Sprout doesn\'t just show you data — it helps you understand it. See where your child falls on growth percentiles, what their trajectory looks like, and get clear explanations of trends, predictions, and what it all means for your child\'s development.'
  },
  {
    icon: <AssignmentIcon sx={{ fontSize: 22, color: 'white' }} />,
    iconBg: '#00897B',
    title: 'Visit Prep',
    description:
      'Walk into every appointment prepared. Create a visit prep document to organize your questions, save topics from your research, and make the most of your time with the pediatrician.'
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

export const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
              backed by evidence
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
            Easily ask questions, track growth, and make sense of the numbers.  No forums or guesswork—only evidence-based insights from PubMed, NIH, AAP, and the CDC.
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
          {loading && <MedicalLoader />}

          {error && (
            <Card sx={{ bgcolor: '#FFF3E0' }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: '#E65100' }}>{error}</Typography>
              </CardContent>
            </Card>
          )}

          {result && (
            <>
              <AnswerCard result={result} query={query.trim()} />

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
      <Container maxWidth="xl" sx={{ py: 8, px: { xs: 2, lg: 6 } }}>
        <Typography variant="h2" textAlign="center" gutterBottom>
          Everything you need, nothing you don't
        </Typography>
        <Typography
          variant="body1"
          textAlign="center"
          sx={{ color: 'text.secondary', maxWidth: 560, mx: 'auto', mb: 6 }}
        >
          Built for parents who deserve better than guesswork, misinformation,
          and midnight Google spirals.
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' },
            gap: 2
          }}
        >
          {features.map((feature) => (
            <FeatureCard key={feature.title}>
              <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
                <IconWrapper sx={{ backgroundColor: feature.iconBg }}>
                  {feature.icon}
                </IconWrapper>
                <Typography variant="body1" fontWeight={700} gutterBottom sx={{ fontSize: '0.95rem' }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', lineHeight: 1.5 }}>
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
            Sprout is built by pediatricians who know what parents actually need.
             Our answers come from peer-reviewed research and established clinical guidelines — the same sources your
            pediatrician uses. Growth tracking follows WHO and CDC standards, and
            predictions use clinically validated methods.
          </Typography>
          <Stack direction="row" spacing={3} justifyContent="center">
            <Box textAlign="center">
              <Typography variant="h3">Evidence-Based</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Sourced from peer-reviewed literature
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h3">Built by Pediatricians</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Designed by doctors, for parents
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h3">No Guesswork</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                No forums, no anecdotes, no misinformation
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
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => navigate(user ? '/children' : '/login')}
        >
          {user ? 'Go to Dashboard' : 'Create Your Free Account'}
        </Button>
      </Container>
    </Box>
  );
};
