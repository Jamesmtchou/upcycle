$.widget('upcycle.facetlist', $.upcycle.base, {
	'options': {
		'templatesNamespace': 'upcycle.templates',
		'templateName': 'facetlist',
		'facets': [],
		'moreLessMin': 4,
		'moreLessLinkContainer': null,
		'moreLessOpenByDefault': false,
		'label': 'FACETLIST_LABEL'
	},
	'_create': function(){
		this._super();
		this._on({'click [role="button"][data-action="remove"]': this._onRemove});
		this._render();
	},
	'_render': function(){
		this.element.html(this._getMarkup(this.options));
		return this.update();
	},
	'update': function(){
		/**
		 * More/Less
		 */
		var $facets = this.element.find('.up-facets'),
			moreLessOptions = {
				'minItems': this.options.moreLessMin,
				'linkContainer': this.options.moreLessLinkContainer,
				'openByDefault': this.options.moreLessOpenByDefault
			};
		if( this.options.more ){
			moreLessOptions.more = this._getLabel(this.options.more);
		}
		if( this.options.less ){
			moreLessOptions.less = this._getLabel(this.options.less);
		}
		$facets.moreless( moreLessOptions );
		
		return this;		
	},
	'add': function(facetsToAdd, options){
		facetsToAdd = _.isArray(facetsToAdd) ? facetsToAdd : _.isObject(facetsToAdd) ? [facetsToAdd] : [];
		options = options || {};
		var facets = this.options.facets,
			added = [];
		_(facetsToAdd).each(function(facetToAdd){
			var existing = _(facets).findWhere({'name': facetToAdd.name}),
				preExistingOptionsLength;
			if(existing){
				preExistingOptionsLength = existing.options.length;
				existing.options = _(existing.options.concat(facetToAdd.options)).uniq();
				if(preExistingOptionsLength < existing.options.length)
					added.push(facetToAdd);
			}else{
				facets.push(facetToAdd);
				added.push(facetToAdd);
			}
		}, this);
		if(added.length && !options.silent){
			this._trigger(':facets:add', null, {
				'facets': added
			});
		}
		return this._setOption('facets', facets, options);
	},
	'remove': function(facetsToRemove, options){
		facetsToRemove = _.isArray(facetsToRemove) ? facetsToRemove : _.isObject(facetsToRemove) ? [facetsToRemove] : [];
		options = options || {};
		var remainingOptions,
			removedOptions,
			removed = [],
			facets = _(this.options.facets).reject(function(facet){
				var toRemove = _(facetsToRemove).findWhere({'name': facet.name});
				if(toRemove){
					remainingOptions = _(facet.options).difference(toRemove.options);
					removedOptions = _(facet.options).intersection(toRemove.options);
					facet.options = remainingOptions;
					toRemove.options = removedOptions;
					removed.push(toRemove);
					return !remainingOptions.length;
				}
			});
		if(removed.length && !options.silent){
			this._trigger(':facets:remove', null, {
				'facets': removed
			});
		}
		return this._setOption('facets', facets, options);
			
	},
	'reset': function(facets, options){
		options = options || {};
		if(!options.silent){
			if(this.options.facets.length){
				this._trigger(':facets:remove', null, {
					'facets': this.options.facets
				});
			}
			if(facets && facets.length){
				this._trigger(':facets:add', null, {
					'facets': facets
				});
			}
		}
		return this._setOption('facets', facets || [], options);
	},
	'change': function(facetsToChange){
		var element = this.element,
			facets = this.option('facets'),
			match;
		_(facetsToChange).each(function(optionMap, facetName){
			match = _(facets).find(function(f){return f.name === facetName;});
			if(match){
				_(optionMap).each(function(newValue, oldValue){
					_(match.options).each(function(value, index){
						if(value === oldValue){
							match.options.splice(index, 1, newValue);
							element.find('[data-facet="'+match.name+'"][data-facet-option="'+$.upcycle.escapeForSelector(oldValue)+'"]')
								.attr('data-facet-option', newValue)
								.find('.up-facet-option-name')
									.text(newValue);
						}
					});
				});
			}
		});
	},
	'_setOption': function(key, value, options){
		this._super(key, value);
		options = options || {};
		if(key === 'facets'){
			this._render();
			if(!options.silent){
				this._trigger(':facets:changed', null, {
					'facets': this.options.facets
				});
			}
		}
		if(key === 'moreLessMin'){
			this._render();
		}
		return this;
	},
	'_onRemove': function(event){
		var $item = $(event.currentTarget).parent(),
			facetAtts = this._getFacetAtts($item);
		return this.remove({
			'name': facetAtts.name,
			'options': [facetAtts.option]
		});
	},
	'_getFacetAtts': function(element){
		element = element instanceof $ ? element.get(0) : element;
		return {
			'name': element.getAttribute('data-facet'),
			'option': element.getAttribute('data-facet-option')
		};
	},
	'_getTemplateContext': function(options){
		var context = _({}).extend(options);
		if(this.options.localizeLabels){
			_(context).extend({
				'label': $.i18n.prop(options.label)
			});
		}
		return context;
	}
});