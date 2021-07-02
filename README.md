# ocrbot
A Discord bot written in `node.js` that uses OCR to transcribe text from images

Dependencies:
- `discord.js` >= 12.5.3
- `googleapis` >= 74.2.0
- `ocr-space-api` >=1.0.1
- `request` >= 2.88.2
- `stream` >= 0.0.2

Required authentication token files:
- `auth.json`: Discord bot authentication token
- `gdrive.json`: Google Drive authentication token
- `google.json`: Google authentication token
- `ocrspace.json`: OCR.space Free API key (request [here](https://ocr.space/ocrapi))

Usage:
- Currently it supports two OCR engines: OCR.space and Google
- Post `png` images to channel
- To use OCR.space engine, react using country flags: `:flag_jp:` for Japanese, `:flag_hk:` for Traditional Chinese and `:flag_cn:` for Simplified Chinese
- To use Google engine, react with `:regional_indicator_g:`, language will be automatically detected
- Google is better for recognizing obscure fonts, but may take longer since it needs to upload image to Google Drive then export it back as text
