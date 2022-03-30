
interface IMoneyDragData
{
    value: number;
    elementId: string;
};

function createMoneyElement(value: number, displayValue: number, ...classNames: string[])
{
    const ele = document.createElement("div");

    ele.classList.add("money");
    ele.classList.add(...classNames);
    
    const id = Math.floor(Math.random() * 100000).toString().padStart(6, "0");

    ele.setAttribute("data-drag-id", id);
    ele.setAttribute("data-value-visual", displayValue.toString());
    ele.setAttribute("draggable", "true");

    ele.addEventListener("dragstart", (ev) => 
    {
        ev.dataTransfer.dropEffect = "move";
        ev.dataTransfer.setData("application/json", JSON.stringify({
            value,
            elementId: id,
        } as IMoneyDragData));
    });

    ele.addEventListener("dragend", (ev) =>
    {
        
    });

    return ele;
}

function createMoneyDropArea(cb: (value: number) => boolean, ele: HTMLDivElement = document.createElement("div"), ...classNames: string[])
{
    ele.classList.add("money-drop");
    ele.classList.add(...classNames);

    ele.addEventListener("dragover", (ev) =>
    {
        ev.preventDefault();
    });

    ele.addEventListener("drop", (ev) =>
    {
        ev.preventDefault();
        const data: IMoneyDragData = JSON.parse(ev.dataTransfer.getData("application/json"));
        
        if(cb(data.value) || document.querySelector(`[data-drag-id="${data.elementId}"]`)?.classList.contains("remove"))
        {
            // delete element
            document.querySelector(`[data-drag-id="${data.elementId}"]`)?.remove();
        }

        // console.log(data);
        
    });

    return ele;
}

export {
    createMoneyElement,
    createMoneyDropArea,
}