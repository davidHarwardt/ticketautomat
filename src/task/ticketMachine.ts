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

    public static get defaultCollection() { return [new Ticket(170, "Reduced"), new Ticket(250, "Regular"), new Ticket(580, "1 Day")] }

    constructor(price: number, name: string)
    {
        this._price = price;
        this._name = name;
    }

    private genUUID() { return Ticket.uuid.generateString(); }

    public get price() { return this._price; }
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

    public static get defaultCollection()
    {
        return [
            new MoneyCartrige(1),       new MoneyCartrige(2),       new MoneyCartrige(5),
            new MoneyCartrige(10),      new MoneyCartrige(20),      new MoneyCartrige(50),
            new MoneyCartrige(100),     new MoneyCartrige(200),     new MoneyCartrige(500),
            new MoneyCartrige(1000),    new MoneyCartrige(2000),    new MoneyCartrige(5000),
        ];
    }

    constructor(value: number, num: number = 10, max: number = 25)
    {
        this._value = value;
        this._num = num;
        this._max = max;
    }

    public get value() { return this._value; }
    public get num() { return this._num; }
    public get fillValue() { return this.value * this.num; }

    check(value: number) { return value == this._value && this._num < this._max; }

    // todo implement error class with data
    insert() { if(this._num >= this._max) { throw new Error(`the ${this._value}ct cartrige is full`); } this._num++; }

    take(): boolean { if(this._num > 0) { this._num--; return true; } return false; }

    insertIfCorrect(value: number) { if(!this.check(value)) { return false; } console.log("insert", this.value); this.insert(); return true; }
}

class Register
{
    private _cartriges: MoneyCartrige[];

    public static get default() { return new Register(...MoneyCartrige.defaultCollection); }

    constructor(...cartriges: MoneyCartrige[])
    {
        this._cartriges = cartriges;
    }

    // todo insertIfCorrect could cause problems when multiple cartriges of same value are used with some implementations for find
    insert(value: number) { return !!this._cartriges.find(v => v.insertIfCorrect(value)); }

    canRepay(value: number): boolean { return this.totalValue > value; }

    public repay(returnValue: number): number[]
    {
        const res: number[] = [];

        let remainingSum = returnValue;

        const sortedCartriges = this._cartriges.sort((a, b) => a.value - b.value).reverse();

        while(remainingSum > 0)
        {
            let beforeIter = remainingSum;

            cartrigeLoop: for(let i = 0; i < sortedCartriges.length; i++)
            {
                if((sortedCartriges[i].value <= remainingSum) && sortedCartriges[i].take())
                {
                    res.push(sortedCartriges[i].value);
                    remainingSum -= sortedCartriges[i].value;
                    break cartrigeLoop;
                }
            }

            if(remainingSum === beforeIter) throw new Error("cant repay");
        }

        return res;
    }

    public get totalValue() { return this._cartriges.reduce((pv, cv) => pv + cv.fillValue, 0) }
    public get accepts() { return this._cartriges.map(v => v.value); }
}

class Printer
{
    private _maxPaper: number;
    private _numPaper: number;

    public static get default() { return new Printer(25); }

    constructor(numPaper: number, maxPaper: number = numPaper) 
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

interface IPaymentData
{
    alreadyPayed: number,
    selectedTicket: Ticket,
};

type PayoutCallback = (money: number[]) => void;
type TicketCallback = (ticket: string) => void;

class TicketMachine
{
    private _tickets: Ticket[];
    private _register: Register;
    private _printer: Printer;

    private _onPayout: PayoutCallback;
    private _onTicket: TicketCallback;

    private _payment?: IPaymentData;

    constructor(payoutCb: PayoutCallback, ticketCb: TicketCallback, register: Register = Register.default, printer: Printer = Printer.default, ...tickets: Ticket[])
    {
        this._onPayout = payoutCb;
        this._onTicket = ticketCb;
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

        if(this._payment.alreadyPayed >= this._payment.selectedTicket.price)
        {
            // print ticket
            

            let repayment: number[];
            try
            {
                repayment = this._register.repay(this._payment.alreadyPayed - this._payment.selectedTicket.price);
                this._onTicket(this._printer.printStr(this._payment.selectedTicket.create()));
            }
            catch(ex)
            { 
                // repay full ammount if ticket or repayment fails
                console.error(ex);
                repayment = this._register.repay(this._payment.alreadyPayed);
            }
            finally { this._onPayout(repayment); }

            this._payment = undefined;
        }

        return true;
    }

    cancel()
    {
        this.enshureTicketSelected(true);

        const repayment = this._register.repay(this._payment.alreadyPayed);

        this._onPayout(repayment);

        this._payment = undefined;
    }

    public get paymentData() { if(this._payment) return { ...(this._payment), remaining: this._payment.selectedTicket.price - this._payment.alreadyPayed }; }
    public get accepts() { return this._register.accepts; }
    public get tickets() { return this._tickets; }
}

export {
    TicketMachine,
    Ticket,
};