import { UUID } from "./uuid.js";

interface ITicketData
{
    uuid: string;
    price: number;
    name: string;
};

class Ticket
{
    private static readonly uuid = new UUID();

    protected readonly _name: string
    protected readonly _price: number;

    constructor(price: number, name: string)
    {
        this._price = price;
        this._name = name;
    }

    private genUUID() { return Ticket.uuid.generateString(); }

    public get price() { return this.price; }
    public get name() { return this._name; }

    public create(): ITicketData
    {
        return {
            uuid: this.genUUID(),
            price: this.price,
            name: this.name,
        };
    }
}

class MoneyCartrige
{
    private _num: number;
    private _max: number;
    private _value: number;

    constructor(value: number, num: number = 10, max: number = 25)
    {
        this._value = value;
        this._num = num;
        this._max = max;
    }

    public get value() { return this._value; }
    public get num() { return this._num; }
    public get fillValue() { return this.value * this.num; }

    check(value: number) { return value == this._value && this._value < this._max; }

    // todo implement error class with data
    insert() { if(this._num >= this._max) { throw new Error(`the ${this._value}ct cartrige is full`); } this._num++; }

    insertIfCorrect(value: number) { if(!this.check(value)) { return false; } this.insert(); return true; }
}

class Printer
{
    private _maxPaper: number;
    private _numPaper: number;

    constructor(numPaper: number, maxPaper: number) 
    {
        this._numPaper = numPaper;
        this._maxPaper = maxPaper;
    }

    print(ticket: ITicketData)
    {
        if(this._numPaper <= 0) { throw new Error("printer out of paper"); }
        this._numPaper--;
        return ticket;
    }

    printStr(ticket: ITicketData)
    {
        const data = this.print(ticket);
        return `${data.name} (${(data.price / 100).toFixed(2)}$)\n${data.uuid}`;
    }
}

class Register
{
    private _cartriges: MoneyCartrige[];

    constructor(...cartriges: MoneyCartrige[])
    {
        this._cartriges = cartriges;
    }

    // todo insertIfCorrect could cause problems when multiple cartriges of same value are used with some implementations for find
    insert(value: number) { return !!this._cartriges.find(v => v.insertIfCorrect(value)); }

    public get totalValue() { return this._cartriges.reduce((pv, cv) => cv.fillValue, 0) }
}

interface IPaymentData
{
    alreadyPayed: number,
    selectedTicket: Ticket,
};

type PayoutCallback = (money: number[]) => void;

class TicketMachine
{
    private _tickets: Ticket[];
    private _register: Register;
    private _printer: Printer;

    private _onPayout: PayoutCallback;

    private _payment?: IPaymentData;

    constructor(payoutCb: PayoutCallback, register: Register, printer: Printer, ...tickets: Ticket[])
    {
        this._onPayout = payoutCb;
        this._register = register;
        this._printer = printer;
        this._tickets = tickets;
    }

    private enshureTicketSelected(selected: boolean) { if((!!this._payment) != selected) { throw new Error(selected ? "no ticket selected" : "ticket already selected"); } }

    select(idx: number)
    {
        this.enshureTicketSelected(false);

        this._payment = {
            alreadyPayed: 0,
            selectedTicket: this._tickets[idx],
        };
    }

    insert(value: number): boolean
    {
        this.enshureTicketSelected(true);
        if(!this._register.insert(value)) { return false; }
        
        this._payment.alreadyPayed += value;
        return true;
    }

    cancel()
    {
        this.enshureTicketSelected(true);


    }

    public get paymentData() { return this._payment; }
}