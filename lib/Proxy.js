class Proxy {
    constructor(obj) {
        this.obj = obj;
        this.data = {};
    }

    defineProperty(prop, options) {
        this.data[prop] = this.obj[prop];

        let getter = options && options.get ? options.get : null;
        options.get = () => {
            let value = this.data[prop];
            let newValue = getter ? getter(value) : value;
            return newValue === undefined ? value : newValue;
        };

        let setter = options && options.set ? options.set : null;
        options.set = value => {
            let newValue = setter ? setter(value) : value;
            this.data[prop] = newValue === undefined ? value : newValue;
            if (options.afterSet) options.afterSet(this.data[prop]);
        };

        Object.defineProperty(this.obj, prop, options);
    }
}

export default Proxy;