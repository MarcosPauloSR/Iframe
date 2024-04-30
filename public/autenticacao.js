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
  host: "dtsqd.us.qlikcloud.com",
  prefix: "/",
  port: 443,
  isSecure: true,
  webIntegrationId: "wwzaTjlPzKb8V7FIOQHLAbJy0T8Lhsl2",
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

    var app = qlik.openApp("fcede786-2ffb-47fa-8f0f-92429e09c30b", config);
    app.visualization.get("02307a04-2de3-48f2-b0e7-28cb78a7a37f").then(function (vis) {
      vis.show("QV01");
    });
    app.visualization.get("AZrTszy").then(function (vis) {
      vis.show("QV02");
    });
  });
}

// Chama a função para gerar o Token de Acesso
fetchJWT();
