//define the menu
//need to specify food kind: burger, combo, shake

const itemMap = new Map([["combo", "combo"],
["hamburger", "burger"],
["cheeseburger", "burger"],
["MCS", "burger"],
["burger", "burger"],
["fries", "fries"],
["shake", "shake"],
["milk", "other"],
["coffee", "other"],
["cocoa", "other"],
["water", "other"],
["drink", "drink"],
["coke", "drink"],
["root beer", "drink"],
["dr pepper", "drink"],
["7-up", "drink"],
["lemonade", "drink"],
["iced tea", "drink"]]);

const comboOptions = new Set(["hamburger",
    "cheeseburger",
    "MCS"]);

const burgerOptions = new Set([
    "medium rare",
    "well done",
    "cut in half",
    "anteater style"]);

const burgerIngredients = new Set(["more tomato", "no tomato",
    "more cheese", "no cheese",
    "more onion", "no onion",
    "more veggie", "no veggie",
    "more lettuce", "no lettuce",
    "more pickle", "no pickle",
    "more salt", "no salt",
    "more meat", "no meat",
    "extra toasted buns", "lightly toasted buns", "untoasted buns",
    "cold cheese", "grilled cheese",
    "mustard", "ketchup"
]);

const friesOptions = new Set(["anteater style", "cheese", "well done", "light well"]);
const shakeOptions = new Set(["chocolate", "strawberry", "vanilla"]);
const drinkOptions = new Set(["small", "medium", "extra large", "large"]);
const otherOptions = new Set([]);
const optionMap = new Map([["combo", comboOptions], ["burger", burgerOptions], ["fries", friesOptions], ["shake", shakeOptions], ["drink", drinkOptions], ["other", otherOptions]]);

const burgerOptionsTypeMap = new Map([
    ["with", "with"],
    // Tomato
    ["more tomato", "tomato"],
    ["no tomato", "tomato"],
    // Cheese
    ["no cheese", "cheese"],
    ["more cheese", "cheese"],
    ["cold cheese", "cheese"],
    ["grilled cheese", "cheese"],
    // Onion
    ["more onion", "onion"],
    ["no onion", "onion"],
    // Veggie
    ["more veggie", "veggie"],
    ["no veggie", "veggie"],
    // Lettuce
    ["more lettuce", "lettuce"],
    ["no lettuce", "lettuce"],
    // Pickle
    ["more pickle", "pickle"],
    ["no pickle", "pickle"],
    // Salt
    ["more salt", "salt"],
    ["no salt", "salt"],
    // Meat
    ["more meat", "meat"],
    ["no meat", "meat"],
    // Buns
    ["extra toasted buns", "buns"],
    ["lightly toasted buns", "buns"],
    ["untoasted buns", "buns"],
    // Others
    ["mustard", "mustard"],
    ["ketchup", "ketchup"],
    // Cook
    ["medium rare", "cook"],
    ["well done", "cook"],
    // Cut
    ["cut in half", "cut"],
    // style
    ["anteater style", "style"],
]);


const friesOptionsTypeMap = new Map([
    ["anteater style", "style"],
    ["cheese", "style"],
    ["well done", "cook"],
    ["light well", "cook"]
]);

const drinkOptionsTypeMap = new Map([
    ["small", "size"],
    ["medium", "size"],
    ["large", "size"],
    ["extra large", "size"]
]);

const shakeOptionsTypeMap = new Map([
    ["chocolate", "chocolate"],
    ["strawberry", "strawberry"],
    ["vanilla", "vanilla"]
]);

const optionsTypeMap = new Map([
    ['burger', burgerOptionsTypeMap],
    ['fries', friesOptionsTypeMap],
    ['drink', drinkOptionsTypeMap],
    ['shake', shakeOptionsTypeMap]
]);

module.exports = {
    burgerOptions: burgerOptions,
    itemMap: itemMap,
    comboOptions: comboOptions,
    burgerIngredients: burgerIngredients,
    friesOptions: friesOptions,
    shakeOptions: shakeOptions,
    drinkOptions: drinkOptions,
    otherOptions: otherOptions,
    optionMap: optionMap,
    burgerOptionsTypeMap: burgerOptionsTypeMap,
    friesOptionsTypeMap: friesOptionsTypeMap,
    drinkOptionsTypeMap: drinkOptionsTypeMap,
    shakeOptionsTypeMap: shakeOptionsTypeMap,
    optionsTypeMap: optionsTypeMap
}
