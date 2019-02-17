const productMap = new Map([
    ["eat", "We have hamburger, cheeseburger, MCS burger, fries, and shake with different ingredient options. Which one do you want?"],
    ["drink", "We have coke, root beer, 7-up, lemonade, dr pepper, iced tea, milk, cocoa, and coffee. What would you like to have?"],
]);

const ingredientMap = new Map([
    ['hamburger', 'A hamburger includes toasted buns, 1 beef patty, onions, lettuce, tomato, pickles, and spread.'],
    ['cheeseburger', 'A cheeseburger includes toasted buns, 1 cheese slice, 1 beef patty, onions, lettuce, tomato, pickles, and spread.'],
    ['MCS', 'A MCS burger includes toasted buns, 2 cheese slices, 2 beef patties, onions, lettuce, tomato, pickles, and spread.'],
    ['fries', 'Fries is made of fresh potatoes.'],
    ['combo', 'A combo consists of a burger, an order of fries and 1 medium drink.'],
    ['hamburger combo', ' A combo consists of a hamburger, an order of fries and 1 medium drink.'],
    ['cheeseburger combo', 'A cheeseburger combo consists of a hamburger, an order of fries and 1 medium drink.'],
    ['MCS combo', 'A MCS burger combo consists of a MCS burger, an order of fries and 1 medium drink.'],
    ['shake', 'A shake is made of real ice cream.']
]);

const { orderPrice } = require('./order-price');

const optionMap = new Map([
    ['burger', 'We have hamburger, cheeseburger and MCS burger.'],
    ['hamburger', 'You can customized your hamburger with options such as no/more onion/lettuce/tomato/pickle...  We provide lots of options for you. Please check our menu.'],
    ['cheeseburger', 'You can customized your cheeseburger with options such as no/more onion/lettuce/tomato/pickle...  We provide lots of options for you. Please check our menu.'],
    ['MCS burger', 'You can customized your MCS burger with options such as no/more onion/lettuce/tomato/pickle...  We provide lots of options for you. Please check our menu.'],
    ['shake', 'You can choose chocolate, vanilla or strawberry flavor for your shake.'],
    ['fries', 'You can have your fries cooked well done/light well, add cheese, or make it anteater style.'],
    ['coke', 'For coke we provide 4 sizes: small, medium, large and extra large.'],
    ['7-up', 'For 7-up we provide 4 sizes: small, medium, large and extra large.'],
    ['lemonade', 'For lemonade we provide 4 sizes: small, medium, large and extra large.'],
    ['dr pepper', 'For dr pepper we provide 4 sizes: small, medium, large and extra large.'],
    ['iced tea', 'For iced tea we provide 4 sizes: small, medium, large and extra large.'],
    ['root beer', 'For root beer we provide 4 sizes: small, medium, large and extra large.'],
    ['drinks', 'For drinks we provide 4 sizes: small, medium, large and extra large; milk, coca, and coffee are one-size.'],
]);

const haveMap = new Map([
    // what [combo] do you have?
    ['combo', 'We have hamburger combo, cheeseburger combo, and MCS burger combo.'],
    ['burger', 'We have hamburger, cheeseburger, and MCS burger.'],
    ['shake', 'We have 3 flavors for you to choose: chocolate, strawberry, and vanilla.'],
    ["drink", "We have coke, root beer, 7-up, lemonade, dr pepper, iced tea, milk, cocoa, and coffee. What would you like to have?"],
    // do you have [hamburger]?
    ['hamburger', 'Yes, we do.'],
    ['cheeseburger', 'Yes, we do.'],
    ['MCS burger', 'Yes, we do.'],
    ['fries', 'Yes, we do.'],
    ['coke', 'Yes, we do.'],
    ['7-up', 'Yes, we do.'],
    ['lemonade', 'Yes, we do.'],
    ['dr pepper', 'Yes, we do.'],
    ['iced tea', 'Yes, we do.'],
    ['root beer', 'Yes, we do.'],
    ['milk', 'Yes, we do.'],
    ['cocoa', 'Yes, we do.'],
    ['coffe', 'Yes, we do.'],
    ['shake', 'Yes, we do.'],
    ['chocolate shake', 'Yes, we do.'],
    ['vanilla shake', 'Yes, we do.'],
    ['strawberry shake', 'Yes, we do.'],
]);

const { parseItem } = require('./parse-item');

exports.queryInfo = function(queryType, item) {
    let response;
    // customer need (eat, drink)
    if (queryType == 'eat' || queryType == 'drink') {
        return productMap.get(queryType);
    }

    // handle drinks, combos -> to drink, combo
    let length = item.length;
    if (item.charAt(length - 1) == 's' && item != 'fries') {
        item = item.slice(0, length - 1);
    }
    // product attribute (ingredient, price, option, pic, have)
    // will have a specified item
    if (queryType == 'ingredient') {
        response = ingredientMap.get(item);
    }
    else if (queryType == 'price') {
        // [item] must includes food item to calculate price
        let obj = parseItem(item);
        response = 'It\'s ' + orderPrice([obj]) + ' dollars after tax.';
    }
    else if (queryType == 'option') {
        response = optionMap.get(item);
    }
    else if (queryType == 'have') { // what burgers/shakes/drinks do you have
        let fallback = 'Sorry, we don\'t have that.';
        response = haveMap.get(item) ? haveMap.get(item) : fallback;
    }

    return response;
}