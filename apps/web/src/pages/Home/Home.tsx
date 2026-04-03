import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';

const HeroSection = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.light}22 0%, ${theme.palette.secondary.light}22 100%)`,
  padding: theme.spacing(10, 0, 8),
  textAlign: 'center'
}));

const FeatureCard = styled(Card)(({ theme }) => ({
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

export const Home = () => {
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
              fontSize: '1.2rem',
              maxWidth: 640,
              mx: 'auto',
              mb: 4
            }}
          >
            Sprout gives parents the tools and trusted medical guidance they need
            to track their child's growth, stay current on vaccines, and find
            reliable answers to their health questions — all in one place.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="contained" color="primary" size="large">
              Get Started — It's Free
            </Button>
            <Button variant="outlined" color="primary" size="large">
              Learn More
            </Button>
          </Stack>
        </Container>
      </HeroSection>

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
            the "Ask a Question" feature, your answers come from peer-reviewed
            research and established clinical guidelines — the same sources your
            pediatrician uses.
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
        <Button variant="contained" color="primary" size="large">
          Create Your Free Account
        </Button>
      </Container>
    </Box>
  );
};
