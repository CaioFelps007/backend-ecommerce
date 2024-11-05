const express = require("express");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const router = express.Router();

// Rota para adicionar uma avaliação a um produto
router.post("/product/:id/review", async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  try {
    const newReview = await prisma.review.create({
      data: {
        rating,
        comment,
        productId: parseInt(id), // Associando a avaliação ao produto
      },
    });
    res.status(201).json(newReview); // Retorna a avaliação criada
  } catch (error) {
    console.error("Erro ao criar avaliação:", error);
    res.status(500).json({ error: "Erro ao criar avaliação" });
  }
});

// Rota para listar todas as avaliações de um produto
router.get("/product/:id/reviews", async (req, res) => {
  const { id } = req.params;

  try {
    const reviews = await prisma.review.findMany({
      where: { productId: parseInt(id) },
    });
    res.status(200).json(reviews); // Retorna as avaliações do produto
  } catch (error) {
    console.error("Erro ao buscar avaliações:", error);
    res.status(500).json({ error: "Erro ao buscar avaliações" });
  }
});

module.exports = router;
