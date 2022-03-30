import { Ticket, TicketMachine } from "./src/task/ticketMachine.js";
import { UUID } from "./src/task/uuid.js";
import { createMoneyDropArea, createMoneyElement } from "./src/visual/money.js";

const machine = new TicketMachine(payout, ticket, undefined, undefined, ...Ticket.defaultCollection);

const moneyContainer = document.querySelector(".money-container") as HTMLDivElement;
const moneyInsert = document.querySelector(".coin-side") as HTMLDivElement;
const moneyReturn = document.querySelector(".money-return") as HTMLDivElement;
const screen = document.querySelector(".screen") as HTMLDivElement;
const ticketPrint = document.querySelector(".ticket-print") as HTMLDivElement;

let err: Error = undefined;

function isEuro(ct: number) { return ct >= 100; }
function isCoin(ct: number) { return ct <  500; }
function toEuro(ct: number) { return isEuro(ct) ? (ct / 100) : ct; }

machine.accepts.forEach(v =>
{
    const isEur = isEuro(v), value = toEuro(v), eurClass = isEuro(v) ? "eur" : "ct", coinClass = isCoin(v) ? "coin" : "bill";

    moneyContainer.append(createMoneyElement(v, toEuro(v), `money-${value}${eurClass}`, coinClass));
});

function payout(money: number[])
{
    money.forEach(v =>
    {
        const isEur = isEuro(v), value = toEuro(v), eurClass = isEuro(v) ? "eur" : "ct", coinClass = isCoin(v) ? "coin" : "bill";
    
        moneyReturn.append(createMoneyElement(v, toEuro(v), `money-${value}${eurClass}`, coinClass, "remove"));
    });
}

function ticket(ticket: string)
{
    console.log(ticket);
    ticketPrint.innerHTML = `
        <div class="ticket">${ticket}</div>
    `;
}

createMoneyDropArea(v =>
{
    try
    {
        machine.insert(v);
    }
    catch(ex) { err = ex; }

    update();
    return false;
}, moneyInsert);

createMoneyDropArea(v => false, document.body as HTMLDivElement)

function update()
{
    screen.innerHTML = "";

    const paymentData = machine.paymentData;

    if(err)
    {
        screen.innerHTML = `Error!<br>${err.message}`;
        err = undefined;
        setTimeout(_ => update(), 1000);
        return;
    }

    if(!paymentData)
    {
        screen.innerHTML = `
            Select a Ticket!<hr>
            ${machine.tickets.map((v, i) => `<div class="screen-button" onclick="select(${i})">${v.name} | ${(v.price / 100).toFixed(2) + "€"}</div>`).join("\n")}
        `;
        return;
    }

    screen.innerHTML = `
        Selected: ${paymentData.selectedTicket.name}<hr>
        payed:     ${(paymentData.alreadyPayed / 100).toFixed(2)}€
        remaining: ${(paymentData.remaining / 100).toFixed(2)}€
        <hr>
        <div class="screen-button" onclick="cancel()">cancel</div>
    `;
}

ticketPrint.addEventListener("click", _ => ticketPrint.innerHTML = "");

update();

window["clearReturn"] = _ => moneyReturn.innerHTML = "";
window["select"] = v => { machine.select(v); update(); };
window["cancel"] = v => { machine.cancel(); update(); };