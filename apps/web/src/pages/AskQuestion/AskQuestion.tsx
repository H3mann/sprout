import { useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import BiotechIcon from '@mui/icons-material/Biotech';
import BuildIcon from '@mui/icons-material/Build';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';

import { PediatricianFaq } from './PediatricianFaq';
import { Research } from './Research';

export const AskQuestion = () => {
  const [tab, setTab] = useState(0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, newValue) => setTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<QuestionAnswerIcon />} iconPosition="start" label="Ask a Pediatrician" />
          <Tab icon={<BiotechIcon />} iconPosition="start" label="Research" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3, px: 1, py: 1.5, bgcolor: '#FFF8E1', borderRadius: 2 }}>
            <BuildIcon sx={{ color: '#F57F17', fontSize: 20 }} />
            <Typography variant="body2" sx={{ color: '#5D4037', fontSize: '0.8rem' }}>
              <Chip label="Work in Progress" size="small" sx={{ mr: 1, bgcolor: '#FFF3E0', color: '#E65100', fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
              This section is actively being expanded. A larger database of pediatrician-answered questions is on the way.
            </Typography>
          </Stack>
          <PediatricianFaq />
        </>
      )}
      {tab === 1 && <Research />}
    </Container>
  );
};
