// app.config.ts
import 'dotenv/config';

export default {
  expo: {
    name: 'Mumtaz',
    slug: 'mumtaz',
    version: '1.0.0',
    extra: {
      API_URL: process.env.API_URL,
    },
  },
};
