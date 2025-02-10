// server.js
const express = require('express');
const multer = require('multer');
const { fromPath } = require('pdf2pic');
const { PDFDocument } = require('pdf-lib');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Set up Multer to store uploaded files in a temporary directory
const upload = multer({ dest: 'uploads/' });

// Helper function to delete a file
const deleteFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) console.error(`Error deleting file ${filePath}:`, err);
  });
};

// POST endpoint to convert PDF to images (all pages) and return a ZIP file
// Expecting a single PDF file uploaded under the field name 'pdf'
app.post('/', upload.single('pdf'), async (req, res) => {
  try {
    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "Please upload a PDF file." });
    }

    const pdfPath = req.file.path;

    // Load the PDF using pdf-lib to determine page count
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();
    console.log(`PDF has ${pageCount} pages.`);

    // Define options for pdf2pic conversion
    const options = {
      density: 100,
      saveFilename: 'page', // Base filename for output images
      savePath: 'output',   // Directory where images will be saved
      format: 'png',        // Output format
      width: 600,           // Desired image width in pixels
      height: 600           // Desired image height in pixels
    };

    // Ensure the output directory exists
    if (!fs.existsSync('output')) {
      fs.mkdirSync('output');
    }

    // Initialize pdf2pic converter with the uploaded PDF file
    const convert = fromPath(pdfPath, options);

    // Create an array of promises to convert each page
    const conversionPromises = [];
    for (let page = 1; page <= pageCount; page++) {
      conversionPromises.push(convert(page));
    }

    // Wait for all pages to be converted
    const conversionResults = await Promise.all(conversionPromises);
    // Each result contains a property "path" with the output image path.
    console.log("PDF conversion complete. Generated images:", conversionResults.map(r => r.path));

    // Create a ZIP archive of the converted images
    const zipFilePath = path.join('output', `converted_${Date.now()}.zip`);
    const outputZipStream = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Listen for archive completion
    outputZipStream.on('close', () => {
      console.log(`Created ZIP archive: ${zipFilePath} (${archive.pointer()} total bytes)`);

      // Send the ZIP file as the response
      res.sendFile(path.resolve(zipFilePath), (err) => {
        if (err) {
          console.error("Error sending ZIP file:", err);
        }

        // Clean up: Delete the uploaded PDF, converted images, and the ZIP archive
        deleteFile(pdfPath);
        conversionResults.forEach(result => deleteFile(result.path));
        deleteFile(zipFilePath);
      });
    });

    // Pipe archive data to the file
    archive.pipe(outputZipStream);

    // Append each converted image file to the archive
    for (const result of conversionResults) {
      const imageFilePath = result.path;
      // Use the base filename (e.g., "page-1.png") in the archive
      archive.file(imageFilePath, { name: path.basename(imageFilePath) });
    }

    // Finalize the archive (this will trigger the 'close' event when done)
    archive.finalize();

  } catch (error) {
    console.error("Error converting PDF to images:", error);
    res.status(500).json({ error: "Failed to convert PDF to images." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`PDF-to-Image Converter service is running on port ${PORT}`);
});
