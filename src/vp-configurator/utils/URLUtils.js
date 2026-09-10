export class URLUtils {
    static encodeState(state) {
        const json = JSON.stringify(state);
        const base64 = btoa(json);
        const url = new URL(window.location.href);
        url.searchParams.set('s', base64);
        return url.toString();
    }

    static decodeState() {
        const params = new URLSearchParams(window.location.search);
        const base64 = params.get('s');
        if (!base64) return null;
        try {
            const json = atob(base64);
            return JSON.parse(json);
        } catch (e) {
            console.error("Failed to decode state from URL", e);
            return null;
        }
    }
}
