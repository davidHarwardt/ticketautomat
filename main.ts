import { UUID } from "./src/task/uuid.js";
import { createMoneyDropArea, createMoneyElement } from "./src/visual/money.js";


document.body.append(createMoneyElement(10, 10, "money-10ct"));

document.body.append(createMoneyDropArea(v => false));
