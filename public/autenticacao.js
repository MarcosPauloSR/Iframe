let token = "";

async function fetchJWT() {
  try {
    const response = await fetch("/generate-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Erro na resposta da requisição: " + response.statusText);
    }

    const data = await response.json();
    token = data.token;

    console.log("Token JWT: ", token);
    await initializeQlik(token); // Chama a função para inicializar o Qlik com o token
  } catch (error) {
    console.error("Erro ao obter o token JWT:", error);
  }
}

async function initializeQlik(token) {
  console.log("Iniciando o Login ao Qlik");
  await login();
  configureQlik();
}

var config = {
  host: "2t54o942nfo22c0.us.qlikcloud.com",
  prefix: "/",
  port: 443,
  isSecure: true,
  webIntegrationId: "F40i3sPExdaLCBM4N33F_Zt2dWH6qs2U",
  jwt: `${token}`,
};

async function login() {
  const response = await fetch(
    `https://${config.host}/login/jwt-session`, //?qlik-web-integration-id=${config.webIntegrationId}`,
    {
      method: "POST",
      credentials: "include",
      mode: "cors",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
        "qlik-web-integration-id": config.webIntegrationId,
      },
      rejectunAuthorized: false,
    }
  );

  console.log("===================");
  console.log('Login: ', await response.text());
  console.log("===================");

  if (response.status !== 200) {
    console.log(await response.text());
    throw new Error("Falha no login via JWT");
  }
}

function configureQlik() {
  require.config({
    baseUrl: `${config.isSecure ? "https://" : "http://"}${config.host}${
      config.port ? ":" + config.port : ""
    }${config.prefix}resources`,
    webIntegrationId: config.webIntegrationId,
  });

  require(["js/qlik"], function (qlik) {
    qlik.on("error", function (error) {
      $("#popupText").append(error.message + "<br>");
      $("#popup").fadeIn(1000);
    });
    $("#closePopup").click(function () {
      $("#popup").hide();
    });

    // Inserir o iframe no documento após a autenticação
    // var iframe = document.createElement("iframe");
    // iframe.style.width = "100%";
    // iframe.style.height = "400px"; // Defina a altura conforme necessário
    // iframe.src = "https://2t54o942nfo22c0.us.qlikcloud.com/single/?appid=73294db6-dfa3-4a33-a52b-142ee73a78d4&sheet=GyjdqzV&theme=horizon&opt=ctxmenu,currsel&select=$::Ano,2024&select=$::Status,Ativo"; // Substitua pela URL correta
    // document.getElementById("iframeContainer").appendChild(iframe); // Certifique-se que "iframeContainer" é o ID do elemento onde o iframe deve ser inserido

  });
}

// Chama a função para gerar o Token de Acesso
fetchJWT();
