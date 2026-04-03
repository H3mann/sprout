import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import BiotechIcon from '@mui/icons-material/Biotech';
import SchoolIcon from '@mui/icons-material/School';
import SearchIcon from '@mui/icons-material/Search';
import VerifiedIcon from '@mui/icons-material/Verified';

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  textAlign: 'center',
  transition: 'transform 0.15s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
  }
}));

const IconCircle = styled(Box)<{ bgcolor: string }>(({ bgcolor }) => ({
  width: 64,
  height: 64,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: bgcolor,
  margin: '0 auto 16px'
}));

export const Research = () => {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Do Your Own Research — The Right Way
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 640 }}>
          We believe parents should have access to the same evidence their pediatrician uses.
          This tool will let you explore peer-reviewed medical literature in plain language —
          no jargon, no bias, no algorithm-driven misinformation.
        </Typography>
      </Box>

      <Card sx={{ mb: 4, bgcolor: 'primary.dark', color: 'primary.contrastText' }}>
        <CardContent sx={{ py: 4, textAlign: 'center' }}>
          <BiotechIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
          <Typography variant="h2" gutterBottom>
            Coming Soon
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 520, mx: 'auto' }}>
            We're building a research tool that connects you to trusted medical sources —
            so you can make informed decisions with confidence, not confusion.
          </Typography>
        </CardContent>
      </Card>

      <Typography variant="h5" sx={{ mb: 3 }}>
        What to expect
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 3,
          mb: 4
        }}
      >
        <FeatureCard>
          <CardContent sx={{ p: 3 }}>
            <IconCircle bgcolor="#E3F2FD">
              <SearchIcon sx={{ fontSize: 30, color: '#1565C0' }} />
            </IconCircle>
            <Typography variant="h5" gutterBottom>
              Search Medical Literature
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Search across trusted databases of peer-reviewed pediatric research.
              Results are summarized in plain language so you can understand what
              the evidence actually says.
            </Typography>
          </CardContent>
        </FeatureCard>

        <FeatureCard>
          <CardContent sx={{ p: 3 }}>
            <IconCircle bgcolor="#E8F5E9">
              <VerifiedIcon sx={{ fontSize: 30, color: '#388E3C' }} />
            </IconCircle>
            <Typography variant="h5" gutterBottom>
              Pediatrician-Reviewed Summaries
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Every research summary is reviewed by a board-certified pediatrician to
              ensure accuracy and appropriate context. You'll always know who reviewed
              it and what sources were used.
            </Typography>
          </CardContent>
        </FeatureCard>

        <FeatureCard>
          <CardContent sx={{ p: 3 }}>
            <IconCircle bgcolor="#FFF3E0">
              <SchoolIcon sx={{ fontSize: 30, color: '#E65100' }} />
            </IconCircle>
            <Typography variant="h5" gutterBottom>
              Understand the Evidence
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Learn to evaluate health claims with confidence. We'll show you how strong
              the evidence is, what study types back it up, and what the medical consensus
              looks like.
            </Typography>
          </CardContent>
        </FeatureCard>
      </Box>

      <Card sx={{ bgcolor: '#FAFBFC' }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Why this matters
          </Typography>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="start">
              <Chip label="Problem" size="small" sx={{ bgcolor: '#FFEBEE', color: '#C62828', fontWeight: 600, mt: 0.5 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Parents searching for health information online are often met with AI-generated
                summaries, anonymous forum posts, sponsored content, and anecdotal advice that
                can be misleading or outright dangerous.
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="start">
              <Chip label="Solution" size="small" sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 600, mt: 0.5 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Sprout's research tool gives you direct access to the same peer-reviewed evidence
                your pediatrician relies on — translated into language you can understand, with
                context that helps you have better conversations with your child's doctor.
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="start">
              <Chip label="Goal" size="small" sx={{ bgcolor: '#E3F2FD', color: '#1565C0', fontWeight: 600, mt: 0.5 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                We're not here to replace your pediatrician. We're here to help you show up to
                appointments informed, ask better questions, and feel confident in the decisions
                you make for your child.
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
