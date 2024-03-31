import { Card, HandRule, ParseError } from "./cards.js";
import { Deck } from "./deck.js";
import { actualRanks, fakeSuits, pokerHands, suits } from "./defs.js";
import { Rendered, htmlElement, inputElement, outputElement, textAreaElement } from "./helpers.js";
function addToInput(input, text) {
    const { value, selectionStart, selectionEnd } = input;
    console.log(`selection: ${selectionStart} ${selectionEnd}`);
    input.value = `${value.slice(0, selectionStart ?? value.length)}${text}${value.slice(selectionEnd ?? value.length)}`;
    input.selectionStart = input.selectionEnd = (selectionStart ?? value.length) + text.length;
    input.dispatchEvent(new InputEvent("input"));
    input.focus();
}
for (const container of document.getElementsByClassName("helperButtons")) {
    const input = inputElement(container.parentElement?.querySelector("input"));
    for (const [letter, symbol] of Object.entries(suits).concat(Object.entries(fakeSuits))) {
        const button = Rendered.html `<button onclick=${() => addToInput(input, symbol)}>${symbol === letter ? symbol : `${symbol} (${letter})`}</button> `;
        container.append(button);
    }
}
const handSizeInput = inputElement("handSize");
const handSpec = inputElement("handSpec");
const output = outputElement("output");
const handList = htmlElement("hands");
const sampleHands = htmlElement("sampleHands");
const jokers = [
    new Card("*", "C"),
    new Card("*", "D"),
];
const deck = Deck.create(["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"], ["C", "D", "H", "S"], ...jokers);
let shuffleDeck = deck.slice().shuffle();
const wilds = new Set(["*"]);
const wildsList = htmlElement("wilds");
const dataText = textAreaElement("data");
function wildsChange(rank, wild) {
    if (wild) {
        wilds.add(rank);
    }
    else {
        wilds.delete(rank);
    }
    deck.set(actualRanks.map(r => wilds.has(r) ? "*" : r), ["C", "D", "H", "S"], ...(wilds.has("*") ? jokers : []));
    shuffleDeck = deck.slice().shuffle();
    recalc();
}
for (const rank of actualRanks) {
    if (!rank)
        continue;
    wildsList.append(Rendered.html `
        <li>
            <label><input type="checkbox" checked=${false} oninput=${function () { wildsChange(rank, this.checked); }}> ${rank}</label>
        </li>`);
}
wildsList.append(Rendered.html `
    <li>
        <label><input type="checkbox" checked=${true} oninput=${function () { wildsChange("*", this.checked); }}> Jokers</label>
    </li>`);
let handSize = handSizeInput.valueAsNumber || 6;
let handRule;
htmlElement("addHand").onclick = () => {
    if (output.value !== handRule?.toString())
        return;
    const name = window.prompt("Name of this hand?");
    if (!name?.trim())
        return;
    handRule.name = name.trim();
    handRules.push(handRule);
    exportData();
    recalc();
};
handSizeInput.oninput = () => {
    handSize = handSizeInput.valueAsNumber || 5;
    recalc();
};
handSpec.oninput = () => {
    if (!handSpec.value) {
        output.value = "";
        return;
    }
    try {
        handRule = HandRule.parseFrom(handSpec.value);
        output.value = handRule.toString();
    }
    catch (e) {
        if (e instanceof ParseError) {
            output.value = `Could not parse hand: ${e.message}`;
        }
        else {
            throw e;
        }
    }
};
dataText.oninput = () => {
    importData();
    recalc();
};
handSpec.oninput(null);
const handRules = [];
const hands = [];
for (const [name, spec] of Object.entries(pokerHands)) {
    handRules.push(HandRule.parseFrom(spec, name));
}
function importData(data = dataText.value) {
    const dataLines = data.split("\n").filter(s => s);
    handRules.length = 0;
    for (const line of dataLines) {
        const [name, spec] = line.split(": ");
        try {
            handRules.push(HandRule.parseFrom(spec, name));
        }
        catch (e) {
            if (e instanceof ParseError) {
                console.error(e.message);
            }
            else {
                throw e;
            }
        }
    }
    localStorage.handRules = data;
    if (dataText.value !== data) {
        dataText.value = data;
    }
}
function exportData() {
    const data = handRules.map(h => `${h.name}: ${h.short()}`).join("\n");
    dataText.value = data;
    localStorage.handRules = data;
}
function recalc() {
    handList.replaceChildren();
    sampleHands.replaceChildren();
    let totalHands = deck.handCount(handSize);
    for (const hand of handRules) {
        hand.frequency = hand.calculateFrequency(deck, handSize);
    }
    handRules.sort((a, b) => a.frequency - b.frequency);
    for (const hand of handRules) {
        // const value = hand.calculateValue(deck);
        const { name, frequency: freq } = hand;
        handList.append(Rendered.html `
        <div>
            <dt>
                <span class="descr">${name} (${hand.short()}):</span>
                <span class="right">${freq.toLocaleString()}</span>
                <span>in ${totalHands.toLocaleString()} =</span>
                <span>${(freq * 100 / totalHands).toLocaleString(undefined, { minimumSignificantDigits: 3, maximumSignificantDigits: 3 })}%</span>
                <span class="center">=</span>
                <span class="right">${(totalHands / freq - 1).toLocaleString(undefined, { maximumFractionDigits: 1 })}:1</span>
            </dt>
            <dd>${hand}</dd>
        </div>`);
        hand.ruleElement = htmlElement(handList.lastElementChild);
    }
    hands.splice(0, Infinity, ...shuffleDeck.dealHands(handSize));
    for (const hand of hands) {
        sampleHands.append(Rendered.html `
            <li>${hand.short()}: ${handRules.filter(r => hand.handMatches(r)).map(r => r.name).join(", ")}</li>`);
    }
}
if (localStorage.handRules?.trim()) {
    importData(localStorage.handRules);
}
else {
    exportData();
}
recalc();
Object.assign(self, { handSpec, output, hands, handRules, deck, exportData, importData, recalc });
//# sourceMappingURL=main.js.map