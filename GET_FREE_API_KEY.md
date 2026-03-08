# 🆓 Get Your FREE Hugging Face API Key (30 seconds)

Your app is configured to use FREE AI, but you need a Hugging Face API key for the best experience.

## Quick Steps (30 seconds):

### 1. Create Free Account
Go to: https://huggingface.co/join

- Enter email
- Choose username
- Create password
- Click "Sign Up"

### 2. Get API Key
Go to: https://huggingface.co/settings/tokens

- Click "New token"
- Name it: "skill-mentor"
- Role: "read"
- Click "Generate"
- **Copy the token** (starts with `hf_...`)

### 3. Add to Your App
Open `backend/.env` and add your token:

```bash
HUGGINGFACE_API_KEY=hf_your_token_here
```

### 4. Restart Backend
```bash
# Stop server (Ctrl+C)
# Restart:
npm run dev
```

## Done! 🎉

Your app now has:
- ✅ FREE AI-powered features
- ✅ Unlimited requests
- ✅ Fast responses
- ✅ No credit card needed

## Without API Key?

The app will still work using smart fallback responses, but:
- ⚠️ Responses won't be as personalized
- ⚠️ Character analysis will use defaults
- ⚠️ Roadmaps will be template-based

**Recommendation**: Get the free API key - it takes 30 seconds!

---

**Need help?** Check FREE_AI_SETUP.md for more details.
