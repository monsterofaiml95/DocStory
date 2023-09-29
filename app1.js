import express from 'express';
import ejs from 'ejs';
import multer from 'multer';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage });

mongoose.connect(
    process.env.MONGODB_URI || 'mongodb+srv://Admin:Admi1234@cluster0.ivmippx.mongodb.net/Document',
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
);

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

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const fileName = req.file.originalname;
    const fileBuffer = req.file.buffer;

    const document = new Document({ name: fileName, data: fileBuffer });

    document
        .save()
        .then(() => {
            console.log('Document uploaded successfully. ' + fileName);
            res.redirect('/download');
        })
        .catch((error) => {
            console.error('Error saving document:', error);
            res.status(500).send('Error uploading the document.');
        });
});

app.get('/download', (req, res) => {
    Document.find()
        .then((documents) => {
            res.render('download', { documents });
        })
        .catch((error) => {
            console.error('Error fetching documents:', error);
            res.status(500).send('Error fetching documents.');
        });
});

app.get('/download/:id', (req, res) => {
    const documentId = req.params.id;

    Document.findById(documentId)
        .then((document) => {
            if (!document) {
                return res.status(404).send('Document not found.');
            }

            res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.send(document.data);
        })
        .catch((error) => {
            console.error('Error fetching document:', error);
            res.status(500).send('Error fetching document.');
        });
});

app.get('/delete', (req, res) => {
    Document.find()
        .then((documents) => {
            res.render('delete', { documents });
        })
        .catch((error) => {
            console.error('Error fetching documents:', error);
            res.status(500).send('Error fetching documents for deletion...');
        });
});

app.get('/delete/:id', (req, res) => {
    const documentId = req.params.id;

    Document.findByIdAndRemove(documentId)
        .then((deletedDocument) => {
            if (!deletedDocument) {
                return res.status(404).send('Document not found.');
            }

            console.log('Document deleted successfully. ' + documentId);
            res.redirect('/delete');
        })
        .catch((error) => {
            console.error('Error deleting document:', error);
            res.status(500).send('Error deleting document.');
        });
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
