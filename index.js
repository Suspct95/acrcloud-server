const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT || 3000;

app.post('/identify', upload.single('audio'), async (req, res) => {
  const filePath = req.file.path; // Chemin du fichier .m4a reçu
  const wavPath = `${filePath}.wav`;

  try {
    // 🔄 Convertir .m4a en .wav (PCM)
    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .output(wavPath)
        .audioCodec('pcm_s16le')
        .audioChannels(1)
        .audioFrequency(44100)
        .format('wav')
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // 🧠 Lecture du buffer .wav
    const buffer = fs.readFileSync(wavPath);

    // 🔐 Infos d'auth ACRCloud
    const host = 'identify-eu-west-1.acrcloud.com';
    const accessKey = process.env.ACR_ACCESS_KEY;
    const accessSecret = process.env.ACR_ACCESS_SECRET;
    const timestamp = Math.floor(Date.now() / 1000);
    const stringToSign = ['POST', '/v1/identify', accessKey, 'audio', '1', timestamp].join('\n');
    const signature = crypto.createHmac('sha1', accessSecret)
                            .update(stringToSign)
                            .digest('base64');

    // 📨 Construction du FormData
    const form = new FormData();
    form.append('sample', buffer, { filename: 'sample.wav' });
    form.append('access_key', accessKey);
    form.append('data_type', 'audio');
    form.append('signature', signature);
    form.append('sample_bytes', buffer.length);
    form.append('timestamp', timestamp);
    form.append('signature_version', '1');

    // 📡 Requête ACRCloud
    const response = await axios.post(`https://${host}/v1/identify`, form, {
      headers: form.getHeaders(),
    });

    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Identification failed' });
  } finally {
    // 🧹 Nettoyage des fichiers temporaires
    try { fs.unlinkSync(filePath); } catch {}
    try { fs.unlinkSync(wavPath); } catch {}
  }
});

app.get('/', (req, res) => res.send('✅ ACRCloud Proxy is running.'));

app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
