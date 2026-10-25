# MoneyMap: frontend

The React + Vite client for MoneyMap. See the [main README](../README.md) for what the app does, how it's built and how to deploy it.

```bash
npm install
echo "VITE_API_URL=http://localhost:3000/api" > .env.local
npm run dev     # http://localhost:5173
npm test        # unit tests (Vitest)
npm run lint
npm run build   # production build in dist/
```

`VITE_API_URL` points the app at the backend API. In production it's set in Vercel's environment variables.
