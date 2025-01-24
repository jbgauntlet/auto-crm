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
              mr: 2,
              '&.Mui-selected': {
                backgroundColor: 'transparent',
              }
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
                  color: currentFilter === value ? 'custom.primaryLightContrast' : 'text.primary',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: currentFilter === value ? 'primary.light' : 'custom.lightGray',
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                <Typography 
                  variant="h4" 
                  component="div"
                  color={currentFilter === value ? 'custom.primaryLightContrast' : 'primary.main'}
                >
                  {counts[value]}
                </Typography>
                <Typography 
                  variant="subtitle2" 
                  component="div"
                  color={currentFilter === value ? 'custom.primaryLightContrast' : 'text.secondary'}
                >
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
              sx={{
                color: 'primary.main',
                '&.Mui-checked': {
                  color: 'primary.main',
                },
              }}
            />
          }
          label="Show Closed Tickets"
          sx={{
            color: 'text.secondary',
          }}
        />
      </Box>
    </Box>
  );
}

export default TicketFilterButtons; 