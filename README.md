# QuickPick - AI Shopping Assistant

A mobile-first web application that helps users make quick decisions between products in a supermarket using AI vision analysis. Built with Next.js 14, Clerk authentication, Prisma database, and Google Gemini AI.

## Features

- 🔐 **User Authentication**: Secure user accounts with Clerk
- 📸 **Camera/Gallery Upload**: Take a photo or upload from gallery
- 🤖 **AI Analysis**: Uses Google Gemini 2.5 Flash vision to analyze product images
- 🆚 **Comparison Mode**: Compare two products side-by-side with battle-style analysis
- 📊 **Health Score**: Nutri-Score style A-E grading system for product healthiness
- 📝 **Detailed Analysis**: Flavor profiles, pros/cons, and personalized recommendations
- 📱 **Mobile-First Design**: Native app-like UI optimized for mobile devices
- ⚡ **Streaming Responses**: Real-time AI responses using Vercel AI SDK
- 💾 **Database Ready**: Prisma ORM with PostgreSQL for storing scan history

## Tech Stack

- **Framework**: Next.js 14.2.5 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI
- **Authentication**: Clerk v5.7.5
- **Database**: Prisma ORM with PostgreSQL
- **AI**: Google Gemini 2.5 Flash (via Vercel AI SDK)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Google Generative AI API key (Get one free at [Google AI Studio](https://aistudio.google.com/apikey))
- Clerk account and API keys (Get one free at [Clerk](https://clerk.com))
- PostgreSQL database (Optional - Vercel Postgres or Neon for production)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd Shop_Project
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables:**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Google Gemini AI
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   
   # Database (Optional - for production)
   DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
   ```

   **How to get API keys:**
   
   - **Google Gemini**: 
     1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
     2. Sign in with your Google account
     3. Create a new API key
     4. Copy and paste into `.env.local`
   
   - **Clerk Authentication**:
     1. Sign up for a free account at [clerk.com](https://clerk.com)
     2. Create a new application
     3. Go to "API Keys" in your Clerk dashboard
     4. Copy the "Publishable Key" and "Secret Key"
     5. Paste them into your `.env.local` file
   
   - **Database** (Optional for now):
     - Use [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) or [Neon](https://neon.tech) for production
     - Add the connection string to `.env.local` when ready

   **Important:** Never commit your `.env.local` file to version control!

4. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## Usage

### Single Scan Mode

1. Select "Single Scan" mode at the top
2. Click "Scan Products" or "Choose from Gallery"
3. Select or capture an image of a product
4. Wait for AI analysis (usually 5-10 seconds)
5. Review:
   - **Headline**: Catchy product summary
   - **Health Score**: A-E grade with explanation
   - **Quick Summary**: Who this product is for
   - **Full Analysis**: Flavor, texture, pros, cons, and verdict

### Comparison Mode

1. Select "Compare Two" mode at the top
2. Upload Product A image
3. Upload Product B image
4. Wait for AI comparison analysis
5. Review:
   - **Headline**: Comparison title
   - **Winner**: Which product wins and why
   - **Health Comparison**: Side-by-side health scores
   - **Flavor Face-Off**: Taste and texture comparison
   - **Pros & Cons Comparison**: Detailed comparison
   - **Verdict**: Final recommendation

## Project Structure

```
Shop_Project/
├── app/
│   ├── api/
│   │   └── analyze/           # API route for image analysis
│   ├── sign-in/               # Clerk sign-in page
│   ├── sign-up/               # Clerk sign-up page
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout with ClerkProvider
│   └── page.tsx               # Main page with mode toggle
├── components/
│   ├── ui/                    # Shadcn/UI components
│   ├── CameraCapture.tsx      # Camera/gallery component
│   ├── Header.tsx             # Header with user button
│   └── ResultDisplay.tsx      # Results display component
├── lib/
│   ├── prisma.ts              # Prisma client singleton
│   └── utils.ts               # Utility functions
├── prisma/
│   └── schema.prisma          # Database schema
├── middleware.ts              # Clerk authentication middleware
└── public/                    # Static assets
```

## Deployment

### Deploy to Vercel

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Import your repository in [Vercel](https://vercel.com)**

3. **Add environment variables in Vercel:**
   
   Go to **Settings → Environment Variables** and add:
   - `GOOGLE_GENERATIVE_AI_API_KEY` - Your Google AI Studio API key
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key (starts with `pk_`)
   - `CLERK_SECRET_KEY` - Your Clerk secret key (starts with `sk_`)
   - `DATABASE_URL` - Your PostgreSQL connection string (optional)

   **Important:** 
   - Select "All Environments" for each variable
   - Make sure Clerk keys are set, otherwise authentication won't work
   - The app will work without `DATABASE_URL` (Prisma will use a dummy URL for generation)

4. **Deploy!**

   The application will be automatically deployed and available at your Vercel URL.

5. **After deployment:**
   - Visit your Vercel URL
   - You'll be redirected to sign-in (Clerk authentication)
   - Create an account and start using the app!

## Configuration

### AI Model

The app uses **Google Gemini 2.5 Flash** by default, which provides fast and accurate vision analysis. The model automatically falls back to:
- `gemini-flash-latest` (stable fallback)
- `gemini-pro-latest` (Pro fallback)

To change the model, edit `app/api/analyze/route.ts` and modify the `modelNamesToTry` array.

### Database Setup

The app includes Prisma ORM with PostgreSQL support:

- **Development**: Prisma client generation works without a database
- **Production**: Set `DATABASE_URL` in Vercel environment variables
- **Migrations**: Run `npx prisma migrate dev` when ready to use the database

See `PRISMA_SETUP.md` for detailed database setup instructions.

## Features in Detail

### Health Score (Nutri-Score Style)

Products receive an A-E health grade:
- **A**: Very Healthy (Natural, nutrient-dense, low processed)
- **B**: Healthy (Mostly natural, good nutritional profile)
- **C**: Moderate (Some processed ingredients, average nutrition)
- **D**: Less Healthy (Highly processed, high sugar/salt, few nutrients)
- **E**: Unhealthy (Highly processed, very high sugar/salt, minimal nutritional value)

The score is displayed as a colored badge with a short explanation.

### Analysis Output Format

**Single Scan Mode:**
- **HEADLINE**: Catchy one-sentence product summary
- **HEALTH SCORE**: A-E grade with reason
- **WHO IS THIS FOR?**: Target audience
- **FLAVOR & TEXTURE**: Taste and mouthfeel details
- **PROS & CONS**: Strengths and weaknesses
- **VERDICT**: Final recommendation

**Comparison Mode:**
- **HEADLINE**: Comparison title
- **WINNER**: Which product wins and why
- **HEALTH COMPARISON**: Side-by-side health scores
- **FLAVOR FACE-OFF**: Taste and texture comparison
- **PROS & CONS COMPARISON**: Detailed comparison
- **VERDICT**: Final recommendation

### Mobile Optimization

- Large, readable fonts optimized for mobile screens
- Touch-friendly buttons and interface elements
- Native camera integration via HTML5
- Responsive layout that works on all screen sizes
- Native app-like UI/UX with smooth animations
- Optimized images using Next.js Image component

## Troubleshooting

### Build Errors

**Prisma Client not found:**
- Run `npx prisma generate` before building
- The build script automatically runs this, but you can run it manually

**Middleware errors:**
- Make sure Clerk environment variables are set in Vercel
- Check that `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are correct
- The middleware will allow requests if Clerk keys are missing (development mode)

**Type errors:**
- Run `npm install` to ensure all dependencies are installed
- Make sure you're using Node.js 18+

### Runtime Errors

**500 Internal Server Error:**
- Check Vercel runtime logs for specific error messages
- Verify all environment variables are set correctly
- Ensure Clerk keys are valid and not expired

**Authentication not working:**
- Verify Clerk keys are set in Vercel
- Check that sign-in/sign-up routes are accessible
- Review Clerk dashboard for any configuration issues

## Additional Documentation

- **`CLERK_SETUP.md`**: Detailed Clerk authentication setup guide
- **`PRISMA_SETUP.md`**: Prisma database setup and usage instructions

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the additional documentation files
3. Open an issue on GitHub
