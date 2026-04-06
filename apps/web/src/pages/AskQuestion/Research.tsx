import { useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import CircleIcon from '@mui/icons-material/Circle';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LaunchIcon from '@mui/icons-material/Launch';
import SearchIcon from '@mui/icons-material/Search';
import VerifiedIcon from '@mui/icons-material/Verified';

import { searchMedlinePlus, type MedlinePlusResult } from '../../services/medlinePlus';
import { searchPerplexity, type PerplexityResult } from '../../services/perplexity';

const SourceCard = styled(Card)(({ theme }) => ({
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
  }
}));

export const Research = () => {
  const [query, setQuery] = useState('');
  const [medlineResults, setMedlineResults] = useState<MedlinePlusResult[]>([]);
  const [perplexityResult, setPerplexityResult] = useState<PerplexityResult | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [perplexityError, setPerplexityError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setHasSearched(true);
    setMedlineResults([]);
    setPerplexityResult(null);
    setPerplexityError(null);
    setExpandedIndex(null);
    setLoading(true);

    // Run both searches in parallel
    const [perplexitySettled, medlineSettled] = await Promise.allSettled([
      searchPerplexity(trimmed),
      searchMedlinePlus(trimmed)
    ]);

    if (perplexitySettled.status === 'fulfilled') {
      setPerplexityResult(perplexitySettled.value);
    } else {
      setPerplexityError(
        perplexitySettled.reason instanceof Error
          ? perplexitySettled.reason.message
          : 'Failed to search medical sources'
      );
    }

    if (medlineSettled.status === 'fulfilled') {
      setMedlineResults(medlineSettled.value);
    }

    setLoading(false);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClear = () => {
    setQuery('');
    setMedlineResults([]);
    setPerplexityResult(null);
    setPerplexityError(null);
    setHasSearched(false);
    setExpandedIndex(null);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" gutterBottom>
          Research — The Right Way
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 640 }}>
          Ask any pediatric health question in plain language. We search only trusted medical
          sources — PubMed, NIH, AAP, CDC, WHO — and give you a clear, evidence-based answer
          with citations. No forums, no social media, no guesswork.
        </Typography>
      </Box>

      {/* Search bar */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="e.g., When is a fever too high for a baby? Why won't my toddler eat? Is it safe to co-sleep?"
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
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              fontSize: '1.05rem',
              py: 0.5
            }
          }}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          sx={{ px: 4, whiteSpace: 'nowrap' }}
        >
          Search
        </Button>
      </Stack>

      {/* Source badges — shown before first search */}
      {!hasSearched && (
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 4, gap: 1 }}>
          <Chip
            icon={<VerifiedIcon />}
            label="PubMed & NIH"
            size="small"
            sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 600 }}
          />
          <Chip label="AAP" size="small" sx={{ bgcolor: '#E3F2FD', color: '#1565C0', fontWeight: 600 }} />
          <Chip label="CDC" size="small" sx={{ bgcolor: '#E3F2FD', color: '#1565C0', fontWeight: 600 }} />
          <Chip label="WHO" size="small" sx={{ bgcolor: '#E3F2FD', color: '#1565C0', fontWeight: 600 }} />
          <Chip label="Mayo Clinic" size="small" sx={{ bgcolor: '#E3F2FD', color: '#1565C0', fontWeight: 600 }} />
          <Chip
            label="No forums or social media"
            size="small"
            sx={{ bgcolor: '#FFEBEE', color: '#C62828', fontWeight: 600 }}
          />
        </Stack>
      )}

      {/* Loading state */}
      {loading && (
        <Card sx={{ mb: 3, textAlign: 'center', py: 5 }}>
          <CardContent>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body1">
              Searching PubMed, AAP, CDC, WHO, and other trusted sources...
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              This may take a few seconds
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Perplexity answer — primary result */}
      {perplexityResult && (
        <Card sx={{ mb: 4, border: '2px solid', borderColor: 'primary.main' }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <SearchIcon sx={{ color: 'primary.main', fontSize: 22 }} />
              <Typography variant="h5">Answer</Typography>
            </Stack>

            <Box
              sx={{
                mb: 3,
                '& > *:not(:last-child)': { mb: 2 }
              }}
            >
              {perplexityResult.answer.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return null;

                // Format line: bold, inline citations as superscript links, headers
                const formatLine = (text: string) => {
                  return text
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/#{2,}\s*(.+)/g, '<strong>$1</strong>')
                    .replace(
                      /\[(\d+)\]/g,
                      (_, num) => {
                        const idx = parseInt(num, 10) - 1;
                        const cite = perplexityResult.citations[idx];
                        if (cite) {
                          return `<a href="${cite.url}" target="_blank" rel="noopener noreferrer" style="color: #4CAF50; font-size: 0.7rem; vertical-align: super; text-decoration: none; font-weight: 600;">[${num}]</a>`;
                        }
                        return `[${num}]`;
                      }
                    );
                };

                // Bold-only header lines like **Key Takeaways:**
                const headerMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
                if (headerMatch) {
                  return (
                    <Typography key={i} variant="body2" fontWeight={700} sx={{ mt: 2, fontSize: '0.95rem' }}>
                      {headerMatch[1]}
                    </Typography>
                  );
                }

                // Markdown headers ## Header
                const mdHeaderMatch = trimmed.match(/^#{2,}\s+(.+)/);
                if (mdHeaderMatch) {
                  return (
                    <Typography key={i} variant="body2" fontWeight={700} sx={{ mt: 2, fontSize: '0.95rem' }}>
                      {mdHeaderMatch[1]}
                    </Typography>
                  );
                }

                // Bullet points
                if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
                  return (
                    <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start" sx={{ pl: 1 }}>
                      <CircleIcon sx={{ fontSize: 6, color: 'primary.main', mt: 1, flexShrink: 0 }} />
                      <Typography
                        variant="body2"
                        sx={{ lineHeight: 1.8, fontSize: '0.9rem' }}
                        dangerouslySetInnerHTML={{ __html: formatLine(trimmed.replace(/^[•\-]\s*/, '')) }}
                      />
                    </Stack>
                  );
                }

                // Regular paragraph
                return (
                  <Typography
                    key={i}
                    variant="body2"
                    sx={{ lineHeight: 1.8, fontSize: '0.925rem' }}
                    dangerouslySetInnerHTML={{ __html: formatLine(trimmed) }}
                  />
                );
              })}
            </Box>

            {perplexityResult.citations.length > 0 && (
              <>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
                  Sources
                </Typography>
                <Stack spacing={0.75}>
                  {perplexityResult.citations.map((citation, i) => (
                    <Stack key={i} direction="row" alignItems="flex-start" spacing={1}>
                      <Chip
                        label={i + 1}
                        size="small"
                        sx={{
                          minWidth: 24,
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          bgcolor: 'primary.main',
                          color: 'white'
                        }}
                      />
                      <Link
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          fontSize: '0.8rem',
                          lineHeight: 1.5
                        }}
                      >
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
      )}

      {/* Perplexity error */}
      {perplexityError && !loading && (
        <Card sx={{ mb: 3, bgcolor: '#FFF3E0' }}>
          <CardContent>
            <Typography variant="body2" sx={{ color: '#E65100' }}>
              {perplexityError}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* MedlinePlus — supporting trusted sources */}
      {medlineResults.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <VerifiedIcon sx={{ color: '#2E7D32', fontSize: 20 }} />
            <Typography variant="h5">Related NIH Health Topics</Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Official health topics from the U.S. National Library of Medicine for further reading.
          </Typography>

          <Stack spacing={1.5}>
            {medlineResults.map((result, index) => {
              const isExpanded = expandedIndex === index;

              return (
                <SourceCard key={result.url}>
                  <CardActionArea
                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    sx={{ borderRadius: 3 }}
                  >
                    <CardContent sx={{ py: 1.5 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1 }}>
                          <AutoStoriesIcon sx={{ color: '#2E7D32', fontSize: 20 }} />
                          <Typography variant="body2" fontWeight={600}>
                            {result.title}
                          </Typography>
                        </Stack>
                        <ExpandMoreIcon
                          sx={{
                            transform: isExpanded ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.2s',
                            color: 'text.secondary',
                            fontSize: 20
                          }}
                        />
                      </Stack>
                    </CardContent>
                  </CardActionArea>

                  <Collapse in={isExpanded}>
                    <Divider />
                    <CardContent sx={{ bgcolor: '#FAFBFC', py: 2 }}>
                      {result.keyPoints.length > 0 ? (
                        <Stack spacing={1} sx={{ mb: 2 }}>
                          {result.keyPoints.slice(0, 5).map((point, pi) => (
                            <Stack key={pi} direction="row" spacing={1.5} alignItems="flex-start">
                              <CircleIcon
                                sx={{ fontSize: 6, color: 'primary.main', mt: 0.9, flexShrink: 0 }}
                              />
                              <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'text.primary', fontSize: '0.85rem' }}>
                                {point}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'text.primary', mb: 2 }}>
                          {result.fullSummary.slice(0, 300)}
                          {result.fullSummary.length > 300 ? '...' : ''}
                        </Typography>
                      )}

                      <Link
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}
                      >
                        Read full article on MedlinePlus
                        <LaunchIcon sx={{ fontSize: 14 }} />
                      </Link>
                    </CardContent>
                  </Collapse>
                </SourceCard>
              );
            })}
          </Stack>
        </Box>
      )}

      {/* No results at all */}
      {hasSearched && !loading && !perplexityResult && !perplexityError && medlineResults.length === 0 && (
        <Card sx={{ mb: 3, textAlign: 'center', py: 4 }}>
          <CardContent>
            <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" gutterBottom>
              No results found
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
              Try rephrasing your question or using different keywords.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      {hasSearched && !loading && (
        <Card sx={{ bgcolor: '#FAFBFC' }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
              <strong>Disclaimer:</strong> This information is for educational purposes only and is
              not a substitute for professional medical advice. Always consult your child's
              pediatrician for diagnosis and treatment decisions.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
