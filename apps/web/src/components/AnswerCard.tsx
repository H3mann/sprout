import { useState } from 'react';
import DOMPurify from 'dompurify';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckIcon from '@mui/icons-material/Check';
import CircleIcon from '@mui/icons-material/Circle';
import SearchIcon from '@mui/icons-material/Search';
import SubjectIcon from '@mui/icons-material/Subject';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';

import { useVisitPrep } from '../context/VisitPrepContext';
import type { PerplexityResult } from '../services/perplexity';

type ViewMode = 'full' | 'summary';

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

function extractSummaryPoints(answer: string): string[] {
  const lines = answer.split('\n').map((l) => l.trim()).filter(Boolean);
  const points: string[] = [];

  for (const line of lines) {
    // Skip markdown headers
    if (/^#{2,}\s+/.test(line)) continue;
    // Skip bold-only header lines like **Key Takeaways:**
    if (/^\*\*(.+?)\*\*$/.test(line) && line.endsWith(':**')) continue;

    // Already a bullet — clean and keep
    if (line.startsWith('•') || line.startsWith('-')) {
      const cleaned = line.replace(/^[•\-]\s*/, '').replace(/\*\*/g, '');
      if (cleaned.length > 10) points.push(cleaned);
      continue;
    }

    // Paragraph — take the first sentence as a key point
    const stripped = line.replace(/\*\*/g, '').replace(/\[(\d+)\]/g, '');
    const sentenceMatch = stripped.match(/^(.+?[.!?])\s/);
    const sentence = sentenceMatch ? sentenceMatch[1] : stripped;
    if (sentence.length > 15 && sentence.length < 300) {
      points.push(sentence);
    }
  }

  // Deduplicate similar points (same first 40 chars)
  const seen = new Set<string>();
  return points.filter((p) => {
    const key = p.slice(0, 40).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

interface AnswerCardProps {
  result: PerplexityResult;
  query?: string;
}

export const AnswerCard = ({ result, query }: AnswerCardProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const { addItem, hasQuestion } = useVisitPrep();
  const saved = query ? hasQuestion(query) : false;

  const summaryPoints = extractSummaryPoints(result.answer);

  return (
    <Card sx={{ mb: 3, border: '2px solid', borderColor: 'primary.main' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <SearchIcon sx={{ color: 'primary.main', fontSize: 22 }} />
            <Typography variant="h5">Answer</Typography>
          </Stack>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, v) => v && setViewMode(v)}
            size="small"
          >
            <ToggleButton value="full" sx={{ px: 1.5, py: 0.5, textTransform: 'none', fontSize: '0.75rem' }}>
              <SubjectIcon sx={{ fontSize: 16, mr: 0.5 }} />
              Full
            </ToggleButton>
            <ToggleButton value="summary" sx={{ px: 1.5, py: 0.5, textTransform: 'none', fontSize: '0.75rem' }}>
              <FormatListBulletedIcon sx={{ fontSize: 16, mr: 0.5 }} />
              Summary
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {viewMode === 'full' ? (
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
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatLine(trimmed.replace(/^[•\-]\s*/, ''), result.citations)) }}
                    />
                  </Stack>
                );
              }

              return (
                <Typography
                  key={i}
                  variant="body2"
                  sx={{ lineHeight: 1.8, fontSize: '0.925rem' }}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatLine(trimmed, result.citations)) }}
                />
              );
            })}
          </Box>
        ) : (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={700} sx={{ mb: 1.5, fontSize: '0.95rem' }}>
              Key Takeaways
            </Typography>
            <Stack spacing={1}>
              {summaryPoints.map((point, i) => (
                <Box
                  key={i}
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    bgcolor: '#F5F5F5',
                    borderLeft: '3px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ lineHeight: 1.7, fontSize: '0.925rem' }}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatLine(point, result.citations)) }}
                  />
                </Box>
              ))}
            </Stack>
          </Box>
        )}

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

        {query && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Button
              variant={saved ? 'outlined' : 'contained'}
              size="small"
              startIcon={saved ? <CheckIcon /> : <AssignmentIcon />}
              onClick={() => addItem(query, 'research')}
              disabled={saved}
              color={saved ? 'success' : 'primary'}
            >
              {saved ? 'Saved to Visit Prep' : 'Save to Visit Prep'}
            </Button>
          </Box>
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
  );
};
