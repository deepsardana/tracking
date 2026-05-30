import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

router.get('/summary', async (_req, res) => {
  const [customerCount, transactions] = await Promise.all([
    prisma.customer.count(),
    prisma.transaction.findMany({ select: { type: true, amount: true } }),
  ]);

  const totalDR = transactions
    .filter((t) => t.type === 'DR')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalCR = transactions
    .filter((t) => t.type === 'CR')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  res.json({
    customerCount,
    totalDR,
    totalCR,
    netBalance: totalDR - totalCR,
  });
});

export default router;
