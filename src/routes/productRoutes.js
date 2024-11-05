const express = require("express");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const router = express.Router();

// Rota para listar todos os produtos com avaliações
router.get("/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        reviews: true, // Inclui as avaliações do produto
      },
    });
    res.status(200).json(products); // Retorna a lista de produtos
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para buscar um produto específico com avaliações
router.get("/product/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        reviews: true, // Inclui as avaliações associadas
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    res.status(200).json(product); // Retorna o produto e suas avaliações
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para criar um novo produto
router.post("/product", async (req, res) => {
  const { name, price, photo } = req.body;

  try {
    const newProduct = await prisma.product.create({
      data: {
        name,
        price,
        photo,
      },
    });
    res.status(201).json(newProduct); // Retorna o produto criado
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    res.status(500).json({ error: "Erro ao criar produto" });
  }
});

// Rota para atualizar um produto existente
router.put("/product/:id", async (req, res) => {
  const { id } = req.params;
  const { name, price, photo } = req.body;

  try {
    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name,
        price,
        photo,
      },
    });
    res.status(200).json(updatedProduct); // Retorna o produto atualizado
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
});

// Rota para excluir um produto
router.delete("/product/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.product.delete({
      where: { id: parseInt(id) },
    });
    res.status(200).json({ message: "Produto excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    res.status(500).json({ error: "Erro ao excluir produto" });
  }
});

module.exports = router;
