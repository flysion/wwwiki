function isCallable(argument) {
    let type = typeof argument
    if (argument == null || (type !== 'object' && type !== 'function')) {
        return false
    }

    return typeof argument.call === 'function'
}

export default isCallable;