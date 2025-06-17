const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT || 3000;

app.post('/identify', upload.single('audio'), async (req, res) => {
  const filePath = req.file.path;
  const buffer = fs.readFileSync(filePath);

  const host = 'identify-eu-west-1.acrcloud.com';
  const accessKey = process.env.ACR_ACCESS_KEY;
  const accessSecret = process.env.ACR_ACCESS_SECRET;
  const timestamp = Math.floor(Date.now() / 1000);
  const stringToSign = ['POST', '/v1/identify', accessKey, 'audio', '1', timestamp].join('\n');
  const signature = crypto.createHmac('sha1', accessSecret)
                          .update(stringToSign)
                          .digest('base64');

  const form = new FormData();
  form.append('sample', buffer, { filename: 'sample.wav' });
  form.append('access_key', accessKey);
  form.append('data_type', 'audio');
  form.append('signature', signature);
  form.append('sample_bytes', buffer.length);
  form.append('timestamp', timestamp);
  form.append('signature_version', '1');

  try {
    const response = await axios.post(`https://${host}/v1/identify`, form, {
      headers: form.getHeaders(),
    });
    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Identification failed' });
  } finally {
    fs.unlinkSync(filePath);
  }
});

app.get('/', (req, res) => res.send('ACRCloud Proxy is running.'));

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));