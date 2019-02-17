// Copyright 2017, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Dialogflow fulfillment getting started guide:
// https://dialogflow.com/docs/how-tos/getting-started-fulfillment

'use strict';

const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion, Image } = require('dialogflow-fulfillment');
const { parseItem } = require('./parse-item');
const { printItems } = require('./print-items');
const { queryInfo } = require('./product-info');
const { getCategoryOption, isOptionsConflict, insertOptionsToItem } = require('./insert-options');
const { orderPrice } = require('./order-price');
const { wordsToNumbers } = require('words-to-numbers');
const https = require('https');
const omsUrl = "https://liyutongordermanagementsystem.herokuapp.com/getOrder/";
const itemLimit = 50;
const orderLimit = 10;
const wordDict = require('./word-dictionary');
const wordMap = wordDict.wordMap;
const comboComps = new Set(["burger", "fries", "drink"]);

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  // console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  // console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  function welcome(agent) {
    agent.add(getWelcomeStr());
  }

  function fallback(agent) {
    agent.add(`Sorry, could you say that again?`);
  }

  function addItem(agent) {
    let obj = createItemObject(agent.parameters.allItem, agent.parameters.itemAmount, 1);
    if (obj.category == "drink" && obj.options.length == 0) obj.options.push("medium"); //medium by default
    console.log(obj);
    let SF = initSlotFilling();
    let allItems = getOldItems(agent);
    let length = allItems.length;
    if (length > 0 && allItems[length - 1].name == obj.name && isIncludedIn(obj.options, allItems[length - 1].options)) {
      allItems[length - 1].amount = allItems[length - 1].amount + obj.amount;
    }
    else if (!detectSlots(SF, obj)) allItems.push(obj);
    let newItems = resetOrderContext(agent, allItems);
    setDeliveryMethod(agent, agent.parameters.deliveryMethod);
    
    if (fillSlots(agent, SF)) return;
    
    if (checkEmptyOrder(agent, newItems)) return;
    confirmAllItems(agent, newItems);
  }

  function placeOrder(agent) {
    let items = agent.parameters.allProduct; //items are an array of pure strings
    let itemObjects = []; //itemObjects are an array of item objects
    let SF = initSlotFilling();
    
    let replaceItemParams = getContextParams(agent, 'replaceitem');
    let isReplacingItem = replaceItemParams ? replaceItemParams.replaceitem : false;
    for (let item of items) {
      let obj = parseItem(item); //return a js object
      if (obj.category == "drink" && obj.options.length == 0) obj.options.push("medium"); //medium by default
      console.log(obj);
      if (!detectSlots(SF, obj)) itemObjects.push(obj);
    }
    let allItems = getOldItems(agent);
    let clarifyItems = false;
    let itemsToClarify = [];
    let length = allItems.length;
    if (length > 0) {
      for (let itemObject of itemObjects) {
        //if the same name but different options => clarify
        if (itemObject.name != "combo"
          && itemObject.name == allItems[length - 1].name
          && !arraysEqual(itemObject.options, allItems[length - 1].options)) {
          clarifyItems = true;
          itemsToClarify.push(itemObject);
        }
        else {
          if (isReplacingItem) {
            itemObject.amount = allItems[length - 1].amount;
            allItems[length - 1] = itemObject;
            deleteContext(agent, 'replaceitem');
          }
          else {
            allItems.push(itemObject);
          }
        }
      }
    }
    else allItems.push.apply(allItems, itemObjects);
    let newItems = resetOrderContext(agent, allItems);
    setDeliveryMethod(agent, agent.parameters.deliveryMethod);

    if (clarifyItems) {
      let clarifyParams = { clarifyitems: itemsToClarify };
      setContext(agent, 'clarifyitems', 5, clarifyParams);
      agent.add("Would you like to modify your " + itemsToClarify[0].name
        + " or add " + itemsToClarify[0].amount + " more " + itemsToClarify[0].name
        + ((itemsToClarify[0].name != "fries" && itemsToClarify[0].amount > 1) ? "s" : "") + "?");
    }

    if (clarifyItems || fillSlots(agent, SF)) return;

    if (checkEmptyOrder(agent, newItems)) return;
    confirmAllItems(agent, newItems);
  }

  function placeOrderAdd(agent) {
    let clarifyContext = agent.getContext('clarifyitems');
    let itemsToClarify = clarifyContext.parameters.clarifyitems;
    console.log(printItems(itemsToClarify));
    deleteContext(agent, 'clarifyitems');
    let allItems = getOldItems(agent);
    allItems.push.apply(allItems, itemsToClarify);
    let newItems = resetOrderContext(agent, allItems);
    if (checkEmptyOrder(agent, newItems)) return;
    confirmAllItems(agent, newItems);
  }

  function placeOrderModify(agent) {
    let clarifyContext = agent.getContext('clarifyitems');
    let itemsToClarify = clarifyContext.parameters.clarifyitems;
    console.log(printItems(itemsToClarify));
    deleteContext(agent, 'clarifyitems');
    let allItems = getOldItems(agent);
    let length = allItems.length;
    if (length < 1) {
      allItems.push.apply(allItems, itemsToClarify);
    }
    else {
      let i;
      for (i = length - 1; i >= 0; i--) {
        if (allItems[i].name == itemsToClarify[0].name) break;
      }
      ////////////////////////////////////////////////////////////o////////////
      // only one item to modify
      if (i >= 0) {
        // allItems[i].options = itemsToClarify[0].options;
        let newOptions = itemsToClarify[0].options;
        let item = allItems[i];
        let categoryOptions = getCategoryOption(newOptions, item);
        if (isOptionsConflict(categoryOptions)) {
          agent.add(`Uh... I'm sorry?`);
          return;
        }
        allItems[i] = insertOptionsToItem(item, categoryOptions);
      }
      else allItems.push.apply(allItems, itemsToClarify);
      ////////////////////////////////////////////////////////////////////////
    }
    let newItems = resetOrderContext(agent, allItems);
    if (checkEmptyOrder(agent, newItems)) return;
    confirmAllItems(agent, newItems);
  }

  function clarifyBurger(agent) {
    let burger = agent.parameters.comboOption; // items are an array of pure strings
    let clarifyContext = agent.getContext('clarifyburger');
    let obj;
    if (clarifyContext == null || clarifyContext.parameters == null
      || clarifyContext.parameters.clarifyburger == undefined
      || clarifyContext.parameters.clarifyburger.length == 0) {
      obj = parseItem(burger);
      deleteContext(agent, 'clarifyburger');
    }
    else {
      let burgerToClarify = clarifyContext.parameters.clarifyburger;
      console.log(printItems(burgerToClarify));
      obj = burgerToClarify[burgerToClarify.length - 1];
      if (burgerToClarify.length == 1) deleteContext(agent, 'clarifyburger');
      else {
        burgerToClarify.pop();
        let burgerParams = { clarifyburger: burgerToClarify };
        setContext(agent, 'clarifyburger', 5, burgerParams);
      }
      if (obj.name == "burger") obj.name = burger;
      if (obj.name == "combo") obj.options.push(burger);
    }
    let allItems = getOldItems(agent);
    
    let replaceItemParams = getContextParams(agent, 'replaceitem');
    let isReplacingItem = replaceItemParams ? replaceItemParams.replaceitem : false;
    
    if (isReplacingItem) {
      obj.amount = allItems[allItems.length - 1].amount;
      allItems[allItems.length - 1] = obj;
      deleteContext(agent, 'replaceitem');
    } else {
      allItems.push(obj);
    }
    let newItems = resetOrderContext(agent, allItems);
    if (checkEmptyOrder(agent, newItems)) return;
    confirmAllItems(agent, newItems);
  }

  function clarifyShake(agent) {
    let shakeOption = agent.parameters.shakeOption; // items are an array of pure strings
    let clarifyContext = agent.getContext('clarifyshake');
    let obj;

    if (clarifyContext == null || clarifyContext.parameters == null
      || clarifyContext.parameters.clarifyshake == undefined
      || clarifyContext.parameters.clarifyshake.length == 0) {
      obj = parseItem(shakeOption + " shake");
      deleteContext(agent, 'clarifyshake');
    }
    else {
      let shakeToClarify = clarifyContext.parameters.clarifyshake;
      console.log(printItems(shakeToClarify));
      obj = shakeToClarify[shakeToClarify.length - 1];
      if (shakeToClarify.length == 1) deleteContext(agent, 'clarifyshake');
      else {
        shakeToClarify.pop();
        let shakeParams = { clarifyshake: shakeToClarify };
        setContext(agent, 'clarifyshake', 5, shakeParams);
      }
      obj.options.push(shakeOption);
    }
    let allItems = getOldItems(agent);


    let replaceItemParams = getContextParams(agent, 'replaceitem');
    let isReplacingItem = replaceItemParams ? replaceItemParams.replaceitem : false;
    
    if (isReplacingItem) {
      obj.amount = allItems[allItems.length - 1].amount;
      allItems[allItems.length - 1] = obj;
      deleteContext(agent, 'replaceitem');
    } else {
      allItems.push(obj);
    }

    let newItems = resetOrderContext(agent, allItems);
    if (checkEmptyOrder(agent, newItems)) return;
    confirmAllItems(agent, newItems);
  }

  function modifyItem(agent) {
    let newOptions = agent.parameters.allOption; //items are an array of pure strings
    let allItems = getOldItems(agent);
    if (checkEmptyOrder(agent, allItems)) return;

    let length = allItems.length;
    let i = length - 1;
    for(; i >= 0; i--){
    	let modifiedItems = modifyTheItem (allItems[i], newOptions);
    	if(modifiedItems.length > 0){
        	allItems.splice(i, 1);
        	allItems.push.apply( allItems, modifiedItems);
        	break;
    	}
    }
    if(i < 0){ //none of the items is modified
        agent.add(`Sorry, that would not work. Could you say that again?`);
        return;
    }
    
    let newItems = resetOrderContext(agent, allItems);
    if (checkEmptyOrder(agent, newItems)) return;
    confirmAllItems(agent, newItems);
  }
  
  function modifyTheItem (item, newOptions){ //if not modified, then return a null array
	  let modifiedItems = [];
	  if(item.category == "combo"){ //modify combo
	    let comboMap = breakCombo(item);
	    let comboModified = false;
	    for (let category of comboComps){
			let obj = comboMap.get(category);
	    	let categoryOptions = getCategoryOption(newOptions, obj);
	    	if (isOptionsConflict(categoryOptions)) return modifiedItems;
	    	if(categoryOptions.has(category)){
	    		obj.options = categoryOptions.get(category);
	    		obj = sortOptions(obj);
	    		console.log(obj); 
	    		comboMap.set(category, obj);
	    		comboModified = true;
	    	}
	    }
	    if(comboModified){
	    	for (let category of comboComps){
	    		modifiedItems.push(comboMap.get(category))
	    	}
	    }
	 }
	 else{ //modify single item
	    let categoryOptions = getCategoryOption(newOptions, item);
	    if (isOptionsConflict(categoryOptions)) return modifiedItems; 
	    if(categoryOptions.has(item.category)){
		    item = insertOptionsToItem(item, categoryOptions);
		    item = sortOptions(item);
		    console.log(item);
		    modifiedItems.push(item);
	    }
	 }
	 return modifiedItems;
  }
  
  function modifyAmount(agent) {
	let amount = strToInt(agent.parameters.itemAmount);
	let allItems = getOldItems(agent);
	if (checkEmptyOrder(agent, allItems)) return;

	let length = allItems.length;
	if(amount > 0) allItems[length - 1].amount = amount;
	else {
        agent.add(`Sorry, that would not work. Could you say that again?`);
        return;
	}
	     
	let newItems = resetOrderContext(agent, allItems);
	if (checkEmptyOrder(agent, newItems)) return;
	confirmAllItems(agent, newItems);
  }

  function removeItem(agent) {
    let oldItems = getOldItems(agent);
    if (checkEmptyOrder(agent, oldItems)) return;
    let obj = createItemObject(agent.parameters.allItem, agent.parameters.itemAmount, 999);

    //if a combo may be modified => break the combo
    let tempItems = [];
	for (let item of oldItems){
		tempItems.push(item);
		if(item.category == "combo"){
			if(item.options[0] == obj.name 
					|| obj.name == "burger"
					|| obj.name == "drink"
					|| (obj.name == "fries" && obj.options.length == 0)){
				tempItems.pop();
				let comboMap = breakCombo(item);
	        	for (let category of comboComps){
	        		tempItems.push(comboMap.get(category));
	        	}
			}
		}
	}
    let allItems = mergeOrder(tempItems);
    
    //When the folloiwng criteria are satisfied, the old item will be reserved:
    //1. name is different
    //2. name is equal, but one of the removed item's options is not included in the old item's options
    //3. name is equal and options match, but the amount is less than total amount
    let newItems = [];
    let removed = false;
    for (let item of allItems) {
      let reserved = false;
      //remove category
      if(obj.name == "burger" || obj.name == "drink"){
    	  
    	  if(item.category != obj.name) reserved = true;
      }
      //remove particular item
      else if (item.name != obj.name) reserved = true; //case 1
      else if (isIncludedIn(obj.options, item.options)) { //case 3
        if (item.amount - obj.amount > 0) {
          item.amount = item.amount - obj.amount;
          reserved = true;
        }
      }
      else reserved = true; //case 2
      
      if (reserved) {
        newItems.push(item);
      } //if(reserved)
      else removed = true;
    } //for (let item of oldItems)
    newItems = resetOrderContext(agent, newItems);
    if(!removed){ //nothing is removed
    	agent.add(`Sorry, that would not work. Could you say that again?`);
    	return;
    }
    if (checkEmptyOrder(agent, newItems)) return;
    confirmAllItems(agent, newItems);
  }

  function replaceItem(agent) {
    // Order context
    let allItems = getOldItems(agent);
    if (checkEmptyOrder(agent, allItems)) return;
    let length = allItems.length;
    let lastItem = allItems[length - 1];
    
    // Dialogflow
    let allProduct = agent.parameters.allProduct;
    let allOption = agent.parameters.allOption;
    let newItems;

    let SF = initSlotFilling();

    if (allProduct) {
      let amount = lastItem.amount;
      let obj = parseItem(allProduct);
      if (detectSlots(SF, obj)) {
        let replaceItemParams = { replaceitem: true };
        setContext(agent, 'replaceitem', 5, replaceItemParams);
        if (fillSlots(agent, SF)) return;
      }
      else {
        allItems[length - 1] = obj; // return a js object
        allItems[length - 1].amount = amount;
        newItems = resetOrderContext(agent, allItems);
        if (checkEmptyOrder(agent, newItems)) return;
        confirmAllItems(agent, newItems);
      }
    }
    else if (allOption) { // either one of these is defined
      let categoryOptions = getCategoryOption([allOption], lastItem);
      if (isOptionsConflict(categoryOptions)) {
        agent.add(`Seems your customized options have conflicts. Could you say that again?`);
        return;
      }
      allItems[length - 1] = insertOptionsToItem(lastItem, categoryOptions);
      allItems[length - 1] = sortOptions(allItems[length - 1]);

      newItems = resetOrderContext(agent, allItems);
      if (checkEmptyOrder(agent, newItems)) return;
      confirmAllItems(agent, newItems);
    }
    else {
      agent.add('I\'m sorry, could you say that again?');
    } 
  }

  function finalizeOrder(agent) {
    let allItems = getOldItems(agent);
    if (checkEmptyOrder(agent, allItems)) return;
    let response;
    let deliveryParams = getContextParams(agent, 'delivery');
    if (deliveryParams == undefined || deliveryParams == null) {
      response = "Is it for here or to go?";
    }
    else { // delivery method has been set before
      let deliveryMethod = deliveryParams.delivery;
      response = 'So your order will be ' + printItems(allItems) + ', ' + deliveryMethod + ', right?';
    }
    agent.add(response);
  }

  function finalizeOrderChooseDelivery(agent) {
    let allItems = getOldItems(agent);
    if (checkEmptyOrder(agent, allItems)) return;
    let deliveryMethod = agent.parameters.deliveryMethod;
    setDeliveryMethod(agent, deliveryMethod);
    let response = 'So your order will be ' + printItems(allItems) + ', ' + deliveryMethod + ", right?";
    agent.add(response);
  }

  function finalizeOrderConfirmOrder(agent) {
    let allItems = getOldItems(agent);
    if (checkEmptyOrder(agent, allItems)) return;
    allItems = processOrder(allItems);
    let delivery = getContextParams(agent, 'delivery').delivery;

    // Send order information to server
    let orderJson = {
      "intent": "OrderFood",
      "delivery method": delivery,
      "items": allItems,
      "time": getLocaleTimeString()
    }

    let request = omsUrl + JSON.stringify(orderJson);

    return sendToServer(request).then((response) => {
      let json = JSON.parse(response);
      agent.add("The total will be " + json.totalPrice + " dollars. Your order number is " + json.orderNumber + ". Have a good one.");
      // Delete context only if the order is place successfully
      deleteContext(agent, 'order');
      deleteContext(agent, 'delivery');
      deleteContext(agent, 'placeorder');
    }).catch(() => {
      agent.add("Oops! Something went wrong while placing your order. Could you try again? My apologies.");
    })
  }

  function chooseDelivery(agent) {
    let delivery = agent.parameters.deliveryMethod;
    setDeliveryMethod(agent, delivery);
    agent.add("" + getConfirmStr() + capitalizeString(delivery) + ". " + getDefaultFollowUpStr());
  }

  ////////////////////The following are utility functions////////////////////

  function initSlotFilling() {
    let SF = new Object();
    SF.clarifyBurger = false;
    SF.clarifyShake = false;
    SF.burgerToClarify = [];
    SF.shakeToClarify = [];
    return SF;
  }

  //return true if sth needs to be clarified, false if it is clear
  function detectSlots(SF, obj) {
    if (obj.name == "burger" || (obj.name == "combo" && obj.options.length == 0)) {
      SF.clarifyBurger = true;
      SF.burgerToClarify.push(obj);
    }
    else if (obj.name == "shake" && obj.options.length == 0) {
      SF.clarifyShake = true;
      SF.shakeToClarify.push(obj);
    }
    else if (obj.name == "water") agent.add("If you need water, "
      + "just ask our friendly staff for a plastic cup. It's FREE. Thanks!");
    else return false;
    return true;
  }

  function fillSlots(agent, SF) {
    if (SF.clarifyBurger) {
      let burgerParams = { clarifyburger: SF.burgerToClarify };
      setContext(agent, 'clarifyburger', 5, burgerParams);
      agent.add("Which burger would you like? "
        + "Hamburger, cheeseburger, or MCS?");
    }
    if (SF.clarifyShake) {
      let shakeParams = { clarifyshake: SF.shakeToClarify };
      setContext(agent, 'clarifyshake', 5, shakeParams);
      agent.add("What kind of flavor do you want for your shake? "
        + "We have chocolate, strawberry, and vanilla. "
        + "All of them are delicious!");
    }
    if (SF.clarifyBurger || SF.clarifyShake) return true;
    return false;
  }

  function strToInt(str) {
    return parseInt(wordsToNumbers(str), 10);
  }

  function createItemObject(allItem, itemAmount, defaultAmt) {
    let obj = parseItem(allItem); //amount must be 1, but the correct amount is amount
    let amount;
    if (itemAmount == '') amount = defaultAmt;
    else amount = strToInt(itemAmount);
    obj.amount = amount;
    return obj;
  }

  function getOldItems(agent) {
    let context = agent.getContext('order');
    if (context == null || context.parameters == null ||
      context.parameters.order == undefined || context.parameters.order.length == 0)
      return [];
    return context.parameters.order;
  }

  function processOrder(order) {
    for (let item of order) {
      if (item.options.includes('with')) {
        let index = item.options.indexOf('with');
        item.options.splice(index, 1);
      }
    }
    return order;
  }

  function queryMenu(agent) {
	  agent.add(new Card({
		  title: 'MCS Burger – Menu',
		  imageUrl: 'https://goo.gl/oaYHG8',
		  text: '4:00 – 7:00 pm\nPacific Ballroom, UC Irvine Student Center',
		  buttonText: 'check it out',
		  buttonUrl: 'https://goo.gl/oaYHG8'
	  }));
  }

  function queryWord(agent) {
    let response;
    if (agent.parameters.vocabulary) {
      response = wordMap.get(agent.parameters.vocabulary);
    }
    if (agent.parameters.any) {
      response = wordMap.get(agent.parameters.any);
    }

    if (response) {
      agent.add(response);
    }
    else {
      agent.add("Sorry, I never heard " + agent.parameters.any + " before. Anything else I can help?");
    }
  }

  function queryProduct(agent) {
    let item = agent.parameters.allItem;
    let productAttr = agent.parameters.productAttribute;
    let customerNeed = agent.parameters.customerNeed;

    let response;
    if (customerNeed) {
      response = queryInfo(customerNeed);
    }
    else {
      response = queryInfo(productAttr, item);
    }

    agent.add(response);
  }
  
  function queryRecommendation(agent) {
	  agent.add("We have the best burger in Irvine. "
			  + "Would you like to try it? Or you can check our menu here:");
	  queryMenu(agent);
  }

  function sendToServer(request) {
    return new Promise((resolve, reject) => {
      https.get(request, (resp) => {
        let data = ''
        resp.on('data', (chunk) => { // A chunk of data has been recieved.
          data += chunk;
        });
        resp.on('end', () => { // The whole response has been received. Print out the result.
          console.log(data);
          resolve(data);
        });
      }).on("error", (err) => {
        console.log("Error: " + err.message);
        reject(err);
      });
    });
  }

  function resetOrderContext(agent, allItems) {
    let newItems = mergeOrder(allItems);
    let parameters = { order: newItems };
    setContext(agent, 'order', 999, parameters);
    return newItems;
  }

  function setDeliveryMethod(agent, deliveryMethod) {
    if (deliveryMethod != "") {
      let deliveryParams = { delivery: deliveryMethod };
      setContext(agent, 'delivery', 999, deliveryParams);
    }
  }

  function checkEmptyOrder(agent, allItems) {
    let length = allItems.length;
    if (length <= 0) {
      agent.add("There is no item in your order. "
        + "What can I get for you today?");
      setContext(agent, 'unhappy', 5);
      return true;
    }
    return false;
  }

  function confirmAllItems(agent, allItems) {
    let response = '' + getConfirmStr(); //response is a string
    response += printItems(allItems);
    response += '. ' + getFollowUpStr(allItems);
    agent.add(response);
  }

  function getContextParams(agent, name) {
    let context = agent.getContext(name);
    return context ? context.parameters : undefined;
  }

  function setContext(agent, name, lifespan, parameters) {
    agent.setContext({
      name: name,
      lifespan: lifespan,
      parameters: parameters
    });
  }

  //This syntax works :
  //agent.setContext({'name': 'context_name', 'lifespan': '0'});
  function deleteContext(agent, name) {
    agent.setContext({ 'name': name, 'lifespan': '0' });
  }

  function getWelcomeStr() {
    let greet = ["Hi! ", "Hello! "];
    let myName = ["I'm Robo-waiter. ", "My name is Robo-waiter. "];
    let ask = ["What can I get for you today?", "What do you want to eat?"];
    let response = ""
      + greet[getRandomInt(greet.length)]
      + myName[getRandomInt(myName.length)]
      + ask[getRandomInt(ask.length)];
    return response;
  }

  function getConfirmStr() {
    let confirm = ['Sure. ', 'No problem. ', 'Gotcha. ', 'Okay. ', 'Of course. ', 'Awesome. '];
    return confirm[getRandomInt(confirm.length)];
  }

  function getFollowUpStr(allItems) {
    let orderDrink = false;
    //check if the customer has ordered drink
    for (let item of allItems) {
      if (item.category != "burger" && item.category != "fries") {
        console.log(item);
        orderDrink = true;
        break;
      }
    }
    console.log(orderDrink);
    if (!orderDrink) return 'Anything to drink?';
    return getDefaultFollowUpStr();
  }

  function getDefaultFollowUpStr() {
    let followUp = ['What else?', 'Anything else?'];
    return followUp[getRandomInt(followUp.length)];
  }

  function getRandomInt(size) {
    let max = Math.floor(size - 1);
    return Math.floor(Math.random() * (max + 1));
  }

  function capitalizeString(str) {
    // This function capitalize the first character of a string to uppercase for response purpose
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function mergeOrder(order) {
    let result = [];
    // This function merges identical json object in an order list
    for (let orderItem of order) {
      let hasPushed = false;
      for (let i = 0; i < result.length; i++) {
        let resultItem = result[i];
        if (orderItem.name != resultItem.name) continue;
        if (arraysEqual(orderItem.options, resultItem.options)) {
          // same item, increase amount
          result[i].amount += orderItem.amount;
          hasPushed = true;
        }
      }
      if (!hasPushed) {
        result.push(orderItem);
      }
    }
    //limit order size, only keep the lastest items
    if(result.length > orderLimit) result.splice(0, result.length - orderLimit);
    //detect fraudulent deals
    for (let i = 0; i < result.length; i++) {
      if (result[i].amount - itemLimit > 0) {
        result[i].amount = itemLimit;
        //agent.add("Thank you, but we only accept order amount of " + itemLimit + " at most."); //need to confirm with Kyle
      }
    }
    return result;
  }

  function getLocaleTimeString() {
    var date = new Date();
    var utcDate = new Date(date.toUTCString());
    utcDate.setHours(utcDate.getHours() - 8);
    var usDate = new Date(utcDate);
    return usDate.toLocaleDateString() + ' ' + usDate.toLocaleTimeString();
  }

  function arraysEqual(a1, a2) {
    if (a1.length != a2.length) return false;

    let set = new Set(a1);
    for (let e of a2) {
      if (set.has(e) == false) {
        return false;
      }
    }
    return true;
  }

  function isIncludedIn(a1, a2) {
    if (a1.length == 0 && a2.length == 0) return true;
    if (a1.length > a2.length) return false;
    let set = new Set(a2);
    for (let o of a1) {
      if (set.has(o) == false) {
        return false;
      }
    }
    return true;
  }
  
  function sortOptions(obj) {
	  if(obj.category != "burger") return obj;
	  let str = obj.name;
	  for (let option of obj.options) { 
	     str = str + option + " ";
	  }
	  let newObj = parseItem(str);
	  obj.options = newObj.options;
	  return obj;
  }
  
  function breakCombo(combo){ 
	  let comboMap = new Map();
	  
	  if(combo.category != "combo"){
		  comboMap.set(combo.category, combo); 
		  return comboMap;
	  }
	  
	  for (let category of comboComps) {
		  let obj = new Object();
		  obj.name = category;
		  if(category == "burger") obj.name = combo.options[0];
		  //assume combo burger has been clarified
		  obj.category = category;
		  obj.options = []; 
		  if(category == "drink") obj.options.push("medium");
		  obj.amount = combo.amount;
		  comboMap.set(category, obj); 
	  }
	  
	  return comboMap;
  }
  
  // // Uncomment and edit to make your own intent handler
  // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function yourFunctionHandler(agent) {
  //   agent.add(`This message is from Dialogflow's Cloud Functions for Firebase inline editor!`);
  //   agent.add(new Card({
  //       title: `Title: this is a card title`,
  //       imageUrl: 'https://dialogflow.com/images/api_home_laptop.svg',
  //       text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
  //       buttonText: 'This is a button',
  //       buttonUrl: 'https://docs.dialogflow.com/'
  //     })
  //   );
  //   agent.add(new Suggestion(`Quick Reply`));
  //   agent.add(new Suggestion(`Suggestion`));
  //   agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
  // }

  // // Uncomment and edit to make your own Google Assistant intent handler
  // // uncomment `intentMap.set('your intent name here', googleAssistantHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function googleAssistantHandler(agent) {
  //   let conv = agent.conv(); // Get Actions on Google library conv instance
  //   conv.ask('Hello from the Actions on Google client library!') // Use Actions on Google library
  //   agent.add(conv); // Add Actions on Google library responses to your agent's response
  // }

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();

  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Place Order', placeOrder);
  intentMap.set('Add Item', addItem);
  intentMap.set('Clarify Burger', clarifyBurger);
  intentMap.set('Clarify Shake', clarifyShake);
  intentMap.set('Modify Item', modifyItem);
  intentMap.set('Modify Amount', modifyAmount);
  intentMap.set('Remove Item', removeItem);
  intentMap.set('Replace Item', replaceItem);
  intentMap.set('Finalize Order', finalizeOrder);
  intentMap.set('Finalize Order - Choose Delivery', finalizeOrderChooseDelivery);
  intentMap.set('Finalize Order - Choose Delivery - Yes', finalizeOrderConfirmOrder);
  intentMap.set('Finalize Order - Confirm Order', finalizeOrderConfirmOrder);
  intentMap.set('Choose Delivery', chooseDelivery);
  intentMap.set('Place Order - Add', placeOrderAdd);
  intentMap.set('Place Order - Modify', placeOrderModify);
  intentMap.set('Query Menu', queryMenu);
  intentMap.set('Query Word', queryWord);
  intentMap.set('Query Product', queryProduct);
  intentMap.set('Query Recommendation', queryRecommendation);

  // intentMap.set('<INTENT_NAME_HERE>', yourFunctionHandler);
  // intentMap.set('<INTENT_NAME_HERE>', googleAssistantHandler);
  agent.handleRequest(intentMap);
});