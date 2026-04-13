import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import PrintIcon from '@mui/icons-material/Print';

import { useVisitPrep } from '../../context/VisitPrepContext';
import { useChildren } from '../../context/ChildContext';

const sourceLabels: Record<string, { label: string; color: string }> = {
  research: { label: 'From Research', color: '#E3F2FD' },
  faq: { label: 'From FAQ', color: '#E8F5E9' },
  manual: { label: 'Your question', color: '#FFF3E0' },
};

export const VisitPrep = () => {
  const { items, addItem, removeItem, clearAll } = useVisitPrep();
  const { activeChild } = useChildren();
  const [newQuestion, setNewQuestion] = useState('');

  const handleAdd = () => {
    const trimmed = newQuestion.trim();
    if (!trimmed) return;
    addItem(trimmed, 'manual');
    setNewQuestion('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
        <AssignmentIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Typography variant="h3">Visit Prep</Typography>
        {items.length > 0 && (
          <Chip label={`${items.length} question${items.length === 1 ? '' : 's'}`} color="primary" size="small" />
        )}
      </Stack>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Collect questions as you go and bring this list to your next pediatrician appointment.
        {activeChild ? ` Preparing for ${activeChild.name}'s visit.` : ''}
      </Typography>

      {/* Add free-form question */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Add a Question
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="start">
            <TextField
              fullWidth
              multiline
              minRows={1}
              maxRows={4}
              placeholder="Type a question you want to ask your pediatrician..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
              }}
            />
            <Button
              variant="contained"
              onClick={handleAdd}
              disabled={!newQuestion.trim()}
              startIcon={<AddIcon />}
              sx={{ whiteSpace: 'nowrap', mt: '1px' }}
            >
              Add
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Questions list */}
      {items.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <AssignmentIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No questions yet
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
              Add questions above, or save them from the Research and FAQ pages using the
              "Save to Visit Prep" button that appears with each answer.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              {items.map((item, index) => {
                const sourceInfo = sourceLabels[item.source || 'manual'];
                return (
                  <Box key={item.id}>
                    {index > 0 && <Divider />}
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={2}
                      sx={{ px: 3, py: 2 }}
                    >
                      <Typography
                        sx={{
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          color: 'text.secondary',
                          minWidth: 28,
                        }}
                      >
                        {index + 1}.
                      </Typography>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                          {item.question}
                        </Typography>
                        <Chip
                          label={sourceInfo.label}
                          size="small"
                          sx={{
                            mt: 0.5,
                            fontSize: '0.7rem',
                            height: 20,
                            bgcolor: sourceInfo.color,
                          }}
                        />
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => removeItem(item.id)}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
                );
              })}
            </CardContent>
          </Card>

          {/* Actions */}
          <Stack direction="row" spacing={2} justifyContent="space-between">
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteSweepIcon />}
              onClick={clearAll}
              size="small"
            >
              Clear All
            </Button>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              size="small"
            >
              Print List
            </Button>
          </Stack>
        </>
      )}

      <Alert severity="info" variant="standard" sx={{ mt: 3 }}>
        Your questions are saved to the cloud and accessible from any device.
      </Alert>

      <Card sx={{ mt: 2, border: '1px solid', borderColor: 'secondary.light', bgcolor: '#FFF8E1' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, '&:last-child': { pb: 2 } }}>
          <PhoneIphoneIcon sx={{ fontSize: 32, color: 'secondary.main' }} />
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <Typography variant="body1" fontWeight={700} sx={{ fontSize: '0.95rem' }}>
                Text to your phone
              </Typography>
              <Chip label="Coming Soon" size="small" sx={{ bgcolor: '#FFF3E0', color: '#E65100', fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
              Soon you'll be able to text your questions and answers directly to your phone so you're prepared and ready to go when you walk into your child's appointment.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};
