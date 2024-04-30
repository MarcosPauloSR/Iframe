const express = require("express");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const uid = require("uid-safe");
const { Pool } = require('pg');

const app = express();

app.use(express.json());
app.use(express.static("public"));

// Configuração do pool de conexão
const pool = new Pool({
  host: 'postgresql-170851-0.cloudclusters.net',
  port: 10011,
  user: 'estadao',
  password: 'estadao123',
  database: 'estadao_teste'
});

// Gera o token JWT para acesso sem login ao Qlik
app.post("/generate-token", async (req, res) => {
  let privateKey = fs.readFileSync("./public/privatekey.pem", "utf8");
  
  try {
    const client = await pool.connect(); // Obtém uma conexão do pool
    const query = 'SELECT nome, email FROM public.usuarios WHERE id = $1;'; // Substitua $1 pelo ID do usuário desejado
    const userId = 2; // Exemplo: ID do usuário
    const dbResult = await client.query(query, [userId]); // Executa a query
    const userName = dbResult.rows[0].nome.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); // Obtém o nome do usuário do banco de dados
    const email = dbResult.rows[0].email; // Obtém o nome do usuário do banco de dados
    client.release(); // Libera a conexão de volta ao pool

    const payload = {
      jti: uid.sync(32),
      sub: `${userName}`, // Usuário obtido do banco de dados
      subType: "user",
      name: `${userName}`,
      email: `${email}`,	
      email_verified: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
      nbf: Math.floor(Date.now() / 1000),
      iss: "pu5thqmnfyno428.us.qlikcloud.com",
      aud: "qlik.api/login/jwt-session",
      groups: [
        "Analytics Admin",
        "Data Admin",
        "Data Space Creator",
        "Developer",
        "Managed Space Creator",
        "Shared Space Creator",
        "Tenant Admin",
      ],
    };

    const options = {
      keyid: "02dcf10d-59f1-4b40-93bc-863a83bff7ac",
      algorithm: "RS256",
    };

    let token = jwt.sign(payload, privateKey, options);
    res.json({ token });

    console.log('===================================')
    console.log('Logado no usuário: ', userName, ' | Email: ', email);
  } catch (error) {
    console.error("Erro ao gerar JWT ou consultar o banco de dados:", error.message);
    res.status(500).send("Erro ao gerar token ou acessar dados");
  }
});

// const port = process.env.PORT || 3000;
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
