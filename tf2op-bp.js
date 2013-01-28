// ==UserScript==
// @name       TF2OP-BP
// @namespace  http://kyleschattler.com
// @version    0.1
// @description  Script that loads prices from backpack.tf and adds them to tf2outpost.com
// @match      *tf2outpost.com/*
// @copyright  2012+
// @require http://code.jquery.com/jquery-latest.js
// ==/UserScript==

'use strict'

jQuery.noConflict();

(function($) {
    var prices = {};
    
    var PriceElement = function(price) {
        this.el = $('<div></div>')
            .attr({class: 'price'})
            .append('<p>' + price + '</p>');
    }
    
    PriceElement.prototype = {
        getDOMElement:  function() {
            return $(this.el);
        }
    };
    
    var searchItem = function(item, effect) {
        try {
            if(effect) {
                return prices[item[1]][item[2]][effect];
            }
            
            return prices[item[1]][item[2]][0];
        }
        catch(ex) {
            return 0;
        }
    }
    
    var getItemData = function(dataHash) {
        var item = dataHash.split(',');
        //console.log(item);
        //Item is a wildcard item.
        if(item[1] >= 90000) {
            if(item[1] == 90000) {
                return { value: 'offer' };
            }
            else if(item[1] == 90003) {
                return { value: '1.33 ref' };
            }
            else if(item[1] == 90002) {
                return { value: '$$$' };
            }
            
            return { value: '0.00' };
        }
        //Item is for DOTA2
        if(item[0] == 570) {
            return;
        }
        //Item is unusual
        if(item[2] == '5') {
            return searchItem(item, item[3]);
        }
        
        return searchItem(item);
    }
    
    //Would have loved to use regex here but the returned array didn't seem to want 
    //to give me access to the first index. ;_; Have to look more into this later.
    var getUnusualEffect = function(url) {
        var effect = url.toString().split('/');
        effect = effect[effect.length-1].split('.');
        //console.log(effect);
        
        return effect[0];
    }
    
    var convertCurrency = function(value) {
        if(isNaN(value) || !value.toFixed) return value;
        
        var keyValue = prices[5021][6][0].value;
        var billsValue = prices[126][6][0].value;
        var budsValue = prices[143][6][0].value;
        
        console.log('key value ' + keyValue + '\nbills value ' + billsValue + '\nbuds value ' + budsValue);
        
        if(value > keyValue && value < billsValue) {
            value = value / keyValue;
            if(value == 1) {
                return value.toFixed(2) + ' key';
            }
            return value.toFixed(2) + ' keys';
        }
        
        if(value > billsValue && value < budsValue) {
            value = value / billsValue;
            if(value == 1) {
                return value.toFixed(2) + ' bill';
            }
            return value.toFixed(2) + ' bills';
        }
        
        if(value > budsValue) {
            value = value / budsValue;
            if(value == 1) {
                return value.toFixed(2) + ' bud';
            }
            return value.toFixed(2) + ' buds';
        }
        
        return value.toFixed(2) + ' ref';
    }
    
    $(document).ready(function() {
        
        GM_addStyle(
            ".price { position: absolute; min-width: 50%; background-color: #161514; border-bottom-right-radius: 4px; border-top-left-radius: 7px; padding: 2px;}" +
            ".price > p { margin: 0; text-align: center; } ");
        
        console.log('getting data');
        
        GM_xmlhttpRequest({
            url: 'http://backpack.tf/api/IGetPrices/v2',
            method: 'GET',
            onload:     function(data) {
                prices = $.parseJSON(data.responseText).response.prices;
                console.log(prices);
                
                $('.item').each(function(index) {
                    var dataHash =$(this).attr('data-hash');
                    
                    //Test to see if the item is uncraftable. Needs to be done because
                    //backpack.tf decided that 600 would be a good alteration to the id system.
                    if($(this).hasClass('uncraftable')) {
                        dataHash = dataHash.replace(/6$/, '600');
                    }
                    
                    //If the item has a style attribute then we know the unusual has an effect
                    if($(this).attr('style')) {
                        dataHash += ',' + getUnusualEffect($(this).attr('style'));
                    }
                    
                    
                    //Gets the item data for the current item
                    var item = getItemData(dataHash);
                    
                    //If the item is truthy, add a DOM element with it's price
                    if(item) {
                        $(this).prepend(new PriceElement(convertCurrency(item.value)).getDOMElement());
                    }
                });
            },
            onerror:    function(data) {
                $('#header').after('<div></div>').attr({class: 'error'}).append('<p>There was an error connecting to the backpack.tf server.</p>');
            }
        });
    });
})(jQuery);