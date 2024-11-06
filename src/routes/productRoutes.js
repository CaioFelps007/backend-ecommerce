const express = require("express");
const { PrismaClient } = require("@prisma/client");
const multer = require("multer");
const path = require("path");
const prisma = new PrismaClient();

const router = express.Router();

// Configuração do Multer para armazenar imagens no diretório 'uploads'
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Pasta onde as imagens serão armazenadas
  },
  filename: (req, file, cb) => {
    const fileName = Date.now() + path.extname(file.originalname);
    cb(null, fileName); // Nome do arquivo será o timestamp para evitar sobreposição
  },
});

const upload = multer({ storage: storage });

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

// Rota para criar um novo produto (com upload de múltiplas imagens)
router.post("/product", upload.array("photos", 10), async (req, res) => {
  const { name, price } = req.body;

  // Verifica se foram enviadas imagens
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "Nenhuma imagem enviada" });
  }

  // Obter os caminhos das imagens
  const imagePaths = req.files.map((file) => `/uploads/${file.filename}`); // Caminho das imagens no servidor

  try {
    const newProduct = await prisma.product.create({
      data: {
        name,
        price,
        photo: imagePaths[0], // Usar a primeira imagem como 'photo' principal (opcional)
        imagePaths, // Armazenar todas as imagens no campo `imagePaths`
      },
    });
    res.status(201).json(newProduct); // Retorna o produto criado
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    res.status(500).json({ error: "Erro ao criar produto" });
  }
});

// Rota para atualizar um produto existente (com upload de múltiplas imagens)
router.put("/product/:id", upload.array("photos", 10), async (req, res) => {
  const { id } = req.params;
  const { name, price } = req.body;

  // Verifica se foram enviadas imagens
  let imagePaths = [];
  if (req.files && req.files.length > 0) {
    imagePaths = req.files.map((file) => `/uploads/${file.filename}`); // Caminho das imagens no servidor
  }

  try {
    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name,
        price,
        photo: imagePaths.length > 0 ? imagePaths[0] : undefined, // Atualiza a 'photo' se houver novas imagens
        imagePaths: imagePaths.length > 0 ? imagePaths : undefined, // Atualiza o campo `imagePaths` com as novas imagens
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
