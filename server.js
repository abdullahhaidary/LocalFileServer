const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3000;

// Enable CORS
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const folder = req.body.folder || 'default';
        const uploadPath = path.join(__dirname, 'uploads', folder);

        // Create folder if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Create uploads directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// Route to handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
    res.json({
        success: true,
        file: req.file,
        folder: req.body.folder
    });
});

// Route to get list of files
app.get('/files', (req, res) => {
    const folder = req.query.folder || 'default';
    const folderPath = path.join(__dirname, 'uploads', folder);

    if (!fs.existsSync(folderPath)) {
        return res.json({ files: [] });
    }

    const files = fs.readdirSync(folderPath).map(file => ({
        name: file,
        path: `/uploads/${folder}/${file}`,
        size: fs.statSync(path.join(folderPath, file)).size
    }));

    res.json({ files });
});

// Route to get list of folders
app.get('/folders', (req, res) => {
    const uploadsPath = path.join(__dirname, 'uploads');
    const folders = fs.readdirSync(uploadsPath).filter(file =>
        fs.statSync(path.join(uploadsPath, file)).isDirectory()
    );
    res.json({ folders });
});

// Route to create new folder
app.post('/folders', express.json(), (req, res) => {
    const folderName = req.body.name;
    const folderPath = path.join(__dirname, 'uploads', folderName);

    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
        res.json({ success: true, folder: folderName });
    } else {
        res.status(400).json({ success: false, message: 'Folder already exists' });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Access from other devices using your local IP address`);
}); 