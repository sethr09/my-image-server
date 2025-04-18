// server.js (Conceptual)
const express = require('express');
const multer = require('multer'); // For handling file uploads
const sharp = require('sharp');   // For image processing (install: npm install sharp)
const cors = require('cors'); // for handling CORS (install: npm install cors)
const { v4: uuidv4 } = require('uuid'); // For generating unique filenames (install: npm install uuid)
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads')); // Serve uploaded images

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Store uploaded files in the 'uploads' directory
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = uuidv4();
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension); // Unique filename
    },
});

const upload = multer({ storage: storage });

// Endpoint to handle image upload and contrast adjustment
app.post('/process-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image provided' });
        }

        const contrast = parseInt(req.body.contrast, 10);
        if (isNaN(contrast)) {
            return res.status(400).json({ error: 'Invalid contrast value' });
        }

        const filePath = req.file.path;
        const fileName = req.file.filename;
        // Use Sharp to adjust the contrast
        const outputFileName = `contrast_${contrast}-${fileName}`;
        const outputPath = `uploads/${outputFileName}`;

        await sharp(filePath)
            .modulate({ brightness: 1, saturation: 1, hue: 0 }) // Correct usage
            .linear(contrast/100, 0)
            .toFile(outputPath);
        // Construct the URL of the processed image.  Important for the client to access it.
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${outputFileName}`;
        res.json({ imageUrl: imageUrl }); // Send back the URL of the processed image
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({ error: 'Failed to process image', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});