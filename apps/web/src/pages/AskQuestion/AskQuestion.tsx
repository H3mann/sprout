import { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import BiotechIcon from '@mui/icons-material/Biotech';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';

import { PediatricianFaq } from './PediatricianFaq';
import { Research } from './Research';

export const AskQuestion = () => {
  const [tab, setTab] = useState(0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
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

      {tab === 0 && <PediatricianFaq />}
      {tab === 1 && <Research />}
    </Container>
  );
};
