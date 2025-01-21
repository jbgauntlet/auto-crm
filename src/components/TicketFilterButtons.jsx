import { Box, Card, Typography, ToggleButton, ToggleButtonGroup, FormControlLabel, Checkbox } from '@mui/material';

function TicketFilterButtons({ 
  currentFilter, 
  onFilterChange, 
  showClosed,
  onShowClosedChange,
  counts 
}) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 2,
        alignItems: 'center'
      }}>
        <ToggleButtonGroup
          value={currentFilter}
          exclusive
          onChange={(e, newValue) => {
            if (newValue !== null) {
              onFilterChange(newValue);
            }
          }}
          sx={{ 
            '& .MuiToggleButton-root': { 
              border: 'none',
              p: 0,
              overflow: 'visible',
              mr: 2
            } 
          }}
        >
          {[
            { value: 'you', label: 'YOU' },
            { value: 'groups', label: 'GROUPS' },
            { value: 'all', label: 'ALL' }
          ].map(({ value, label }) => (
            <ToggleButton 
              key={value} 
              value={value}
            >
              <Card 
                elevation={currentFilter === value ? 4 : 1}
                sx={{
                  width: 120,
                  height: 80,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  bgcolor: currentFilter === value ? 'primary.light' : 'background.paper',
                  '&:hover': {
                    bgcolor: currentFilter === value ? 'primary.light' : 'action.hover',
                  }
                }}
              >
                <Typography variant="h4" component="div">
                  {counts[value]}
                </Typography>
                <Typography variant="subtitle2" component="div">
                  {label}
                </Typography>
              </Card>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <FormControlLabel
          control={
            <Checkbox
              checked={showClosed}
              onChange={(e) => onShowClosedChange(e.target.checked)}
            />
          }
          label="Show Closed Tickets"
        />
      </Box>
    </Box>
  );
}

export default TicketFilterButtons; 