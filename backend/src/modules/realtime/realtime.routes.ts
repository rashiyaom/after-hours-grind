import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { subscribeUserEvents } from "../../lib/realtime.js";

const router = Router();

router.get("/stream/events", requireAuth, (req, res) => {
  const userId = req.user!.userId;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  res.write(`event: ready\n`);
  res.write(`data: ${JSON.stringify({ ok: true, at: new Date().toISOString() })}\n\n`);

  const unsubscribe = subscribeUserEvents(userId, (event) => {
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify(event.payload)}\n\n`);
  });

  const heartbeat = setInterval(() => {
    res.write(`: ping ${Date.now()}\n\n`);
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
});

export default router;
