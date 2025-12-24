# ClipioAI - Video Analysis SaaS MVP

## Quick Start

1. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual keys
   ```

2. **Set up Supabase database:**
   - Go to your Supabase project
   - Run the SQL schema from `supabase-schema.sql`

3. **Set up Stripe:**
   - Create products in Stripe Dashboard
   - Add price IDs to `.env.local`
   - Set up webhook endpoint

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Visit:** http://localhost:3000

## Next Steps

- [ ] Copy remaining component files from Claude artifacts
- [ ] Set up Clerk authentication
- [ ] Configure Supabase database
- [ ] Set up Stripe products and webhooks
- [ ] Add admin user IDs to environment variables

## Documentation

See the artifacts in your Claude conversation for:
- Complete component code
- API route implementations
- Detailed setup instructions
- Supabase SQL schema

## Support

Check the setup guide artifact for detailed instructions on:
- Clerk setup
- Supabase configuration
- Stripe integration
- Deployment to Vercel
