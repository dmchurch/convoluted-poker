export const Rendered = {
    /**
     * Creates a {@link DocumentFragment} representing the given interpolated HTML string. If the initial backtick is followed
     * immediately by a newline, all initial whitespace is ignored (rather than being rendered as a text node). DOM properties
     * of HTML elements can be set by having an interpolation immediately follow a property name with an equals sign. Thus,
     *
     * ```
     * Rendered.html`<input value="${5}">`
     * ```
     *
     * will set the HTML attribute "value" to "5", but
     *
     * ```
     * Rendered.html`<input value=${5}>`
     * ```
     *
     * will set the DOM property `.value` to 5. This is especially useful for event handler properties.
     *
     * If the string contains only a single element and you would like to have the {@link Element} rather than a {@link DocumentFragment}, just access `.firstElementChild`.
     */
    html(strings, ...exprs) {
        const propAssignmentRegex = /(?<=\s+)(\w+)=$/;
        const rawStrings = [...strings.raw];
        if (strings.raw[0][0] === '\n' || strings.raw[0][0] === '\r') { // if this starts with an explicit linebreak, strip early whitespace
            rawStrings[0] = rawStrings[0].trimStart();
        }
        const propertiesToSet = [];
        for (const [i, string] of rawStrings.entries()) {
            const matches = propAssignmentRegex.exec(string);
            if (matches) {
                const propIdx = propertiesToSet.length;
                propertiesToSet.push({ name: matches[1], value: exprs[i] });
                rawStrings[i] = string.replace(propAssignmentRegex, "");
                exprs[i] = `data-rendered-prop-to-set data-rendered-prop-idx-${propIdx}="${propIdx}"`;
            }
        }
        let htmlString = String.raw({ raw: rawStrings }, ...exprs);
        if (htmlString[0] === '\n' || htmlString[0] === '\r') { // if this starts with a linebreak, strip early whitespace
            htmlString = htmlString.trimStart();
        }
        const template = document.createElement("template");
        template.innerHTML = htmlString;
        for (const elem of template.content.querySelectorAll("[data-rendered-prop-to-set]")) {
            elem.removeAttribute("data-rendered-prop-to-set");
            for (const attr of Array.from(elem.attributes)) {
                if (attr.name.startsWith("data-rendered-prop-idx-")) {
                    const setProp = propertiesToSet[parseInt(attr.value)];
                    elem.removeAttributeNode(attr);
                    if (setProp) {
                        elem[setProp.name] = setProp.value;
                    }
                }
            }
        }
        return template.content;
    },
    css(strings, ...exprs) {
        const cssString = String.raw(strings, ...exprs);
        const stylesheet = new CSSStyleSheet();
        stylesheet.replaceSync(cssString);
        return stylesheet;
    },
};
export const typedEntries = Object.entries;
export const strictTypedEntries = Object.entries;
export const typedKeys = Object.keys;
export const fromTypedEntries = Object.fromEntries;
export const fromStrictTypedEntries = Object.fromEntries;
export const tuple = Array.of;
export const strictTuple = Array.of;
export function getElement(elementOrId, expectedClass, throwIfMissing = true, warnIfMissing = true) {
    const expectedClasses = Array.isArray(expectedClass) ? expectedClass : [expectedClass];
    const element = typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;
    for (const expected of expectedClasses) {
        if (element instanceof expected)
            return element;
    }
    if (warnIfMissing) {
        console.warn("Expected element missing or wrong type!", elementOrId, expectedClass, element);
    }
    if (throwIfMissing) {
        throw new Error(`Expected to find element of type ${expectedClasses.map(c => c.name).join("|")} with ${elementOrId}, instead found ${element}!`);
    }
    return undefined;
}
export function htmlElement(elementOrId, throwIfMissing = true, warnIfMissing = true) {
    return getElement(elementOrId, HTMLElement, throwIfMissing, warnIfMissing);
}
export function inputElement(elementOrId, throwIfMissing = true, warnIfMissing = true) {
    return getElement(elementOrId, HTMLInputElement, throwIfMissing, warnIfMissing);
}
export function textAreaElement(elementOrId, throwIfMissing = true, warnIfMissing = true) {
    return getElement(elementOrId, HTMLTextAreaElement, throwIfMissing, warnIfMissing);
}
export function selectElement(elementOrId, throwIfMissing = true, warnIfMissing = true) {
    return getElement(elementOrId, HTMLSelectElement, throwIfMissing, warnIfMissing);
}
export function meterElement(elementOrId, throwIfMissing = true, warnIfMissing = true) {
    return getElement(elementOrId, HTMLMeterElement, throwIfMissing, warnIfMissing);
}
export function outputElement(elementOrId, throwIfMissing = true, warnIfMissing = true) {
    return getElement(elementOrId, HTMLOutputElement, throwIfMissing, warnIfMissing);
}
export function memoize(object, property, value, writable = false, enumerable = false) {
    Object.defineProperty(object, property, { value, configurable: true, writable, enumerable });
    return value;
}
export function factorial(n, min = 2) {
    let total = 1;
    while (n >= min) {
        total *= n--;
    }
    return total;
}
export function nCr(n, r) {
    return factorial(n, Math.max(r, n - r) + 1) / factorial(Math.min(r, n - r));
}
Object.assign(self, {
    typedKeys, typedEntries, htmlElement, inputElement, outputElement, factorial, nCr,
});
//# sourceMappingURL=helpers.js.map