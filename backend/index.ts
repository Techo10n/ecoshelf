import express from 'express';
import trimTitleRouter from './trimTitle.ts'; // Use .ts extension for ts-node
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = 8000;

app.use(express.json());
app.use(cors({
  origin: '*', // or be more restrictive
}));
app.use(trimTitleRouter);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});