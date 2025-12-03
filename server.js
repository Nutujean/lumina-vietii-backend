// server.js - Lumina Vietii backend complet cu Stripe

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Stripe from "stripe";

// 🔐 Încarcă variabilele din .env
dotenv.config();

const app = express();

// 🌍 Middleware-uri de bază
app.use(cors());
app.use(express.json());

// 🔑 Variabile de mediu
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://lumina-vietii.ro";

// 💳 Stripe
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  console.log("Stripe key loaded: DA ✔️");
} else {
  console.warn("⚠️ STRIPE_SECRET_KEY nu este setat în .env");
}

// 🗄️ Conectare MongoDB
if (!MONGO_URI) {
  console.warn("⚠️ Lipsă MONGO_URI în .env - backend-ul pornește fără DB!");
} else {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB conectat"))
    .catch((err) =>
      console.error("❌ Eroare la conectarea MongoDB:", err.message)
    );
}

// 🏠 Ruta de bază
app.get("/", (req, res) => {
  res.send("Lumina Vietii backend este online ✅");
});

// 🧪 Test Stripe
app.get("/api/stripe-test", async (req, res) => {
  if (!stripe) {
    return res
      .status(500)
      .json({ ok: false, error: "Stripe nu este configurat (fără cheie)." });
  }

  try {
    const balance = await stripe.balance.retrieve();
    return res.json({ ok: true, balance });
  } catch (err) {
    console.error("Eroare Stripe (test):", err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// 💳 Creare sesiune de plată Stripe
app.post("/api/create-checkout-session", async (req, res) => {
  if (!stripe) {
    return res
      .status(500)
      .json({ error: "Stripe nu este configurat (lipsește STRIPE_SECRET_KEY)" });
  }

  try {
    const { priceId, email } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: "Lipsește priceId" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email || undefined,
      success_url: `${FRONTEND_URL}/plata-succes`,
      cancel_url: `${FRONTEND_URL}/plata-anulata`,
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error("Eroare la create-checkout-session:", err);
    return res
      .status(500)
      .json({ error: "Eroare la crearea sesiunii de plată Stripe" });
  }
});

// 🚀 Pornire server
app.listen(PORT,"0.0.0.0", () => {
  console.log(`✅ Server pornit pe portul ${PORT}`);
});

