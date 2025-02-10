// server.js
const express = require('express');
const multer  = require('multer');
const { PDFDocument } = require('pdf-lib');

// Set up Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Set up Multer with memory storage (we don't need to write files to disk)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Endpoint to merge PDFs
// Expect multiple files uploaded under the field name 'pdfs'
app.post('/', upload.array('pdfs'), async (req, res) => {
  try {
    const files = req.files;
    
    if (!files || files.length < 2) {
      return res.status(400).json({ error: "Please upload at least two PDF files to merge." });
    }
    
    // Create a new PDFDocument which will hold the merged content
    const mergedPdf = await PDFDocument.create();
    
    // Loop over each uploaded file
    for (const file of files) {
      // Load the PDF file from the uploaded buffer
      const pdf = await PDFDocument.load(file.buffer);
      // Get all pages from the loaded PDF
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      // Add each page to the merged PDF
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }
    
    // Save the merged PDF to a Uint8Array (byte array)
    const mergedPdfBytes = await mergedPdf.save();
    
    // Set response headers so that the browser downloads the PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=merged.pdf');
    res.send(Buffer.from(mergedPdfBytes));
    
  } catch (error) {
    console.error("Error merging PDFs:", error);
    res.status(500).json({ error: "Failed to merge PDFs." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`PDF Merger Microservice is running on port ${PORT}`);
});
