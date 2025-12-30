# Deployment Guide

This guide covers deploying Tool Connect Craft to various platforms and environments.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Deployment Options](#deployment-options)
  - [Vercel (Recommended)](#vercel-recommended)
  - [Netlify](#netlify)
  - [Docker](#docker)
  - [Self-Hosted](#self-hosted)
- [Database Setup](#database-setup)
- [Post-Deployment](#post-deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- [ ] Supabase project created
- [ ] Database migrations applied
- [ ] Environment variables documented
- [ ] Build passes locally (`npm run build`)
- [ ] All tests passing (when implemented)

---

## Environment Setup

### Required Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Settings** > **API**
4. Copy:
   - Project URL (VITE_SUPABASE_URL)
   - Anon/public key (VITE_SUPABASE_PUBLISHABLE_KEY)
5. Get Project ID from **Settings** > **General**

---

## Deployment Options

### Vercel (Recommended)

Vercel is the recommended platform for deploying Vite apps with zero configuration.

#### Via Vercel Dashboard

1. **Import Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" > "Project"
   - Import your GitHub repository

2. **Configure Build Settings**
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

3. **Add Environment Variables**
   - Go to "Settings" > "Environment Variables"
   - Add all required variables
   - Make sure they're available for Production, Preview, and Development

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

#### Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
vercel env add VITE_SUPABASE_PROJECT_ID
```

#### Automatic Deployments

- **Production**: Pushes to `main` branch
- **Preview**: Pull requests
- **Development**: Pushes to other branches

#### Custom Domain

1. Go to "Settings" > "Domains"
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for SSL certificate provisioning

---

### Netlify

#### Via Netlify Dashboard

1. **Import Repository**
   - Go to [Netlify Dashboard](https://app.netlify.com/)
   - Click "Add new site" > "Import an existing project"
   - Connect to GitHub and select repository

2. **Configure Build Settings**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **Add Environment Variables**
   - Go to "Site settings" > "Build & deploy" > "Environment"
   - Add all required variables

4. **Deploy**
   - Click "Deploy site"

#### Via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize
netlify init

# Deploy
netlify deploy --prod

# Set environment variables
netlify env:set VITE_SUPABASE_URL "your-url"
netlify env:set VITE_SUPABASE_PUBLISHABLE_KEY "your-key"
netlify env:set VITE_SUPABASE_PROJECT_ID "your-project-id"
```

#### Netlify Configuration File

Create `netlify.toml` in project root:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

---

### Docker

#### Dockerfile

Create `Dockerfile` in project root:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

Create `nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

#### Building and Running

```bash
# Build image
docker build -t tool-connect-craft .

# Run container
docker run -d -p 80:80 tool-connect-craft

# With docker-compose
docker-compose up -d

# View logs
docker logs -f <container-id>
```

---

### Self-Hosted

#### Using PM2

```bash
# Install dependencies
npm install

# Build application
npm run build

# Install PM2 globally
npm install -g pm2

# Serve with PM2
pm2 serve dist 8080 --name tool-connect-craft

# Save PM2 configuration
pm2 save

# Set up auto-start
pm2 startup
```

#### Using Nginx

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Copy files to web root**
   ```bash
   sudo cp -r dist/* /var/www/html/
   ```

3. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       root /var/www/html;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

4. **Restart Nginx**
   ```bash
   sudo systemctl restart nginx
   ```

#### With Apache

1. **Enable mod_rewrite**
   ```bash
   sudo a2enmod rewrite
   ```

2. **Create `.htaccess`**
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

3. **Copy build files**
   ```bash
   sudo cp -r dist/* /var/www/html/
   ```

---

## Database Setup

### Applying Migrations

#### Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-id

# Push migrations
supabase db push
```

#### Manual Migration

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **SQL Editor**
4. Copy contents of `supabase/migrations/*.sql`
5. Execute the migration

### Seeding Data (Optional)

To add sample connectors:

```sql
-- Insert connectors
INSERT INTO connectors (name, slug, description, category, auth_type, is_active)
VALUES 
  ('GitHub', 'github', 'Manage repositories and issues', 'Development', 'oauth', true),
  ('Gmail', 'gmail', 'Send and receive emails', 'Communication', 'oauth', true);

-- Insert tools
INSERT INTO connector_tools (connector_id, name, description, schema, source)
VALUES 
  ((SELECT id FROM connectors WHERE slug = 'github'), 
   'list_repositories', 
   'List user repositories', 
   '{"type": "object", "properties": {}}',
   'rest');
```

---

## Post-Deployment

### Verify Deployment

1. **Check health**
   ```bash
   curl https://your-domain.com
   ```

2. **Test authentication**
   - Try signing up
   - Try signing in
   - Check session persistence

3. **Test connectors**
   - Browse connectors page
   - Try connecting to a service
   - Execute a tool

### Set Up Monitoring

#### Vercel Analytics

```bash
npm install @vercel/analytics
```

```typescript
// Add to main.tsx
import { Analytics } from '@vercel/analytics/react';

<App />
<Analytics />
```

#### Custom Monitoring

Consider adding:
- Error tracking (Sentry)
- Performance monitoring (New Relic, DataDog)
- Uptime monitoring (Pingdom, UptimeRobot)

### Configure CDN

For static assets:
- Use Cloudflare for global CDN
- Enable caching for assets
- Set up image optimization

---

## Monitoring

### Health Checks

Create `/api/health` endpoint (future):

```typescript
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  });
}
```

### Uptime Monitoring

Services to consider:
- [UptimeRobot](https://uptimerobot.com/) - Free tier available
- [Pingdom](https://www.pingdom.com/)
- [StatusCake](https://www.statuscake.com/)

Configure alerts for:
- Site down
- Response time > 2s
- SSL certificate expiration

---

## Troubleshooting

### Build Failures

**Issue**: Build fails with dependency errors

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Issue**: Environment variables not found

**Solution**:
- Verify all VITE_ prefixed variables are set
- Check deployment platform environment settings
- Rebuild after adding variables

### Runtime Errors

**Issue**: White screen after deployment

**Solution**:
1. Check browser console for errors
2. Verify base URL in `vite.config.ts`
3. Check routing configuration

**Issue**: Supabase connection fails

**Solution**:
1. Verify environment variables
2. Check Supabase project status
3. Verify RLS policies are correct
4. Check CORS settings in Supabase

### Performance Issues

**Issue**: Slow initial load

**Solution**:
- Enable code splitting
- Implement lazy loading
- Use CDN for assets
- Enable gzip compression

**Issue**: Large bundle size

**Solution**:
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
```

---

## Security Checklist

Before going to production:

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Supabase RLS policies tested
- [ ] CORS configured correctly
- [ ] Rate limiting implemented (when available)
- [ ] Security headers configured
- [ ] Dependencies audited (`npm audit`)
- [ ] Secrets rotated
- [ ] Backup strategy in place
- [ ] Monitoring and alerting configured

---

## Rollback Strategy

### Vercel

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

### Netlify

1. Go to "Deploys" tab
2. Find previous successful deploy
3. Click "Publish deploy"

### Docker

```bash
# Tag current version
docker tag tool-connect-craft:latest tool-connect-craft:v1.0

# Rollback to previous version
docker run -d -p 80:80 tool-connect-craft:v0.9
```

---

## Continuous Deployment

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
          VITE_SUPABASE_PROJECT_ID: ${{ secrets.VITE_SUPABASE_PROJECT_ID }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Support

For deployment issues:
- Check [documentation](../README.md)
- Search [GitHub Issues](https://github.com/Krosebrook/tool-connect-craft/issues)
- Ask in [Discussions](https://github.com/Krosebrook/tool-connect-craft/discussions)
