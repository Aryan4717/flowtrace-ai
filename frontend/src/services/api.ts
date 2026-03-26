import axios from 'axios';

const baseURL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3001');

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.warn(
    '[FlowTrace] VITE_API_URL is not set. Set it in Vercel (Production) to your Railway API URL (e.g. https://xxx.up.railway.app).'
  );
}

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});
