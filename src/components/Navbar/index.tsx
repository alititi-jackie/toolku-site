import { AppBar, Toolbar, Stack, Select, MenuItem, IconButton, Typography } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mode } from '../App';

const languages = [
  ['en', 'English'], ['zh', '中文'], ['es', 'Español'], ['fr', 'Français'],
  ['de', 'Deutsch'], ['pt', 'Português'], ['ja', '日本語'], ['hi', 'हिंदी'],
  ['nl', 'Nederlands'], ['ru', 'Русский'], ['uk', 'Українська']
];

export default function Navbar({ mode, onChangeMode }: { mode: Mode; onChangeMode: () => void }) {
  const { i18n } = useTranslation();
  return (
    <AppBar position="static" color="transparent" elevation={0}>
      <Toolbar sx={{ width: '100%', maxWidth: 1440, mx: 'auto', justifyContent: 'space-between', gap: 1 }}>
        <Stack component={Link} to="/" direction="row" spacing={1} alignItems="center" sx={{ textDecoration: 'none', color: 'text.primary' }}>
          <img src="/favicon/apple-touch-icon.png" width="36" height="36" alt="" style={{ borderRadius: 10 }} />
          <Typography component="span" sx={{ fontSize: { xs: 23, sm: 28 }, fontWeight: 700 }}>ToolKu</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Select size="small" value={i18n.resolvedLanguage || 'en'} inputProps={{ 'aria-label': 'Language / 语言' }}
            onChange={(event) => { void i18n.changeLanguage(event.target.value); }}
            sx={{ minWidth: { xs: 98, sm: 120 }, '& fieldset': { border: 0 } }}>
            {languages.map(([code, label]) => <MenuItem key={code} value={code}>{label}</MenuItem>)}
          </Select>
          <IconButton onClick={onChangeMode} aria-label="Change color theme" title={mode}>
            {mode === 'dark' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
