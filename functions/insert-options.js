const itemOptions = require('./item-options');
const burgerOptions = itemOptions.burgerOptions;
const burgerIngredients = itemOptions.burgerIngredients;
const friesOptions = itemOptions.friesOptions;
const shakeOptions = itemOptions.shakeOptions;
const drinkOptions = itemOptions.drinkOptions;
const optionsTypeMap = itemOptions.optionsTypeMap; 

function insertOptionsToItem(item, newOptionsMap) {
    // This function insert options to an item
    // newOptions: Map of new options for item.category (pre-processed, no duplicate / conflict options)
    let category = item.category;
    let oldOptions = item.options;
    let newOptions = newOptionsMap.get(category) ? newOptionsMap.get(category) : [];
    let categoryOptionsTypeMap = optionsTypeMap.get(category);

    if (item.category == "drink" || item.category == "shake" || item.category == "other") {
        item.options = newOptions;
        return item;
    }

    // Handle special case for burger / fries
    // If conflict, override; if not, append new options to existing ones
    // Cheese case should be handled independently
    let noCheese = newOptions.includes('no cheese');

    if (oldOptions.length == 0) {
        item.options = newOptions;
        return item;
    }

    for (let option of newOptions) {
        if (oldOptions.includes(option)) continue; // option already exists, do nothing

        for (let oldOption of oldOptions) {
            if (oldOption == 'with') continue;
            let index = item.options.indexOf(oldOption);
            let optionType = categoryOptionsTypeMap.get(option);
            let oldOptionType = categoryOptionsTypeMap.get(oldOption);
            if (categoryOptionsTypeMap.get(option) != 'cheese') {
                if (optionType == oldOptionType) {
                    item.options.splice(index, 1);
                }
            }
            else if (noCheese) {
                if (categoryOptionsTypeMap.get(option) == 'cheese') {
                    item.options.splice(index, 1);
                }
            }
            else if (option == 'grilled cheese') {
                if (oldOption == 'cold cheese') {
                    item.options.splice(index, 1);
                }
            }
            else if (option == 'cold cheese') {
                if (oldOption == 'grilled cheese') {
                    item.options.splice(index, 1);
                }
            }
            else {
                let index = item.options.indexOf('no cheese');
                if (index != -1) item.options.splice(index, 1);
                if (!item.options.includes(option)) item.options.push(option);
            }

            if (!oldOptions.includes(option)) {
                item.options.push(option);
            }
        }
    }
    if (noCheese && !item.options.includes('no cheese')) {
        item.options.push('no cheese');
    }

    return item;
}

function getCategoryOption(newOptions, item) {
    // This function separates options to a map that maps [category, available options]
	// item is just used to dintingish burger and fries options
	// will not filter out newOptions
	
    // remove duplicate
    let uniqueOptions = newOptions.filter(function (item, pos) {
        return newOptions.indexOf(item) == pos;
    });

    var categoryOption = new Map();
    for (let option of uniqueOptions) {
        let itemType = getOptionType(option);
        // Work around for "well done" and "anteater style"
        //, which exists in both burger and fries
        if (item != undefined && item.category == 'fries' 
        	&& (option == 'well done' || option == 'anteater style')) {
            itemType = 'fries';
        }
        categoryOption.set(itemType, setOption(categoryOption, itemType, option));
    }

    return categoryOption;
}

function setOption(categoryOption, key, option) {
    // A helper for getCategoryOption()
    if (categoryOption.get(key) == undefined) {
        return [option];
    } else {
        let temp = categoryOption.get(key);
        temp.push(option);
        return temp;
    }
}

function getOptionType(option) {
    // A helper for getCategoryOption()
    if (burgerIngredients.has(option) || burgerOptions.has(option) || option == "with")
        return 'burger';
    else if (friesOptions.has(option))
        return 'fries';
    else if (shakeOptions.has(option))
        return 'shake';
    else if (drinkOptions.has(option))
        return 'drink';
    else 
        return 'ERROR: unknow food type in getOptionType()';
}



function isOptionsConflict(newOptionsMap) {
    for (var key of newOptionsMap.keys()) {
        let availableOptionsTypeMap = optionsTypeMap.get(key);
        newOptions = newOptionsMap.get(key);
        if (key == "drink") { // drink can only has one size
            if (newOptions.length > 1) {
                console.log("Size options for drinks have conflict!");
                return true;
            }
        }
        if (key == "shake") { // can choose multiple falvors for shakes
            console.log("No conflicts in new options for shakes. Proceed.");
            return false;
        }

        let bunsIndex = -1;
        let cookIndex = -1;
        let styleIndex = -1;
        for (let option of newOptions) {
            let category = availableOptionsTypeMap.get(option);
            let hasNoCategory = newOptions.includes("no " + category);
            let hasCategory = ("no " + category) != option;
            if (hasNoCategory && hasCategory) {
                console.log("isOptionsConflict(): No/Add options conflict!");
                return true;
            }
            if (newOptions.includes('cold cheese') && newOptions.includes('grilled cheese')) {
                console.log("isOptionsConflict(): Cold/grilled options conflict!");
                return false;
            }
            if (category == "buns") {
                if (bunsIndex != -1) {
                    console.log("isOptionsConflict(): Buns options conflict!");
                    return true;
                }
                bunsIndex = newOptions.indexOf(option);
            }
            if (category == "cook") {
                if (cookIndex != -1) {
                    console.log("isOptionsConflict(): Cook options conflict!");
                    return true;
                }
                cookIndex = newOptions.indexOf(option);
            }
            if (category == "style") {
                if (styleIndex != -1) {
                    console.log("isOptionsConflict(): Style options conflict!");
                    return true;
                }
                styleIndex = newOptions.indexOf(option);
            }
        }
        // No conflicts in new options. Proceed.
    }
    return false;
}

exports.getCategoryOption = getCategoryOption;
exports.isOptionsConflict = isOptionsConflict;
exports.insertOptionsToItem = insertOptionsToItem;