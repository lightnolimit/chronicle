export interface Env {
  AGENT_URL: string;
  FRONTEND_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const hostname = url.hostname;

    let targetUrl: string;

    if (hostname === "api.chronicle.sh") {
      targetUrl = `${env.AGENT_URL}${url.pathname}${url.search}`;
    } else if (hostname === "app.chronicle.sh") {
      targetUrl = `${env.FRONTEND_URL}${url.pathname}${url.search}`;
    } else {
      return new Response("Not Found", { status: 404 });
    }

    const headers = new Headers(request.headers);
    headers.set("Host", url.hostname);
    headers.delete("cf-connecting-ip");
    headers.delete("x-forwarded-for");
    headers.delete("x-real-ip");

    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
      redirect: "follow",
    });

    try {
      const response = await fetch(proxyRequest);
      
      const responseHeaders = new Headers(response.headers);
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.delete("cf-ray");
      responseHeaders.delete("x-served-by");
      responseHeaders.delete("x-cache");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      return new Response(`Proxy error: ${error}`, { status: 502 });
    }
  },
};
