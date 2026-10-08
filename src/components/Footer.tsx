import { Box, Link, Typography } from '@mui/material';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        textAlign: 'center',
        py: 3,
        px: 2,
        mt: 'auto',
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.default'
      }}
    >
      <Typography
        variant="body2"
        sx={{ fontSize: 14, color: 'text.secondary' }}
      >
        By OpenAA ·{' '}
        <Link
          href="https://openaa.com/"
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          sx={{ color: 'primary.main' }}
        >
          openaa.com
        </Link>
      </Typography>
    </Box>
  );
}
