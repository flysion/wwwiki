function loadScript(url, callback) {
    let script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    script.onload = () => {
        if (callback) callback();
    };

    document.getElementsByTagName('head')[0].appendChild(script);
}

export default loadScript;