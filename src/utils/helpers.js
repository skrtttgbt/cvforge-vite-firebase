export const cx = (...classes) => classes.filter(Boolean).join(' ')
export const makeToken = () => crypto.randomUUID().slice(0, 8) + '-' + crypto.randomUUID().slice(0, 4)
