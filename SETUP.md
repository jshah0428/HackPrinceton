# 🚀 DoctorVoice Setup Guide

## What You Just Built! 🎉

Your app now:
1. **Uploads medical files** (PDF, images, text)
2. **Sends them to ChatGPT API** for analysis
3. **Gets disease risk predictions** back
4. **Shows beautiful results** on the confirmation page

---

## 📋 Setup Steps

### 1️⃣ Get OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Sign up / Log in
3. Click "Create new secret key"
4. Copy your key (starts with `sk-...`)

### 2️⃣ Set Up Backend

```bash
# Navigate to backend folder
cd backend

# Install dependencies (using uv as per workspace rules)
uv add fastapi uvicorn openai python-multipart pypdf2 pillow pytesseract

# Create .env file
echo "OPENAI_API_KEY=sk-your-actual-key-here" > .env
```

**Important:** Replace `sk-your-actual-key-here` with your actual OpenAI API key!

### 3️⃣ Install Tesseract OCR (for reading images)

**Windows:**
- Download: https://github.com/UB-Mannheim/tesseract/wiki
- Run installer
- Add to PATH: `C:\Program Files\Tesseract-OCR`

**Mac:**
```bash
brew install tesseract
```

**Linux:**
```bash
sudo apt install tesseract-ocr
```

### 4️⃣ Start Backend Server

```bash
# In backend folder
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### 5️⃣ Start Frontend (Already Running!)

Your frontend should already be running on `http://localhost:3000`

If not:
```bash
cd frontend
npm run dev
```

---

## 🎯 How to Test

1. **Open:** http://localhost:3000
2. **Upload** a medical file (PDF, image, or text)
3. **Click** "Upload & Analyze"
4. **Wait** for AI analysis (shows spinning loader)
5. **See** disease risk predictions! 🎉

---

## 📁 Supported File Types

- ✅ **PDF** - Medical reports, prescriptions
- ✅ **Images** (PNG, JPG) - Lab results, X-rays
- ✅ **Text files** - Medical notes

---

## 🐛 Troubleshooting

### "Analysis Failed" Error?

**Check:**
1. ✅ Backend server is running (`http://localhost:8000`)
2. ✅ OPENAI_API_KEY is set in `.env`
3. ✅ You have OpenAI API credits

**Test backend:**
```bash
curl http://localhost:8000/health
```

Should return: `{"status":"healthy","openai_configured":true}`

### Can't extract text from images?

- Make sure Tesseract OCR is installed
- Check it's in your system PATH

---

## 💰 Cost Estimate

OpenAI GPT-4 pricing:
- **Input:** ~$0.03 per 1K tokens
- **Output:** ~$0.06 per 1K tokens

**Example:** Analyzing a 2-page medical PDF ≈ $0.10-0.20

---

## 🎓 How It Works

```
User uploads file
    ↓
Frontend sends to Backend (localhost:8000)
    ↓
Backend extracts text (PDF/OCR)
    ↓
Sends to ChatGPT API with medical prompt
    ↓
ChatGPT analyzes and predicts disease risks
    ↓
Backend returns JSON results
    ↓
Frontend displays beautiful analysis! ✨
```

---

## 🔥 Features

- ✅ Real-time AI analysis
- ✅ Multiple file upload
- ✅ Disease risk prediction
- ✅ Professional UI with Poppins font
- ✅ Loading states & error handling
- ✅ Secure file processing

---

## 📝 Next Steps (Optional)

Want to make it even better?

1. **Add authentication** - Only you can access
2. **Save results to database** - Keep history
3. **Add voice input** - Match your "DoctorVoice" theme
4. **Deploy to cloud** - Make it live!

---

Need help? Check the error messages in:
- Backend terminal
- Browser console (F12)
- Network tab (F12 → Network)

Happy hacking! 🚀

