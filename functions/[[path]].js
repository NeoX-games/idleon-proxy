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

    const targetUrl =
        ORIGIN +
        requestUrl.pathname +
        requestUrl.search;

    const response = await fetch(targetUrl, {
        method: context.request.method,
        headers: context.request.headers,
        redirect: "manual"
    });

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
