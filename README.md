# QuickPick - AI Shopping Assistant

A mobile-first web application that helps users make quick decisions between products in a supermarket using AI vision analysis.

## Features

- 🔐 **User Authentication**: Secure user accounts with Clerk
- 📸 **Camera/Gallery Upload**: Take a photo or upload from gallery
- 🤖 **AI Analysis**: Uses Google Gemini 1.5 Flash vision to analyze product images
- 🆚 **Comparison Mode**: Compare two products side-by-side
- 📊 **Quick Comparison**: Concise comparison focusing on taste, ingredients, and features
- 📱 **Mobile-First Design**: Native app-like UI optimized for mobile devices
- ⚡ **Streaming Responses**: Real-time AI responses using Vercel AI SDK

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI
- **Authentication**: Clerk
- **AI**: Google Gemini 1.5 Flash (via Vercel AI SDK)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Google Generative AI API key (Get one free at [Google AI Studio](https://aistudio.google.com/apikey))
- Clerk account and API keys (Get one free at [Clerk](https://clerk.com))

### Installation

1. Clone the repository or navigate to the project directory:
   ```bash
   cd Shop_Project
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add:
   ```
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   ```
   
   **How to get Clerk keys:**
   1. Sign up for a free account at [clerk.com](https://clerk.com)
   2. Create a new application
   3. Go to "API Keys" in your Clerk dashboard
   4. Copy the "Publishable Key" and "Secret Key"
   5. Paste them into your `.env.local` file
   
   **Important:** Replace all placeholder values with your actual API keys.
   Never commit your real API keys to version control!

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Click "Scan Products" or "Choose from Gallery"
2. Select or capture an image of products
3. Wait for AI analysis (usually 5-10 seconds)
4. Review the comparison and verdict
5. Click "Scan Another Product" to try again

## Project Structure

```
Shop_Project/
├── app/
│   ├── api/
│   │   └── analyze/       # API route for image analysis
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/
│   ├── ui/                # Shadcn/UI components
│   ├── CameraCapture.tsx  # Camera/gallery component
│   └── ResultDisplay.tsx  # Results display component
├── lib/
│   └── utils.ts           # Utility functions
└── public/                # Static assets
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub/GitLab/Bitbucket
2. Import your repository in [Vercel](https://vercel.com)
3. Add your `GOOGLE_GENERATIVE_AI_API_KEY` in the environment variables section
4. Deploy!

The application will be automatically deployed and available at your Vercel URL.

## Configuration

### Current AI Model

The app currently uses **Google Gemini 1.5 Flash** (`models/gemini-1.5-flash-latest`), which is free and provides fast, accurate vision analysis.

### Using Different AI Models

To switch to a different Gemini model, modify `app/api/analyze/route.ts`:

```typescript
// Change the model name in the streamText call:
model: google("models/gemini-1.5-pro-latest")  // For more powerful model
// or
model: google("models/gemini-2.0-flash-exp")   // For latest experimental
```

## Features in Detail

### Analysis Output Format

The AI provides:
- **Product Names**: Identified products in the image
- **The Verdict**: One-sentence recommendation
- **Comparison**: Flavor profile, key pros, and cons for each product
- **Quick Summary**: 1-2 sentence "vibe" description

### Mobile Optimization

- Large, readable fonts
- Touch-friendly buttons
- Native camera integration
- Responsive layout optimized for mobile viewports
- Native app-like UI/UX

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
