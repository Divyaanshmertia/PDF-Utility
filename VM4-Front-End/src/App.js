// src/App.js
import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import axios from 'axios';

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.56.101:3000';

  // State for merge PDFs form
  const [mergeFiles, setMergeFiles] = useState(null);

  // State for convert PDF form
  const [convertFile, setConvertFile] = useState(null);

  // Handler for tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handler for multiple file input (merge)
  const handleMergeFilesChange = (e) => {
    setMergeFiles(e.target.files);
  };

  // Handler for single file input (convert)
  const handleConvertFileChange = (e) => {
    setConvertFile(e.target.files[0]);
  };

  // Function to download a blob as a file
  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  };

  // Submit handler for merging PDFs
  const handleMergeSubmit = async (e) => {
    e.preventDefault();
    if (!mergeFiles || mergeFiles.length < 2) {
      alert('Please select at least two PDF files to merge.');
      return;
    }

    const formData = new FormData();
    Array.from(mergeFiles).forEach((file) => {
      formData.append('pdfs', file);
    });

    try {
      const response = await axios.post(`${apiUrl}/merge`, formData, {
        responseType: 'blob',
      });
      downloadBlob(response.data, 'merged.pdf');
    } catch (error) {
      console.error('Error merging PDFs:', error);
      alert('Failed to merge PDFs.');
    }
  };

  // Submit handler for converting PDF to images
  const handleConvertSubmit = async (e) => {
    e.preventDefault();
    if (!convertFile) {
      alert('Please select a PDF file to convert.');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', convertFile);

    try {
      const response = await axios.post(`${apiUrl}/convert`, formData, {
        responseType: 'blob',
      });
      downloadBlob(response.data, 'converted_images.zip');
    } catch (error) {
      console.error('Error converting PDF:', error);
      alert('Failed to convert PDF.');
    }
  };

  return (
    <div>
      {/* App Header */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div">
            Microservice PDF Utility App
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
          >
            <Tab label="Merge PDFs" />
            <Tab label="Convert PDF to Images" />
          </Tabs>

          {activeTab === 0 && (
            <Box component="form" onSubmit={handleMergeSubmit} sx={{ mt: 2 }}>
              <Typography variant="h5" gutterBottom>
                Merge PDFs
              </Typography>
              <Typography variant="body1" gutterBottom>
                Upload at least two PDF files to merge them into one.
              </Typography>
              <input
                type="file"
                accept="application/pdf"
                multiple
                onChange={handleMergeFilesChange}
                style={{ margin: '16px 0' }}
              />
              <br />
              <Button type="submit" variant="contained" color="primary">
                Merge PDFs
              </Button>
            </Box>
          )}

          {activeTab === 1 && (
            <Box component="form" onSubmit={handleConvertSubmit} sx={{ mt: 2 }}>
              <Typography variant="h5" gutterBottom>
                Convert PDF to Images
              </Typography>
              <Typography variant="body1" gutterBottom>
                Upload a PDF file to convert each page into an image.
              </Typography>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleConvertFileChange}
                style={{ margin: '16px 0' }}
              />
              <br />
              <Button type="submit" variant="contained" color="primary">
                Convert PDF
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </div>
  );
}

export default App;

