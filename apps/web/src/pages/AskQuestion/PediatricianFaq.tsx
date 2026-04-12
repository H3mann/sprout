import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SearchIcon from '@mui/icons-material/Search';
import VerifiedIcon from '@mui/icons-material/Verified';

import { PEDIATRIC_FAQ, type FaqEntry } from '../../data/pediatricFaq';
import { useVisitPrep } from '../../context/VisitPrepContext';

const AnswerCard = styled(Card)(({ theme }) => ({
  border: `2px solid ${theme.palette.primary.main}`,
  borderRadius: 16
}));

const FaqCard = styled(Card)<{ isMatch?: boolean }>(({ theme, isMatch }) => ({
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  ...(isMatch && {
    borderColor: theme.palette.primary.light,
    borderWidth: 2,
    borderStyle: 'solid'
  }),
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
  }
}));

const categoryColors: Record<string, string> = {
  Nutrition: '#FF9800',
  'Illness & Safety': '#F44336',
  Sleep: '#9C27B0',
  Growth: '#4CAF50',
  Development: '#2196F3',
  Vaccines: '#00BCD4',
  'General Health': '#607D8B'
};

function matchQuestion(query: string, faq: FaqEntry[]): FaqEntry[] {
  if (!query.trim()) return [];

  const queryWords = query
    .toLowerCase()
    .replace(/[?.,!]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (queryWords.length === 0) return [];

  const scored = faq.map((entry) => {
    let score = 0;

    for (const word of queryWords) {
      // Keyword match (strongest signal)
      for (const keyword of entry.keywords) {
        if (keyword === word) {
          score += 3;
        } else if (keyword.includes(word) || word.includes(keyword)) {
          score += 2;
        }
      }

      // Question text match
      if (entry.question.toLowerCase().includes(word)) {
        score += 1;
      }
    }

    return { entry, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.entry);
}

export const PediatricianFaq = () => {
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { addItem, hasQuestion } = useVisitPrep();

  const matches = useMemo(() => matchQuestion(query, PEDIATRIC_FAQ), [query]);
  const hasQuery = query.trim().length > 0;
  const displayedFaq = hasQuery ? matches : PEDIATRIC_FAQ;
  const noResults = hasQuery && matches.length === 0;

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSelectQuestion = (entry: FaqEntry) => {
    setQuery(entry.question);
    setExpandedId(entry.id);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" gutterBottom>
          Ask a Pediatrician
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 640 }}>
          Type your question below. We'll match it to answers that have been written and reviewed
          by board-certified pediatricians — sourced from peer-reviewed medical literature, not
          AI or forums.
        </Typography>
      </Box>

      <TextField
        fullWidth
        placeholder="e.g., When should I start solid foods? Is my baby's fever dangerous? How much sleep does my toddler need?"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setExpandedId(null);
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: query ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => { setQuery(''); setExpandedId(null); }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null
          }
        }}
        sx={{
          mb: 3,
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            fontSize: '1.05rem',
            py: 0.5
          }
        }}
      />

      {hasQuery && matches.length > 0 && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          {matches.length} matching {matches.length === 1 ? 'answer' : 'answers'} found
        </Typography>
      )}

      {noResults && (
        <Card sx={{ mb: 3, textAlign: 'center', py: 4 }}>
          <CardContent>
            <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" gutterBottom>
              No matching answers found
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
              Try different keywords, or browse the questions below. We're constantly adding new
              answers reviewed by pediatricians.
            </Typography>
          </CardContent>
        </Card>
      )}

      {!hasQuery && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontWeight: 500 }}>
          Or browse all questions:
        </Typography>
      )}

      <Stack spacing={2}>
        {displayedFaq.map((entry) => {
          const isExpanded = expandedId === entry.id;
          const catColor = categoryColors[entry.category] || '#757575';

          return (
            <FaqCard key={entry.id} isMatch={hasQuery && matches.includes(entry)}>
              <CardActionArea
                onClick={() => (hasQuery ? handleToggle(entry.id) : handleSelectQuestion(entry))}
                sx={{ borderRadius: 3 }}
              >
                <CardContent sx={{ py: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1 }}>
                      <LocalHospitalIcon sx={{ color: catColor, fontSize: 22 }} />
                      <Typography variant="body1" fontWeight={600}>
                        {entry.question}
                      </Typography>
                    </Stack>
                    <Chip
                      label={entry.category}
                      size="small"
                      sx={{ bgcolor: catColor + '1A', color: catColor, fontWeight: 600, fontSize: '0.7rem' }}
                    />
                  </Stack>
                </CardContent>
              </CardActionArea>

              <Collapse in={isExpanded}>
                <Divider />
                <CardContent sx={{ bgcolor: '#FAFBFC' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-line',
                      lineHeight: 1.8,
                      color: 'text.primary',
                      mb: 3,
                      '& strong': { fontWeight: 600 }
                    }}
                    dangerouslySetInnerHTML={{
                      __html: entry.answer
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br />')
                    }}
                  />

                  <Divider sx={{ mb: 2 }} />

                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <VerifiedIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                        {entry.reviewedBy}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <MenuBookIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                        {entry.source}
                      </Typography>
                    </Stack>
                  </Stack>

                  <Divider sx={{ my: 2 }} />
                  {(() => {
                    const isSaved = hasQuestion(entry.question);
                    return (
                      <Button
                        variant={isSaved ? 'outlined' : 'contained'}
                        size="small"
                        startIcon={isSaved ? <CheckIcon /> : <AssignmentIcon />}
                        onClick={() => addItem(entry.question, 'faq')}
                        disabled={isSaved}
                        color={isSaved ? 'success' : 'primary'}
                      >
                        {isSaved ? 'Saved to Visit Prep' : 'Save to Visit Prep'}
                      </Button>
                    );
                  })()}
                </CardContent>
              </Collapse>
            </FaqCard>
          );
        })}
      </Stack>
    </Box>
  );
};
