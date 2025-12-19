// src/components/Header.js
import React from 'react';
import { Box, Typography } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';

export default function Header({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'home', label: 'ホーム', icon: <FavoriteBorderIcon /> },
    { id: 'pattern', label: 'UIパターン', icon: <ShowChartIcon /> },
    { id: 'social', label: 'ソーシャル機能', icon: <PeopleAltOutlinedIcon /> },
    { id: 'best', label: 'ベストプラクティス', icon: <AutoStoriesOutlinedIcon /> },
  ];

  return (
    <nav className="custom-header">
      <div className="tab-container">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {activeTab === tab.id && (
              <span className="tab-label">{tab.label}</span>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}