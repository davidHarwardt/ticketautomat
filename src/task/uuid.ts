

class UUID
{
    private static SHUFFLE_ARRAY = new Array(24).fill(0).map((v, i) => (i + 5) % 24)

    private _value: number;

    constructor(startValue: number = 0)
    {
        this._value = startValue;
    }

    public generate() { return ++this._value; }

    public generateString()
    {
        const val = this.generate();
        return UUID.SHUFFLE_ARRAY.reduce((pv, cv, ci) => { return pv | (((val >> cv) & 0x01) << cv); }, 0x00).toString().padStart(16, "0").substring(0, 16);
    }
}

export {
    UUID,
};