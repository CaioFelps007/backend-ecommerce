const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer"); // Para lidar com uploads de arquivos
const path = require("path"); // Para manipulação de caminhos de arquivos
const { PrismaClient } = require("@prisma/client"); // Importar o PrismaClient

dotenv.config();

const app = express();
const prisma = new PrismaClient(); // Instanciar o Prisma Client

// Configuração do CORS
app.use(cors());
app.use(express.json());

// Definir onde as imagens enviadas serão salvas
const uploadDirectory = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadDirectory)); // Para servir imagens estáticas

// Configuração do Multer para upload de arquivos (fotos)
// Filtrando os tipos de arquivos aceitos para garantir que só imagens sejam enviadas
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory); // Salvar arquivos na pasta 'uploads'
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + Math.round(Math.random() * 1e9); // Gerar nome único para o arquivo
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`); // Nome do arquivo
  },
});

const fileFilter = (req, file, cb) => {
  // Filtrando tipos de arquivos permitidos: PNG, JPG, JPEG
  const fileTypes = /png|jpg|jpeg/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true); // Aceitar o arquivo
  } else {
    return cb(
      new Error("Somente imagens PNG, JPG ou JPEG são permitidas."),
      false
    ); // Rejeitar o arquivo
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Rota para listar todos os produtos com avaliações
app.get("/api/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        reviews: true, // Inclui as avaliações do produto
      },
    });

    // Mapear os produtos e ajustar o campo 'photo' para enviar o caminho completo da imagem
    const productsWithFullImagePath = products.map((product) => ({
      ...product,
      photo: JSON.parse(product.photo).map(
        (imagePath) => `/uploads/${path.basename(imagePath)}` // Adiciona o prefixo '/uploads/' ao caminho da imagem
      ),
    }));

    res.status(200).json(productsWithFullImagePath); // Retorna a lista de produtos com caminhos completos das imagens
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para buscar um produto específico com avaliações
app.get("/api/product/:id", async (req, res) => {
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

    // Modificar o campo 'photo' para enviar o caminho completo da imagem
    const productWithFullImagePath = {
      ...product,
      photo: JSON.parse(product.photo).map(
        (imagePath) => `/uploads/${path.basename(imagePath)}` // Adiciona o prefixo '/uploads/' ao caminho da imagem
      ),
    };

    res.status(200).json(productWithFullImagePath); // Retorna o produto com o caminho completo da imagem
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para criar um novo produto com upload de imagens
app.post("/api/product", upload.array("photos"), async (req, res) => {
  const { name, price } = req.body;
  const photos = req.files;

  if (!name || !price || !photos || photos.length === 0) {
    return res
      .status(400)
      .json({ error: "Nome, preço e imagem são obrigatórios." });
  }

  // Converte o preço de string para número
  const priceAsFloat = parseFloat(price);
  if (isNaN(priceAsFloat)) {
    return res.status(400).json({ error: "Preço inválido." });
  }

  try {
    // Criar um novo produto com o array de caminhos das imagens em formato JSON
    const newProduct = await prisma.product.create({
      data: {
        name,
        price: priceAsFloat, // Passa o preço como número
        photo: JSON.stringify(photos.map((file) => file.path)), // Armazenar o array de imagens como string JSON
      },
    });

    res.status(201).json(newProduct); // Retorna o produto criado
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    res.status(500).json({ error: "Erro ao criar produto" });
  }
});

// Rota para atualizar um produto existente com upload de novas imagens
app.put("/api/product/:id", upload.array("photos"), async (req, res) => {
  const { id } = req.params;
  const { name, price } = req.body;
  const photos = req.files;

  if (!name || !price) {
    return res.status(400).json({ error: "Nome e preço são obrigatórios." });
  }

  // Converte o preço de string para número
  const priceAsFloat = parseFloat(price);
  if (isNaN(priceAsFloat)) {
    return res.status(400).json({ error: "Preço inválido." });
  }

  try {
    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name,
        price: priceAsFloat,
        photo:
          photos.length > 0
            ? JSON.stringify(photos.map((file) => file.path)) // Atualizar fotos se houver novas
            : undefined,
      },
    });
    res.status(200).json(updatedProduct); // Retorna o produto atualizado
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
});

// Rota para excluir um produto
app.delete("/api/product/:id", async (req, res) => {
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

// Rota de teste
app.get("/", (req, res) => {
  res.send("API do E-commerce funcionando!");
});

// Iniciar o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
