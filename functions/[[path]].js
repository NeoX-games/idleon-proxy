const ORIGIN = "https://www.legendsofidleon.com";

const BLOCKER = `
<script>
(() => {
    const block = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
    };

    window.addEventListener("contextmenu", block, true);
    document.addEventListener("contextmenu", block, true);
})();
</script>
`;

export async function onRequest(context) {
    const requestUrl = new URL(context.request.url);

    let targetPath = requestUrl.pathname;

    // Корень нашего прокси = /ytGl5oc/ оригинального сайта
    if (targetPath === "/") {
        targetPath = "/ytGl5oc/";
    }

    const targetUrl =
        ORIGIN +
        targetPath +
        requestUrl.search;

    const response = await fetch(targetUrl, {
        method: context.request.method,
        headers: context.request.headers,
        body:
            context.request.method === "GET" ||
            context.request.method === "HEAD"
                ? undefined
                : context.request.body,
        redirect: "manual"
    });

    // Если оригинальный сайт пытается сделать редирект
    if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");

        if (location) {
            const redirectUrl = new URL(location, targetUrl);

            // Если IdleOn отправляет /ytGl5oc/ на свою главную,
            // НЕ отдаём этот редирект браузеру.
            if (
                redirectUrl.hostname === "www.legendsofidleon.com" &&
                redirectUrl.pathname === "/"
            ) {
                return new Response(
                    await (await fetch(
                        ORIGIN + "/ytGl5oc/",
                        {
                            headers: context.request.headers
                        }
                    )).text(),
                    {
                        status: 200,
                        headers: {
                            "content-type": "text/html; charset=UTF-8"
                        }
                    }
                );
            }
        }
    }

    const contentType =
        response.headers.get("content-type") || "";

    if (!contentType.includes("text/html")) {
        return response;
    }

    return new HTMLRewriter()
        .on("head", {
            element(element) {
                element.append(BLOCKER, {
                    html: true
                });
            }
        })
        .transform(response);
}
