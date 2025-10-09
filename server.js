import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Conectare la MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectat la MongoDB"))
  .catch((err) => console.error("❌ Eroare MongoDB:", err));

// ✅ Model utilizator (pentru Premium)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  isPremium: { type: Boolean, default: false },
});

const User = mongoose.model("User", userSchema);

// ✅ Setare / actualizare Premium
app.post("/api/users/premium", async (req, res) => {
  try {
    const { email, isPremium } = req.body;
    if (!email) return res.status(400).json({ error: "Email lipsă" });

    const user = await User.findOneAndUpdate(
      { email },
      { isPremium },
      { new: true, upsert: true }
    );

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Verificare Premium
app.get("/api/users/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    res.json({ isPremium: user?.isPremium || false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Pornire server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server Premium pornit pe portul ${PORT}`));
