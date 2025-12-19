// src/components/Header.js
import React from 'react';
import { Box, Typography } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'; // ハート
import ShowChartIcon from '@mui/icons-material/ShowChart';         // グラフ
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'; // グループ
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined'; // 本

export default function Header({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'home', label: 'ホーム', icon: <FavoriteBorderIcon /> },
    { id: 'pattern', label: 'UIパターン', icon: <ShowChartIcon /> },
    { id: 'social', label: 'ソーシャル機能', icon: <PeopleAltOutlinedIcon /> },
    { id: 'best', label: 'ベストプラクティス', icon: <AutoStoriesOutlinedIcon /> },
  ];

  return (
    <Box className="custom-tab-header">
      <Box sx={{ display: 'flex', gap: { xs: '2px', sm: '10px' }, alignItems: 'center' }}>
        {tabs.map((tab) => (
          <Box
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Box className="tab-icon">{tab.icon}</Box>
            <Typography variant="caption" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
              {tab.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}