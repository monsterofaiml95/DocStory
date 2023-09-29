const express = require('express');
const ejs = require('ejs');
const multer = require('multer');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://Admin:Admi1234@cluster0.ivmippx.mongodb.net/Document', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const Document = mongoose.model('Document', {
  name: String,
  data: Buffer,
});

app.set('views', './views');
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const fileName = req.file.originalname;
  const fileBuffer = req.file.buffer;

  const document = new Document({ name: fileName, data: fileBuffer });

  try {
    await document.save();
    console.log('Document uploaded successfully.');
    res.redirect('/download');
  } catch (error) {
    console.error('Error saving document:', error);
    res.status(500).send('Error uploading the document.');
  }
});

app.get('/download', async (req, res) => {
  try {
    const documents = await Document.find();
    res.render('download', { documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).send('Error fetching documents.');
  }
});

app.get('/download/:id', async (req, res) => {
  const documentId = req.params.id;

  try {
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).send('Document not found.');
    }

    res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(document.data);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).send('Error fetching document.');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
