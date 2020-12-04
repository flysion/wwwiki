window.Markdown = function(options) {
    this.allowEditor = true;
    
    return ($core, back) => {
        back();
    };
};