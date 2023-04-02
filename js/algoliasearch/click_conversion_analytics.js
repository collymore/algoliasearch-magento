algoliaBundle.$(function ($) {
	AlgoliaAnalytics.init({
		applicationID: algoliaConfig.applicationId,
		apiKey: algoliaConfig.instant.apiKey
	});

	// "Click" in autocomplete
	$(algoliaConfig.autocomplete.selector).each(function () {
		$(this).on('autocomplete:selected', function (e, suggestion) {
			trackClick(suggestion.objectID, suggestion.__position, suggestion.__queryID);
		});
	});

	// "Click" on instant search page
	$(document).on('click', algoliaConfig.ccAnalytics.ISSelector, function() {
		var $this = $(this);
		trackClick($this.data('objectid'), $this.data('position'));
	});

	// "Add to cart" conversion
	if (algoliaConfig.ccAnalytics.conversionAnalyticsMode === 'add_to_cart') {
		$(document).on('click', algoliaConfig.ccAnalytics.addToCartSelector, function () {
			var objectId = $(this).data('objectid') || algoliaConfig.productId;

			if (!objectId) {
				var postData = $(this).data('post');
				if (!postData || !postData.data.product) {
					return;
				}

				objectId = postData.data.product;
			}

			// "setTimeout" ensures "trackConversion" is always triggered AFTER "trackClick"
			// when clicking "Add to cart" on instant search results page
			setTimeout(function () {
				trackConversion(objectId);
			}, 0);
		});
	}

	if (algoliaConfig.ccAnalytics.conversionAnalyticsMode === 'place_order') {

		if (typeof algoliaOrderConversionJson !== 'undefined') {
			$.each(algoliaOrderConversionJson, function(idx, itemData) {
				if (itemData && itemData.objectID) {
					trackConversion(itemData.indexName, itemData.objectID, itemData.queryID);
				}
			});
		}
	}

});

var analyticsHelper = {};

algolia.registerHook('beforeAutocompleteSources', function(sources) {
	analyticsHelper.sources = sources;
	return sources;
});

algolia.registerHook('beforeInstantsearchStart', function (search) {
	search.once('render', function() {
		AlgoliaAnalytics.initSearch({
			getQueryID: function() {
				return search.helper.lastResults && search.helper.lastResults._rawResults[0].queryID
			}
		});
	});
	return search;
});

algolia.registerHook('beforeInstantsearchInit', function (instantsearchOptions) {
	instantsearchOptions.searchParameters['clickAnalytics'] = true;
	return instantsearchOptions;
});

function trackClick(index, objectID, position, queryId) {
	var clickData = {
		index: index,
		eventName: "Clicked item",
		objectIDs: [objectID.toString()],
		positions: [parseInt(position)],
		queryID: queryId
	};

	AlgoliaAnalytics.clickedObjectIDsAfterSearch(clickData);
}

function trackConversion(index, objectID, queryId) {
	AlgoliaAnalytics.convertedObjectIDsAfterSearch({
		index: index,
		eventName: "Conversion",
		objectIDs: [objectID.toString()],
		queryID: queryId,
	});
}
