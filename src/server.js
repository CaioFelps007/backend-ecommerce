const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const productRoutes = require("./routes/productRoutes");
const reviewRoutes = require("./routes/reviewRoutes"); // Importa as rotas de avaliação

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Usar as rotas
app.use("/api", productRoutes); // Prefixo "api" para todas as rotas de produto
app.use("/api", reviewRoutes); // Prefixo "api" para todas as rotas de avaliação

// Rota de teste
app.get("/", (req, res) => {
  res.send("API do E-commerce funcionando!");
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
